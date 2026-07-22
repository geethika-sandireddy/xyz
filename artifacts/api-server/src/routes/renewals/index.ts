import { Router, type IRouter } from "express";
import { eq, and, gte, lte, asc } from "drizzle-orm";
import { db, renewalsTable, savingsTable } from "@workspace/db";
import {
  ListRenewalsQueryParams,
  CreateRenewalBody,
  ListUpcomingRenewalsQueryParams,
  UpdateRenewalParams,
  UpdateRenewalBody,
  DeleteRenewalParams,
  GenerateRenewalMessageParams,
} from "@workspace/api-zod";
import { generateMessage } from "../../lib/messageTemplates.js";

const router: IRouter = Router();

function serialize(r: typeof renewalsTable.$inferSelect) {
  return {
    ...r,
    amount: parseFloat(r.amount),
    renewalDate: r.renewalDate.toISOString(),
    createdAt: r.createdAt.toISOString(),
  };
}

// GET /renewals?sessionId=...
router.get("/renewals", async (req, res): Promise<void> => {
  const parsed = ListRenewalsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  const rows = await db
    .select()
    .from(renewalsTable)
    .where(eq(renewalsTable.sessionId, parsed.data.sessionId))
    .orderBy(asc(renewalsTable.renewalDate));

  res.json(rows.map(serialize));
});

// GET /renewals/upcoming?sessionId=...&days=3
// The core Renewal Watch alert feed — anything renewing/converting within
// the window, so the user can act BEFORE they get charged.
router.get("/renewals/upcoming", async (req, res): Promise<void> => {
  const parsed = ListUpcomingRenewalsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + parsed.data.days * 24 * 60 * 60 * 1000);

  const rows = await db
    .select()
    .from(renewalsTable)
    .where(
      and(
        eq(renewalsTable.sessionId, parsed.data.sessionId),
        gte(renewalsTable.renewalDate, now),
        lte(renewalsTable.renewalDate, windowEnd),
      ),
    )
    .orderBy(asc(renewalsTable.renewalDate));

  // Only surface renewals that still need attention.
  const actionable = rows.filter(r => r.status === "upcoming" || r.status === "reminded");

  res.json(actionable.map(serialize));
});

// POST /renewals — start tracking a trial or upcoming renewal
router.post("/renewals", async (req, res): Promise<void> => {
  const body = CreateRenewalBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [created] = await db
    .insert(renewalsTable)
    .values({
      sessionId: body.data.sessionId,
      serviceName: body.data.serviceName,
      amount: String(body.data.amount),
      frequency: body.data.frequency ?? "monthly",
      renewalDate: new Date(body.data.renewalDate),
      isTrial: body.data.isTrial ?? false,
      notes: body.data.notes,
    })
    .returning();

  res.status(201).json(serialize(created));
});

// PATCH /renewals/:id — mark cancelled / renewed / ignored, or reschedule
router.patch("/renewals/:id", async (req, res): Promise<void> => {
  const params = UpdateRenewalParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const body = UpdateRenewalBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updates: Partial<typeof renewalsTable.$inferInsert> = {};
  if (body.data.status) updates.status = body.data.status;
  if (body.data.notes !== undefined) updates.notes = body.data.notes;
  if (body.data.renewalDate) updates.renewalDate = new Date(body.data.renewalDate);

  const [updated] = await db
    .update(renewalsTable)
    .set(updates)
    .where(eq(renewalsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Renewal not found" });
    return;
  }

  // Cancelling a trial/renewal before it charges is a real, provable save —
  // log it to the Savings ledger automatically so it shows up alongside
  // subscription cancellations.
  if (body.data.status === "cancelled") {
    await db.insert(savingsTable).values({
      subscriptionId: null,
      subscriptionName: updated.serviceName,
      amountSaved: updated.amount,
      note: updated.isTrial
        ? "Avoided charge by cancelling free trial before it converted"
        : "Cancelled before renewal via Renewal Watch",
    });
  }

  res.json(serialize(updated));
});

// DELETE /renewals/:id
router.delete("/renewals/:id", async (req, res): Promise<void> => {
  const params = DeleteRenewalParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [deleted] = await db
    .delete(renewalsTable)
    .where(eq(renewalsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Renewal not found" });
    return;
  }

  res.status(204).send();
});

// POST /renewals/:id/message — draft a "cancel before renewal" message
router.post("/renewals/:id/message", async (req, res): Promise<void> => {
  const params = GenerateRenewalMessageParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [renewal] = await db
    .select()
    .from(renewalsTable)
    .where(eq(renewalsTable.id, params.data.id));

  if (!renewal) {
    res.status(404).json({ error: "Renewal not found" });
    return;
  }

  const message = generateMessage(
    "cancel",
    {
      serviceName: renewal.serviceName,
      amount: parseFloat(renewal.amount),
      frequency: renewal.frequency,
    },
    "other",
  );

  // Mark it "reminded" so it drops out of the upcoming-alerts feed once
  // the user has already been shown a cancellation draft for it.
  await db
    .update(renewalsTable)
    .set({ status: "reminded" })
    .where(eq(renewalsTable.id, renewal.id));

  res.json({
    id: renewal.id,
    subscriptionId: renewal.id,
    messageType: "cancel",
    message,
    createdAt: new Date().toISOString(),
  });
});

export default router;
