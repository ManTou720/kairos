"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", icon: "house", label: "Home" },
  { href: "/search", icon: "magnifying-glass", label: "Search" },
  { href: "/decks/new", icon: "plus", label: "Create" },
  { href: "/library", icon: "folder-open", label: "Library" },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-[#E8DDD0] bg-white h-14">
      {tabs.map((tab) => {
        const active = tab.href === "/"
          ? pathname === "/"
          : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
              active ? "text-[#0D2275] font-medium" : "text-[#6A6963]"
            }`}
          >
            <i className={`fa-solid fa-${tab.icon} text-base`} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
