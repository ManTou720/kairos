"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useDeck } from "@/hooks/useDecks";
import { useFlashcardSession } from "@/features/flashcards/useFlashcardSession";
import FlashcardCard from "@/components/flashcards/FlashcardCard";
import { useTTS } from "@/hooks/useTTS";

export default function FlashcardsPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = use(params);
  const { data: deck } = useDeck(deckId);
  const session = useFlashcardSession(deck?.cards);
  const { speak } = useTTS();
  // 「追蹤進度」toggle：off 時按 ✓/✗ 只翻頁，不記錄知道/仍在學習
  const [trackProgress, setTrackProgress] = useState(true);

  if (!deck) {
    return <div className="text-center py-12 text-[#9A9A94]">載入中...</div>;
  }

  const current = session.current;
  if (!current) return null;

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
          <span className="font-semibold text-[#1A1A1A]">{deck.title}</span>
        </div>
        <span className="font-mono text-sm text-[#1A1A1A]">
          {session.index + 1} / {session.total}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={session.doShuffle}
            className="flex items-center gap-1.5 text-sm text-[#6A6963] hover:text-[#1A1A1A] transition-colors"
          >
            <i className="fa-solid fa-shuffle" />
            <span className="hidden sm:inline">隨機</span>
          </button>
          <span
            title="設定（開發中）"
            aria-disabled="true"
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#6A6963]/50 cursor-not-allowed"
          >
            <i className="fa-solid fa-gear" />
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-5 lg:px-20 py-6">
        {/* Progress row */}
        <div className="flex items-center justify-between w-full max-w-[720px] px-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#FFF3EE] border-2 border-[#E85D3A] flex items-center justify-center">
              <span className="text-xs font-semibold text-[#E85D3A]">{session.learning.size}</span>
            </div>
            <span className="text-sm font-medium text-[#E85D3A]">仍在學習</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#2BAC6E]">知道</span>
            <div className="w-7 h-7 rounded-full bg-[#E8F5EE] border-2 border-[#2BAC6E] flex items-center justify-center">
              <span className="text-xs font-semibold text-[#2BAC6E]">{session.known.size}</span>
            </div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="w-full max-w-[720px]">
          <FlashcardCard
            term={current.term}
            definition={current.definition}
            flipped={session.flipped}
            onFlip={session.toggleFlip}
            termLang={current.termLang}
            defLang={current.defLang}
            onSpeak={speak}
          />
        </div>

        {/* X and Check buttons */}
        <div className="flex items-center justify-center gap-8">
          <button
            onClick={() => (trackProgress ? session.markLearning() : session.next())}
            className="w-14 h-14 rounded-full bg-[#FFF3EE] flex items-center justify-center hover:bg-[#FFE8DE] transition-colors"
          >
            <i className="fa-solid fa-xmark text-2xl text-[#E85D3A]" />
          </button>
          <button
            onClick={() => (trackProgress ? session.markKnown() : session.next())}
            className="w-14 h-14 rounded-full bg-[#E8F5EE] flex items-center justify-center hover:bg-[#D0EBD8] transition-colors"
          >
            <i className="fa-solid fa-check text-2xl text-[#2BAC6E]" />
          </button>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between w-full max-w-[720px]">
          <button
            aria-label="播放發音"
            onClick={() =>
              speak(
                session.flipped ? current.definition : current.term,
                session.flipped ? current.defLang : current.termLang
              )
            }
            className="text-[#5C4A32] hover:text-[#1A1A1A] transition-colors"
          >
            <i className="fa-solid fa-volume-high text-lg" />
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={trackProgress}
            onClick={() => setTrackProgress((v) => !v)}
            className="flex items-center gap-2"
          >
            <span className="text-sm font-medium text-[#D4AF37]">追蹤進度</span>
            <span
              className={`relative w-10 h-[22px] rounded-full transition-colors ${
                trackProgress ? "bg-[#D4AF37]" : "bg-[#D5C8B2]"
              }`}
            >
              <span
                className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all ${
                  trackProgress ? "left-[21px]" : "left-[3px]"
                }`}
              />
            </span>
          </button>
          <button
            onClick={session.doShuffle}
            className="text-[#5C4A32] hover:text-[#1A1A1A] transition-colors"
          >
            <i className="fa-solid fa-shuffle text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
}
