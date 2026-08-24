"use client";

import Link from "next/link";
import { useDecks } from "@/hooks/useDecks";
import DeckCard from "@/components/deck/DeckCard";
import ProgressBar from "@/components/ui/ProgressBar";

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
  const jumpBackIn = sorted.slice(0, 2);
  const recents = sorted;

  return (
    <div className="p-6 lg:p-10 space-y-8">
      {/* Jump back in */}
      {jumpBackIn.length > 0 && (
        <section>
          <h2 className="font-display text-[28px] font-medium text-[#1A1A1A] tracking-tight mb-4">
            繼續學習
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {jumpBackIn.map((deck) => (
              <div
                key={deck.id}
                className="rounded-xl border border-[#E8DDD0] bg-white p-5 transition-shadow hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-[#1A1A1A] truncate">
                  {deck.title}
                </h3>
                {deck.description && (
                  <p className="mt-1 text-sm text-[#6A6963] line-clamp-1">
                    {deck.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2 text-[13px] text-[#6A6963]">
                  <span>
                    已複習 {deck.learnedCount}/{deck.cardCount} 張卡片
                  </span>
                </div>
                <ProgressBar value={deck.learnedCount} max={deck.cardCount} className="mt-3" />
                <Link
                  href={`/decks/${deck.id}`}
                  className="mt-3 inline-flex items-center rounded-full bg-[#D4AF37] px-5 py-2 text-sm font-semibold text-[#1A1A1A] hover:bg-[#C9A02E] transition-colors"
                >
                  繼續
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recents */}
      <section>
        <h2 className="font-display text-[28px] font-medium text-[#1A1A1A] tracking-tight mb-4">
          最近
        </h2>
        {recents.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-[#E8DDD0] bg-white">
            <p className="text-[#6A6963] mb-4">還沒有學習集</p>
            <Link
              href="/decks/new"
              className="inline-flex items-center rounded-full bg-[#D4AF37] px-5 py-2 text-sm font-semibold text-[#1A1A1A] hover:bg-[#C9A02E] transition-colors"
            >
              建立你的第一個學習集
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recents.map((deck) => (
              <Link
                key={deck.id}
                href={`/decks/${deck.id}`}
                className="flex items-center justify-between rounded-xl border border-[#E8DDD0] bg-white px-5 py-4 hover:shadow-md transition-shadow"
              >
                <div className="space-y-1">
                  <h3 className="font-semibold text-[#1A1A1A] text-base">
                    {deck.title}
                  </h3>
                  <p className="text-[13px] text-[#6A6963]">
                    {deck.cardCount} cards &middot; by {deck.authorName}
                  </p>
                </div>
                <i className="fa-solid fa-chevron-right text-xs text-[#9A9A94]" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Popular with other learners */}
      {sorted.length > 2 && (
        <section>
          <h2 className="font-display text-[28px] font-medium text-[#1A1A1A] tracking-tight mb-4">
            其他學習者的熱門選擇
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sorted.slice(2, 6).map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
