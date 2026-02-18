"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { mutate } from "swr";
import { useFolders } from "@/hooks/useDecks";
import * as api from "@/lib/api";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

export default function FoldersPage() {
  const { data: folders, isLoading } = useFolders();
  const searchParams = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderDesc, setFolderDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setShowCreate(true);
    }
  }, [searchParams]);

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

  async function handleCreate() {
    if (!folderName.trim()) return;
    setCreating(true);
    try {
      await api.createFolder(folderName.trim());
      mutate("/api/folders");
      setFolderName("");
      setFolderDesc("");
      setShowCreate(false);
    } catch {
      // handle error
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-bold text-[#1A1A1A]">
          文件夾
        </h1>
        <Button onClick={() => setShowCreate(true)}>
          <i className="fa-solid fa-folder-plus mr-2" /> 新文件夾
        </Button>
      </div>

      <div className="space-y-3">
        {(folders || []).length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-[#E8DDD0] bg-white">
            <i className="fa-solid fa-folder-open text-3xl text-[#D5C8B2] mb-3" />
            <p className="text-[#6A6963]">還沒有文件夾</p>
            <p className="text-sm text-[#9A9A94] mt-1">
              建立文件夾來整理你的學習集。
            </p>
          </div>
        ) : (
          (folders || []).map((folder) => (
            <Link
              key={folder.id}
              href={`/folders/${folder.id}`}
              className="flex items-center justify-between rounded-xl border border-[#E8DDD0] bg-white px-5 py-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-folder text-[#D4AF37] text-lg" />
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

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="建立新文件夾"
      >
        <div className="space-y-4">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-2xl bg-[#D4AF3720] flex items-center justify-center">
              <i className="fa-solid fa-folder text-[#D4AF37] text-2xl" />
            </div>
          </div>
          <div>
            <label
              htmlFor="folderName"
              className="block text-sm font-medium text-[#1A1A1A] mb-1"
            >
              文件夾名稱
            </label>
            <input
              id="folderName"
              type="text"
              autoFocus
              placeholder="輸入文件夾名稱"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full rounded-lg border border-[#D5C8B2] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9A9A94] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            />
          </div>
          <div>
            <label
              htmlFor="folderDesc"
              className="block text-sm font-medium text-[#1A1A1A] mb-1"
            >
              說明
            </label>
            <textarea
              id="folderDesc"
              rows={2}
              placeholder="新增說明（選填）"
              value={folderDesc}
              onChange={(e) => setFolderDesc(e.target.value)}
              className="w-full rounded-lg border border-[#D5C8B2] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9A9A94] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={!folderName.trim() || creating}>
              {creating ? "建立中..." : "建立"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
