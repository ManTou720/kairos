"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDecks } from "@/hooks/useStore";
import { loadSampleData } from "@/lib/sample-data";
import DeckCard from "@/components/deck/DeckCard";
import Button from "@/components/ui/Button";

export default function HomePage() {
  const decks = useDecks();

  useEffect(() => {
    loadSampleData();
  }, []);

  if (decks === null) {
    return <div className="text-center py-12 text-gray-400">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Decks</h1>
        <Link href="/decks/new">
          <Button>+ Create deck</Button>
        </Link>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            No decks yet
          </h2>
          <p className="text-gray-500 mb-6">
            Create your first flashcard deck to get started.
          </p>
          <Link href="/decks/new">
            <Button size="lg">Create your first deck</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {decks
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
        </div>
      )}
    </div>
  );
}
