import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { cards, decks } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth.js";
import { calculateSM2 } from "../lib/sr.js";

const router = Router();
router.use(authMiddleware);

// Load a card and verify it belongs to a deck owned by `userId`.
async function findOwnedCard(cardId: string, userId: string) {
  return db
    .select({ card: cards })
    .from(cards)
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(and(eq(cards.id, cardId), eq(decks.userId, userId)))
    .limit(1)
    .then((rows) => rows[0]?.card);
}

// POST /cards/:id/review — grade a card (quality 0-5); SM-2 is computed
// server-side so clients can never forge interval/ease values.
router.post("/:id/review", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const cardId = req.params.id as string;
  const { quality } = req.body;

  if (typeof quality !== "number" || !Number.isFinite(quality)) {
    res.status(400).json({ error: "quality must be a number" });
    return;
  }

  const card = await findOwnedCard(cardId, userId);
  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  const nextSr = calculateSM2(
    {
      interval: card.srInterval,
      easeFactor: card.srEaseFactor,
      repetitions: card.srRepetitions,
      nextReview: card.srNextReview,
      lastReview: card.srLastReview,
    },
    quality
  );

  await db
    .update(cards)
    .set({
      srInterval: nextSr.interval,
      srEaseFactor: nextSr.easeFactor,
      srRepetitions: nextSr.repetitions,
      srNextReview: nextSr.nextReview,
      srLastReview: nextSr.lastReview,
    })
    .where(eq(cards.id, cardId));

  res.json({ cardId, sr: nextSr });
});

export default router;
