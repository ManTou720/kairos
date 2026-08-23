import { eq, lt } from "drizzle-orm";
import { db } from "../db";
import { sessions, users } from "../db/schema";

/** Sessions are valid for 30 days after login. */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Throttle for the lazy expired-session purge (at most once per hour).
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
let lastCleanupAt = 0;

function maybePurgeExpiredSessions() {
  const now = Date.now();
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
  lastCleanupAt = now;
  // Fire-and-forget: never block the request on housekeeping.
  db.delete(sessions)
    .where(lt(sessions.expiresAt, now))
    .catch((err) => console.error("Session cleanup failed:", err));
}

export interface AuthUser {
  id: string;
  username: string;
}

/**
 * Validate the request's Bearer token and return the owning user,
 * or null when missing/invalid/expired. Expired sessions are deleted
 * so subsequent requests fail fast.
 */
export async function authenticate(req: Request): Promise<AuthUser | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const now = Date.now();

  maybePurgeExpiredSessions();

  const result = await db
    .select({
      userId: sessions.userId,
      expiresAt: sessions.expiresAt,
      username: users.username,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1);

  if (result.length === 0) return null;

  if (result[0].expiresAt < now) {
    await db.delete(sessions).where(eq(sessions.token, token));
    return null;
  }

  return { id: result[0].userId, username: result[0].username };
}
