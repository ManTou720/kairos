"use client";

import { use, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useDeck } from "@/hooks/useDecks";
import { useKeyboard } from "@/hooks/useKeyboard";
import { shuffle } from "@/lib/utils";
import { Card } from "@/lib/types";
import FlashcardCard from "@/components/flashcards/FlashcardCard";
import { useTTS } from "@/hooks/useTTS";

export default function FlashcardsPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = use(params);
  const { data: deck } = useDeck(deckId);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [cards, setCards] = useState<Card[] | null>(null);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [learning, setLearning] = useState<Set<string>>(new Set());
  const { speak } = useTTS();

  const displayCards = useMemo(() => {
    if (cards) return cards;
    return deck?.cards ?? [];
  }, [cards, deck?.cards]);

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
    if (!deck) return;
    setCards(shuffle(deck.cards));
    setIndex(0);
    setFlipped(false);
  }, [deck]);

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

  if (!deck) {
    return <div className="text-center py-12 text-[#9A9A94]">載入中...</div>;
  }

  const current = displayCards[index];
  if (!current) return null;

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
          <span className="font-semibold text-[#1A1A1A]">{deck.title}</span>
        </div>
        <span className="font-mono text-sm text-[#1A1A1A]">
          {index + 1} / {displayCards.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={doShuffle}
            className="flex items-center gap-1.5 text-sm text-[#6A6963] hover:text-[#1A1A1A] transition-colors"
          >
            <i className="fa-solid fa-shuffle" />
            <span className="hidden sm:inline">隨機</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-5 lg:px-20 py-6">
        {/* Progress row */}
        <div className="flex items-center justify-between w-full max-w-[720px] px-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#FFF3EE] border-2 border-[#E85D3A] flex items-center justify-center">
              <span className="text-xs font-semibold text-[#E85D3A]">{learning.size}</span>
            </div>
            <span className="text-sm font-medium text-[#E85D3A]">仍在學習</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#2BAC6E]">知道</span>
            <div className="w-7 h-7 rounded-full bg-[#E8F5EE] border-2 border-[#2BAC6E] flex items-center justify-center">
              <span className="text-xs font-semibold text-[#2BAC6E]">{known.size}</span>
            </div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="w-full max-w-[720px]">
          <FlashcardCard
            term={current.term}
            definition={current.definition}
            flipped={flipped}
            onFlip={() => setFlipped((f) => !f)}
            termLang={current.termLang}
            defLang={current.defLang}
            onSpeak={speak}
          />
        </div>

        {/* X and Check buttons */}
        <div className="flex items-center justify-center gap-8">
          <button
            onClick={markLearning}
            className="w-14 h-14 rounded-full bg-[#FFF3EE] flex items-center justify-center hover:bg-[#FFE8DE] transition-colors"
          >
            <i className="fa-solid fa-xmark text-2xl text-[#E85D3A]" />
          </button>
          <button
            onClick={markKnown}
            className="w-14 h-14 rounded-full bg-[#E8F5EE] flex items-center justify-center hover:bg-[#D0EBD8] transition-colors"
          >
            <i className="fa-solid fa-check text-2xl text-[#2BAC6E]" />
          </button>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between w-full max-w-[720px]">
          <button
            onClick={prev}
            disabled={index === 0}
            className="text-[#5C4A32] hover:text-[#1A1A1A] disabled:opacity-30 transition-colors"
          >
            <i className="fa-solid fa-rotate-left text-lg" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#D4AF37]">追蹤進度</span>
          </div>
          <button
            onClick={doShuffle}
            className="text-[#5C4A32] hover:text-[#1A1A1A] transition-colors"
          >
            <i className="fa-solid fa-shuffle text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
}
