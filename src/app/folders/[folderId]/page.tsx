"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { useDecks, useFolders } from "@/hooks/useDecks";
import { formatDate } from "@/lib/utils";
import * as api from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import MoreMenu from "@/components/ui/MoreMenu";

export default function FolderDetailPage({
  params,
}: {
  params: Promise<{ folderId: string }>;
}) {
  const { folderId } = use(params);
  const router = useRouter();
  const { data: folders, isLoading: foldersLoading } = useFolders();
  const { data: decks, isLoading: decksLoading } = useDecks();

  const [search, setSearch] = useState<string>("");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isLoading = foldersLoading || decksLoading;
  const folder = folders?.find((f) => f.id === folderId);
  const folderDecks = (decks || []).filter((d) => d.folderId === folderId);

  const visibleDecks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? folderDecks.filter((d) => d.title.toLowerCase().includes(q))
      : folderDecks;
    if (!sortNewestFirst) return filtered;
    return [...filtered].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [folderDecks, search, sortNewestFirst]);

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

  async function handleRename() {
    if (!folder || !renameValue.trim()) return;
    await api.updateFolder(folder.id, renameValue.trim());
    mutate("/api/folders");
    setRenaming(false);
  }

  async function handleDelete() {
    if (!folder || deleting) return;
    setDeleting(true);
    try {
      await api.deleteFolder(folder.id);
      mutate("/api/folders");
      mutate("/api/decks");
      router.push("/folders");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <i className="fa-solid fa-folder text-[#D4AF37] text-xl" />
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#1A1A1A]">
              {folder.name}
            </h1>
          </div>
          <p className="text-sm text-[#6A6963]">
            {folderDecks.length} 個學習集 &middot; 建立於{" "}
            {formatDate(folder.createdAt)}
          </p>
        </div>
        <MoreMenu
          items={[
            {
              icon: "pen",
              label: "編輯",
              onClick: () => {
                setRenameValue(folder.name);
                setRenaming(true);
              },
            },
            {
              icon: "trash",
              label: "刪除文件夾",
              danger: true,
              onClick: handleDelete,
            },
          ]}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 mt-5 mb-4">
        <span className="text-sm font-semibold text-[#1A1A1A]">全部</span>
        <Link
          href="/decks/new"
          aria-label="新增學習集"
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#D5C8B2] bg-white text-[#6A6963] hover:border-[#D4AF37] hover:text-[#1A1A1A] transition-colors"
        >
          <i className="fa-solid fa-plus text-xs" />
        </Link>
      </div>

      {/* Sort row */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setSortNewestFirst((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-[#6A6963] hover:bg-[#EADCC5]/50 hover:text-[#1A1A1A] transition-colors"
        >
          <i className="fa-solid fa-arrow-down-wide-short" />
          {sortNewestFirst ? "最近更新" : "預設排序"}
        </button>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="在此輸入搜尋..."
          className="w-full max-w-[240px] rounded-full border border-[#D5C8B2] bg-white px-4 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9A9A94] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
        />
      </div>

      {/* Deck list */}
      <div className="space-y-3">
        {folderDecks.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-[#E8DDD0] bg-white">
            <p className="text-[#6A6963]">這個文件夾還沒有學習集</p>
            <Link
              href="/decks/new"
              className="mt-3 inline-flex items-center rounded-full bg-[#D4AF37] px-5 py-2 text-sm font-semibold text-[#1A1A1A] hover:bg-[#C9A02E] transition-colors"
            >
              新增學習集
            </Link>
          </div>
        ) : visibleDecks.length === 0 ? (
          <p className="text-center py-12 text-sm text-[#6A6963]">
            沒有符合的學習集
          </p>
        ) : (
          visibleDecks.map((deck) => (
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

      {/* Bottom action bar */}
      <div className="mt-auto pt-6">
        <div className="inline-flex items-center gap-3 rounded-full border border-[#E8DDD0] bg-white p-2 pl-3 shadow-sm">
          {(() => {
            const firstDeck = folderDecks[0];
            return firstDeck ? (
              <Link href={`/decks/${firstDeck.id}/flashcards`}>
                <Button variant="secondary">學習</Button>
              </Link>
            ) : (
              <Button variant="secondary" disabled>
                學習
              </Button>
            );
          })()}
          <Link href="/decks/new">
            <Button>
              <i className="fa-solid fa-plus" /> 新增學習集
            </Button>
          </Link>
        </div>
      </div>

      {/* Rename modal */}
      <Modal open={renaming} onClose={() => setRenaming(false)} title="編輯文件夾">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRename();
          }}
          className="space-y-4"
        >
          <Input
            label="文件夾名稱"
            id="rename-folder"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            autoFocus
          />
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={() => setRenaming(false)}>
              取消
            </Button>
            <Button type="submit" disabled={!renameValue.trim()}>
              儲存
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
