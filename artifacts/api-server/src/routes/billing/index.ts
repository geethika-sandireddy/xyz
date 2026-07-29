import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { getUserIdFromCookie } from "../../lib/auth.js";

const router: IRouter = Router();

// this is a DEMO toggle only. there is no real payment processor wired up
// yet, so this just flips the plan field in the db. nothing is charged.
router.post("/billing/upgrade", async (req, res): Promise<void> => {
  const userId = getUserIdFromCookie(req);
  if (!userId) {
    res.status(401).json({ error: "not logged in" });
    return;
  }

  const updated = await db.update(usersTable).set({ plan: "pro" }).where(eq(usersTable.id, userId)).returning();
  const user = updated[0];
  res.json({ id: user.id, email: user.email, plan: user.plan });
});

router.post("/billing/downgrade", async (req, res): Promise<void> => {
  const userId = getUserIdFromCookie(req);
  if (!userId) {
    res.status(401).json({ error: "not logged in" });
    return;
  }

  const updated = await db.update(usersTable).set({ plan: "free" }).where(eq(usersTable.id, userId)).returning();
  const user = updated[0];
  res.json({ id: user.id, email: user.email, plan: user.plan });
});

export default router;
