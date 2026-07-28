import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, negotiationMessagesTable } from "@workspace/db";
import { SetMessageOutcomeParams, SetMessageOutcomeBody } from "@workspace/api-zod";

const router: IRouter = Router();

// after you send a message, tell us what happened
router.patch("/messages/:id/outcome", async (req, res): Promise<void> => {
  const params = SetMessageOutcomeParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "bad id" });
    return;
  }

  const body = SetMessageOutcomeBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updated = await db
    .update(negotiationMessagesTable)
    .set({ outcome: body.data.outcome })
    .where(eq(negotiationMessagesTable.id, params.data.id))
    .returning();

  const msg = updated[0];
  if (!msg) {
    res.status(404).json({ error: "message not found" });
    return;
  }

  res.json({ ...msg, createdAt: msg.createdAt.toISOString() });
});

// how often do messages for each service actually work, based on what people reported
router.get("/messages/stats", async (req, res): Promise<void> => {
  const all = await db.select().from(negotiationMessagesTable);

  const byService: Record<string, { total: number; worked: number }> = {};

  for (const m of all) {
    if (!m.outcome || !m.serviceName) continue;
    if (!byService[m.serviceName]) {
      byService[m.serviceName] = { total: 0, worked: 0 };
    }
    byService[m.serviceName].total += 1;
    if (m.outcome === "worked") {
      byService[m.serviceName].worked += 1;
    }
  }

  const stats = Object.keys(byService).map((name) => {
    const s = byService[name];
    return {
      serviceName: name,
      totalReported: s.total,
      workedCount: s.worked,
      winRate: s.total > 0 ? s.worked / s.total : 0,
    };
  });

  res.json(stats);
});

export default router;
