"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useDeck } from "@/hooks/useDecks";
import { useTimer } from "@/hooks/useTimer";
import { shuffle } from "@/lib/utils";
import { MIN_CARDS_FOR_MATCH, MAX_MATCH_PAIRS } from "@/lib/constants";
import Button from "@/components/ui/Button";

interface MatchItem {
  id: string;
  cardId: string;
  text: string;
  type: "term" | "definition";
  matched: boolean;
}

type Phase = "ready" | "playing" | "done";

export default function MatchPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = use(params);
  const { data: deck } = useDeck(deckId);
  const { elapsed, start, stop, formatTime } = useTimer();
  const [phase, setPhase] = useState<Phase>("ready");
  const [terms, setTerms] = useState<MatchItem[]>([]);
  const [definitions, setDefinitions] = useState<MatchItem[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [selectedDef, setSelectedDef] = useState<string | null>(null);
  const [errors, setErrors] = useState(0);
  const [shakeIds, setShakeIds] = useState<string[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [totalPairs, setTotalPairs] = useState(0);

  const initGame = useCallback(() => {
    if (!deck) return;
    const pairs = shuffle(deck.cards).slice(0, MAX_MATCH_PAIRS);
    const termItems: MatchItem[] = shuffle(
      pairs.map((c) => ({
        id: `t-${c.id}`,
        cardId: c.id,
        text: c.term,
        type: "term" as const,
        matched: false,
      }))
    );
    const defItems: MatchItem[] = shuffle(
      pairs.map((c) => ({
        id: `d-${c.id}`,
        cardId: c.id,
        text: c.definition,
        type: "definition" as const,
        matched: false,
      }))
    );
    setTerms(termItems);
    setDefinitions(defItems);
    setSelectedTerm(null);
    setSelectedDef(null);
    setErrors(0);
    setShakeIds([]);
    setMatchedCount(0);
    setTotalPairs(pairs.length);
    setPhase("playing");
    start();
  }, [deck, start]);

  // Check for match whenever both sides are selected
  useEffect(() => {
    if (!selectedTerm || !selectedDef) return;

    const term = terms.find((t) => t.id === selectedTerm);
    const def = definitions.find((d) => d.id === selectedDef);

    if (!term || !def) return;

    if (term.cardId === def.cardId) {
      // Match!
      setTerms((prev) =>
        prev.map((t) => (t.id === selectedTerm ? { ...t, matched: true } : t))
      );
      setDefinitions((prev) =>
        prev.map((d) => (d.id === selectedDef ? { ...d, matched: true } : d))
      );
      setMatchedCount((c) => c + 1);
      setSelectedTerm(null);
      setSelectedDef(null);
    } else {
      // Mismatch
      setErrors((e) => e + 1);
      setShakeIds([selectedTerm, selectedDef]);
      setTimeout(() => {
        setShakeIds([]);
        setSelectedTerm(null);
        setSelectedDef(null);
      }, 500);
    }
  }, [selectedTerm, selectedDef, terms, definitions]);

  // Check for completion
  useEffect(() => {
    if (
      phase === "playing" &&
      totalPairs > 0 &&
      matchedCount === totalPairs
    ) {
      stop();
      setPhase("done");
    }
  }, [matchedCount, totalPairs, phase, stop]);

  if (!deck) {
    return <div className="text-center py-12 text-[#9A9A94]">載入中...</div>;
  }

  if (deck.cards.length < MIN_CARDS_FOR_MATCH) {
    return (
      <div className="text-center py-16">
        <p className="text-[#6A6963] mb-4">
          配對模式至少需要 {MIN_CARDS_FOR_MATCH} 張卡片。
        </p>
        <Link href={`/decks/${deckId}`}>
          <Button variant="secondary">返回學習集</Button>
        </Link>
      </div>
    );
  }

  function handleTermClick(item: MatchItem) {
    if (item.matched || phase !== "playing" || shakeIds.length > 0) return;
    setSelectedTerm(item.id === selectedTerm ? null : item.id);
  }

  function handleDefClick(item: MatchItem) {
    if (item.matched || phase !== "playing" || shakeIds.length > 0) return;
    setSelectedDef(item.id === selectedDef ? null : item.id);
  }

  if (phase === "ready") {
    return (
      <div className="text-center py-16 px-4">
        <Link
          href={`/decks/${deckId}`}
          className="text-sm text-[#6A6963] hover:text-[#1A1A1A] mb-4 inline-block"
        >
          <i className="fa-solid fa-xmark mr-2" /> 返回
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#1A1A1A] mb-2">
          配對模式
        </h1>
        <p className="text-[#6A6963] mb-6">
          盡快將詞語和定義配對！
        </p>
        <Button size="lg" onClick={initGame}>
          開始
        </Button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="text-center py-12 px-4">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#1A1A1A] mb-2">
          完成！
        </h2>
        <p className="text-lg text-[#6A6963] mb-1">
          時間：{formatTime(elapsed)}
        </p>
        <p className="text-[#9A9A94] mb-6">
          {errors} 次錯誤
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={initGame}>再玩一次</Button>
          <Link href={`/decks/${deckId}`}>
            <Button variant="secondary">返回學習集</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between h-14 px-4 lg:px-6 bg-white border-b border-[#E8DDD0] shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/decks/${deckId}`}
            className="text-[#6A6963] hover:text-[#1A1A1A] transition-colors"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </Link>
          <span className="font-semibold text-[#1A1A1A]">配對模式</span>
        </div>
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-stopwatch text-[#6A6963]" />
          <span className="font-mono text-lg font-semibold text-[#1A1A1A]">
            {formatTime(elapsed)}
          </span>
        </div>
        <span className="text-sm text-[#6A6963]">
          已配對 {matchedCount}/{totalPairs}
        </span>
      </div>

      {/* Two-column match area */}
      <div className="flex-1 flex items-center justify-center px-4 lg:px-20 py-6">
        <div className="flex gap-3 lg:gap-10 w-full max-w-[640px]">
          {/* Left column - terms */}
          <div className="flex-1 flex flex-col gap-2.5 lg:gap-3">
            {terms.map((item) => {
              const isSelected = selectedTerm === item.id;
              const isShaking = shakeIds.includes(item.id);

              let style =
                "border-[#D5C8B2] bg-white hover:border-[#D4AF37] cursor-pointer";
              if (item.matched) {
                style =
                  "border-[#2D6A4F] bg-[#2D6A4F15] opacity-50 pointer-events-none border-2";
              } else if (isShaking) {
                style =
                  "border-[#E85D3A] bg-[#FFF3EE] border-2 animate-shake";
              } else if (isSelected) {
                style =
                  "border-[#D4AF37] bg-[#D4AF3715] border-2 font-semibold";
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleTermClick(item)}
                  disabled={item.matched}
                  className={`rounded-full border h-14 lg:h-14 flex items-center justify-center text-sm lg:text-base text-[#1A1A1A] transition-all ${style}`}
                >
                  {item.text}
                  {item.matched && " \u2713"}
                </button>
              );
            })}
          </div>

          {/* Right column - definitions */}
          <div className="flex-1 flex flex-col gap-2.5 lg:gap-3">
            {definitions.map((item) => {
              const isSelected = selectedDef === item.id;
              const isShaking = shakeIds.includes(item.id);

              let style =
                "border-[#D5C8B2] bg-white hover:border-[#D4AF37] cursor-pointer";
              if (item.matched) {
                style =
                  "border-[#2D6A4F] bg-[#2D6A4F15] opacity-50 pointer-events-none border-2";
              } else if (isShaking) {
                style =
                  "border-[#E85D3A] bg-[#FFF3EE] border-2 animate-shake";
              } else if (isSelected) {
                style =
                  "border-[#D4AF37] bg-[#D4AF3715] border-2 font-semibold";
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleDefClick(item)}
                  disabled={item.matched}
                  className={`rounded-full border h-14 lg:h-14 flex items-center justify-center text-sm lg:text-base text-[#1A1A1A] transition-all ${style}`}
                >
                  {item.text}
                  {item.matched && " \u2713"}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
