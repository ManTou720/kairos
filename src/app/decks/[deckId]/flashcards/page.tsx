"use client";

import { use, useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useDeck } from "@/hooks/useDecks";
import { useFlashcardSession } from "@/features/flashcards/useFlashcardSession";
import FlashcardCard from "@/components/flashcards/FlashcardCard";
import { useTTS } from "@/hooks/useTTS";
import { getUserRateMult, setUserRateMult } from "@/lib/tts";
import { useKeyboard } from "@/hooks/useKeyboard";

export default function FlashcardsPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = use(params);
  const { data: deck } = useDeck(deckId);
  const session = useFlashcardSession(deck?.cards);
  const { speak } = useTTS();
  // 評分飛出動畫:滑動/按鈕/鍵盤共用同一條路徑
  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);
  const exitingRef = useRef(false);
  // 「追蹤進度」toggle：off 時按 ✓/✗ 只翻頁，不記錄知道/仍在學習
  const [trackProgress, setTrackProgress] = useState(true);
  // 設定:自動播放發音
  const [autoplay, setAutoplay] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // 設定:語速（localStorage 共享給所有發音按鈕）
  const [rateMult, setRateMult] = useState<number>(() => getUserRateMult());

  // 自動播放發音:新卡出現時朗讀詞語
  useEffect(() => {
    if (!autoplay || session.phase !== "studying") return;
    const c = session.current;
    if (c) speak(c.term, c.termLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, session.index, session.phase]);

  /** 評分 → 卡片朝對應方向飛出 → 換下一張 */
  function gradeAndFly(dir: "left" | "right") {
    if (exitingRef.current || session.phase !== "studying") return;
    exitingRef.current = true;
    setExitDir(dir);
    window.setTimeout(() => {
      if (trackProgress) {
        if (dir === "right") session.markKnown();
        else session.markLearning();
      } else {
        session.next();
      }
      setExitDir(null);
      exitingRef.current = false;
    }, 240);
  }

  // 鍵盤快速鍵:1 = 仍在學習、2 = 知道
  const gradeKeys = useMemo(
    () => ({
      Digit1: () => gradeAndFly("left"),
      Digit2: () => gradeAndFly("right"),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trackProgress, session.index, session.phase]
  );
  useKeyboard(gradeKeys);

  if (!deck) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#9A9A94]">
        <i className="fa-solid fa-spinner fa-spin mr-2" />
        載入中...
      </div>
    );
  }

  /* ---------- 回合完成畫面 ---------- */
  if (session.phase === "roundComplete") {
    const knownCount = session.known.size;
    const learningCount = session.learning.size;
    const mastery =
      knownCount + learningCount > 0
        ? Math.round((knownCount / (knownCount + learningCount)) * 100)
        : 0;

    return (
      <div className="flex-1 flex items-center justify-center px-5 py-10 animate-fade-in">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#D4AF3715] flex items-center justify-center">
            <i className="fa-solid fa-trophy text-3xl text-[#D4AF37]" />
          </div>
          <h1 className="font-display font-bold text-4xl text-[#1A1A1A] mb-2">
            回合完成！
          </h1>
          <p className="text-sm text-[#6A6963] mb-8">
            這一輪共複習了 {session.total} 張卡片
          </p>

          {/* 統計卡 */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="rounded-xl border border-[#E8DDD0] bg-white p-4">
              <p className="font-display font-bold text-3xl text-[#2BAC6E]">
                {knownCount}
              </p>
              <p className="text-xs text-[#6A6963] mt-1">知道</p>
            </div>
            <div className="rounded-xl border border-[#E8DDD0] bg-white p-4">
              <p className="font-display font-bold text-3xl text-[#E85D3A]">
                {learningCount}
              </p>
              <p className="text-xs text-[#6A6963] mt-1">仍在學習</p>
            </div>
            <div className="rounded-xl border border-[#E8DDD0] bg-white p-4">
              <p className="font-display font-bold text-3xl text-[#D4AF37]">
                {mastery}%
              </p>
              <p className="text-xs text-[#6A6963] mt-1">熟練度</p>
            </div>
          </div>

          {/* 動作 */}
          <div className="flex flex-col gap-3">
            <button
              onClick={session.restartAll}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] text-[#1A1A1A] font-semibold px-6 py-3 text-sm hover:bg-[#C9A02E] active:scale-[0.98] transition-all"
            >
              <i className="fa-solid fa-rotate-right" />
              再來一輪（全部）
            </button>
            <button
              onClick={session.restartLearning}
              disabled={learningCount === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white border border-[#D5C8B2] text-[#1A1A1A] font-medium px-6 py-3 text-sm hover:bg-[#EADCC5]/30 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <i className="fa-solid fa-dumbbell" />
              只練不熟的 {learningCount} 張
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

  const current = session.current;
  if (!current) return null;

  const progressPercent =
    session.total > 0 ? Math.round(((session.index + 1) / session.total) * 100) : 0;

  /* ---------- 學習中畫面 ---------- */
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
        <div className="flex items-center gap-1 relative">
          <button
            onClick={session.doShuffle}
            aria-label="隨機排序"
            title="隨機排序（S）"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#6A6963] hover:bg-[#EADCC5]/50 hover:text-[#1A1A1A] transition-colors"
          >
            <i className="fa-solid fa-shuffle" />
          </button>
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            aria-label="設定"
            aria-expanded={settingsOpen}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              settingsOpen || autoplay
                ? "text-[#D4AF37] bg-[#D4AF3715]"
                : "text-[#6A6963] hover:bg-[#EADCC5]/50 hover:text-[#1A1A1A]"
            }`}
          >
            <i className="fa-solid fa-gear" />
          </button>

          {/* 設定彈窗 */}
          {settingsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setSettingsOpen(false)}
              />
              <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-[#E8DDD0] bg-white shadow-lg p-2 animate-fade-in">
                <SwitchRow
                  label="自動播放發音"
                  hint="翻到新卡時朗讀詞語"
                  checked={autoplay}
                  onChange={(v) => {
                    setAutoplay(v);
                    if (v) {
                      const c = session.current;
                      if (c) speak(c.term, c.termLang); // 開啟時立刻朗讀當前卡作為回饋
                    }
                    setSettingsOpen(false);
                  }}
                />
                <div className="px-3 py-2.5">
                  <span className="block text-sm font-medium text-[#1A1A1A]">
                    語速
                  </span>
                  <span className="block text-[11px] text-[#9A9A94] mb-2">
                    神經語音朗讀速度，長句自動放慢
                  </span>
                  <div className="flex gap-1.5">
                    {[
                      { mult: 0.6, label: "慢" },
                      { mult: 0.8, label: "稍慢" },
                      { mult: 1, label: "正常" },
                    ].map((opt) => (
                      <button
                        key={opt.mult}
                        type="button"
                        aria-pressed={rateMult === opt.mult}
                        onClick={() => {
                          setRateMult(opt.mult);
                          setUserRateMult(opt.mult);
                          const c = session.current;
                          if (autoplay && c) speak(c.term, c.termLang); // 重播試聽
                        }}
                        className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all active:scale-[0.97] ${
                          rateMult === opt.mult
                            ? "border-[#D4AF37] bg-[#D4AF3715] text-[#B8912C]"
                            : "border-[#E8DDD0] text-[#6A6963] hover:border-[#D5C8B2] hover:text-[#1A1A1A]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <SwitchRow
                  label="追蹤進度"
                  hint="關閉時評分按鈕只會翻頁"
                  checked={trackProgress}
                  onChange={setTrackProgress}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 sm:gap-5 px-4 lg:px-20 py-4 overflow-y-auto">
        {/* Progress */}
        <div className="w-full max-w-[720px] space-y-2">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="min-w-7 h-7 px-1 rounded-full bg-[#FFF3EE] border-2 border-[#E85D3A] flex items-center justify-center">
                <span className="text-xs font-semibold text-[#E85D3A]">
                  {session.learning.size}
                </span>
              </span>
              <span className="text-sm font-medium text-[#E85D3A]">仍在學習</span>
            </div>
            <span className="text-xs font-medium text-[#6A6963] tabular-nums">
              {session.index + 1} / {session.total}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#2BAC6E]">知道</span>
              <span className="min-w-7 h-7 px-1 rounded-full bg-[#E8F5EE] border-2 border-[#2BAC6E] flex items-center justify-center">
                <span className="text-xs font-semibold text-[#2BAC6E]">
                  {session.known.size}
                </span>
              </span>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-[#E8DDD0] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#D4AF37] transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Flashcard */}
        <div
          key={`${session.index}-${session.phase}`}
          className="w-full max-w-[720px] card-enter"
        >
          <FlashcardCard
            term={current.term}
            definition={current.definition}
            flipped={session.flipped}
            onFlip={session.toggleFlip}
            termLang={current.termLang}
            defLang={current.defLang}
            onSpeak={speak}
            exitDirection={exitDir}
            onSwipeLeft={() => gradeAndFly("left")}
            onSwipeRight={() => gradeAndFly("right")}
          />
        </div>

        {/* Grade buttons */}
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          <button
            onClick={() => gradeAndFly("left")}
            className="group flex items-center gap-2.5 rounded-full bg-[#FFF3EE] pl-4 pr-5 py-3 hover:bg-[#FFE8DE] active:scale-[0.97] transition-all"
          >
            <span className="w-9 h-9 rounded-full bg-white/70 flex items-center justify-center">
              <i className="fa-solid fa-xmark text-lg text-[#E85D3A]" />
            </span>
            <span className="text-left leading-tight">
              <span className="block text-sm font-semibold text-[#E85D3A]">
                仍在學習
              </span>
              <span className="hidden sm:block text-[11px] text-[#E85D3A]/60">
                滑左 · 鍵盤 1
              </span>
            </span>
          </button>
          <button
            onClick={() => gradeAndFly("right")}
            className="group flex items-center gap-2.5 rounded-full bg-[#E8F5EE] pl-4 pr-5 py-3 hover:bg-[#D0EBD8] active:scale-[0.97] transition-all"
          >
            <span className="w-9 h-9 rounded-full bg-white/70 flex items-center justify-center">
              <i className="fa-solid fa-check text-lg text-[#2BAC6E]" />
            </span>
            <span className="text-left leading-tight">
              <span className="block text-sm font-semibold text-[#2BAC6E]">
                知道
              </span>
              <span className="hidden sm:block text-[11px] text-[#2BAC6E]/60">
                滑右 · 鍵盤 2
              </span>
            </span>
          </button>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between w-full max-w-[720px] px-2">
          <button
            onClick={session.prev}
            disabled={session.index === 0}
            aria-label="上一張"
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#5C4A32] hover:bg-[#EADCC5]/40 hover:text-[#1A1A1A] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <i className="fa-solid fa-arrow-left text-lg" />
          </button>
          <div className="hidden sm:flex items-center gap-4 text-[11px] text-[#9A9A94]">
            <kbd className="rounded border border-[#D5C8B2] bg-white px-1.5 py-0.5">空格</kbd> 翻面
            <kbd className="rounded border border-[#D5C8B2] bg-white px-1.5 py-0.5">←→</kbd> 切換卡片
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoplay}
            onClick={() => setAutoplay((v) => !v)}
            className="flex items-center gap-2"
          >
            <i
              className={`fa-solid fa-volume-high text-sm ${
                autoplay ? "text-[#D4AF37]" : "text-[#9A9A94]"
              }`}
            />
            <span className={`text-sm font-medium ${autoplay ? "text-[#D4AF37]" : "text-[#9A9A94]"}`}>
              自動發音
            </span>
            <span
              className={`relative w-10 h-[22px] rounded-full transition-colors ${
                autoplay ? "bg-[#D4AF37]" : "bg-[#D5C8B2]"
              }`}
            >
              <span
                className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all ${
                  autoplay ? "left-[21px]" : "left-[3px]"
                }`}
              />
            </span>
          </button>
          <button
            onClick={() => session.next()}
            disabled={session.index >= session.total - 1}
            aria-label="下一張"
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#5C4A32] hover:bg-[#EADCC5]/40 hover:text-[#1A1A1A] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <i className="fa-solid fa-arrow-right text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SwitchRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 hover:bg-[#F6F4F0] transition-colors text-left"
    >
      <span>
        <span className="block text-sm font-medium text-[#1A1A1A]">{label}</span>
        {hint && <span className="block text-[11px] text-[#9A9A94]">{hint}</span>}
      </span>
      <span
        className={`relative shrink-0 w-10 h-[22px] rounded-full transition-colors ${
          checked ? "bg-[#D4AF37]" : "bg-[#D5C8B2]"
        }`}
      >
        <span
          className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all ${
            checked ? "left-[21px]" : "left-[3px]"
          }`}
        />
      </span>
    </button>
  );
}
