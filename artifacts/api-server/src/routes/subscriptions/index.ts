import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, subscriptionsTable, negotiationMessagesTable } from "@workspace/db";
import {
  ListSubscriptionsQueryParams,
  GetSubscriptionParams,
  UpdateSubscriptionParams,
  UpdateSubscriptionBody,
  GenerateSubscriptionMessageParams,
  GenerateSubscriptionMessageBody,
  GetSubscriptionMessageParams,
  GetBundleSuggestionsQueryParams,
  GetDealWatchQueryParams,
} from "@workspace/api-zod";
import { generateMessage } from "../../lib/messageTemplates.js";
import { findMatchingDeals } from "../../lib/dealWatch.js";

// Category-specific advice for what a bundle/combo could replace these with.
// Kept simple and India-relevant since that's who most detected services target.
const BUNDLE_ADVICE: Record<string, string> = {
  streaming: "Several telecom postpaid/broadband plans in India (Jio, Airtel, Vi) bundle in one or more OTT subscriptions for free — check if your existing plan already includes one of these before paying separately.",
  fitness: "Some fitness aggregator apps (like a single all-access pass) can replace multiple single-gym memberships at a lower combined cost — worth comparing against paying each individually.",
  software: "Check if your employer, college, or an existing software suite (e.g. Google Workspace, Microsoft 365) already includes one of these tools for free.",
};

const router: IRouter = Router();

// GET /subscriptions?sessionId=...
router.get("/subscriptions", async (req, res): Promise<void> => {
  const parsed = ListSubscriptionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  const subs = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.sessionId, parsed.data.sessionId))
    .orderBy(subscriptionsTable.createdAt);

  res.json(subs.map(s => ({
    ...s,
    amount: parseFloat(s.amount),
    previousAmount: s.previousAmount ? parseFloat(s.previousAmount) : null,
    createdAt: s.createdAt.toISOString(),
  })));
});

// GET /subscriptions/bundle-suggestions?sessionId=...
// Bundle Optimizer: groups active subscriptions by category and flags
// categories with 2+ subscriptions as worth checking against a bundle/combo.
// NOTE: this must be registered before GET /subscriptions/:id, otherwise
// Express matches "bundle-suggestions" as the :id param.
router.get("/subscriptions/bundle-suggestions", async (req, res): Promise<void> => {
  const parsed = GetBundleSuggestionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  const subs = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.sessionId, parsed.data.sessionId));

  const active = subs.filter(s => s.status === "active" || s.status === "flagged");

  const byCategory = new Map<string, typeof active>();
  for (const s of active) {
    const list = byCategory.get(s.category) ?? [];
    list.push(s);
    byCategory.set(s.category, list);
  }

  const suggestions = Array.from(byCategory.entries())
    .filter(([, items]) => items.length >= 2)
    .map(([category, items]) => {
      const combinedMonthlyCost = items.reduce((sum, s) => {
        const amt = parseFloat(s.amount);
        if (s.frequency === "annual") return sum + amt / 12;
        if (s.frequency === "weekly") return sum + amt * 4.33;
        return sum + amt;
      }, 0);

      return {
        category,
        subscriptions: items.map(s => s.name),
        combinedMonthlyCost: Math.round(combinedMonthlyCost * 100) / 100,
        message: BUNDLE_ADVICE[category] ?? `You have ${items.length} ${category} subscriptions active — worth checking if a combined plan or bundle covers all of them for less than ₹${Math.round(combinedMonthlyCost)}/mo combined.`,
      };
    });

  res.json(suggestions);
});

// GET /subscriptions/deal-watch?sessionId=...
// Deal Watch: cross-references active subscriptions against the curated
// deals database to surface bundle/family-plan/off-peak savings the user
// might not know about. Must be registered before GET /subscriptions/:id.
router.get("/subscriptions/deal-watch", async (req, res): Promise<void> => {
  const parsed = GetDealWatchQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  const subs = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.sessionId, parsed.data.sessionId));

  const active = subs.filter(s => s.status === "active" || s.status === "flagged");

  const matches = active.flatMap(s => {
    const deals = findMatchingDeals(s.name, null);
    return deals.map(d => ({
      subscriptionName: s.name,
      title: d.title,
      description: d.description,
    }));
  });

  res.json(matches);
});

// GET /subscriptions/:id
router.get("/subscriptions/:id", async (req, res): Promise<void> => {
  const params = GetSubscriptionParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.id, params.data.id));

  if (!sub) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  res.json({ ...sub, amount: parseFloat(sub.amount), previousAmount: sub.previousAmount ? parseFloat(sub.previousAmount) : null, createdAt: sub.createdAt.toISOString() });
});

// PATCH /subscriptions/:id
router.patch("/subscriptions/:id", async (req, res): Promise<void> => {
  const params = UpdateSubscriptionParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const body = UpdateSubscriptionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  const updates: Partial<typeof subscriptionsTable.$inferInsert> = { ...body.data } as any;

  // Price-Hike Detector: if the incoming amount is genuinely higher than
  // what's on record, remember the old price and flag it so the user
  // notices the silent increase instead of just eating the extra cost.
  if (body.data.amount !== undefined) {
    const oldAmount = parseFloat(existing.amount);
    const newAmount = body.data.amount;
    if (newAmount > oldAmount) {
      updates.previousAmount = String(oldAmount);
      updates.status = "flagged";
      updates.flagReason = `Price increased from ₹${oldAmount.toLocaleString("en-IN")} to ₹${newAmount.toLocaleString("en-IN")}`;
    }
    updates.amount = String(newAmount) as any;
  }

  const [updated] = await db
    .update(subscriptionsTable)
    .set(updates)
    .where(eq(subscriptionsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  res.json({ ...updated, amount: parseFloat(updated.amount), previousAmount: updated.previousAmount ? parseFloat(updated.previousAmount) : null, createdAt: updated.createdAt.toISOString() });
});

// POST /subscriptions/:id/message — generate a negotiation/cancellation message
router.post("/subscriptions/:id/message", async (req, res): Promise<void> => {
  const params = GenerateSubscriptionMessageParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const body = GenerateSubscriptionMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.id, params.data.id));

  if (!sub) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  const message = generateMessage(
    body.data.messageType as "cancel" | "negotiate" | "downgrade" | "refund",
    { serviceName: sub.name, amount: parseFloat(sub.amount), frequency: sub.frequency },
    sub.category
  );

  // Delete old message of same type, then insert new one
  await db
    .delete(negotiationMessagesTable)
    .where(eq(negotiationMessagesTable.subscriptionId, sub.id));

  const [saved] = await db
    .insert(negotiationMessagesTable)
    .values({ subscriptionId: sub.id, messageType: body.data.messageType, message })
    .returning();

  res.json({ ...saved, createdAt: saved.createdAt.toISOString() });
});

// GET /subscriptions/:id/message — retrieve saved message
router.get("/subscriptions/:id/message", async (req, res): Promise<void> => {
  const params = GetSubscriptionMessageParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [msg] = await db
    .select()
    .from(negotiationMessagesTable)
    .where(eq(negotiationMessagesTable.subscriptionId, params.data.id))
    .orderBy(negotiationMessagesTable.createdAt);

  if (!msg) {
    res.status(404).json({ error: "No message generated yet" });
    return;
  }

  res.json({ ...msg, createdAt: msg.createdAt.toISOString() });
});

export default router;
