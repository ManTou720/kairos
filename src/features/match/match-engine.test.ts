import { describe, it, expect } from "vitest";
import { buildMatchBoard, type MatchItem } from "./match-engine";
import { shuffle, generateId } from "@/lib/utils";
import type { Card } from "@/lib/types";

function makeCards(n: number): Card[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `card-${i}`,
    term: `term ${i}`,
    definition: `definition ${i}`,
    termLang: null,
    defLang: null,
    sr: {
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      nextReview: Date.now(),
      lastReview: null,
    },
  }));
}

function cardIds(items: MatchItem[]): string[] {
  return items.map((i) => i.cardId).sort();
}

describe("buildMatchBoard", () => {
  it("uses at most maxPairs cards", () => {
    const board = buildMatchBoard(makeCards(10), 6, shuffle);
    expect(board.totalPairs).toBe(6);
    expect(board.terms).toHaveLength(6);
    expect(board.definitions).toHaveLength(6);
  });

  it("handles decks smaller than maxPairs", () => {
    const board = buildMatchBoard(makeCards(3), 6, shuffle);
    expect(board.totalPairs).toBe(3);
  });

  it("keeps term/definition columns paired by cardId", () => {
    const board = buildMatchBoard(makeCards(8), 6, shuffle);
    expect(cardIds(board.terms)).toEqual(cardIds(board.definitions));
  });

  it("starts with no item matched", () => {
    const board = buildMatchBoard(makeCards(8), 6, shuffle);
    expect([...board.terms, ...board.definitions].every((i) => !i.matched)).toBe(
      true
    );
  });

  it("term ids are unique and distinct from definition ids", () => {
    const board = buildMatchBoard(makeCards(8), 6, shuffle);
    const allIds = [...board.terms, ...board.definitions].map((i) => i.id);
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it("generateId produces unique values (used by question builders)", () => {
    const [a, b] = [generateId(), generateId()];
    expect(a).not.toBe(b);
  });
});
