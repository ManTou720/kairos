"use client";

import { use } from "react";
import Link from "next/link";
import { useDeck } from "@/hooks/useDecks";
import DeckForm from "@/components/deck/DeckForm";
import Button from "@/components/ui/Button";

export default function EditDeckPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = use(params);
  const { data: deck, isLoading } = useDeck(deckId);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-[#D5C8B2]" />
          <div className="h-10 rounded bg-[#D5C8B2]" />
          <div className="h-24 rounded bg-[#D5C8B2]" />
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">
          Deck not found
        </h2>
        <Link href="/">
          <Button variant="secondary">Back to home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#1A1A1A] mb-6">
        Edit Deck
      </h1>
      <DeckForm deck={deck} />
    </div>
  );
}
