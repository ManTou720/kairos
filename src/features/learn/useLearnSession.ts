"use client";

import { useState, useMemo, useCallback } from "react";
import { shuffle } from "@/lib/utils";
import * as api from "@/lib/api";
import type { Card } from "@/lib/types";

export interface LearnItem {
  card: Card;
  options: string[];
}

function buildQuestions(cards: Card[]): LearnItem[] {
  return shuffle(cards).map((card) => {
    const others = cards.filter((c) => c.id !== card.id);
    const distractors = shuffle(others)
      .slice(0, Math.min(3, others.length))
      .map((c) => c.definition);
    return {
      card,
      options: shuffle([card.definition, ...distractors]),
    };
  });
}

/**
 * Learn-mode session state machine. Grades are reported to the server
 * (quality 4 = correct, 1 = incorrect); the server computes SM-2.
 * Missed cards are tracked so they can be re-drilled in a follow-up round.
 */
export function useLearnSession(cards: Card[] | undefined) {
  // Snapshot the deck's cards when they first arrive so SWR revalidations
  // don't rebuild an in-progress session. Bumping `seed` builds a new set.
  const [sessionCards, setSessionCards] = useState<Card[] | null>(null);
  const [seed, setSeed] = useState(0);
  // 本輪只練這些卡片（再學一次＝null 代表整副）
  const [poolOverride, setPoolOverride] = useState<Card[] | null>(null);
  const [missedIds, setMissedIds] = useState<Set<string>>(new Set());

  if (cards && cards.length > 0 && sessionCards !== cards) {
    setSessionCards(cards);
  }

  const sourceCards = poolOverride ?? sessionCards;

  const questions = useMemo(
    () => (sourceCards ? buildQuestions(sourceCards) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `seed` intentionally triggers a rebuild for a new round
    [sourceCards, seed]
  );

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  /** 全部重來：清空統計、重新出題 */
  const restart = useCallback(() => {
    setSeed((s) => s + 1);
    setPoolOverride(null);
    setMissedIds(new Set());
    setCurrent(0);
    setSelected(null);
    setResults([]);
    setDone(false);
  }, []);

  /** 只練答錯的：把累積答錯的卡片重排成一輪 */
  const restartMissed = useCallback(() => {
    const missed = sessionCards?.filter((c) => missedIds.has(c.id)) ?? [];
    if (!missed.length) return;
    setPoolOverride(shuffle(missed));
    setSeed((s) => s + 1);
    setCurrent(0);
    setSelected(null);
    setResults([]);
    setDone(false);
  }, [sessionCards, missedIds]);

  const handleSelect = useCallback(
    (option: string) => {
      const q = questions?.[current];
      if (!q || selected) return;
      setSelected(option);
      const isCorrect = option === q.card.definition;
      setResults((r) => [...r, isCorrect]);
      setMissedIds((prev) => {
        const next = new Set(prev);
        if (isCorrect) {
          next.delete(q.card.id);
        } else {
          next.add(q.card.id);
        }
        return next;
      });

      // Fire-and-forget: the server owns the SR calculation.
      api.reviewCard(q.card.id, isCorrect ? 4 : 1).catch(() => {});
    },
    [questions, current, selected]
  );

  const handleNext = useCallback(() => {
    if (!questions) return;
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
    } else {
      setDone(true);
    }
  }, [questions, current]);

  return {
    items: questions ?? [],
    q: questions?.[current],
    current,
    selected,
    results,
    done,
    missedCount: missedIds.size,
    handleSelect,
    handleNext,
    restart,
    restartMissed,
  };
}
