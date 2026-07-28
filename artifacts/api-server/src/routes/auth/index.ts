import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
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

export default router;
