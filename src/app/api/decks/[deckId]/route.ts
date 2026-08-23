import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db";
import { cards, decks } from "@/server/db/schema";
import { authenticate } from "@/server/lib/auth";
import { jsonError, unauthorized } from "@/server/lib/http";
import { toDeckDto } from "@/server/types/api";

type DeckRow = typeof decks.$inferSelect;
type CardRow = typeof cards.$inferSelect;
type Params = { params: Promise<{ deckId: string }> };

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

/** Returns the validated card array, [] when absent, or null when invalid. */
function parseCards(raw: unknown): CardInput[] | null | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw) || !raw.every(isCardInput)) return null;
  return raw as CardInput[];
}

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

// GET /api/decks/:deckId — full deck with all cards
export async function GET(req: NextRequest, { params }: Params) {
  const user = await authenticate(req);
  if (!user) return unauthorized();

  const { deckId } = await params;
  const [deck, owned] = await getOwnedDeckWithCards(deckId, user.id);
  if (!deck) return jsonError(404, "Deck not found");

  return NextResponse.json(toDeckDto(deck, owned));
}

// PUT /api/decks/:deckId — update deck and diff-update its cards
export async function PUT(req: NextRequest, { params }: Params) {
  const user = await authenticate(req);
  if (!user) return unauthorized();

  const { deckId } = await params;
  const body = await req.json().catch(() => ({}));
  const { title, description, folderId } = body;

  let cardData: CardInput[] | undefined;
  if (body.cards !== undefined) {
    const parsed = parseCards(body.cards);
    if (parsed === null || parsed === undefined) {
      return jsonError(400, "Invalid card data");
    }
    cardData = parsed;
  }

  const existing = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, user.id)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existing) return jsonError(404, "Deck not found");

  const now = Date.now();

  // Deck metadata + card diff are applied atomically.
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

    // Diff-update cards: delete removed, update kept, insert new.
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
          // Insert new card with fresh SR state
          await tx.insert(cards).values({
            id: crypto.randomUUID(),
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

  return NextResponse.json(toDeckDto(updated, deckCards));
}

// DELETE /api/decks/:deckId
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await authenticate(req);
  if (!user) return unauthorized();

  const { deckId } = await params;
  const result = await db
    .delete(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, user.id)))
    .returning();

  if (result.length === 0) return jsonError(404, "Deck not found");

  return NextResponse.json({ success: true });
}
