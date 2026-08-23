import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { folders } from "@/server/db/schema";
import { authenticate } from "@/server/lib/auth";
import { jsonError, unauthorized } from "@/server/lib/http";

type Params = { params: Promise<{ folderId: string }> };

// PUT /api/folders/:folderId
export async function PUT(req: NextRequest, { params }: Params) {
  const user = await authenticate(req);
  if (!user) return unauthorized();

  const { folderId } = await params;
  const body = await req.json().catch(() => ({}));
  const { name } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return jsonError(400, "Folder name is required");
  }

  const result = await db
    .update(folders)
    .set({ name: name.trim(), updatedAt: Date.now() })
    .where(and(eq(folders.id, folderId), eq(folders.userId, user.id)))
    .returning();

  if (result.length === 0) return jsonError(404, "Folder not found");

  return NextResponse.json(result[0]);
}

// DELETE /api/folders/:folderId
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await authenticate(req);
  if (!user) return unauthorized();

  const { folderId } = await params;
  const result = await db
    .delete(folders)
    .where(and(eq(folders.id, folderId), eq(folders.userId, user.id)))
    .returning();

  if (result.length === 0) return jsonError(404, "Folder not found");

  return NextResponse.json({ success: true });
}
