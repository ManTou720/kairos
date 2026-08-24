"use client";

import Link from "next/link";
import { DeckSummary } from "@/lib/types";

interface DeckCardProps {
  deck: DeckSummary;
}

export default function DeckCard({ deck }: DeckCardProps) {
  return (
    <Link
      href={`/decks/${deck.id}`}
      className="block rounded-xl border border-[#E8DDD0] bg-white p-5 transition-shadow hover:shadow-md"
    >
      <h3 className="text-base font-semibold text-[#1A1A1A] truncate font-[family-name:var(--font-ui)]">
        {deck.title}
      </h3>
      {deck.description && (
        <p className="mt-1 text-sm text-[#6A6963] line-clamp-2">
          {deck.description}
        </p>
      )}
      <div className="mt-3 text-[13px] text-[#6A6963]">
        <span>{deck.cardCount} cards</span>
        <span className="mx-1">&middot;</span>
        <span>by {deck.authorName}</span>
      </div>
    </Link>
  );
}
