/**
 * Input validation helpers used across route handlers.
 */

/** Strip HTML and script tags from user-provided text to prevent XSS in stored data */
export function sanitizeText(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

/** Validate that a sessionId is a non-empty string (UUID or similar) */
export function isValidSessionId(sessionId: unknown): sessionId is string {
  return typeof sessionId === "string" && sessionId.trim().length > 0 && sessionId.length <= 128;
}

/** Clamp a number to a safe range */
export function clampAmount(amount: number, min = 0, max = 1_000_000): number {
  return Math.max(min, Math.min(max, amount));
}

/** Check if a string is a valid subscription status */
export const VALID_STATUSES = ["active", "flagged", "cancelled", "reviewing"] as const;
export type SubscriptionStatus = (typeof VALID_STATUSES)[number];

export function isValidStatus(s: unknown): s is SubscriptionStatus {
  return typeof s === "string" && (VALID_STATUSES as readonly string[]).includes(s);
}
