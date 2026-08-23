import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { cards, decks } from "@/server/db/schema";
import { authenticate } from "@/server/lib/auth";
import { jsonError, unauthorized } from "@/server/lib/http";
import { deckSummaryColumns } from "@/server/lib/queries";
import { toDeckDto, type CardRow } from "@/server/types/api";

// GET /api/decks — list all decks with card counts
export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) return unauthorized();

  const result = await db
    .select(deckSummaryColumns)
    .from(decks)
    .where(eq(decks.userId, user.id))
    .orderBy(decks.updatedAt);

  return NextResponse.json(result);
}

interface CardInput {
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

function parseCards(raw: unknown): CardInput[] | null {
  if (raw === undefined) return [];
  if (!Array.isArray(raw) || !raw.every(isCardInput)) return null;
  return raw as CardInput[];
}

function toCardRows(
  deckId: string,
  cardData: CardInput[],
  now: number
): CardRow[] {
  return cardData.map((c, i) => ({
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
  }));
}

// POST /api/decks — create a deck with initial cards (atomic)
export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const { title, description, folderId } = body;

  if (!title || typeof title !== "string") {
    return jsonError(400, "Title is required");
  }

  const cardData = parseCards(body.cards);
  if (cardData === null) {
    return jsonError(400, "Invalid card data");
  }

  const now = Date.now();
  const deckId = crypto.randomUUID();
  const newCards = toCardRows(deckId, cardData, now);

  // Deck + initial cards are created atomically.
  const created = await db.transaction(async (tx): Promise<typeof decks.$inferSelect> => {
    const [deck] = await tx
      .insert(decks)
      .values({
        id: deckId,
        userId: user.id,
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

  return NextResponse.json(toDeckDto(created, newCards), { status: 201 });
}
