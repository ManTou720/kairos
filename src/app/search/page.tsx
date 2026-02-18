"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import * as api from "@/lib/api";
import { DeckSummary } from "@/lib/types";

type TabType = "all" | "sets" | "users";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DeckSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState<TabType>("all");

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api.searchDecks(query.trim());
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const tabs: { key: TabType; label: string }[] = [
    { key: "all", label: "全部" },
    { key: "sets", label: "學習集" },
    { key: "users", label: "使用者" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-bold text-[#1A1A1A] mb-4">
          搜尋結果
        </h1>
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9A94]" />
          <input
            type="text"
            autoFocus
            placeholder="搜尋學習集..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-[#D5C8B2] bg-white pl-11 pr-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[#9A9A94] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#D5C8B2] pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t.key
                ? "bg-[#D4AF3720] text-[#1A1A1A]"
                : "text-[#6A6963] hover:text-[#1A1A1A]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {query.trim() && (
        <p className="text-sm text-[#6A6963]">
          {searching
            ? "搜尋中..."
            : `找到 ${results.length} 個結果`}
        </p>
      )}

      <div className="space-y-2">
        {results.map((deck) => (
          <Link
            key={deck.id}
            href={`/decks/${deck.id}`}
            className="flex items-center justify-between rounded-xl border border-[#E8DDD0] bg-white px-5 py-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-layer-group text-[#D4AF37]" />
              <div>
                <h3 className="font-semibold text-[#1A1A1A] text-sm">
                  {deck.title}
                </h3>
                <p className="text-xs text-[#9A9A94] mt-1">
                  {deck.cardCount} 張卡片
                </p>
              </div>
            </div>
            <i className="fa-solid fa-chevron-right text-xs text-[#9A9A94]" />
          </Link>
        ))}
      </div>
    </div>
  );
}
