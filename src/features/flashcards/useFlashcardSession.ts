"use client";

import { useState, useMemo, useCallback } from "react";
import { useKeyboard } from "@/hooks/useKeyboard";
import { shuffle } from "@/lib/utils";
import type { Card } from "@/lib/types";

export type FlashcardPhase = "studying" | "roundComplete";

/**
 * Flashcard browsing session: deck ordering, flip state and
 * known / still-learning tracking across rounds.
 * Pure UI state — no SR writes; grading happens in Learn mode.
 */
export function useFlashcardSession(deckCards: Card[] | undefined) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [cards, setCards] = useState<Card[] | null>(null);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [learning, setLearning] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<FlashcardPhase>("studying");

  const displayCards = useMemo(() => {
    if (cards) return cards;
    return deckCards ?? [];
  }, [cards, deckCards]);

  const prev = useCallback(() => {
    if (index > 0 && phase === "studying") {
      setIndex((i) => i - 1);
      setFlipped(false);
    }
  }, [index, phase]);

  /** 前進一張;若已是最後一張則結束回合 */
  const advance = useCallback(() => {
    if (index < displayCards.length - 1) {
      setIndex((i) => i + 1);
      setFlipped(false);
    } else {
      setFlipped(false);
      setPhase("roundComplete");
    }
  }, [index, displayCards.length]);

  // 向下相容:next 在最後一張時結束回合
  const next = advance;

  const markKnown = useCallback(() => {
    if (phase !== "studying") return;
    const current = displayCards[index];
    if (!current) return;
    setKnown((prev) => new Set(prev).add(current.id));
    setLearning((prev) => {
      const nextSet = new Set(prev);
      nextSet.delete(current.id);
      return nextSet;
    });
    advance();
  }, [displayCards, index, phase, advance]);

  const markLearning = useCallback(() => {
    if (phase !== "studying") return;
    const current = displayCards[index];
    if (!current) return;
    setLearning((prev) => new Set(prev).add(current.id));
    setKnown((prev) => {
      const nextSet = new Set(prev);
      nextSet.delete(current.id);
      return nextSet;
    });
    advance();
  }, [displayCards, index, phase, advance]);

  const doShuffle = useCallback(() => {
    if (!deckCards) return;
    setCards(shuffle(deckCards));
    setIndex(0);
    setFlipped(false);
    setPhase("studying");
  }, [deckCards]);

  /** 全部重來:清空統計、重新洗牌 */
  const restartAll = useCallback(() => {
    if (!deckCards?.length) return;
    setKnown(new Set());
    setLearning(new Set());
    setCards(shuffle(deckCards));
    setIndex(0);
    setFlipped(false);
    setPhase("studying");
  }, [deckCards]);

  /** 只練不熟:把「仍在學習」的卡片重排成一輪(統計累計保留) */
  const restartLearning = useCallback(() => {
    if (!deckCards?.length) return;
    const pool = deckCards.filter((c) => learning.has(c.id));
    if (!pool.length) return;
    setCards(shuffle(pool));
    setIndex(0);
    setFlipped(false);
    setPhase("studying");
  }, [deckCards, learning]);

  const toggleFlip = useCallback(() => {
    if (phase === "studying") setFlipped((f) => !f);
  }, [phase]);

  const handlers = useMemo(
    () => ({
      " ": (e: KeyboardEvent) => {
        e.preventDefault();
        if (phase === "studying") setFlipped((f) => !f);
      },
      ArrowLeft: () => prev(),
      ArrowRight: () => advance(),
      KeyS: () => doShuffle(),
    }),
    [prev, advance, doShuffle, phase]
  );

  useKeyboard(handlers);

  return {
    current: displayCards[index],
    index,
    total: displayCards.length,
    flipped,
    known,
    learning,
    phase,
    prev,
    next,
    markKnown,
    markLearning,
    doShuffle,
    restartAll,
    restartLearning,
    toggleFlip,
  };
}
