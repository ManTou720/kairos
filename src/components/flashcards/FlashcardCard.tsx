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
  /** 由父層驅動的飛出方向（按鈕／鍵盤／滑動判定後觸發） */
  exitDirection?: "left" | "right" | null;
}

const SWIPE_THRESHOLD = 90;
/** 橡膠阻尼：超過這個距離後拖曳阻力變大 */
const DRAG_CAP = 150;

/** 拖曳進度 0→1（印章與色彩濃度用） */
function stampProgress(dragX: number): number {
  const p = (Math.abs(dragX) - 24) / (SWIPE_THRESHOLD - 24);
  return Math.max(0, Math.min(1, p));
}

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
  exitDirection = null,
}: FlashcardCardProps) {
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const movedRef = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const exiting = exitDirection !== null;

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
    if (exiting) return;
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    movedRef.current = false;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (startXRef.current === null || exiting) return;
    const dx = e.touches[0].clientX - startXRef.current;
    const dy = e.touches[0].clientY - (startYRef.current ?? 0);
    // 以橫向為主才視為拖曳,避免干擾直向捲動
    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
      movedRef.current = true;
      setDragging(true);
      // 橡膠阻尼：超過上限後每多拖 1px 只前進 0.15 倍
      const abs = Math.abs(dx);
      const capped =
        abs <= DRAG_CAP
          ? abs
          : DRAG_CAP + (abs - DRAG_CAP) * 0.15;
      setDragX(Math.sign(dx) * Math.min(capped, DRAG_CAP + 60));
    }
  }

  function handleTouchEnd() {
    if (dragging && !exiting) {
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
    if (!movedRef.current && !exiting) onFlip();
  }

  // 漸進式方向提示（拖到 24px 起淡入，門檻處全開）
  const leftP = dragging && dragX < 0 ? stampProgress(dragX) : 0;
  const rightP = dragging && dragX > 0 ? stampProgress(dragX) : 0;
  // 飛出時鎖定對應印章全開
  const showLeftStamp = exitDirection === "left" || leftP > 0;
  const showRightStamp = exitDirection === "right" || rightP > 0;
  const stampOpacity = (p: number) =>
    exitDirection ? 1 : 0.25 + 0.75 * p;
  const stampScale = (p: number) =>
    exitDirection ? 1.08 : 0.92 + 0.16 * p;

  // 外框 transform：跟指 / 彈回 / 飛出三種狀態
  let transform: string;
  let transition: string;
  if (exiting) {
    const dir = exitDirection === "left" ? -1 : 1;
    transform = `translateX(${dir * 130}%) translateY(-18px) rotate(${dir * 16}deg) scale(0.96)`;
    transition = "transform 0.26s cubic-bezier(0.5, 0, 0.75, 0.4)";
  } else if (dragging) {
    transform = `translateX(${dragX}px) rotate(${dragX / 38}deg) scale(0.985)`;
    transition = "none";
  } else {
    // 彈回：帶一點過衝的 spring 感
    transform = "translateX(0) rotate(0deg) scale(1)";
    transition = "transform 0.42s cubic-bezier(0.175, 0.885, 0.32, 1.35)";
  }

  return (
    <div
      className={`flip-card w-full select-none ${
        exiting ? "pointer-events-none" : "cursor-pointer"
      }`}
      style={{
        transform,
        transition,
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
          aria-hidden={!showLeftStamp}
          className={`pointer-events-none absolute top-5 left-5 z-30 rounded-full border-2 border-[#E85D3A] bg-white/95 px-4 py-1.5 text-sm font-bold text-[#E85D3A] shadow-md ${
            showLeftStamp ? "" : "opacity-0"
          }`}
          style={{
            opacity: showLeftStamp ? stampOpacity(leftP) : 0,
            transform: `rotate(-8deg) scale(${stampScale(leftP)})`,
            transition: "opacity 0.12s linear, scale 0.15s ease-out",
          }}
        >
          仍在學習
        </div>
        <div
          aria-hidden={!showRightStamp}
          className={`pointer-events-none absolute top-5 right-5 z-30 rounded-full border-2 border-[#2BAC6E] bg-white/95 px-4 py-1.5 text-sm font-bold text-[#2BAC6E] shadow-md ${
            showRightStamp ? "" : "opacity-0"
          }`}
          style={{
            opacity: showRightStamp ? stampOpacity(rightP) : 0,
            transform: `rotate(8deg) scale(${stampScale(rightP)})`,
            transition: "opacity 0.12s linear, scale 0.15s ease-out",
          }}
        >
          知道
        </div>

        {/* 漸進色彩回饋：越接近門檻，邊緣色暈越明顯 */}
        {(leftP > 0 || rightP > 0 || exiting) && (
          <div
            className="pointer-events-none absolute inset-0 z-20 rounded-2xl"
            style={
              exitDirection === "left" || (!exitDirection && leftP > 0)
                ? {
                    boxShadow: `inset 0 0 0 ${(exiting ? 3 : Math.ceil(leftP * 3))}px rgba(232,93,58,${
                      exiting ? 0.55 : leftP * 0.5
                    })`,
                  }
                : {
                    boxShadow: `inset 0 0 0 ${(exiting ? 3 : Math.ceil(rightP * 3))}px rgba(43,172,110,${
                      exiting ? 0.55 : rightP * 0.5
                    })`,
                  }
            }
          />
        )}

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
          <p className="font-display font-medium text-3xl sm:text-4xl lg:text-[44px] leading-snug text-center text-[#1A1A1A] break-words text-balance max-h-full overflow-y-auto">
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
          <p className="text-xl sm:text-2xl text-center text-[#1A1A1A] break-words text-pretty leading-relaxed max-h-full overflow-y-auto">
            {definition}
          </p>
        </div>
      </div>
    </div>
  );
}
