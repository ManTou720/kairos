import { sql } from "drizzle-orm";
import { decks } from "../db/schema";

/**
 * Shared select shape for deck summaries (deck list + search results).
 * Keeps the two queries in sync and counts cards in a single query.
 *
 * NOTE: the subqueries are fully hand-qualified (`cards.deck_id`,
 * `decks.id`). Interpolating Drizzle Column objects into a sql`` template
 * renders them UNQUALIFIED ("id"), which inside the subquery resolves to
 * cards.id instead of decks.id and silently returns 0.
 */
export const deckSummaryColumns = {
  id: decks.id,
  title: decks.title,
  description: decks.description,
  folderId: decks.folderId,
  createdAt: decks.createdAt,
  updatedAt: decks.updatedAt,
  authorName:
    sql<string>`(SELECT username FROM users WHERE users.id = decks.user_id)`.mapWith(
      String
    ),
  cardCount:
    sql<number>`(SELECT COUNT(*) FROM cards WHERE cards.deck_id = decks.id)`.mapWith(
      Number
    ),
  /** Cards that have been studied at least once (sr_repetitions > 0). */
  learnedCount:
    sql<number>`(SELECT COUNT(*) FROM cards WHERE cards.deck_id = decks.id AND cards.sr_repetitions > 0)`.mapWith(
      Number
    ),
};
