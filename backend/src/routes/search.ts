import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { decks, cards } from "../db/schema.js";
import { eq, and, or, ilike, sql } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

// GET /search?q=keyword
router.get("/", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const query = (req.query.q as string) || "";

  if (!query.trim()) {
    res.json([]);
    return;
  }

  const pattern = `%${query.trim()}%`;

  // Find decks that match by title or have cards matching term/definition
  const matchingDecks = await db
    .select({
      id: decks.id,
      title: decks.title,
      description: decks.description,
      folderId: decks.folderId,
      createdAt: decks.createdAt,
      updatedAt: decks.updatedAt,
      cardCount: sql<number>`(SELECT COUNT(*) FROM cards WHERE cards.deck_id = ${decks.id})`.mapWith(Number),
    })
    .from(decks)
    .where(
      and(
        eq(decks.userId, userId),
        or(
          ilike(decks.title, pattern),
          sql`EXISTS (SELECT 1 FROM cards WHERE cards.deck_id = ${decks.id} AND (cards.term ILIKE ${pattern} OR cards.definition ILIKE ${pattern}))`
        )
      )
    )
    .orderBy(decks.updatedAt);

  res.json(matchingDecks);
});

export default router;
