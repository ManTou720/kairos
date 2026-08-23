import { NextRequest, NextResponse } from "next/server";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { decks } from "@/server/db/schema";
import { authenticate } from "@/server/lib/auth";
import { unauthorized } from "@/server/lib/http";
import { deckSummaryColumns } from "@/server/lib/queries";

// GET /api/search?q=keyword — match deck titles or card term/definition
export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) return unauthorized();

  const query = req.nextUrl.searchParams.get("q") || "";
  if (!query.trim()) return NextResponse.json([]);

  const pattern = `%${query.trim()}%`;

  const matchingDecks = await db
    .select(deckSummaryColumns)
    .from(decks)
    .where(
      and(
        eq(decks.userId, user.id),
        or(
          ilike(decks.title, pattern),
          sql`EXISTS (SELECT 1 FROM cards WHERE cards.deck_id = decks.id AND (cards.term ILIKE ${pattern} OR cards.definition ILIKE ${pattern}))`
        )
      )
    )
    .orderBy(decks.updatedAt);

  return NextResponse.json(matchingDecks);
}
