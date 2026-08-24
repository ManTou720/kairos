"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Logo from "../ui/Logo";

interface NavBarProps {
  onMenuToggle?: () => void;
}

export default function NavBar({ onMenuToggle }: NavBarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#E8DDD0] bg-white h-16 px-4 lg:px-5">
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onMenuToggle}
          aria-label="開啟選單"
          className="text-[#6A6963] p-2 -ml-2 hover:bg-[#EADCC5]/50 rounded-lg transition-colors"
        >
          <i className="fa-solid fa-bars text-lg" />
        </button>
        <Link href="/" aria-label="Kairos 首頁">
          <Logo size={32} />
        </Link>
      </div>

      <form
        onSubmit={handleSearchSubmit}
        className="relative flex items-center flex-1 max-w-md lg:max-w-[480px] mx-3 lg:mx-4"
      >
        <i className="fa-solid fa-magnifying-glass absolute left-4 text-[#6A6963] pointer-events-none" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜尋學習集、教科書、問題"
          aria-label="搜尋"
          className="w-full rounded-full border border-[#D5C8B2] bg-white pl-10 pr-4 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#9A9A94] hover:border-[#D4AF37] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-colors [&::-webkit-search-cancel-button]:hidden"
        />
      </form>

      <div className="flex items-center gap-3">
        <Link
          href="/decks/new"
          aria-label="建立學習集"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#D4AF37] text-[#1A1A1A] hover:bg-[#C9A02E] transition-colors"
        >
          <i className="fa-solid fa-plus" />
        </Link>
        {user && (
          <div
            title={user.username}
            className="w-9 h-9 rounded-full bg-[#6A6963] flex items-center justify-center text-white text-sm font-medium"
          >
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}
        {user && (
          <button
            onClick={logout}
            aria-label="登出"
            className="w-9 h-9 flex items-center justify-center rounded-full text-[#6A6963] hover:text-[#1A1A1A] hover:bg-[#EADCC5]/50 transition-colors"
          >
            <i className="fa-solid fa-right-from-bracket" />
          </button>
        )}
      </div>
    </header>
  );
}
