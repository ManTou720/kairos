"use client";

import { use } from "react";
import Link from "next/link";
import { useDecks, useFolders } from "@/hooks/useDecks";
import { formatDate } from "@/lib/utils";
import Button from "@/components/ui/Button";

export default function FolderDetailPage({
  params,
}: {
  params: Promise<{ folderId: string }>;
}) {
  const { folderId } = use(params);
  const { data: folders, isLoading: foldersLoading } = useFolders();
  const { data: decks, isLoading: decksLoading } = useDecks();

  const isLoading = foldersLoading || decksLoading;
  const folder = folders?.find((f) => f.id === folderId);
  const folderDecks = (decks || []).filter((d) => d.folderId === folderId);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-[#D5C8B2]" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-[#D5C8B2]" />
          ))}
        </div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">
          找不到文件夾
        </h2>
        <Link href="/folders">
          <Button variant="secondary">返回文件夾列表</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <i className="fa-solid fa-folder text-[#D4AF37] text-xl" />
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#1A1A1A]">
            {folder.name}
          </h1>
        </div>
        <p className="text-sm text-[#9A9A94]">
          建立於 {formatDate(folder.createdAt)}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#D5C8B2] pb-2">
        <button className="px-4 py-2 text-sm font-medium rounded-lg bg-[#D4AF3720] text-[#1A1A1A]">
          全部
        </button>
      </div>

      {/* Deck list */}
      <div className="space-y-2">
        {folderDecks.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-[#E8DDD0] bg-white">
            <p className="text-[#6A6963]">這個文件夾還沒有學習集</p>
            <Link
              href="/decks/new"
              className="mt-3 inline-flex items-center rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#1A1A1A] hover:bg-[#C9A02E] transition-colors"
            >
              新增學習集
            </Link>
          </div>
        ) : (
          folderDecks.map((deck) => (
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
                  <p className="text-xs text-[#9A9A94] mt-0.5">
                    {deck.cardCount} 張卡片
                  </p>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right text-xs text-[#9A9A94]" />
            </Link>
          ))
        )}
      </div>

      {/* Bottom action bar */}
      <div className="flex gap-3">
        <Button variant="secondary">
          <i className="fa-solid fa-users mr-2" /> 學員
        </Button>
        <Link href="/decks/new">
          <Button>
            <i className="fa-solid fa-plus mr-2" /> 新增學習集
          </Button>
        </Link>
      </div>
    </div>
  );
}
