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
          找不到學習集
        </h2>
        <Link href="/">
          <Button variant="secondary">返回首頁</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between h-14 px-4 lg:px-6 bg-white border-b border-[#E8DDD0] shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/decks/${deckId}`}
            className="text-[#6A6963] hover:text-[#1A1A1A] transition-colors"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </Link>
          <span className="font-semibold text-[#1A1A1A]">編輯學習集</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-2xl">
          <DeckForm deck={deck} />
        </div>
      </div>
    </div>
  );
}
