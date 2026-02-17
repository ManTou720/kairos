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
    return <div className="text-center py-12 text-[#9A9A94]">Loading...</div>;
  }

  if (deck.cards.length < MIN_CARDS_FOR_LEARN) {
    return (
      <div className="text-center py-16">
        <p className="text-[#6A6963] mb-4">
          Need at least {MIN_CARDS_FOR_LEARN} cards to use Learn mode.
        </p>
        <Link href={`/decks/${deckId}`}>
          <Button variant="secondary">Back to deck</Button>
        </Link>
      </div>
    );
  }

  if (done) {
    const correct = results.filter(Boolean).length;
    return (
      <div className="text-center py-12 px-4">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#1A1A1A] mb-2">
          Session Complete!
        </h2>
        <p className="text-lg text-[#6A6963] mb-1">
          {correct} / {results.length} correct
        </p>
        <p className="text-[#9A9A94] mb-6">
          {Math.round((correct / results.length) * 100)}% accuracy
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
            Learn again
          </Button>
          <Link href={`/decks/${deckId}`}>
            <Button variant="secondary">Back to deck</Button>
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
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/decks/${deckId}`}
          className="text-sm text-[#6A6963] hover:text-[#1A1A1A]"
        >
          <i className="fa-solid fa-arrow-left mr-1" /> Back
        </Link>
        <h1 className="text-lg font-semibold text-[#1A1A1A] font-[family-name:var(--font-ui)]">
          Learn
        </h1>
        <span className="text-sm text-[#9A9A94]">
          {current + 1} / {items.length}
        </span>
      </div>

      <ProgressBar value={current + 1} max={items.length} className="mb-6" />

      <div className="rounded-xl border border-[#E8DDD0] bg-white p-6 mb-6">
        <p className="text-sm text-[#9A9A94] mb-2">What is the definition of:</p>
        <p className="font-[family-name:var(--font-display)] text-2xl font-medium text-[#1A1A1A]">
          {q.card.term}
        </p>
      </div>

      <div className="space-y-3">
        {q.options.map((option, i) => {
          let style = "border-[#E8DDD0] bg-white hover:border-[#D4AF37]";
          if (selected) {
            if (option === q.card.definition) {
              style = "border-[#2D6A4F] bg-[#2D6A4F10]";
            } else if (option === selected) {
              style = "border-[#8B0000] bg-[#8B000010]";
            } else {
              style = "border-[#E8DDD0] bg-[#EADCC5]/30 opacity-50";
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(option)}
              disabled={!!selected}
              className={`w-full text-left rounded-xl border p-4 text-sm transition-colors ${style}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-4 text-center">
          <Button onClick={handleNext}>
            {current < items.length - 1 ? "Next" : "See results"}
          </Button>
        </div>
      )}
    </div>
  );
}
