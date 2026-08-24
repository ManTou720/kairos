"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { useDeck } from "@/hooks/useDecks";
import * as api from "@/lib/api";
import {
  MIN_CARDS_FOR_LEARN,
  MIN_CARDS_FOR_TEST,
  MIN_CARDS_FOR_MATCH,
} from "@/lib/constants";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import MoreMenu from "@/components/ui/MoreMenu";
import { useAuth } from "@/hooks/useAuth";
import { useTTS } from "@/hooks/useTTS";

export default function DeckDetailPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = use(params);
  const { data: deck, isLoading } = useDeck(deckId);
  const router = useRouter();
  const { user } = useAuth();
  const [showDelete, setShowDelete] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewFlipped, setPreviewFlipped] = useState(false);
  const { speak } = useTTS();

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded bg-[#D5C8B2]" />
          <div className="h-4 w-48 rounded bg-[#D5C8B2]" />
          <div className="grid gap-4 sm:grid-cols-2 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-[#D5C8B2]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">
          找不到學習集
        </h2>
        <Link href="/">
          <Button variant="secondary">返回首頁</Button>
        </Link>
      </div>
    );
  }

  async function handleDelete() {
    await api.deleteDeck(deckId);
    mutate("/api/decks");
    router.push("/");
  }

  const cardCount = deck.cards.length;
  // 防呆：卡片被刪除時避免預覽索引越界
  const safePreviewIndex = Math.min(previewIndex, cardCount - 1);

  const modes = [
    {
      name: "單詞卡",
      href: `/decks/${deckId}/flashcards`,
      min: 1,
      icon: "fa-clone",
    },
    {
      name: "學習",
      href: `/decks/${deckId}/learn`,
      min: MIN_CARDS_FOR_LEARN,
      icon: "fa-graduation-cap",
    },
    {
      name: "測試",
      href: `/decks/${deckId}/test`,
      min: MIN_CARDS_FOR_TEST,
      icon: "fa-file-pen",
    },
    {
      name: "配對",
      href: `/decks/${deckId}/match`,
      min: MIN_CARDS_FOR_MATCH,
      icon: "fa-link",
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-[32px] font-bold text-[#1A1A1A]">
            {deck.title}
          </h1>
          {deck.description && (
            <p className="text-[#6A6963] mt-1">{deck.description}</p>
          )}
          <div className="flex items-center flex-wrap gap-x-3 gap-y-2 mt-2 text-sm">
            {user && (
              <span className="font-semibold text-[#1A1A1A]">
                {user.username}
              </span>
            )}
            <span className="text-[#6A6963]">&middot;</span>
            <span className="text-[#6A6963]">{cardCount} 個詞語</span>
            <span className="text-[#6A6963]">&middot;</span>
            {/* Language selector (design: LanguageSelector pills) */}
            <span className="inline-flex items-center gap-2">
              <span className="px-3 py-1 rounded-full border border-[#D5C8B2] bg-white text-xs text-[#1A1A1A]">
                義大利文
              </span>
              <i className="fa-solid fa-arrow-right text-[#9A9A94] text-xs" />
              <span className="px-3 py-1 rounded-full border border-[#D5C8B2] bg-white text-xs text-[#1A1A1A]">
                中文
              </span>
            </span>
          </div>
        </div>
        <MoreMenu
          items={[
            {
              icon: "pen",
              label: "編輯",
              onClick: () => router.push(`/decks/${deckId}/edit`),
            },
            {
              icon: "trash",
              label: "刪除",
              danger: true,
              onClick: () => setShowDelete(true),
            },
          ]}
        />
      </div>

      {/* Study Modes - white StudyModeCards */}
      <div className="flex flex-wrap gap-3">
        {modes.map((mode) => {
          const disabled = cardCount < mode.min;
          const inner = (
            <>
              <span className="w-9 h-9 rounded-lg bg-[#D4AF3720] flex items-center justify-center">
                <i
                  className={`fa-solid ${mode.icon} text-sm ${
                    disabled ? "text-[#9A9A94]" : "text-[#D4AF37]"
                  }`}
                />
              </span>
              <span
                className={`text-sm font-semibold ${
                  disabled ? "text-[#9A9A94]" : "text-[#1A1A1A]"
                }`}
              >
                {mode.name}
              </span>
            </>
          );
          return disabled ? (
            <div
              key={mode.name}
              title={`至少需要 ${mode.min} 張卡片`}
              className="flex items-center gap-3 rounded-xl border border-[#E8DDD0] bg-white px-[18px] py-3.5 opacity-50 shrink-0 cursor-not-allowed"
            >
              {inner}
            </div>
          ) : (
            <Link
              key={mode.name}
              href={mode.href}
              className="flex items-center gap-3 rounded-xl border border-[#E8DDD0] bg-white px-[18px] py-3.5 hover:border-[#D4AF37] hover:shadow-md transition-all shrink-0"
            >
              {inner}
            </Link>
          );
        })}
      </div>

      {/* Preview Flashcard */}
      {deck.cards[0] && (
        <section>
          <h2 className="text-base font-semibold text-[#1A1A1A] mb-3">預覽</h2>
          <div className="flex items-center gap-3 max-w-xl">
            <button
              aria-label="上一張"
              disabled={previewIndex === 0}
              onClick={() => {
                setPreviewIndex((i) => Math.max(0, i - 1));
                setPreviewFlipped(false);
              }}
              className="shrink-0 w-10 h-10 rounded-full border border-[#D5C8B2] bg-white flex items-center justify-center text-[#6A6963] hover:border-[#D4AF37] hover:text-[#1A1A1A] active:scale-[0.95] disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <i className="fa-solid fa-chevron-left text-sm" />
            </button>
            <div
              className="flex-1 min-w-0 flip-card cursor-pointer select-none animate-fade-in"
              key={deck.cards[safePreviewIndex].id}
              onClick={() => setPreviewFlipped((v) => !v)}
            >
              <div
                className={`flip-card-inner relative w-full h-[220px] sm:h-[240px] ${
                  previewFlipped ? "flipped" : ""
                }`}
              >
                <div className="flip-card-front absolute inset-0 rounded-2xl border border-[#E8DDD0] bg-white p-8 shadow-sm">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const c = deck.cards[safePreviewIndex];
                      speak(c.term, c.termLang);
                    }}
                    aria-label="播放發音"
                    className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center text-[#6A6963] hover:text-[#D4AF37] hover:bg-[#F6F4F0] transition-colors"
                  >
                    <i className="fa-solid fa-volume-high" />
                  </button>
                  <span className="absolute top-4 right-4 text-xs text-[#9A9A94] tabular-nums">
                    {previewIndex + 1} / {deck.cards.length}
                  </span>
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="font-display text-[28px] sm:text-[32px] font-medium text-[#1A1A1A] text-center leading-snug break-words max-h-full overflow-y-auto">
                      {deck.cards[safePreviewIndex].term}
                    </p>
                  </div>
                  <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-[#9A9A94] whitespace-nowrap">
                    <i className="fa-solid fa-hand-pointer mr-1.5" />
                    點擊翻面
                  </span>
                </div>
                <div className="flip-card-back absolute inset-0 rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-b from-[#FBF6EA] to-[#F6EDDA] p-8 shadow-sm">
                  <span className="absolute top-4 left-4 text-[11px] font-semibold uppercase tracking-wider text-[#B8912C]">
                    定義
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const c = deck.cards[safePreviewIndex];
                      speak(c.term, c.termLang);
                    }}
                    aria-label="播放發音"
                    className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-[#9A9A94] hover:text-[#D4AF37] hover:bg-white/70 transition-colors"
                  >
                    <i className="fa-solid fa-volume-high" />
                  </button>
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-lg sm:text-xl text-center text-[#1A1A1A] leading-relaxed break-words max-h-full overflow-y-auto">
                      {deck.cards[safePreviewIndex].definition}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <button
              aria-label="下一張"
              disabled={previewIndex >= deck.cards.length - 1}
              onClick={() => {
                setPreviewIndex((i) => Math.min(deck.cards.length - 1, i + 1));
                setPreviewFlipped(false);
              }}
              className="shrink-0 w-10 h-10 rounded-full border border-[#D5C8B2] bg-white flex items-center justify-center text-[#6A6963] hover:border-[#D4AF37] hover:text-[#1A1A1A] active:scale-[0.95] disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <i className="fa-solid fa-chevron-right text-sm" />
            </button>
          </div>
        </section>
      )}

      {/* Cards List */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-[#1A1A1A]">
            本學習集中的詞語 ({cardCount})
          </h2>
        </div>
        <div className="border-t border-b border-[#E8DDD0]">
          {/* 欄位標題 */}
          <div className="hidden sm:flex items-center gap-4 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#9A9A94] border-b border-[#E8DDD0]/70">
            <span className="w-7 shrink-0">#</span>
            <span className="flex-1">詞語</span>
            <span className="flex-1">定義</span>
            <span className="w-9 shrink-0" aria-hidden />
          </div>
          {deck.cards.map((card, i) => (
            <div
              key={card.id}
              className="group flex items-center gap-4 px-3 py-3.5 border-b border-[#E8DDD0]/50 last:border-b-0 hover:bg-white/70 transition-colors rounded-sm"
            >
              <span className="w-7 shrink-0 text-xs text-[#9A9A94] tabular-nums group-hover:text-[#B8912C] transition-colors">
                {i + 1}
              </span>
              <span
                className="flex-1 min-w-0 font-medium text-sm text-[#1A1A1A] truncate"
                title={card.term}
              >
                {card.term}
              </span>
              <span
                className="flex-1 min-w-0 text-sm text-[#6A6963] truncate"
                title={card.definition}
              >
                {card.definition}
              </span>
              <button
                onClick={() => speak(card.term, card.termLang)}
                aria-label={`播放「${card.term}」的發音`}
                className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[#9A9A94] opacity-60 hover:text-[#D4AF37] hover:bg-[#F6F4F0] hover:opacity-100 focus:opacity-100 transition-all"
              >
                <i className="fa-solid fa-volume-high text-sm" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="刪除學習集？"
      >
        <p className="text-sm text-[#6A6963] mb-4">
          這將永久刪除「{deck.title}」和所有卡片。
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowDelete(false)}>
            取消
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            刪除
          </Button>
        </div>
      </Modal>
    </div>
  );
}
