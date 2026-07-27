import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, subscriptionsTable } from "@workspace/db";
import { AnalyzeBillsBody } from "@workspace/api-zod";
import { detectSubscriptions } from "../../lib/subscriptionDetector.js";

const router: IRouter = Router();

router.post("/bills/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeBillsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { text, sessionId } = parsed.data;

  const detected = detectSubscriptions(text);

  if (detected.length === 0) {
    res.json({
      sessionId,
      subscriptions: [],
      totalFound: 0,
      totalFlagged: 0,
    });
    return;
  }

  // Delete old subscriptions for this session before inserting new ones
  await db.delete(subscriptionsTable).where(eq(subscriptionsTable.sessionId, sessionId));

  const inserted = await db.insert(subscriptionsTable)
    .values(
      detected.map(s => ({
        sessionId,
        name: s.name,
        amount: String(s.amount),
        frequency: s.frequency,
        category: s.category,
        status: s.status,
        flagReason: s.flagReason ?? null,
      }))
    )
    .returning();

  const totalFlagged = inserted.filter(s => s.status === "flagged").length;

  res.json({
    sessionId,
    subscriptions: inserted.map(s => ({
      ...s,
      amount: parseFloat(s.amount),
      createdAt: s.createdAt.toISOString(),
    })),
    totalFound: inserted.length,
    totalFlagged,
  });
});

export default router;
