import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db, usersTable, subscriptionsTable, renewalsTable, budgetProfileTable, fixedExpensesTable, financialGoalsTable, loansTable, savingsTable, negotiationMessagesTable, sharePlanRequestsTable } from "@workspace/db";
import { SignupBody, LoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

const SECRET = process.env.SESSION_SECRET;
if (!SECRET) {
  throw new Error("SESSION_SECRET environment variable is required but was not provided.");
}

const COOKIE_NAME = "auth_token";

function makeToken(userId: string) {
  return jwt.sign({ userId }, SECRET as string, { expiresIn: "30d" });
}

function setCookie(res: any, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

function getUserIdFromCookie(req: any): string | null {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, SECRET as string) as { userId: string };
    return payload.userId;
  } catch {
    return null;
  }
}

router.post("/auth/signup", async (req, res): Promise<void> => {
  const body = SignupBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, body.data.email));
  if (existing[0]) {
    res.status(409).json({ error: "an account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(body.data.password, 10);
  const id = randomUUID();

  await db.insert(usersTable).values({ id, email: body.data.email, passwordHash });

  const token = makeToken(id);
  setCookie(res, token);
  res.status(201).json({ id, email: body.data.email });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const body = LoginBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const rows = await db.select().from(usersTable).where(eq(usersTable.email, body.data.email));
  const user = rows[0];
  if (!user) {
    res.status(401).json({ error: "wrong email or password" });
    return;
  }

  const ok = await bcrypt.compare(body.data.password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "wrong email or password" });
    return;
  }

  const token = makeToken(user.id);
  setCookie(res, token);
  res.json({ id: user.id, email: user.email });
});

router.post("/auth/logout", (req, res): void => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    res.json({ user: null });
    return;
  }

  try {
    const payload = jwt.verify(token, SECRET as string) as { userId: string };
    const rows = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));
    const user = rows[0];
    if (!user) {
      res.json({ user: null });
      return;
    }
    res.json({ user: { id: user.id, email: user.email } });
  } catch {
    res.json({ user: null });
  }
});

// deletes the account and everything tied to it. no undo.
router.delete("/auth/me", async (req, res): Promise<void> => {
  const userId = getUserIdFromCookie(req);
  if (!userId) {
    res.status(401).json({ error: "not logged in" });
    return;
  }

  // sessionId doubles as the user id everywhere else, so this is just
  // deleting every row in every table that matches it
  // messages table only has subscriptionId, not sessionId, so grab the
  // subscription ids first and delete messages tied to those
  const mySubs = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.sessionId, userId));
  for (const sub of mySubs) {
    await db.delete(negotiationMessagesTable).where(eq(negotiationMessagesTable.subscriptionId, sub.id));
  }

  await db.delete(subscriptionsTable).where(eq(subscriptionsTable.sessionId, userId));
  await db.delete(renewalsTable).where(eq(renewalsTable.sessionId, userId));
  await db.delete(budgetProfileTable).where(eq(budgetProfileTable.sessionId, userId));
  await db.delete(fixedExpensesTable).where(eq(fixedExpensesTable.sessionId, userId));
  await db.delete(financialGoalsTable).where(eq(financialGoalsTable.sessionId, userId));
  await db.delete(loansTable).where(eq(loansTable.sessionId, userId));
  await db.delete(savingsTable).where(eq(savingsTable.sessionId, userId));
  await db.delete(sharePlanRequestsTable).where(eq(sharePlanRequestsTable.sessionId, userId));
  await db.delete(usersTable).where(eq(usersTable.id, userId));

  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

export default router;
