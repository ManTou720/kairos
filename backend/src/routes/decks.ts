import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { decks, cards } from "../db/schema.js";
import { eq, and, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware } from "../middleware/auth.js";
import { deckSummaryColumns } from "../lib/queries.js";
import { toDeckDto, type DeckRow, type CardRow } from "../types/api.js";

const router = Router();
router.use(authMiddleware);

interface CardInput {
  id?: string;
  term: string;
  definition: string;
  termLang?: string;
  defLang?: string;
}

function isCardInput(c: unknown): c is CardInput {
  return (
    typeof c === "object" &&
    c !== null &&
    typeof (c as CardInput).term === "string" &&
    typeof (c as CardInput).definition === "string"
  );
}

function parseCardData(raw: unknown): CardInput[] | null {
  if (!Array.isArray(raw)) return [];
  if (!raw.every(isCardInput)) return null;
  return raw as CardInput[];
}

// GET /decks — list all decks with card count
router.get("/", async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const result = await db
    .select(deckSummaryColumns)
    .from(decks)
    .where(eq(decks.userId, userId))
    .orderBy(decks.updatedAt);

  res.json(result);
});

// POST /decks — create a deck with cards
router.post("/", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { title, description, folderId } = req.body;

  if (!title || typeof title !== "string") {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const cardData = parseCardData(req.body.cards);
  if (cardData === null) {
    res.status(400).json({ error: "Invalid card data" });
    return;
  }

  const now = Date.now();
  const deckId = uuidv4();

  const newCards: CardRow[] = cardData.map((c, i) => ({
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
  }));

  // Deck + initial cards are created atomically.
  const created = await db.transaction(async (tx): Promise<DeckRow> => {
    const [deck] = await tx
      .insert(decks)
      .values({
        id: deckId,
        userId,
        folderId: folderId || null,
        title: title.trim(),
        description: (description || "").trim(),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (newCards.length > 0) {
      await tx.insert(cards).values(newCards);
    }

    return deck;
  });

  res.status(201).json(toDeckDto(created, newCards));
});

// GET /decks/:id — get deck with all cards
router.get("/:id", async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const [deck, owned] = await getOwnedDeckWithCards(
    req.params.id as string,
    userId
  );
  if (!owned) {
    res.status(404).json({ error: "Deck not found" });
    return;
  }

  res.json(toDeckDto(deck!, owned));
});

// PUT /decks/:id — update deck and cards
router.put("/:id", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const deckId = req.params.id as string;
  const { title, description, folderId } = req.body;

  let cardData: CardInput[] | undefined;
  if (req.body.cards !== undefined) {
    const parsed = parseCardData(req.body.cards);
    if (parsed === null) {
      res.status(400).json({ error: "Invalid card data" });
      return;
    }
    cardData = parsed;
  }

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

  const updated = await db.transaction(async (tx): Promise<DeckRow> => {
    const [deck] = await tx
      .update(decks)
      .set({
        title: title?.trim() ?? existing.title,
        description: description?.trim() ?? existing.description,
        folderId: folderId !== undefined ? folderId || null : existing.folderId,
        updatedAt: now,
      })
      .where(eq(decks.id, deckId))
      .returning();

    // Diff-update cards atomically: delete removed, upsert the rest.
    if (cardData !== undefined) {
      const existingCards = await tx
        .select({ id: cards.id })
        .from(cards)
        .where(eq(cards.deckId, deckId));

      const incomingIds = new Set(
        cardData.filter((c) => c.id).map((c) => c.id as string)
      );
      const removedIds = existingCards
        .filter((c) => !incomingIds.has(c.id))
        .map((c) => c.id);

      if (removedIds.length > 0) {
        await tx.delete(cards).where(inArray(cards.id, removedIds));
      }

      const existingIds = new Set(existingCards.map((c) => c.id));
      for (let i = 0; i < cardData.length; i++) {
        const c = cardData[i];
        if (c.id && existingIds.has(c.id)) {
          // Update existing card (preserve SR data)
          await tx
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
          await tx.insert(cards).values({
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

    return deck;
  });

  const deckCards = await db
    .select()
    .from(cards)
    .where(eq(cards.deckId, deckId))
    .orderBy(cards.sortOrder);

  res.json(toDeckDto(updated, deckCards));
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

/** Load a deck + its cards after verifying ownership. */
async function getOwnedDeckWithCards(
  deckId: string,
  userId: string
): Promise<[DeckRow | null, CardRow[]]> {
  const deck = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!deck) return [null, []];

  const deckCards = await db
    .select()
    .from(cards)
    .where(eq(cards.deckId, deckId))
    .orderBy(cards.sortOrder);

  return [deck, deckCards];
}

export default router;
