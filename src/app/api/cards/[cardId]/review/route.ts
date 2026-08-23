import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { cards, decks } from "@/server/db/schema";
import { authenticate } from "@/server/lib/auth";
import { jsonError, unauthorized } from "@/server/lib/http";
import { calculateSM2 } from "@/server/lib/sr";

type Params = { params: Promise<{ cardId: string }> };

// POST /api/cards/:cardId/review — grade a card (quality 0-5).
// SM-2 is computed server-side so clients can never forge
// interval/ease/repetition values.
export async function POST(req: NextRequest, { params }: Params) {
  const user = await authenticate(req);
  if (!user) return unauthorized();

  const { cardId } = await params;
  const body = await req.json().catch(() => ({}));
  const { quality } = body;

  if (typeof quality !== "number" || !Number.isFinite(quality)) {
    return jsonError(400, "quality must be a number");
  }

  // Load the card and verify it belongs to a deck owned by the caller.
  const card = await db
    .select({ card: cards })
    .from(cards)
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(and(eq(cards.id, cardId), eq(decks.userId, user.id)))
    .limit(1)
    .then((rows) => rows[0]?.card);

  if (!card) return jsonError(404, "Card not found");

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

  return NextResponse.json({ cardId, sr: nextSr });
}
