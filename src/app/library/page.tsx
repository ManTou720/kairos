"use client";

import { useState } from "react";
import Link from "next/link";
import { useDecks, useFolders } from "@/hooks/useDecks";

type Tab = "sets" | "folders";

export default function LibraryPage() {
  const { data: decks, isLoading: decksLoading } = useDecks();
  const { data: folders, isLoading: foldersLoading } = useFolders();
  const [tab, setTab] = useState<Tab>("sets");

  const isLoading = decksLoading || foldersLoading;

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-[#D5C8B2]" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-[#D5C8B2]" />
          ))}
        </div>
      </div>
    );
  }

  const sorted = [...(decks || [])].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[28px] font-bold text-[#1A1A1A]">
          你的圖書室
        </h1>
        <Link
          href="/decks/new"
          className="inline-flex items-center rounded-full bg-[#D4AF37] px-5 py-2 text-sm font-semibold text-[#1A1A1A] hover:bg-[#C9A02E] transition-colors"
        >
          <i className="fa-solid fa-plus" /> 新建
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-6">
        <button
          onClick={() => setTab("sets")}
          className={`text-sm transition-colors ${
            tab === "sets"
              ? "font-semibold text-[#1A1A1A]"
              : "text-[#6A6963] hover:text-[#1A1A1A]"
          }`}
        >
          學習集
        </button>
        <button
          onClick={() => setTab("folders")}
          className={`text-sm transition-colors ${
            tab === "folders"
              ? "font-semibold text-[#1A1A1A]"
              : "text-[#6A6963] hover:text-[#1A1A1A]"
          }`}
        >
          文件夾
        </button>
      </div>

      {tab === "sets" ? (
        <div className="space-y-4">
          {sorted.length === 0 ? (
            <p className="text-center py-12 text-[#6A6963]">
              還沒有學習集。建立你的第一個吧！
            </p>
          ) : (
            sorted.map((deck) => (
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
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {(folders || []).length === 0 ? (
            <p className="text-center py-12 text-[#6A6963]">
              還沒有文件夾。
            </p>
          ) : (
            (folders || []).map((folder) => (
              <Link
                key={folder.id}
                href={`/folders/${folder.id}`}
                className="flex items-center justify-between rounded-xl border border-[#E8DDD0] bg-white px-5 py-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-folder text-[#D4AF37]" />
                  <div>
                    <h3 className="font-semibold text-[#1A1A1A] text-sm">
                      {folder.name}
                    </h3>
                    <p className="text-xs text-[#9A9A94] mt-0.5">
                      {folder.deckCount} 個學習集
                    </p>
                  </div>
                </div>
                <i className="fa-solid fa-chevron-right text-xs text-[#9A9A94]" />
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
