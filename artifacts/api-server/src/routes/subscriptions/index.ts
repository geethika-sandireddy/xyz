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
} from "@workspace/api-zod";
import { generateMessage } from "../../lib/messageTemplates.js";

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
