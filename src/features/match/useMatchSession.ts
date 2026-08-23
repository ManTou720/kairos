"use client";

import { useState, useCallback } from "react";
import { useTimer } from "@/hooks/useTimer";
import { shuffle } from "@/lib/utils";
import { MAX_MATCH_PAIRS } from "@/lib/constants";
import type { Card } from "@/lib/types";
import { buildMatchBoard, type MatchItem } from "./match-engine";

export type MatchPhase = "ready" | "playing" | "done";

const MISMATCH_SHAKE_MS = 500;

/**
 * Match-mode session state machine. Pair resolution happens directly in
 * the click handlers (event-driven, no sync effects): as soon as one tile
 * from each column is selected they are resolved — a match locks both
 * tiles, a mismatch triggers a brief shake.
 */
export function useMatchSession(deckCards: Card[] | undefined) {
  const { elapsed, start, stop, formatTime } = useTimer();
  const [phase, setPhase] = useState<MatchPhase>("ready");
  const [terms, setTerms] = useState<MatchItem[]>([]);
  const [definitions, setDefinitions] = useState<MatchItem[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [selectedDef, setSelectedDef] = useState<string | null>(null);
  const [errors, setErrors] = useState(0);
  const [shakeIds, setShakeIds] = useState<string[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [totalPairs, setTotalPairs] = useState(0);

  const busy = shakeIds.length > 0;

  const initGame = useCallback(() => {
    if (!deckCards) return;
    const board = buildMatchBoard(deckCards, MAX_MATCH_PAIRS, shuffle);
    setTerms(board.terms);
    setDefinitions(board.definitions);
    setTotalPairs(board.totalPairs);
    setSelectedTerm(null);
    setSelectedDef(null);
    setErrors(0);
    setShakeIds([]);
    setMatchedCount(0);
    setPhase("playing");
    start();
  }, [deckCards, start]);

  /** Resolve a completed selection pair (one term + one definition). */
  const resolvePair = useCallback(
    (termId: string, defId: string) => {
      const term = terms.find((t) => t.id === termId);
      const def = definitions.find((d) => d.id === defId);
      if (!term || !def) return;

      if (term.cardId === def.cardId) {
        // Match! Lock both tiles and check for completion.
        const mark = (list: MatchItem[]) =>
          list.map((t) =>
            t.id === termId || t.id === defId ? { ...t, matched: true } : t
          );
        setTerms(mark);
        setDefinitions(mark);
        setSelectedTerm(null);
        setSelectedDef(null);
        setMatchedCount((c) => {
          const next = c + 1;
          if (next === totalPairs) {
            stop();
            setPhase("done");
          }
          return next;
        });
      } else {
        // Mismatch — shake briefly, then clear both selections.
        setErrors((e) => e + 1);
        setShakeIds([termId, defId]);
        setTimeout(() => {
          setShakeIds([]);
          setSelectedTerm(null);
          setSelectedDef(null);
        }, MISMATCH_SHAKE_MS);
      }
    },
    [terms, definitions, totalPairs, stop]
  );

  const handleTermClick = useCallback(
    (item: MatchItem) => {
      if (item.matched || phase !== "playing" || busy) return;
      if (selectedTerm === item.id) {
        setSelectedTerm(null); // toggle off
        return;
      }
      setSelectedTerm(item.id);
      if (selectedDef) resolvePair(item.id, selectedDef);
    },
    [phase, busy, selectedTerm, selectedDef, resolvePair]
  );

  const handleDefClick = useCallback(
    (item: MatchItem) => {
      if (item.matched || phase !== "playing" || busy) return;
      if (selectedDef === item.id) {
        setSelectedDef(null); // toggle off
        return;
      }
      setSelectedDef(item.id);
      if (selectedTerm) resolvePair(selectedTerm, item.id);
    },
    [phase, busy, selectedTerm, selectedDef, resolvePair]
  );

  return {
    phase,
    terms,
    definitions,
    selectedTerm,
    selectedDef,
    errors,
    shakeIds,
    matchedCount,
    totalPairs,
    elapsed,
    formatTime,
    initGame,
    handleTermClick,
    handleDefClick,
  };
}
