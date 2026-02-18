"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { useDeck } from "@/hooks/useDecks";
import { shuffle } from "@/lib/utils";
import { calculateSR } from "@/lib/sr";
import * as api from "@/lib/api";
import { MIN_CARDS_FOR_LEARN } from "@/lib/constants";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import { Card } from "@/lib/types";

interface LearnItem {
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

export default function LearnPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = use(params);
  const { data: deck } = useDeck(deckId);
  const [questions, setQuestions] = useState<LearnItem[] | null>(null);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  const items = useMemo(() => {
    if (questions) return questions;
    if (!deck || deck.cards.length < MIN_CARDS_FOR_LEARN) return [];
    const q = buildQuestions(deck.cards);
    setQuestions(q);
    return q;
  }, [questions, deck]);

  if (!deck) {
    return <div className="text-center py-12 text-[#9A9A94]">載入中...</div>;
  }

  if (deck.cards.length < MIN_CARDS_FOR_LEARN) {
    return (
      <div className="text-center py-16">
        <p className="text-[#6A6963] mb-4">
          學習模式至少需要 {MIN_CARDS_FOR_LEARN} 張卡片。
        </p>
        <Link href={`/decks/${deckId}`}>
          <Button variant="secondary">返回學習集</Button>
        </Link>
      </div>
    );
  }

  if (done) {
    const correct = results.filter(Boolean).length;
    return (
      <div className="text-center py-12 px-4">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#1A1A1A] mb-2">
          學習完成！
        </h2>
        <p className="text-lg text-[#6A6963] mb-1">
          {correct} / {results.length} 正確
        </p>
        <p className="text-[#9A9A94] mb-6">
          正確率 {Math.round((correct / results.length) * 100)}%
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => {
              setQuestions(buildQuestions(deck.cards));
              setCurrent(0);
              setSelected(null);
              setResults([]);
              setDone(false);
            }}
          >
            再學一次
          </Button>
          <Link href={`/decks/${deckId}`}>
            <Button variant="secondary">返回學習集</Button>
          </Link>
        </div>
      </div>
    );
  }

  const q = items[current];
  if (!q) return null;

  function handleSelect(option: string) {
    if (selected) return;
    setSelected(option);
    const isCorrect = option === q.card.definition;
    setResults((r) => [...r, isCorrect]);

    const quality = isCorrect ? 4 : 1;
    const newSR = calculateSR(q.card.sr, quality);
    api.updateCardSR(q.card.id, newSR);
  }

  function handleNext() {
    if (current < items.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
    } else {
      setDone(true);
    }
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
          <span className="font-semibold text-[#1A1A1A]">學習模式</span>
        </div>
        <div className="hidden sm:block w-[300px]">
          <ProgressBar value={current + 1} max={items.length} />
        </div>
        <span className="font-mono text-sm text-[#6A6963]">
          {current + 1} / {items.length}
        </span>
      </div>

      {/* Mobile progress bar */}
      <div className="sm:hidden">
        <ProgressBar value={current + 1} max={items.length} />
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 lg:px-20 py-6 lg:py-10">
        <div className="w-full max-w-[700px] rounded-xl border border-[#D5C8B2] bg-white p-6 lg:p-8 space-y-6">
          {/* Question label */}
          <span className="text-xs font-semibold tracking-wider text-[#D4AF37] uppercase">
            定義
          </span>

          {/* Term */}
          <p className="font-[family-name:var(--font-display)] text-2xl lg:text-[28px] font-semibold text-[#1A1A1A]">
            {q.card.term}
          </p>

          {/* Speaker icon */}
          <button className="text-[#8B7355] hover:text-[#1A1A1A] transition-colors">
            <i className="fa-solid fa-volume-high text-lg" />
          </button>

          {/* Instruction */}
          <p className="text-sm font-medium text-[#1A1A1A]">選擇正確的詞語</p>

          {/* Options */}
          <div className="space-y-3">
            {q.options.map((option, i) => {
              let style =
                "border-[#D5C8B2] bg-white hover:border-[#D4AF37] cursor-pointer";
              if (selected) {
                if (option === q.card.definition) {
                  style = "border-[#2BAC6E] bg-[#E8F5EE] border-2";
                } else if (option === selected) {
                  style = "border-[#E85D3A] bg-[#FFF3EE] border-2";
                } else {
                  style = "border-[#D5C8B2] bg-white opacity-40";
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(option)}
                  disabled={!!selected}
                  className={`w-full flex items-center rounded-full border px-4 h-12 text-sm text-[#1A1A1A] transition-all ${style}`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Don't know link */}
          {!selected && (
            <button
              onClick={() => handleSelect("")}
              className="text-sm font-medium text-[#D4AF37] hover:underline"
            >
              不知道嗎？
            </button>
          )}

          {/* Next button */}
          {selected && (
            <div className="text-center pt-2">
              <Button onClick={handleNext}>
                {current < items.length - 1 ? "下一題" : "查看結果"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
