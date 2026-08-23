"use client";

import { useState, useMemo, useCallback } from "react";
import { useKeyboard } from "@/hooks/useKeyboard";
import { shuffle } from "@/lib/utils";
import type { Card } from "@/lib/types";

/**
 * Flashcard browsing session: deck ordering, flip state and
 * known / still-learning tracking. Pure UI state — no SR writes;
 * grading happens in Learn mode.
 */
export function useFlashcardSession(deckCards: Card[] | undefined) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [cards, setCards] = useState<Card[] | null>(null);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [learning, setLearning] = useState<Set<string>>(new Set());

  const displayCards = useMemo(() => {
    if (cards) return cards;
    return deckCards ?? [];
  }, [cards, deckCards]);

  const prev = useCallback(() => {
    if (index > 0) {
      setIndex((i) => i - 1);
      setFlipped(false);
    }
  }, [index]);

  const next = useCallback(() => {
    if (index < displayCards.length - 1) {
      setIndex((i) => i + 1);
      setFlipped(false);
    }
  }, [index, displayCards.length]);

  const markKnown = useCallback(() => {
    const current = displayCards[index];
    if (!current) return;
    setKnown((prev) => new Set(prev).add(current.id));
    setLearning((prev) => {
      const next = new Set(prev);
      next.delete(current.id);
      return next;
    });
    next();
  }, [displayCards, index, next]);

  const markLearning = useCallback(() => {
    const current = displayCards[index];
    if (!current) return;
    setLearning((prev) => new Set(prev).add(current.id));
    setKnown((prev) => {
      const next = new Set(prev);
      next.delete(current.id);
      return next;
    });
    next();
  }, [displayCards, index, next]);

  const doShuffle = useCallback(() => {
    if (!deckCards) return;
    setCards(shuffle(deckCards));
    setIndex(0);
    setFlipped(false);
  }, [deckCards]);

  const toggleFlip = useCallback(() => setFlipped((f) => !f), []);

  const handlers = useMemo(
    () => ({
      " ": (e: KeyboardEvent) => {
        e.preventDefault();
        setFlipped((f) => !f);
      },
      ArrowLeft: () => prev(),
      ArrowRight: () => next(),
      KeyS: () => doShuffle(),
    }),
    [prev, next, doShuffle]
  );

  useKeyboard(handlers);

  return {
    current: displayCards[index],
    index,
    total: displayCards.length,
    flipped,
    known,
    learning,
    prev,
    next,
    markKnown,
    markLearning,
    doShuffle,
    toggleFlip,
  };
}
