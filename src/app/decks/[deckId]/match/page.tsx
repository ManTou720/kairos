"use client";

import { use } from "react";
import Link from "next/link";
import { useDeck } from "@/hooks/useDecks";
import { useMatchSession } from "@/features/match/useMatchSession";
import { MIN_CARDS_FOR_MATCH } from "@/lib/constants";
import Button from "@/components/ui/Button";

export default function MatchPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = use(params);
  const { data: deck } = useDeck(deckId);
  const session = useMatchSession(
    deck && deck.cards.length >= MIN_CARDS_FOR_MATCH ? deck.cards : undefined
  );

  if (!deck) {
    return <div className="text-center py-12 text-[#9A9A94]">載入中...</div>;
  }

  if (deck.cards.length < MIN_CARDS_FOR_MATCH) {
    return (
      <div className="text-center py-16">
        <p className="text-[#6A6963] mb-4">
          配對模式至少需要 {MIN_CARDS_FOR_MATCH} 張卡片。
        </p>
        <Link href={`/decks/${deckId}`}>
          <Button variant="secondary">返回學習集</Button>
        </Link>
      </div>
    );
  }

  const { phase, terms, definitions, shakeIds, selectedTerm, selectedDef } =
    session;

  if (phase === "ready") {
    return (
      <div className="text-center py-16 px-4">
        <Link
          href={`/decks/${deckId}`}
          className="text-sm text-[#6A6963] hover:text-[#1A1A1A] mb-4 inline-block"
        >
          <i className="fa-solid fa-xmark mr-2" /> 返回
        </Link>
        <h1 className="font-display text-3xl font-bold text-[#1A1A1A] mb-2">
          配對模式
        </h1>
        <p className="text-[#6A6963] mb-6">
          盡快將詞語和定義配對！
        </p>
        <Button size="lg" onClick={session.initGame}>
          開始
        </Button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="text-center py-12 px-4">
        <h2 className="font-display text-3xl font-bold text-[#1A1A1A] mb-2">
          完成！
        </h2>
        <p className="text-lg text-[#6A6963] mb-1">
          時間：{session.formatTime(session.elapsed)}
        </p>
        <p className="text-[#9A9A94] mb-6">
          {session.errors} 次錯誤
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={session.initGame}>再玩一次</Button>
          <Link href={`/decks/${deckId}`}>
            <Button variant="secondary">返回學習集</Button>
          </Link>
        </div>
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
          <span className="font-semibold text-[#1A1A1A]">配對模式</span>
        </div>
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-stopwatch text-[#6A6963]" />
          <span className="font-mono text-lg font-semibold text-[#1A1A1A]">
            {session.formatTime(session.elapsed)}
          </span>
        </div>
        <span className="text-sm text-[#6A6963]">
          已配對 {session.matchedCount}/{session.totalPairs}
        </span>
      </div>

      {/* Two-column match area */}
      <div className="flex-1 flex items-center justify-center px-4 lg:px-20 py-6">
        <div className="flex gap-3 lg:gap-10 w-full max-w-[640px]">
          {/* Left column - terms */}
          <div className="flex-1 flex flex-col gap-2.5 lg:gap-3">
            {terms.map((item) => {
              const isSelected = selectedTerm === item.id;
              const isShaking = shakeIds.includes(item.id);

              let style =
                "border-[#D5C8B2] bg-white hover:border-[#D4AF37] cursor-pointer";
              if (item.matched) {
                style =
                  "border-[#2D6A4F] bg-[#2D6A4F15] opacity-50 pointer-events-none border-2";
              } else if (isShaking) {
                style =
                  "border-[#E85D3A] bg-[#FFF3EE] border-2 animate-shake";
              } else if (isSelected) {
                style =
                  "border-[#D4AF37] bg-[#D4AF3715] border-2 font-semibold";
              }

              return (
                <button
                  key={item.id}
                  onClick={() => session.handleTermClick(item)}
                  disabled={item.matched}
                  className={`rounded-full border h-14 lg:h-14 flex items-center justify-center text-sm lg:text-base text-[#1A1A1A] transition-all ${style}`}
                >
                  {item.text}
                  {item.matched && " \u2713"}
                </button>
              );
            })}
          </div>

          {/* Right column - definitions */}
          <div className="flex-1 flex flex-col gap-2.5 lg:gap-3">
            {definitions.map((item) => {
              const isSelected = selectedDef === item.id;
              const isShaking = shakeIds.includes(item.id);

              let style =
                "border-[#D5C8B2] bg-white hover:border-[#D4AF37] cursor-pointer";
              if (item.matched) {
                style =
                  "border-[#2D6A4F] bg-[#2D6A4F15] opacity-50 pointer-events-none border-2";
              } else if (isShaking) {
                style =
                  "border-[#E85D3A] bg-[#FFF3EE] border-2 animate-shake";
              } else if (isSelected) {
                style =
                  "border-[#D4AF37] bg-[#D4AF3715] border-2 font-semibold";
              }

              return (
                <button
                  key={item.id}
                  onClick={() => session.handleDefClick(item)}
                  disabled={item.matched}
                  className={`rounded-full border h-14 lg:h-14 flex items-center justify-center text-sm lg:text-base text-[#1A1A1A] transition-all ${style}`}
                >
                  {item.text}
                  {item.matched && " \u2713"}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
