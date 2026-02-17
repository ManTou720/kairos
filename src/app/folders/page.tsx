"use client";

import { useState } from "react";
import Link from "next/link";
import { mutate } from "swr";
import { useFolders } from "@/hooks/useDecks";
import * as api from "@/lib/api";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

export default function FoldersPage() {
  const { data: folders, isLoading } = useFolders();
  const [showCreate, setShowCreate] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [creating, setCreating] = useState(false);

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
          Folders
        </h1>
        <Button onClick={() => setShowCreate(true)}>
          <i className="fa-solid fa-folder-plus mr-2" /> New Folder
        </Button>
      </div>

      <div className="space-y-3">
        {(folders || []).length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-[#E8DDD0] bg-white">
            <i className="fa-solid fa-folder-open text-3xl text-[#D5C8B2] mb-3" />
            <p className="text-[#6A6963]">No folders yet</p>
            <p className="text-sm text-[#9A9A94] mt-1">
              Create a folder to organize your sets.
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
                    {folder.deckCount} sets
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
        title="Create Folder"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="folderName"
              className="block text-sm font-medium text-[#1A1A1A] mb-1"
            >
              Folder Name
            </label>
            <input
              id="folderName"
              type="text"
              autoFocus
              placeholder="Enter folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full rounded-lg border border-[#D5C8B2] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9A9A94] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!folderName.trim() || creating}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
