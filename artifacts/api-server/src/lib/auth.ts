import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const COOKIE_NAME = "auth_token";

export function getUserIdFromCookie(req: any): string | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;

  try {
    const payload = jwt.verify(token, secret) as { userId: string };
    return payload.userId;
  } catch {
    return null;
  }
}

export { COOKIE_NAME };

export async function isProUser(userId: string): Promise<boolean> {
  const rows = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return rows[0]?.plan === "pro";
}
