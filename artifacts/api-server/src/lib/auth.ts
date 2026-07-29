import jwt from "jsonwebtoken";

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
