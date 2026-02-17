"use client";

import { use, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useDeck } from "@/hooks/useDecks";
import { useKeyboard } from "@/hooks/useKeyboard";
import { shuffle } from "@/lib/utils";
import { Card } from "@/lib/types";
import FlashcardCard from "@/components/flashcards/FlashcardCard";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";

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
    return <div className="text-center py-12 text-[#9A9A94]">Loading...</div>;
  }

  const current = displayCards[index];
  if (!current) return null;

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/decks/${deckId}`}
          className="text-sm text-[#6A6963] hover:text-[#1A1A1A]"
        >
          <i className="fa-solid fa-arrow-left mr-1" /> Back
        </Link>
        <h1 className="text-lg font-semibold text-[#1A1A1A] font-[family-name:var(--font-ui)]">
          {deck.title}
        </h1>
        <Button variant="ghost" size="sm" onClick={doShuffle}>
          <i className="fa-solid fa-shuffle mr-1" /> Shuffle
        </Button>
      </div>

      <ProgressBar value={index + 1} max={displayCards.length} className="mb-2" />
      <p className="text-sm text-[#9A9A94] text-center mb-4">
        {index + 1} / {displayCards.length}
      </p>

      <FlashcardCard
        term={current.term}
        definition={current.definition}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
      />

      <div className="flex justify-center gap-4 mt-6">
        <Button variant="secondary" onClick={prev} disabled={index === 0}>
          <i className="fa-solid fa-arrow-left mr-1" /> Previous
        </Button>
        <Button
          variant="secondary"
          onClick={next}
          disabled={index === displayCards.length - 1}
        >
          Next <i className="fa-solid fa-arrow-right ml-1" />
        </Button>
      </div>

      <p className="text-xs text-[#9A9A94] text-center mt-4">
        Space to flip &middot; Arrow keys to navigate &middot; S to shuffle
      </p>
    </div>
  );
}
