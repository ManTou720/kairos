"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CardRow from "./CardRow";
import * as api from "@/lib/api";
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
  const [submitting, setSubmitting] = useState(false);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validCards = cards.filter((c) => c.term.trim() && c.definition.trim());
    if (!title.trim() || validCards.length < 1) return;

    setSubmitting(true);
    try {
      if (deck) {
        await api.updateDeck(deck.id, {
          title: title.trim(),
          description: description.trim(),
          cards: validCards,
        });
        mutate(`/api/decks/${deck.id}`);
        router.push(`/decks/${deck.id}`);
      } else {
        const newDeck = await api.createDeck({
          title: title.trim(),
          description: description.trim(),
          cards: validCards,
        });
        mutate("/api/decks");
        router.push(`/decks/${newDeck.id}`);
      }
    } catch {
      setSubmitting(false);
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
            className="block text-sm font-medium text-[#1A1A1A] mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            rows={2}
            placeholder="Add a description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-[#D5C8B2] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9A9A94] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-[#1A1A1A]">
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
        <Button type="submit" disabled={!title.trim() || validCount < 1 || submitting}>
          {submitting ? "Saving..." : deck ? "Save changes" : "Create deck"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
