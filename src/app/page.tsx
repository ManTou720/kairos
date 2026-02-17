"use client";

import Link from "next/link";
import { useDecks } from "@/hooks/useDecks";
import DeckCard from "@/components/deck/DeckCard";

export default function DashboardPage() {
  const { data: decks, isLoading } = useDecks();

  if (isLoading) {
    return (
      <div className="p-8 lg:p-10">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-48 rounded bg-[#D5C8B2]" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-[#D5C8B2]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const sorted = [...(decks || [])].sort((a, b) => b.updatedAt - a.updatedAt);
  const recent = sorted.slice(0, 4);

  return (
    <div className="p-6 lg:p-10 space-y-8">
      {/* Jump back in */}
      {recent.length > 0 && (
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-[28px] font-medium text-[#1A1A1A] tracking-tight mb-4">
            Jump back in
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {recent.slice(0, 2).map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        </section>
      )}

      {/* Recents */}
      <section>
        <h2 className="font-[family-name:var(--font-display)] text-[28px] font-medium text-[#1A1A1A] tracking-tight mb-4">
          Recents
        </h2>
        {sorted.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-[#E8DDD0] bg-white">
            <p className="text-[#6A6963] mb-4">No decks yet</p>
            <Link
              href="/decks/new"
              className="inline-flex items-center rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#1A1A1A] hover:bg-[#C9A02E] transition-colors"
            >
              Create your first deck
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((deck) => (
              <Link
                key={deck.id}
                href={`/decks/${deck.id}`}
                className="flex items-center justify-between rounded-xl border border-[#E8DDD0] bg-white px-5 py-4 hover:shadow-md transition-shadow"
              >
                <div>
                  <h3 className="font-semibold text-[#1A1A1A] text-sm font-[family-name:var(--font-ui)]">
                    {deck.title}
                  </h3>
                  <p className="text-xs text-[#9A9A94] mt-1">
                    {deck.cardCount} cards
                  </p>
                </div>
                <i className="fa-solid fa-chevron-right text-xs text-[#9A9A94]" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
