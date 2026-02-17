import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { cards, decks } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

// PATCH /cards/:id/sr — update spaced repetition data
router.patch("/:id/sr", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const cardId = req.params.id as string;
  const { interval, easeFactor, repetitions, nextReview, lastReview } =
    req.body;

  // Verify card belongs to user's deck
  const card = await db
    .select({ id: cards.id, deckId: cards.deckId })
    .from(cards)
    .where(eq(cards.id, cardId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  const deck = await db
    .select({ userId: decks.userId })
    .from(decks)
    .where(and(eq(decks.id, card.deckId), eq(decks.userId, userId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!deck) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  await db
    .update(cards)
    .set({
      srInterval: interval,
      srEaseFactor: easeFactor,
      srRepetitions: repetitions,
      srNextReview: nextReview,
      srLastReview: lastReview,
    })
    .where(eq(cards.id, cardId));

  res.json({ success: true });
});

export default router;
