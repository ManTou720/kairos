/**
 * Single source of truth for API request/response shapes.
 *
 * DTOs are derived from the Drizzle schema so schema changes surface as
 * type errors here instead of silently diverging. The frontend imports
 * these types (type-only, erased at build time) from src/lib/types.ts.
 */
import type { InferSelectModel } from "drizzle-orm";
import type { cards, decks, folders, users } from "../db/schema.js";
import type { SrState } from "../lib/sr.js";

// ---- Row types (derived from schema) ----
export type UserRow = InferSelectModel<typeof users>;
export type FolderRow = InferSelectModel<typeof folders>;
export type DeckRow = InferSelectModel<typeof decks>;
export type CardRow = InferSelectModel<typeof cards>;

// ---- API DTOs ----

export type SpacedRepetition = SrState;

export interface User {
  id: string;
  username: string;
}

export interface Card {
  id: string;
  term: string;
  definition: string;
  termLang: string | null;
  defLang: string | null;
  sr: SpacedRepetition;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  folderId: string | null;
  createdAt: number;
  updatedAt: number;
  cards: Card[];
}

export interface DeckSummary {
  id: string;
  title: string;
  description: string;
  folderId: string | null;
  cardCount: number;
  /** Cards studied at least once (srRepetitions > 0). */
  learnedCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  deckCount: number;
  createdAt: number;
  updatedAt: number;
}

// ---- Row -> DTO mappers (shared by all routes) ----

export function toCardDto(row: CardRow): Card {
  return {
    id: row.id,
    term: row.term,
    definition: row.definition,
    termLang: row.termLang ?? null,
    defLang: row.defLang ?? null,
    sr: {
      interval: row.srInterval,
      easeFactor: row.srEaseFactor,
      repetitions: row.srRepetitions,
      nextReview: row.srNextReview,
      lastReview: row.srLastReview,
    },
  };
}

export function toDeckDto(deck: DeckRow, deckCards: CardRow[]): Deck {
  return {
    id: deck.id,
    title: deck.title,
    description: deck.description,
    folderId: deck.folderId ?? null,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
    cards: deckCards.map(toCardDto),
  };
}
