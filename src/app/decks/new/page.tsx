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
          <span className="font-display font-bold text-[#1A1A1A] text-2xl">
            建立新的學習集
          </span>
        </div>
        <Button type="submit" form="deck-form">
          建立
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 lg:py-8 lg:px-20 max-w-[960px] mx-auto w-full">
          <p className="text-sm text-[#6A6963] mb-5">
            <i className="fa-solid fa-wand-magic-sparkles text-[#B8912C] mr-1.5" />
            想用 AI 從影片、圖片或 PDF 建立卡片？
            <Link
              href="/import"
              className="font-medium text-[#B8912C] hover:text-[#D4AF37] hover:underline ml-1"
            >
              前往匯入頁面
            </Link>
          </p>
          <DeckForm />
        </div>
      </div>
    </div>
  );
}
