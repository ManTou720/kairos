import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { sessions, users } from "@/server/db/schema";
import { SESSION_TTL_MS } from "@/server/lib/auth";
import { jsonError } from "@/server/lib/http";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { username } = body;

  if (!username || typeof username !== "string" || username.trim().length === 0) {
    return jsonError(400, "Username is required");
  }

  const trimmedUsername = username.trim().toLowerCase();

  // Find or create user
  let user = await db
    .select()
    .from(users)
    .where(eq(users.username, trimmedUsername))
    .limit(1)
    .then((rows) => rows[0]);

  if (!user) {
    const newUser = {
      id: crypto.randomUUID(),
      username: trimmedUsername,
      createdAt: Date.now(),
    };
    await db.insert(users).values(newUser);
    user = newUser;
  }

  // Create session
  const now = Date.now();
  const token = crypto.randomUUID();
  await db.insert(sessions).values({
    token,
    userId: user.id,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  });

  return NextResponse.json({
    token,
    user: { id: user.id, username: user.username },
  });
}
