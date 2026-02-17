"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function NavBar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#E8DDD0] bg-white h-14 px-4 lg:px-8">
      <Link
        href="/search"
        className="flex items-center gap-2 rounded-lg border border-[#D5C8B2] bg-[#EADCC5]/30 px-3 py-1.5 text-sm text-[#6A6963] hover:border-[#D4AF37] transition-colors flex-1 max-w-md"
      >
        <i className="fa-solid fa-magnifying-glass text-xs" />
        <span>Search sets...</span>
      </Link>

      <div className="flex items-center gap-3 ml-4">
        {user && (
          <>
            <span className="text-sm text-[#6A6963] hidden sm:inline">
              {user.username}
            </span>
            <button
              onClick={logout}
              className="text-sm text-[#6A6963] hover:text-[#1A1A1A] transition-colors"
            >
              <i className="fa-solid fa-right-from-bracket" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
