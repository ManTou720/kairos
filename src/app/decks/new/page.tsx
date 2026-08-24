"use client";

import Link from "next/link";
import DeckForm from "@/components/deck/DeckForm";
import Button from "@/components/ui/Button";

export default function NewDeckPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between h-16 px-4 lg:px-6 bg-white border-b border-[#E8DDD0] shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-[#6A6963] hover:text-[#1A1A1A] transition-colors"
          >
            <i className="fa-solid fa-xmark text-xl" />
          </Link>
          <span className="font-[family-name:var(--font-display)] font-bold text-[#1A1A1A] text-2xl">
            建立新的學習集
          </span>
        </div>
        <Button type="submit" form="deck-form">
          建立
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 lg:py-8 lg:px-20 max-w-[960px] mx-auto w-full">
          <DeckForm />
        </div>
      </div>
    </div>
  );
}
