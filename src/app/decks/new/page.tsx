"use client";

import DeckForm from "@/components/deck/DeckForm";

export default function NewDeckPage() {
  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#1A1A1A] mb-6">
        Create New Deck
      </h1>
      <DeckForm />
    </div>
  );
}
