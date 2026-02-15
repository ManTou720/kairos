"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { useDeck } from "@/hooks/useStore";
import { shuffle } from "@/lib/utils";
import { calculateSR } from "@/lib/sr";
import { updateCardSR } from "@/lib/storage";
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
  const deck = useDeck(deckId);
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
    return <div className="text-center py-12 text-gray-400">Loading...</div>;
  }

  if (deck.cards.length < MIN_CARDS_FOR_LEARN) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">
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
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
        <p className="text-lg text-gray-600 mb-1">
          {correct} / {results.length} correct
        </p>
        <p className="text-gray-400 mb-6">
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

    // Update SR
    const quality = isCorrect ? 4 : 1;
    const newSR = calculateSR(q.card.sr, quality);
    updateCardSR(deckId, q.card.id, newSR);
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
    <div>
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/decks/${deckId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back
        </Link>
        <h1 className="text-lg font-semibold">Learn</h1>
        <span className="text-sm text-gray-400">
          {current + 1} / {items.length}
        </span>
      </div>

      <ProgressBar value={current + 1} max={items.length} className="mb-6" />

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
        <p className="text-sm text-gray-400 mb-2">What is the definition of:</p>
        <p className="text-xl font-semibold">{q.card.term}</p>
      </div>

      <div className="space-y-3">
        {q.options.map((option, i) => {
          let style = "border-gray-200 bg-white hover:border-indigo-300";
          if (selected) {
            if (option === q.card.definition) {
              style = "border-green-500 bg-green-50";
            } else if (option === selected && option !== q.card.definition) {
              style = "border-red-500 bg-red-50";
            } else {
              style = "border-gray-200 bg-gray-50 opacity-50";
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(option)}
              disabled={!!selected}
              className={`w-full text-left rounded-lg border p-4 text-sm transition-colors ${style}`}
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
