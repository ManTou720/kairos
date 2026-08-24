"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useDeck } from "@/hooks/useDecks";
import { useLearnSession } from "@/features/learn/useLearnSession";
import { MIN_CARDS_FOR_LEARN } from "@/lib/constants";
import Button from "@/components/ui/Button";
import { useTTS } from "@/hooks/useTTS";
import { useKeyboard } from "@/hooks/useKeyboard";

const LETTERS = ["A", "B", "C", "D"];

export default function LearnPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = use(params);
  const { data: deck } = useDeck(deckId);
  const session = useLearnSession(
    deck && deck.cards.length >= MIN_CARDS_FOR_LEARN ? deck.cards : undefined
  );
  const { speak, isSpeaking } = useTTS();

  // 鍵盤：1-4 選選項、Enter/空格 下一題（必須在條件渲染前宣告）
  const keys = useMemo(
    () => ({
      Digit1: () => {
        if (!session.selected && session.q?.options[0] !== undefined)
          session.handleSelect(session.q.options[0]);
      },
      Digit2: () => {
        if (!session.selected && session.q?.options[1] !== undefined)
          session.handleSelect(session.q.options[1]);
      },
      Digit3: () => {
        if (!session.selected && session.q?.options[2] !== undefined)
          session.handleSelect(session.q.options[2]);
      },
      Digit4: () => {
        if (!session.selected && session.q?.options[3] !== undefined)
          session.handleSelect(session.q.options[3]);
      },
      Enter: () => {
        if (session.selected) session.handleNext();
      },
      " ": (e: KeyboardEvent) => {
        e.preventDefault();
        if (session.selected) session.handleNext();
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session.selected, session.current]
  );
  useKeyboard(keys);

  if (!deck) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#9A9A94]">
        <i className="fa-solid fa-spinner fa-spin mr-2" />
        載入中...
      </div>
    );
  }

  if (deck.cards.length < MIN_CARDS_FOR_LEARN) {
    return (
      <div className="text-center py-16">
        <p className="text-[#6A6963] mb-4">
          學習模式至少需要 {MIN_CARDS_FOR_LEARN} 張卡片。
        </p>
        <Link href={`/decks/${deckId}`}>
          <Button variant="secondary">返回學習集</Button>
        </Link>
      </div>
    );
  }

  const { items, q, current, selected, results, done } = session;

  /* ---------- 回合完成畫面 ---------- */
  if (done) {
    const correct = results.filter(Boolean).length;
    const accuracy =
      results.length > 0 ? Math.round((correct / results.length) * 100) : 0;

    return (
      <div className="flex-1 flex items-center justify-center px-5 py-10 animate-fade-in">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#D4AF3715] flex items-center justify-center">
            <i className="fa-solid fa-trophy text-3xl text-[#D4AF37]" />
          </div>
          <h1 className="font-display font-bold text-4xl text-[#1A1A1A] mb-2">
            學習完成！
          </h1>
          <p className="text-sm text-[#6A6963] mb-8">
            這一輪共回答了 {results.length} 題
          </p>

          {/* 統計卡 */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="rounded-xl border border-[#E8DDD0] bg-white p-4">
              <p className="font-display font-bold text-3xl text-[#2BAC6E]">
                {correct}
              </p>
              <p className="text-xs text-[#6A6963] mt-1">答對</p>
            </div>
            <div className="rounded-xl border border-[#E8DDD0] bg-white p-4">
              <p className="font-display font-bold text-3xl text-[#E85D3A]">
                {results.length - correct}
              </p>
              <p className="text-xs text-[#6A6963] mt-1">答錯</p>
            </div>
            <div className="rounded-xl border border-[#E8DDD0] bg-white p-4">
              <p className="font-display font-bold text-3xl text-[#D4AF37]">
                {accuracy}%
              </p>
              <p className="text-xs text-[#6A6963] mt-1">正確率</p>
            </div>
          </div>

          {/* 動作 */}
          <div className="flex flex-col gap-3">
            <button
              onClick={session.restart}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] text-[#1A1A1A] font-semibold px-6 py-3 text-sm hover:bg-[#C9A02E] active:scale-[0.98] transition-all"
            >
              <i className="fa-solid fa-rotate-right" />
              再學一輪（全部）
            </button>
            <button
              onClick={session.restartMissed}
              disabled={session.missedCount === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white border border-[#D5C8B2] text-[#1A1A1A] font-medium px-6 py-3 text-sm hover:bg-[#EADCC5]/30 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <i className="fa-solid fa-dumbbell" />
              只練答錯的 {session.missedCount} 題
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

  if (!q) return null;

  const isCorrect = selected !== null && selected === q.card.definition;
  const progressPercent =
    items.length > 0 ? Math.round(((current + 1) / items.length) * 100) : 0;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Top bar */}
      <div className="flex items-center justify-between h-14 px-4 lg:px-6 shrink-0">
        <Link
          href={`/decks/${deckId}`}
          aria-label="返回學習集"
          className="w-9 h-9 -ml-2 rounded-full flex items-center justify-center text-[#6A6963] hover:bg-[#EADCC5]/50 hover:text-[#1A1A1A] transition-colors"
        >
          <i className="fa-solid fa-arrow-left" />
        </Link>
        <span className="font-semibold text-sm text-[#1A1A1A]" title={deck.title}>
          {deck.title}
        </span>
        <span className="text-xs font-medium text-[#6A6963] tabular-nums">
          {current + 1} / {items.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-4 lg:px-6 shrink-0">
        <div className="h-1.5 rounded-full bg-[#E8DDD0] overflow-hidden max-w-[700px] mx-auto">
          <div
            className="h-full rounded-full bg-[#D4AF37] transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 lg:px-20 py-6 overflow-y-auto animate-fade-in">
        <div className="w-full max-w-[700px] rounded-2xl border border-[#E8DDD0] bg-white p-6 lg:p-8 space-y-6 shadow-sm">
          {/* Question label + speaker */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-[#B8912C] uppercase">
              選擇正確的定義
            </span>
            <button
              onClick={() => speak(q.card.term, q.card.termLang)}
              aria-label="播放發音"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isSpeaking ? "text-[#D4AF37]" : "text-[#9A9A94]"
              } hover:text-[#D4AF37] hover:bg-[#F6F4F0]`}
            >
              <i className="fa-solid fa-volume-high" />
            </button>
          </div>

          {/* Term */}
          <p className="font-display text-3xl lg:text-4xl font-semibold text-[#1A1A1A] leading-snug break-words text-balance">
            {q.card.term}
          </p>

          {/* Options */}
          <div className="grid sm:grid-cols-2 gap-2.5">
            {q.options.map((option, i) => {
              let style =
                "border-[#D5C8B2] bg-white hover:border-[#D4AF37] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer";
              if (selected) {
                if (option === q.card.definition) {
                  style = "border-[#2BAC6E] bg-[#E8F5EE]";
                } else if (option === selected) {
                  style = "border-[#E85D3A] bg-[#FFF3EE]";
                } else {
                  style = "border-[#E8DDD0] bg-white opacity-40 cursor-default";
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => session.handleSelect(option)}
                  disabled={!!selected}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm text-[#1A1A1A] transition-all duration-150 ${style}`}
                >
                  <kbd
                    className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-[11px] font-semibold ${
                      selected && option === q.card.definition
                        ? "border-[#2BAC6E] text-[#2BAC6E]"
                        : selected && option === selected
                          ? "border-[#E85D3A] text-[#E85D3A]"
                          : "border-[#D5C8B2] text-[#9A9A94]"
                    }`}
                  >
                    {LETTERS[i]}
                  </kbd>
                  <span className="leading-snug text-pretty">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback banner */}
          {selected !== null && (
            <div
              className={`flex items-start gap-3 rounded-xl px-4 py-3.5 animate-fade-in ${
                isCorrect ? "bg-[#E8F5EE]" : "bg-[#FFF3EE]"
              }`}
            >
              <i
                className={`fa-solid mt-0.5 ${
                  isCorrect
                    ? "fa-circle-check text-[#2BAC6E]"
                    : "fa-circle-xmark text-[#E85D3A]"
                }`}
              />
              <div className="text-sm leading-relaxed">
                <span
                  className={`block font-semibold mb-0.5 ${
                    isCorrect ? "text-[#2BAC6E]" : "text-[#E85D3A]"
                  }`}
                >
                  {isCorrect ? "答對了！" : "答錯了"}
                </span>
                {!isCorrect && (
                  <span className="text-[#6A6963]">
                    正確答案：
                    <span className="font-semibold text-[#1A1A1A]">
                      {q.card.definition}
                    </span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Next button */}
          {selected !== null && (
            <div className="flex justify-end pt-1">
              <button
                onClick={session.handleNext}
                className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] text-[#1A1A1A] font-semibold px-6 py-2.5 text-sm hover:bg-[#C9A02E] active:scale-[0.97] transition-all"
              >
                {current < items.length - 1 ? "下一題" : "查看結果"}
                <i className="fa-solid fa-arrow-right text-xs" />
              </button>
            </div>
          )}

          {/* Don't know link */}
          {selected === null && (
            <div className="text-center">
              <button
                onClick={() => session.handleSelect("")}
                className="text-sm font-medium text-[#B8912C] hover:text-[#D4AF37] hover:underline"
              >
                不知道嗎？
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
