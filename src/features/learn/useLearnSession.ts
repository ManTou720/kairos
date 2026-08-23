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
      .slice(0, 3)
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
 */
export function useLearnSession(cards: Card[] | undefined) {
  // Snapshot the deck's cards when they first arrive so SWR revalidations
  // don't rebuild an in-progress session. Bumping `seed` builds a new set.
  const [sessionCards, setSessionCards] = useState<Card[] | null>(null);
  const [seed, setSeed] = useState(0);

  if (cards && cards.length > 0 && sessionCards !== cards) {
    setSessionCards(cards);
  }

  const questions = useMemo(
    () => (sessionCards ? buildQuestions(sessionCards) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `seed` intentionally triggers a rebuild for「再學一次」
    [sessionCards, seed]
  );

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  const restart = useCallback(() => {
    setSeed((s) => s + 1);
    setCurrent(0);
    setSelected(null);
    setResults([]);
    setDone(false);
  }, []);

  const handleSelect = useCallback(
    (option: string) => {
      const q = questions?.[current];
      if (!q || selected) return;
      setSelected(option);
      const isCorrect = option === q.card.definition;
      setResults((r) => [...r, isCorrect]);

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
    handleSelect,
    handleNext,
    restart,
  };
}
