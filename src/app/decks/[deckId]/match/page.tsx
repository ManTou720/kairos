"use client";

import { use, useState, useEffect } from "react";
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

  // 最佳紀錄（localStorage，每個學習集獨立）
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [isRecord, setIsRecord] = useState(false);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(`kairos-match-best-${deckId}`);
      if (v !== null) setBestTime(Number(v));
    } catch {
      /* private mode 等 */
    }
  }, [deckId]);

  // 完成時寫入新紀錄
  useEffect(() => {
    if (session.phase !== "done") return;
    try {
      const prev = window.localStorage.getItem(`kairos-match-best-${deckId}`);
      const prevNum = prev === null ? Infinity : Number(prev);
      if (session.elapsed < prevNum) {
        window.localStorage.setItem(
          `kairos-match-best-${deckId}`,
          String(session.elapsed)
        );
        setBestTime(session.elapsed);
        setIsRecord(true);
      }
    } catch {
      /* noop */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.phase]);

  function handleStart() {
    setIsRecord(false);
    session.initGame();
  }

  if (!deck) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#9A9A94]">
        <i className="fa-solid fa-spinner fa-spin mr-2" />
        載入中...
      </div>
    );
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

  /* ---------- READY ---------- */
  if (phase === "ready") {
    return (
      <div className="flex-1 flex items-center justify-center px-4 animate-fade-in">
        <div className="text-center max-w-sm">
          <Link
            href={`/decks/${deckId}`}
            aria-label="返回"
            className="absolute top-20 left-6 w-9 h-9 rounded-full flex items-center justify-center text-[#6A6963] hover:bg-[#EADCC5]/50 hover:text-[#1A1A1A] transition-colors"
          >
            <i className="fa-solid fa-arrow-left" />
          </Link>
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#D4AF3715] flex items-center justify-center">
            <i className="fa-solid fa-hand-pointer text-3xl text-[#D4AF37]" />
          </div>
          <h1 className="font-display font-bold text-4xl text-[#1A1A1A] mb-3">
            配對模式
          </h1>
          <p className="text-sm leading-relaxed text-[#6A6963] mb-2">
            點選一個<span className="font-semibold">詞語</span>，再點它的
            <span className="font-semibold">定義</span>。
            <br />
            全部配對成功就過關，越快越好！
          </p>
          {bestTime !== null && (
            <p className="text-xs text-[#9A9A94] mb-6">
              <i className="fa-solid fa-stopwatch mr-1.5 text-[#B8912C]" />
              目前最佳紀錄{" "}
              <span className="font-semibold tabular-nums">
                {session.formatTime(bestTime)}
              </span>
            </p>
          )}
          {bestTime === null && <div className="mb-6" />}
          <button
            onClick={handleStart}
            className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] text-[#1A1A1A] font-semibold px-8 py-3.5 text-sm hover:bg-[#C9A02E] active:scale-[0.98] transition-all"
          >
            <i className="fa-solid fa-play text-xs" />
            開始配對
          </button>
        </div>
      </div>
    );
  }

  /* ---------- DONE ---------- */
  if (phase === "done") {
    return (
      <div className="flex-1 flex items-center justify-center px-5 py-10 animate-fade-in">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#D4AF3715] flex items-center justify-center">
            <i className="fa-solid fa-trophy text-3xl text-[#D4AF37]" />
          </div>
          <h1 className="font-display font-bold text-4xl text-[#1A1A1A] mb-2">
            配對完成！
          </h1>
          {isRecord ? (
            <span className="inline-flex items-center gap-1.5 mt-1 mb-4 rounded-full bg-[#D4AF37] text-[#1A1A1A] text-xs font-bold px-3.5 py-1.5">
              <i className="fa-solid fa-bolt text-[10px]" />
              新紀錄！
            </span>
          ) : (
            <p className="text-xs text-[#9A9A94] mt-1 mb-4">
              最佳紀錄{" "}
              {bestTime !== null ? session.formatTime(bestTime) : "—"}
            </p>
          )}

          {/* 統計卡 */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="rounded-xl border border-[#E8DDD0] bg-white p-4">
              <p className="font-display font-bold text-3xl text-[#D4AF37] tabular-nums">
                {session.formatTime(session.elapsed)}
              </p>
              <p className="text-xs text-[#6A6963] mt-1">完成時間</p>
            </div>
            <div className="rounded-xl border border-[#E8DDD0] bg-white p-4">
              <p
                className={`font-display font-bold text-3xl ${
                  session.errors === 0 ? "text-[#2BAC6E]" : "text-[#E85D3A]"
                }`}
              >
                {session.errors}
              </p>
              <p className="text-xs text-[#6A6963] mt-1">失誤次數</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleStart}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] text-[#1A1A1A] font-semibold px-6 py-3 text-sm hover:bg-[#C9A02E] active:scale-[0.98] transition-all"
            >
              <i className="fa-solid fa-rotate-right" />
              再玩一次
            </button>
            <Link
              href={`/decks/${deckId}`}
              className="text-sm text-[#6A6963] hover:text-[#1A1A1A] transition-colors py-1"
            >
              返回學習集
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- PLAYING ---------- */
  const progressPercent =
    session.totalPairs > 0
      ? Math.round((session.matchedCount / session.totalPairs) * 100)
      : 0;

  function tileClasses(item: { id: string; matched: boolean }) {
    const isSelected =
      selectedTerm === item.id || selectedDef === item.id;
    const isShaking = shakeIds.includes(item.id);

    let style =
      "border-[#D5C8B2] bg-white shadow-sm hover:border-[#D4AF37] hover:-translate-y-0.5 cursor-pointer";
    if (item.matched) {
      style =
        "border-[#2BAC6E]/40 bg-[#E8F5EE] opacity-0 scale-75 pointer-events-none";
    } else if (isShaking) {
      style = "border-[#E85D3A] bg-[#FFF3EE] border-2 animate-shake";
    } else if (isSelected) {
      style =
        "border-[#D4AF37] bg-[#D4AF3715] border-2 font-semibold scale-[1.03] shadow-md";
    }
    return `rounded-xl border min-h-[52px] px-3 py-2.5 flex items-center justify-center text-center text-sm lg:text-[15px] leading-snug text-[#1A1A1A] transition-all duration-200 ${style}`;
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Top bar */}
      <div className="flex items-center justify-between h-14 px-4 lg:px-6 shrink-0">
        <Link
          href={`/decks/${deckId}`}
          aria-label="離開配對"
          className="w-9 h-9 -ml-2 rounded-full flex items-center justify-center text-[#6A6963] hover:bg-[#EADCC5]/50 hover:text-[#1A1A1A] transition-colors"
        >
          <i className="fa-solid fa-xmark text-lg" />
        </Link>

        <div className="flex items-center gap-4">
          <span className="font-mono text-lg font-semibold text-[#1A1A1A] tabular-nums">
            {session.formatTime(session.elapsed)}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              session.errors > 0
                ? "bg-[#FFF3EE] text-[#E85D3A]"
                : "bg-white/60 text-[#9A9A94]"
            }`}
          >
            <i className="fa-solid fa-xmark text-[10px]" />
            {session.errors} 失誤
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 text-xs font-medium text-[#6A6963]">
            已配對 {session.matchedCount}/{session.totalPairs}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 lg:px-6 shrink-0">
        <div className="h-1.5 rounded-full bg-[#E8DDD0] overflow-hidden max-w-[640px] mx-auto">
          <div
            className="h-full rounded-full bg-[#D4AF37] transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Two-column match area */}
      <div className="flex-1 flex items-center justify-center px-4 lg:px-20 py-5 overflow-y-auto">
        <div className="flex gap-3 lg:gap-10 w-full max-w-[640px] animate-fade-in">
          {/* Left column - terms */}
          <div className="flex-1 flex flex-col gap-2.5 lg:gap-3">
            {terms.map((item) => (
              <button
                key={item.id}
                onClick={() => session.handleTermClick(item)}
                disabled={item.matched}
                className={tileClasses(item)}
              >
                {item.text}
              </button>
            ))}
          </div>

          {/* Right column - definitions */}
          <div className="flex-1 flex flex-col gap-2.5 lg:gap-3">
            {definitions.map((item) => (
              <button
                key={item.id}
                onClick={() => session.handleDefClick(item)}
                disabled={item.matched}
                className={tileClasses(item)}
              >
                {item.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
