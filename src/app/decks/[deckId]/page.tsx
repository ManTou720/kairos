"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { useDeck } from "@/hooks/useDecks";
import * as api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
  MIN_CARDS_FOR_LEARN,
  MIN_CARDS_FOR_TEST,
  MIN_CARDS_FOR_MATCH,
} from "@/lib/constants";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

export default function DeckDetailPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = use(params);
  const { data: deck, isLoading } = useDeck(deckId);
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);

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
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#1A1A1A]">
              {deck.title}
            </h1>
            {deck.description && (
              <p className="text-[#6A6963] mt-1">{deck.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-sm text-[#9A9A94]">
              <span>{cardCount} 張卡片</span>
              <span>&middot;</span>
              <span>更新於 {formatDate(deck.updatedAt)}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href={`/decks/${deckId}/edit`}>
              <Button variant="secondary" size="sm">
                <i className="fa-solid fa-pen mr-1" /> 編輯
              </Button>
            </Link>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDelete(true)}
            >
              刪除
            </Button>
          </div>
        </div>
      </div>

      {/* Language selector placeholder */}
      <div className="flex items-center gap-2 text-sm text-[#6A6963]">
        <span className="px-3 py-1.5 rounded-lg border border-[#D5C8B2] bg-white">義大利文</span>
        <i className="fa-solid fa-arrow-right text-[#9A9A94]" />
        <span className="px-3 py-1.5 rounded-lg border border-[#D5C8B2] bg-white">中文</span>
      </div>

      {/* Study Modes - horizontal tab row */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {modes.map((mode) => {
          const disabled = cardCount < mode.min;
          return disabled ? (
            <div
              key={mode.name}
              className="flex items-center gap-2 rounded-lg border border-[#E8DDD0] bg-white px-4 py-2.5 text-sm text-[#9A9A94] opacity-50 shrink-0"
            >
              <i className={`fa-solid ${mode.icon}`} />
              <span>{mode.name}</span>
            </div>
          ) : (
            <Link
              key={mode.name}
              href={mode.href}
              className="flex items-center gap-2 rounded-lg border border-[#D4AF37] bg-[#D4AF3710] px-4 py-2.5 text-sm font-medium text-[#1A1A1A] hover:bg-[#D4AF3720] transition-colors shrink-0"
            >
              <i className={`fa-solid ${mode.icon} text-[#D4AF37]`} />
              <span>{mode.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Preview Flashcard */}
      {deck.cards[0] && (
        <section>
          <div className="rounded-2xl border border-[#E8DDD0] bg-white p-8 max-w-xl relative">
            <div className="absolute top-4 right-4 flex gap-2">
              <button className="text-[#9A9A94] hover:text-[#D4AF37] transition-colors">
                <i className="fa-solid fa-volume-high" />
              </button>
              <button className="text-[#9A9A94] hover:text-[#D4AF37] transition-colors">
                <i className="fa-regular fa-star" />
              </button>
            </div>
            <p className="font-[family-name:var(--font-display)] text-3xl text-[#1A1A1A] text-center">
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
        <div className="space-y-2">
          {deck.cards.map((card) => (
            <div
              key={card.id}
              className="flex items-center rounded-xl border border-[#E8DDD0] bg-white px-5 py-3"
            >
              <span className="flex-1 font-medium text-sm text-[#1A1A1A]">
                {card.term}
              </span>
              <div className="w-px h-6 bg-[#E8DDD0] mx-4" />
              <span className="flex-1 text-sm text-[#6A6963]">
                {card.definition}
              </span>
              <button className="ml-3 text-[#9A9A94] hover:text-[#D4AF37] transition-colors">
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
