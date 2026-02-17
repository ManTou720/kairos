"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFolders } from "@/hooks/useDecks";

interface NavItemProps {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}

function NavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
        active
          ? "bg-[#1A2D8A] text-[#EADCC5] font-medium"
          : "text-[#EADCC5]/70 hover:bg-[#1A2D8A]/50 hover:text-[#EADCC5]"
      }`}
    >
      <i className={`fa-solid fa-${icon} w-5 text-center`} />
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: folders } = useFolders();

  return (
    <aside className="hidden lg:flex flex-col w-[250px] shrink-0 bg-[#0D2275] h-screen sticky top-0">
      <div className="p-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#D4AF37] tracking-tight"
        >
          Kairos
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        <NavItem
          href="/"
          icon="house"
          label="Home"
          active={pathname === "/"}
        />
        <NavItem
          href="/library"
          icon="folder-open"
          label="Your Library"
          active={pathname === "/library"}
        />

        <div className="my-3 h-px bg-[#1A2D8A]" />

        <p className="px-3 py-2 text-xs font-semibold text-[#EADCC5]/50 uppercase tracking-wider">
          Your Folders
        </p>

        {folders?.map((folder) => (
          <NavItem
            key={folder.id}
            href={`/folders/${folder.id}`}
            icon="folder"
            label={folder.name}
            active={pathname === `/folders/${folder.id}`}
          />
        ))}

        <Link
          href="/folders?create=1"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#EADCC5]/70 hover:bg-[#1A2D8A]/50 hover:text-[#EADCC5] transition-colors"
        >
          <i className="fa-solid fa-folder-plus w-5 text-center" />
          <span>New Folder</span>
        </Link>
      </nav>
    </aside>
  );
}
