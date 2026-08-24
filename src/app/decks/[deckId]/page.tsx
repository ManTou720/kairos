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
          <h1 className="font-[family-name:var(--font-display)] text-[32px] font-bold text-[#1A1A1A]">
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
          <div className="rounded-2xl border border-[#E8DDD0] bg-white p-8 max-w-xl relative">
            <div className="absolute top-4 left-4 flex gap-3">
              <button onClick={() => speak(deck.cards[0].term, deck.cards[0].termLang)} aria-label="播放發音" className="text-[#6A6963] hover:text-[#D4AF37] transition-colors">
                <i className="fa-solid fa-volume-high" />
              </button>
              <button aria-label="收藏" className="text-[#6A6963] hover:text-[#D4AF37] transition-colors">
                <i className="fa-regular fa-star" />
              </button>
            </div>
            <p className="font-[family-name:var(--font-display)] text-[32px] font-medium text-[#1A1A1A] text-center">
              {deck.cards[0].term}
            </p>
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
        <div className="divide-y divide-[#E8DDD0] border-t border-b border-[#E8DDD0]">
          {deck.cards.map((card) => (
            <div
              key={card.id}
              className="flex items-center gap-4 py-3.5"
            >
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => speak(card.term, card.termLang)}
                  aria-label="播放發音"
                  className="text-[#6A6963] hover:text-[#D4AF37] transition-colors"
                >
                  <i className="fa-solid fa-volume-high text-sm" />
                </button>
                <button
                  aria-label="收藏"
                  className="text-[#6A6963] hover:text-[#D4AF37] transition-colors"
                >
                  <i className="fa-regular fa-star text-sm" />
                </button>
              </div>
              <span className="flex-1 font-medium text-sm text-[#1A1A1A] truncate">
                {card.term}
              </span>
              <span className="flex-1 text-sm text-[#6A6963] truncate">
                {card.definition}
              </span>
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
