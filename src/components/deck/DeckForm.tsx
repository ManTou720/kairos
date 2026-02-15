"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CardRow from "./CardRow";
import { createDeck, updateDeck } from "@/lib/storage";
import { Deck } from "@/lib/types";

interface CardField {
  id?: string;
  term: string;
  definition: string;
}

interface DeckFormProps {
  deck?: Deck;
}

export default function DeckForm({ deck }: DeckFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(deck?.title ?? "");
  const [description, setDescription] = useState(deck?.description ?? "");
  const [cards, setCards] = useState<CardField[]>(
    deck?.cards.map((c) => ({ id: c.id, term: c.term, definition: c.definition })) ?? [
      { term: "", definition: "" },
      { term: "", definition: "" },
    ]
  );

  function updateCard(index: number, field: "term" | "definition", value: string) {
    setCards((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function removeCard(index: number) {
    setCards((prev) => prev.filter((_, i) => i !== index));
  }

  function addCard() {
    setCards((prev) => [...prev, { term: "", definition: "" }]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validCards = cards.filter((c) => c.term.trim() && c.definition.trim());
    if (!title.trim() || validCards.length < 1) return;

    if (deck) {
      updateDeck(deck.id, title.trim(), description.trim(), validCards);
      router.push(`/decks/${deck.id}`);
    } else {
      const newDeck = createDeck(title.trim(), description.trim(), validCards);
      router.push(`/decks/${newDeck.id}`);
    }
  }

  const validCount = cards.filter((c) => c.term.trim() && c.definition.trim()).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          label="Title"
          id="title"
          placeholder="Enter deck title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            rows={2}
            placeholder="Add a description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">
            Cards ({validCount} valid)
          </h3>
          <Button type="button" variant="ghost" size="sm" onClick={addCard}>
            + Add card
          </Button>
        </div>
        {cards.map((card, i) => (
          <CardRow
            key={i}
            index={i}
            term={card.term}
            definition={card.definition}
            onChange={(field, value) => updateCard(i, field, value)}
            onRemove={() => removeCard(i)}
            canRemove={cards.length > 1}
          />
        ))}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={!title.trim() || validCount < 1}>
          {deck ? "Save changes" : "Create deck"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
