"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeck } from "@/hooks/useStore";
import { deleteDeck } from "@/lib/storage";
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
  const deck = useDeck(deckId);
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);

  if (deck === null) {
    return <div className="text-center py-12 text-gray-400">Loading...</div>;
  }

  if (!deck) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          Deck not found
        </h2>
        <Link href="/">
          <Button variant="secondary">Back to decks</Button>
        </Link>
      </div>
    );
  }

  function handleDelete() {
    deleteDeck(deckId);
    router.push("/");
  }

  const cardCount = deck.cards.length;

  const modes = [
    {
      name: "Flashcards",
      href: `/decks/${deckId}/flashcards`,
      desc: "Flip through cards",
      min: 1,
      icon: "🃏",
    },
    {
      name: "Learn",
      href: `/decks/${deckId}/learn`,
      desc: "Multiple choice with spaced repetition",
      min: MIN_CARDS_FOR_LEARN,
      icon: "🧠",
    },
    {
      name: "Test",
      href: `/decks/${deckId}/test`,
      desc: "Mixed question types",
      min: MIN_CARDS_FOR_TEST,
      icon: "📝",
    },
    {
      name: "Match",
      href: `/decks/${deckId}/match`,
      desc: "Pair terms with definitions",
      min: MIN_CARDS_FOR_MATCH,
      icon: "🎯",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
        >
          ← Back to decks
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{deck.title}</h1>
            {deck.description && (
              <p className="text-gray-500 mt-1">{deck.description}</p>
            )}
            <p className="text-sm text-gray-400 mt-2">
              {cardCount} cards · Updated {formatDate(deck.updatedAt)}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href={`/decks/${deckId}/edit`}>
              <Button variant="secondary" size="sm">
                Edit
              </Button>
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

      <div className="grid gap-3 sm:grid-cols-2 mb-8">
        {modes.map((mode) => {
          const disabled = cardCount < mode.min;
          return disabled ? (
            <div
              key={mode.name}
              className="rounded-xl border border-gray-200 bg-gray-50 p-5 opacity-50"
            >
              <div className="text-2xl mb-2">{mode.icon}</div>
              <h3 className="font-semibold text-gray-700">{mode.name}</h3>
              <p className="text-sm text-gray-400 mt-1">
                Requires at least {mode.min} cards
              </p>
            </div>
          ) : (
            <Link
              key={mode.name}
              href={mode.href}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="text-2xl mb-2">{mode.icon}</div>
              <h3 className="font-semibold text-gray-900">{mode.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{mode.desc}</p>
            </Link>
          );
        })}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Cards</h2>
        <div className="space-y-2">
          {deck.cards.map((card) => (
            <div
              key={card.id}
              className="flex items-center rounded-lg border border-gray-200 bg-white px-4 py-3"
            >
              <span className="flex-1 font-medium text-sm">{card.term}</span>
              <span className="flex-1 text-sm text-gray-500">
                {card.definition}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete deck?"
      >
        <p className="text-sm text-gray-600 mb-4">
          This will permanently delete &quot;{deck.title}&quot; and all its
          cards. This action cannot be undone.
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
