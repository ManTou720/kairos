import { Request, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { sessions, users } from "../db/schema.js";
import { eq, lt } from "drizzle-orm";

/** Sessions are valid for 30 days after login. */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Throttle for the lazy expired-session purge (at most once per hour).
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
let lastCleanupAt = 0;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- standard Express Request augmentation
  namespace Express {
    interface Request {
      user?: { id: string; username: string };
    }
  }
}

function maybePurgeExpiredSessions() {
  const now = Date.now();
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
  lastCleanupAt = now;
  // Fire-and-forget: never block the request on housekeeping.
  db.delete(sessions)
    .where(lt(sessions.expiresAt, now))
    .catch((err) => console.error("Session cleanup failed:", err));
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

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

  if (result.length === 0) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  if (result[0].expiresAt < now) {
    // Expired: remove it so subsequent requests fail fast.
    await db.delete(sessions).where(eq(sessions.token, token));
    res.status(401).json({ error: "Session expired" });
    return;
  }

  req.user = { id: result[0].userId, username: result[0].username };
  next();
}
