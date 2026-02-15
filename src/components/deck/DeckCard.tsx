"use client";

import Link from "next/link";
import { Deck } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface DeckCardProps {
  deck: Deck;
}

export default function DeckCard({ deck }: DeckCardProps) {
  return (
    <Link
      href={`/decks/${deck.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <h3 className="text-lg font-semibold text-gray-900 truncate">
        {deck.title}
      </h3>
      {deck.description && (
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
          {deck.description}
        </p>
      )}
      <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
        <span>{deck.cards.length} cards</span>
        <span>Updated {formatDate(deck.updatedAt)}</span>
      </div>
    </Link>
  );
}
