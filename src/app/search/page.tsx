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

  // 支援 /search?q=... 直接帶入查詢(從 NavBar 送出)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setQuery(q);
  }, []);

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
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-[#6A6963]" />
          <input
            type="text"
            autoFocus
            placeholder="搜尋學習集、教科書、問題"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-full border border-[#D5C8B2] bg-white pl-11 pr-4 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#9A9A94] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
          />
        </div>
      </div>

      {/* Tabs + sort */}
      <div className="flex items-center justify-between">
        <div className="flex gap-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`text-sm transition-colors ${
                tab === t.key
                  ? "font-semibold text-[#1A1A1A]"
                  : "text-[#6A6963] hover:text-[#1A1A1A]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setResults((prev) => [...prev].reverse())
          }
          className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm text-[#6A6963] hover:bg-[#EADCC5]/50 hover:text-[#1A1A1A] transition-colors"
        >
          <i className="fa-solid fa-arrow-down-wide-short" />
          排序
        </button>
      </div>

      {query.trim() && (
        <p className="text-sm text-[#6A6963]">
          {searching
            ? "搜尋中..."
            : `找到 ${results.length} 個結果`}
        </p>
      )}

      <div className="space-y-4">
        {results.map((deck) => (
          <Link
            key={deck.id}
            href={`/decks/${deck.id}`}
            className="flex items-center justify-between rounded-xl border border-[#E8DDD0] bg-white px-5 py-4 hover:shadow-md transition-shadow"
          >
            <div className="space-y-1">
              <h3 className="font-semibold text-[#1A1A1A] text-base">
                {deck.title}
              </h3>
              <p className="text-[13px] text-[#6A6963]">
                {deck.cardCount} cards &middot; by {deck.authorName}
              </p>
            </div>
            <i className="fa-solid fa-chevron-right text-xs text-[#9A9A94]" />
          </Link>
        ))}
      </div>
    </div>
  );
}
