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
          Deck not found
        </h2>
        <Link href="/">
          <Button variant="secondary">Back to home</Button>
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
      name: "Flashcards",
      href: `/decks/${deckId}/flashcards`,
      min: 1,
      color: "bg-[#D4AF3720]",
      icon: "fa-clone",
    },
    {
      name: "Learn",
      href: `/decks/${deckId}/learn`,
      min: MIN_CARDS_FOR_LEARN,
      color: "bg-[#0D227520]",
      icon: "fa-graduation-cap",
    },
    {
      name: "Test",
      href: `/decks/${deckId}/test`,
      min: MIN_CARDS_FOR_TEST,
      color: "bg-[#2D6A4F20]",
      icon: "fa-file-pen",
    },
    {
      name: "Match",
      href: `/decks/${deckId}/match`,
      min: MIN_CARDS_FOR_MATCH,
      color: "bg-[#8B000020]",
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
              <span>{cardCount} cards</span>
              <span>&middot;</span>
              <span>Updated {formatDate(deck.updatedAt)}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href={`/decks/${deckId}/edit`}>
              <Button variant="secondary" size="sm">Edit</Button>
            </Link>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDelete(true)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Study Modes */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {modes.map((mode) => {
          const disabled = cardCount < mode.min;
          return disabled ? (
            <div
              key={mode.name}
              className={`rounded-xl ${mode.color} p-5 opacity-40`}
            >
              <i className={`fa-solid ${mode.icon} text-xl mb-2 text-[#1A1A1A]`} />
              <h3 className="font-semibold text-[#1A1A1A]">{mode.name}</h3>
              <p className="text-xs text-[#6A6963] mt-1">
                Min {mode.min} cards
              </p>
            </div>
          ) : (
            <Link
              key={mode.name}
              href={mode.href}
              className={`rounded-xl ${mode.color} p-5 transition-shadow hover:shadow-md`}
            >
              <i className={`fa-solid ${mode.icon} text-xl mb-2 text-[#1A1A1A]`} />
              <h3 className="font-semibold text-[#1A1A1A]">{mode.name}</h3>
            </Link>
          );
        })}
      </div>

      {/* Preview Flashcard */}
      {deck.cards[0] && (
        <section>
          <h2 className="text-base font-semibold text-[#1A1A1A] mb-3 font-[family-name:var(--font-ui)]">
            Preview
          </h2>
          <div className="rounded-2xl border border-[#E8DDD0] bg-white p-8 text-center max-w-xl">
            <p className="font-[family-name:var(--font-display)] text-3xl text-[#1A1A1A]">
              {deck.cards[0].term}
            </p>
          </div>
        </section>
      )}

      {/* Cards List */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-[#1A1A1A] font-[family-name:var(--font-ui)]">
            Words ({cardCount})
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
              <span className="flex-1 text-sm text-[#6A6963]">
                {card.definition}
              </span>
            </div>
          ))}
        </div>
      </section>

      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete deck?"
      >
        <p className="text-sm text-[#6A6963] mb-4">
          This will permanently delete &quot;{deck.title}&quot; and all its
          cards.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
