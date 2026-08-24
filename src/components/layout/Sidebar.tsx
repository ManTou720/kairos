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
      className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors ${
        active
          ? "bg-[#1A2D8A] text-[#D4AF37] font-semibold"
          : "text-[#EADCC5]/70 hover:bg-[#1A2D8A]/50 hover:text-[#EADCC5]"
      }`}
    >
      <i className={`fa-solid fa-${icon} w-5 text-center`} />
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { data: folders } = useFolders();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 flex flex-col w-[250px] bg-[#0D2275] h-screen transition-transform duration-300 lg:sticky lg:translate-x-0 lg:z-auto ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:flex`}
      >
        <div className="p-6 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="Kairos" className="w-8 h-8 rounded-xl" />
          <Link
            href="/"
            onClick={onClose}
            className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#EADCC5] tracking-tight"
          >
            Kairos
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <NavItem
            href="/"
            icon="house"
            label="首頁"
            active={pathname === "/"}
          />
          <NavItem
            href="/library"
            icon="book-open"
            label="你的圖書室"
            active={pathname === "/library"}
          />

          <div className="my-3 h-px bg-[#1A2D8A]" />

          <p className="px-4 py-2 text-[11px] font-semibold text-[#9A9A94] uppercase tracking-wider">
            你的文件夾
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
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#EADCC5]/70 hover:bg-[#1A2D8A]/50 hover:text-[#EADCC5] transition-colors"
          >
            <i className="fa-solid fa-folder-plus w-5 text-center" />
            <span>新文件夾</span>
          </Link>
        </nav>
      </aside>
    </>
  );
}
