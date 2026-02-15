"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useDeck } from "@/hooks/useStore";
import { useTimer } from "@/hooks/useTimer";
import { shuffle } from "@/lib/utils";
import { MIN_CARDS_FOR_MATCH, MAX_MATCH_PAIRS } from "@/lib/constants";
import Button from "@/components/ui/Button";

interface Tile {
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
  const deck = useDeck(deckId);
  const { elapsed, start, stop, formatTime } = useTimer();
  const [phase, setPhase] = useState<Phase>("ready");
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [errors, setErrors] = useState(0);
  const [shakeIds, setShakeIds] = useState<string[]>([]);

  const initGame = useCallback(() => {
    if (!deck) return;
    const pairs = shuffle(deck.cards).slice(0, MAX_MATCH_PAIRS);
    const termTiles: Tile[] = pairs.map((c) => ({
      id: `t-${c.id}`,
      cardId: c.id,
      text: c.term,
      type: "term",
      matched: false,
    }));
    const defTiles: Tile[] = pairs.map((c) => ({
      id: `d-${c.id}`,
      cardId: c.id,
      text: c.definition,
      type: "definition",
      matched: false,
    }));
    setTiles(shuffle([...termTiles, ...defTiles]));
    setSelected(null);
    setErrors(0);
    setShakeIds([]);
    setPhase("playing");
    start();
  }, [deck, start]);

  // Check if all matched
  useEffect(() => {
    if (phase === "playing" && tiles.length > 0 && tiles.every((t) => t.matched)) {
      stop();
      setPhase("done");
    }
  }, [tiles, phase, stop]);

  if (!deck) {
    return <div className="text-center py-12 text-gray-400">Loading...</div>;
  }

  if (deck.cards.length < MIN_CARDS_FOR_MATCH) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">
          Need at least {MIN_CARDS_FOR_MATCH} cards for Match.
        </p>
        <Link href={`/decks/${deckId}`}>
          <Button variant="secondary">Back to deck</Button>
        </Link>
      </div>
    );
  }

  function handleTileClick(tile: Tile) {
    if (tile.matched || phase !== "playing") return;

    if (!selected) {
      setSelected(tile.id);
      return;
    }

    if (selected === tile.id) {
      setSelected(null);
      return;
    }

    const first = tiles.find((t) => t.id === selected)!;

    // Must be different types (term vs definition) and same card
    if (first.type !== tile.type && first.cardId === tile.cardId) {
      // Match!
      setTiles((prev) =>
        prev.map((t) =>
          t.cardId === tile.cardId ? { ...t, matched: true } : t
        )
      );
      setSelected(null);
    } else {
      // Wrong
      setErrors((e) => e + 1);
      setShakeIds([first.id, tile.id]);
      setTimeout(() => {
        setShakeIds([]);
        setSelected(null);
      }, 500);
    }
  }

  // READY
  if (phase === "ready") {
    return (
      <div className="text-center py-16">
        <Link
          href={`/decks/${deckId}`}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
        >
          ← Back
        </Link>
        <div className="text-5xl mb-4">🎯</div>
        <h1 className="text-2xl font-bold mb-2">Match Game</h1>
        <p className="text-gray-500 mb-6">
          Match terms with their definitions as fast as you can!
        </p>
        <Button size="lg" onClick={initGame}>
          Start
        </Button>
      </div>
    );
  }

  // DONE
  if (phase === "done") {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold mb-2">Complete!</h2>
        <p className="text-lg text-gray-600 mb-1">
          Time: {formatTime(elapsed)}
        </p>
        <p className="text-gray-400 mb-6">
          {errors} {errors === 1 ? "mistake" : "mistakes"}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={initGame}>Play again</Button>
          <Link href={`/decks/${deckId}`}>
            <Button variant="secondary">Back to deck</Button>
          </Link>
        </div>
      </div>
    );
  }

  // PLAYING
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/decks/${deckId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back
        </Link>
        <span className="text-sm font-medium">{formatTime(elapsed)}</span>
        <span className="text-sm text-gray-400">{errors} mistakes</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {tiles.map((tile) => {
          const isSelected = selected === tile.id;
          const isShaking = shakeIds.includes(tile.id);

          let style = "border-gray-200 bg-white hover:border-indigo-300";
          if (tile.matched) {
            style = "border-green-300 bg-green-50 opacity-40 pointer-events-none";
          } else if (isShaking) {
            style = "border-red-500 bg-red-50 animate-pulse";
          } else if (isSelected) {
            style = "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200";
          }

          return (
            <button
              key={tile.id}
              onClick={() => handleTileClick(tile)}
              disabled={tile.matched}
              className={`rounded-xl border p-3 min-h-[80px] text-sm font-medium transition-all ${style}`}
            >
              {tile.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
