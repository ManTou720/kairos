"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface NavBarProps {
  onMenuToggle?: () => void;
}

export default function NavBar({ onMenuToggle }: NavBarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#E8DDD0] bg-white h-14 px-4 lg:px-8">
      <button
        onClick={onMenuToggle}
        className="lg:hidden text-[#1A1A1A] p-2 -ml-2 hover:bg-[#EADCC5]/50 rounded-lg transition-colors"
      >
        <i className="fa-solid fa-bars text-lg" />
      </button>

      <Link
        href="/search"
        className="flex items-center gap-2 rounded-lg border border-[#D5C8B2] bg-[#EADCC5]/30 px-3 py-1.5 text-sm text-[#6A6963] hover:border-[#D4AF37] transition-colors flex-1 max-w-md mx-4"
      >
        <i className="fa-solid fa-magnifying-glass text-xs" />
        <span>搜尋學習集...</span>
      </Link>

      <div className="flex items-center gap-3">
        <Link
          href="/decks/new"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#D4AF37] text-[#1A1A1A] hover:bg-[#C9A02E] transition-colors"
        >
          <i className="fa-solid fa-plus text-sm" />
        </Link>
        {user && (
          <>
            <div className="w-8 h-8 rounded-full bg-[#0D2275] flex items-center justify-center text-white text-xs font-medium">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={logout}
              className="text-sm text-[#6A6963] hover:text-[#1A1A1A] transition-colors hidden sm:inline"
            >
              <i className="fa-solid fa-right-from-bracket" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
