import { randomUUID } from "crypto";

/**
 * Simple in-memory session store.
 * Sessions map a sessionId to arbitrary data.
 * Suitable for single-instance dev — replace with Redis for production scale.
 */

const sessions = new Map<string, Record<string, unknown>>();

/** Create a new session and return its ID. */
export function createSession(): string {
  const id = randomUUID();
  sessions.set(id, {});
  return id;
}

/** Read session data by ID. Returns null if session doesn't exist. */
export function getSession(id: string): Record<string, unknown> | null {
  return sessions.get(id) ?? null;
}

/** Validate that a session ID exists. */
export function isValidSession(id: string): boolean {
  return sessions.has(id);
}

/** Delete a session (e.g. on logout or upload reset). */
export function deleteSession(id: string): void {
  sessions.delete(id);
}
