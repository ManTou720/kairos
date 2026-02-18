"use client";

import Link from "next/link";
import DeckForm from "@/components/deck/DeckForm";

export default function NewDeckPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between h-14 px-4 lg:px-6 bg-white border-b border-[#E8DDD0] shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-[#6A6963] hover:text-[#1A1A1A] transition-colors"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </Link>
          <span className="font-semibold text-[#1A1A1A]">建立新的學習集</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-2xl">
          <DeckForm />
        </div>
      </div>
    </div>
  );
}
