"use client";

import { useRef, useState } from "react";

interface FlashcardCardProps {
  term: string;
  definition: string;
  flipped: boolean;
  onFlip: () => void;
  termLang?: string | null;
  defLang?: string | null;
  onSpeak?: (text: string, lang?: string | null) => void;
  /** 往左滑 = 標記仍在學習 */
  onSwipeLeft?: () => void;
  /** 往右滑 = 標記知道 */
  onSwipeRight?: () => void;
}

const SWIPE_THRESHOLD = 90;

export default function FlashcardCard({
  term,
  definition,
  flipped,
  onFlip,
  termLang,
  defLang,
  onSpeak,
  onSwipeLeft,
  onSwipeRight,
}: FlashcardCardProps) {
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const movedRef = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  function handleSpeak(e: React.MouseEvent) {
    e.stopPropagation();
    if (!onSpeak) return;
    if (flipped) {
      onSpeak(definition, defLang);
    } else {
      onSpeak(term, termLang);
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    movedRef.current = false;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (startXRef.current === null) return;
    const dx = e.touches[0].clientX - startXRef.current;
    const dy = e.touches[0].clientY - (startYRef.current ?? 0);
    // 以橫向為主才視為拖曳,避免干擾直向捲動
    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
      movedRef.current = true;
      setDragging(true);
      setDragX(Math.max(-140, Math.min(140, dx)));
    }
  }

  function handleTouchEnd() {
    if (dragging) {
      if (dragX <= -SWIPE_THRESHOLD) onSwipeLeft?.();
      else if (dragX >= SWIPE_THRESHOLD) onSwipeRight?.();
    }
    setDragging(false);
    setDragX(0);
    startXRef.current = null;
    startYRef.current = null;
  }

  function handleClick() {
    // 拖曳過就不觸發翻面
    if (!movedRef.current) onFlip();
  }

  const showLeftStamp = dragging && dragX < -60;
  const showRightStamp = dragging && dragX >= 60;

  return (
    <div
      className="flip-card w-full cursor-pointer select-none"
      style={{
        transform: `translateX(${dragX}px) rotate(${dragX / 40}deg)`,
        transition: dragging ? "none" : "transform 0.25s ease-out",
        touchAction: "pan-y",
      }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`flip-card-inner relative w-full h-[340px] sm:h-[400px] ${
          flipped ? "flipped" : ""
        }`}
      >
        {/* 拖曳方向提示章 */}
        <div
          className={`pointer-events-none absolute top-5 left-5 z-10 rounded-full border-2 border-[#E85D3A] bg-white/95 px-4 py-1.5 text-sm font-bold text-[#E85D3A] shadow-md transition-all duration-150 ${
            showLeftStamp ? "scale-105 opacity-100" : "opacity-0"
          }`}
          style={{ transform: "rotate(-8deg)" }}
        >
          仍在學習
        </div>
        <div
          className={`pointer-events-none absolute top-5 right-5 z-10 rounded-full border-2 border-[#2BAC6E] bg-white/95 px-4 py-1.5 text-sm font-bold text-[#2BAC6E] shadow-md transition-all duration-150 ${
            showRightStamp ? "scale-105 opacity-100" : "opacity-0"
          }`}
          style={{ transform: "rotate(8deg)" }}
        >
          知道
        </div>

        <div className="flip-card-front absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-[#E8DDD0] bg-white p-8 shadow-sm hover:border-[#D4AF37]/50 hover:shadow-lg transition-all duration-200">
          {onSpeak && (
            <button
              onClick={handleSpeak}
              aria-label="播放發音"
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-[#9A9A94] hover:text-[#D4AF37] hover:bg-[#F6F4F0] transition-colors"
            >
              <i className="fa-solid fa-volume-high" />
            </button>
          )}
          <p className="font-display font-medium text-3xl sm:text-4xl lg:text-[44px] leading-snug text-center text-[#1A1A1A] break-words max-h-full overflow-y-auto">
            {term}
          </p>
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-[#9A9A94]">
            <i className="fa-solid fa-hand-pointer mr-1.5" />
            點擊翻面
          </span>
        </div>
        <div className="flip-card-back absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-b from-[#FBF6EA] to-[#F6EDDA] p-8 shadow-sm">
          {onSpeak && (
            <button
              onClick={handleSpeak}
              aria-label="播放發音"
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-[#9A9A94] hover:text-[#D4AF37] hover:bg-white/70 transition-colors"
            >
              <i className="fa-solid fa-volume-high" />
            </button>
          )}
          <p className="text-xl sm:text-2xl text-center text-[#1A1A1A] break-words max-h-full overflow-y-auto">
            {definition}
          </p>
        </div>
      </div>
    </div>
  );
}
