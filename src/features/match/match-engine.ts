import type { Card } from "@/lib/types";

export interface MatchItem {
  id: string;
  cardId: string;
  text: string;
  type: "term" | "definition";
  matched: boolean;
}

export interface MatchBoard {
  terms: MatchItem[];
  definitions: MatchItem[];
  totalPairs: number;
}

/**
 * Build a match board from deck cards (pure & testable):
 * pick up to maxPairs cards, then shuffle each column independently.
 */
export function buildMatchBoard(
  cards: Card[],
  maxPairs: number,
  shuffle: <T>(items: T[]) => T[]
): MatchBoard {
  const pairs = shuffle(cards).slice(0, maxPairs);
  const termItems = shuffle(
    pairs.map((c) => ({
      id: `t-${c.id}`,
      cardId: c.id,
      text: c.term,
      type: "term" as const,
      matched: false,
    }))
  );
  const defItems = shuffle(
    pairs.map((c) => ({
      id: `d-${c.id}`,
      cardId: c.id,
      text: c.definition,
      type: "definition" as const,
      matched: false,
    }))
  );
  return { terms: termItems, definitions: defItems, totalPairs: pairs.length };
}
