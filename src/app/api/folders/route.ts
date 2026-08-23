import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { folders } from "@/server/db/schema";
import { authenticate } from "@/server/lib/auth";
import { jsonError, unauthorized } from "@/server/lib/http";

// GET /api/folders — list folders with deck counts
export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) return unauthorized();

  const result = await db
    .select({
      id: folders.id,
      name: folders.name,
      createdAt: folders.createdAt,
      updatedAt: folders.updatedAt,
      // Fully hand-qualified: interpolating folders.id would render an
      // unqualified "id" that resolves to decks.id inside the subquery.
      deckCount:
        sql<number>`(SELECT COUNT(*) FROM decks WHERE decks.folder_id = folders.id)`.mapWith(
          Number
        ),
    })
    .from(folders)
    .where(eq(folders.userId, user.id))
    .orderBy(folders.updatedAt);

  return NextResponse.json(result);
}

// POST /api/folders
export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const { name } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return jsonError(400, "Folder name is required");
  }

  const now = Date.now();
  const folder = {
    id: crypto.randomUUID(),
    userId: user.id,
    name: name.trim(),
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(folders).values(folder);
  return NextResponse.json({ ...folder, deckCount: 0 }, { status: 201 });
}
