import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { decks, cards } from "../db/schema.js";
import { eq, and, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

// GET /decks — list all decks with card count
router.get("/", async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const result = await db
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
    .where(eq(decks.userId, userId))
    .orderBy(decks.updatedAt);

  res.json(result);
});

// POST /decks — create a deck with cards
router.post("/", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { title, description, folderId, cards: cardData } = req.body;

  if (!title || typeof title !== "string") {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const now = Date.now();
  const deckId = uuidv4();

  await db.insert(decks).values({
    id: deckId,
    userId,
    folderId: folderId || null,
    title: title.trim(),
    description: (description || "").trim(),
    createdAt: now,
    updatedAt: now,
  });

  if (Array.isArray(cardData) && cardData.length > 0) {
    const cardValues = cardData.map(
      (c: { term: string; definition: string; termLang?: string; defLang?: string }, i: number) => ({
        id: uuidv4(),
        deckId,
        term: c.term,
        definition: c.definition,
        sortOrder: i,
        srInterval: 0,
        srEaseFactor: 2.5,
        srRepetitions: 0,
        srNextReview: now,
        srLastReview: null,
        termLang: c.termLang ?? null,
        defLang: c.defLang ?? null,
      })
    );
    await db.insert(cards).values(cardValues);
  }

  // Return full deck with cards
  const deck = await getFullDeck(deckId);
  res.status(201).json(deck);
});

// GET /decks/:id — get deck with all cards
router.get("/:id", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const deck = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, req.params.id as string), eq(decks.userId, userId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!deck) {
    res.status(404).json({ error: "Deck not found" });
    return;
  }

  const deckCards = await db
    .select()
    .from(cards)
    .where(eq(cards.deckId, deck.id))
    .orderBy(cards.sortOrder);

  res.json({
    ...deck,
    cards: deckCards.map((c) => ({
      id: c.id,
      term: c.term,
      definition: c.definition,
      termLang: c.termLang ?? null,
      defLang: c.defLang ?? null,
      sr: {
        interval: c.srInterval,
        easeFactor: c.srEaseFactor,
        repetitions: c.srRepetitions,
        nextReview: c.srNextReview,
        lastReview: c.srLastReview,
      },
    })),
  });
});

// PUT /decks/:id — update deck and cards
router.put("/:id", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const deckId = req.params.id as string;
  const { title, description, folderId, cards: cardData } = req.body;

  const existing = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existing) {
    res.status(404).json({ error: "Deck not found" });
    return;
  }

  const now = Date.now();

  await db
    .update(decks)
    .set({
      title: title?.trim() ?? existing.title,
      description: description?.trim() ?? existing.description,
      folderId: folderId !== undefined ? folderId || null : existing.folderId,
      updatedAt: now,
    })
    .where(eq(decks.id, deckId));

  // If cards provided, diff update
  if (Array.isArray(cardData)) {
    const existingCards = await db
      .select()
      .from(cards)
      .where(eq(cards.deckId, deckId));

    const existingCardMap = new Map(existingCards.map((c) => [c.id, c]));
    const newCardIds = new Set(
      cardData.filter((c: { id?: string }) => c.id).map((c: { id: string }) => c.id)
    );

    // Delete removed cards
    for (const ec of existingCards) {
      if (!newCardIds.has(ec.id)) {
        await db.delete(cards).where(eq(cards.id, ec.id));
      }
    }

    // Upsert cards
    for (let i = 0; i < cardData.length; i++) {
      const c = cardData[i];
      if (c.id && existingCardMap.has(c.id)) {
        // Update existing card (preserve SR data)
        await db
          .update(cards)
          .set({
            term: c.term,
            definition: c.definition,
            sortOrder: i,
            termLang: c.termLang ?? null,
            defLang: c.defLang ?? null,
          })
          .where(eq(cards.id, c.id));
      } else {
        // Insert new card
        await db.insert(cards).values({
          id: uuidv4(),
          deckId,
          term: c.term,
          definition: c.definition,
          sortOrder: i,
          srInterval: 0,
          srEaseFactor: 2.5,
          srRepetitions: 0,
          srNextReview: now,
          srLastReview: null,
          termLang: c.termLang ?? null,
          defLang: c.defLang ?? null,
        });
      }
    }
  }

  const deck = await getFullDeck(deckId);
  res.json(deck);
});

// DELETE /decks/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await db
    .delete(decks)
    .where(and(eq(decks.id, req.params.id as string), eq(decks.userId, userId)))
    .returning();

  if (result.length === 0) {
    res.status(404).json({ error: "Deck not found" });
    return;
  }

  res.json({ success: true });
});

async function getFullDeck(deckId: string) {
  const deck = await db
    .select()
    .from(decks)
    .where(eq(decks.id, deckId))
    .limit(1)
    .then((rows) => rows[0]);

  const deckCards = await db
    .select()
    .from(cards)
    .where(eq(cards.deckId, deckId))
    .orderBy(cards.sortOrder);

  return {
    ...deck,
    cards: deckCards.map((c) => ({
      id: c.id,
      term: c.term,
      definition: c.definition,
      termLang: c.termLang ?? null,
      defLang: c.defLang ?? null,
      sr: {
        interval: c.srInterval,
        easeFactor: c.srEaseFactor,
        repetitions: c.srRepetitions,
        nextReview: c.srNextReview,
        lastReview: c.srLastReview,
      },
    })),
  };
}

export default router;
