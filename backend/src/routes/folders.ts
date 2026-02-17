import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { folders, decks } from "../db/schema.js";
import { eq, and, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

// GET /folders
router.get("/", async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const result = await db
    .select({
      id: folders.id,
      name: folders.name,
      createdAt: folders.createdAt,
      updatedAt: folders.updatedAt,
      deckCount: sql<number>`(SELECT COUNT(*) FROM decks WHERE decks.folder_id = ${folders.id})`.mapWith(Number),
    })
    .from(folders)
    .where(eq(folders.userId, userId))
    .orderBy(folders.updatedAt);

  res.json(result);
});

// POST /folders
router.post("/", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { name } = req.body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: "Folder name is required" });
    return;
  }

  const now = Date.now();
  const folder = {
    id: uuidv4(),
    userId,
    name: name.trim(),
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(folders).values(folder);
  res.status(201).json({ ...folder, deckCount: 0 });
});

// PUT /folders/:id
router.put("/:id", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { name } = req.body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: "Folder name is required" });
    return;
  }

  const result = await db
    .update(folders)
    .set({ name: name.trim(), updatedAt: Date.now() })
    .where(and(eq(folders.id, req.params.id as string), eq(folders.userId, userId)))
    .returning();

  if (result.length === 0) {
    res.status(404).json({ error: "Folder not found" });
    return;
  }

  res.json(result[0]);
});

// DELETE /folders/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const result = await db
    .delete(folders)
    .where(and(eq(folders.id, req.params.id as string), eq(folders.userId, userId)))
    .returning();

  if (result.length === 0) {
    res.status(404).json({ error: "Folder not found" });
    return;
  }

  res.json({ success: true });
});

export default router;
