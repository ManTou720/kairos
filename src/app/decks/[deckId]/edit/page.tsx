"use client";

import { use } from "react";
import Link from "next/link";
import { useDeck } from "@/hooks/useStore";
import DeckForm from "@/components/deck/DeckForm";
import Button from "@/components/ui/Button";

export default function EditDeckPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = use(params);
  const deck = useDeck(deckId);

  if (deck === null) {
    return <div className="text-center py-12 text-gray-400">Loading...</div>;
  }

  if (!deck) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          Deck not found
        </h2>
        <Link href="/">
          <Button variant="secondary">Back to decks</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Deck</h1>
      <DeckForm deck={deck} />
    </div>
  );
}
