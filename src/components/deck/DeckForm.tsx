"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CardRow, { LanguageSelect } from "./CardRow";
import * as api from "@/lib/api";
import { Deck } from "@/lib/types";

interface CardField {
  id?: string;
  term: string;
  definition: string;
  termLang: string;
  defLang: string;
}

interface DeckFormProps {
  deck?: Deck;
}

export default function DeckForm({ deck }: DeckFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(deck?.title ?? "");
  const [description, setDescription] = useState(deck?.description ?? "");
  const [cards, setCards] = useState<CardField[]>(
    deck?.cards.map((c) => ({
      id: c.id,
      term: c.term,
      definition: c.definition,
      termLang: c.termLang ?? "auto",
      defLang: c.defLang ?? "auto",
    })) ?? [
      { term: "", definition: "", termLang: "auto", defLang: "auto" },
      { term: "", definition: "", termLang: "auto", defLang: "auto" },
    ]
  );
  const [submitting, setSubmitting] = useState(false);
  // 全域預設語言：新增詞語自動套用；變更時同步到仍為「自動」或舊預設的卡片
  const [defaultTermLang, setDefaultTermLang] = useState(
    () =>
      deck?.cards.find((c) => c.termLang && c.termLang !== "auto")?.termLang ??
      "auto"
  );
  const [defaultDefLang, setDefaultDefLang] = useState(
    () =>
      deck?.cards.find((c) => c.defLang && c.defLang !== "auto")?.defLang ??
      "auto"
  );
  const dragFromRef = useRef<number | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  function updateCard(index: number, field: "term" | "definition", value: string) {
    setCards((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function updateCardLang(index: number, field: "termLang" | "defLang", value: string) {
    setCards((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function handleDefaultLangChange(
    field: "termLang" | "defLang",
    value: string
  ) {
    const old = field === "termLang" ? defaultTermLang : defaultDefLang;
    if (field === "termLang") {
      setDefaultTermLang(value);
    } else {
      setDefaultDefLang(value);
    }
    // 套用到仍為「自動偵測」或舊預設值的卡片（保留手動覆寫）
    setCards((prev) =>
      prev.map((c) =>
        c[field] === old || c[field] === "auto" ? { ...c, [field]: value } : c
      )
    );
  }

  function removeCard(index: number) {
    setCards((prev) => prev.filter((_, i) => i !== index));
  }

  function addCard() {
    setCards((prev) => [
      ...prev,
      {
        term: "",
        definition: "",
        termLang: defaultTermLang,
        defLang: defaultDefLang,
      },
    ]);
  }

  function handleDragStart(index: number) {
    dragFromRef.current = index;
    setDragFrom(index);
    setDropIndex(null);
  }

  function handleDragOverCard(index: number, e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const newDropIndex = e.clientY < midY ? index : index + 1;
    setDropIndex(newDropIndex);
  }

  function handleDrop() {
    const from = dragFromRef.current;
    if (from !== null && dropIndex !== null) {
      const to = dropIndex > from ? dropIndex - 1 : dropIndex;
      if (from !== to) {
        setCards((prev) => {
          const next = [...prev];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          return next;
        });
      }
    }
    dragFromRef.current = null;
    setDragFrom(null);
    setDropIndex(null);
  }

  function handleDragEnd() {
    dragFromRef.current = null;
    setDragFrom(null);
    setDropIndex(null);
  }

  async function submitDeck(target: "view" | "practice") {
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
        router.push(
          target === "practice"
            ? `/decks/${deck.id}/flashcards`
            : `/decks/${deck.id}`
        );
      } else {
        const newDeck = await api.createDeck({
          title: title.trim(),
          description: description.trim(),
          cards: validCards,
        });
        mutate("/api/decks");
        router.push(
          target === "practice"
            ? `/decks/${newDeck.id}/flashcards`
            : `/decks/${newDeck.id}`
        );
      }
    } catch {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitDeck("view");
  }

  function handleSubmitAndPractice() {
    void submitDeck("practice");
  }

  const validCount = cards.filter((c) => c.term.trim() && c.definition.trim()).length;

  return (
    <form id="deck-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          label="標題"
          id="title"
          placeholder="輸入學習集標題，例如「義大利文 基礎詞彙」"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-[#1A1A1A] mb-1"
          >
            說明（選填）
          </label>
          <input
            id="description"
            type="text"
            placeholder="新增說明..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-[#D5C8B2] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9A9A94] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
          />
        </div>
      </div>

      <div
        className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-[#E8DDD0] bg-white px-4 py-3"
      >
        <span className="text-sm font-semibold text-[#1A1A1A]">
          <i className="fa-solid fa-language text-[#D4AF37] mr-1.5" />
          預設語言
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[#6A6963]">詞語</span>
          <LanguageSelect
            value={defaultTermLang}
            onChange={(v) => handleDefaultLangChange("termLang", v)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[#6A6963]">定義</span>
          <LanguageSelect
            value={defaultDefLang}
            onChange={(v) => handleDefaultLangChange("defLang", v)}
          />
        </div>
        <span className="text-[11px] text-[#9A9A94] ml-auto hidden sm:block">
          新增詞語會自動套用
        </span>
      </div>

      <div
        className="space-y-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {cards.map((card, i) => (
          <div key={card.id ?? i}>
            {dropIndex === i && dragFrom !== null && dragFrom !== i && dragFrom !== i - 1 && (
              <div className="flex items-center gap-2 py-1 px-2">
                <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                <div className="flex-1 h-0.5 bg-[#D4AF37] rounded-full" />
              </div>
            )}
            <CardRow
              index={i}
              term={card.term}
              definition={card.definition}
              termLang={card.termLang}
              defLang={card.defLang}
              onChange={(field, value) => updateCard(i, field, value)}
              onChangeLang={(field, value) => updateCardLang(i, field, value)}
              onRemove={() => removeCard(i)}
              canRemove={cards.length > 1}
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOverCard(i, e)}
              onDragEnd={handleDragEnd}
              dragging={dragFrom === i}
            />
            {i === cards.length - 1 && dropIndex === cards.length && dragFrom !== null && dragFrom !== i && (
              <div className="flex items-center gap-2 py-1 px-2 mt-4">
                <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                <div className="flex-1 h-0.5 bg-[#D4AF37] rounded-full" />
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addCard}
          className="w-full rounded-full border border-[#D5C8B2] bg-white py-3.5 text-[15px] font-semibold text-[#6A6963] hover:bg-[#F6F4F0] transition-colors flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-plus text-sm" />
          新增詞語
        </button>
      </div>

      <div className="flex gap-3 py-4">
        <Button
          type="submit"
          variant="secondary"
          disabled={!title.trim() || validCount < 1 || submitting}
        >
          {submitting ? "儲存中..." : deck ? "儲存變更" : "建立"}
        </Button>
        {!deck && (
          <Button type="button" onClick={() => (handleSubmitAndPractice())}>
            建立與練習
          </Button>
        )}
      </div>
    </form>
  );
}
