"use client";

import { useEffect, useRef, useState } from "react";

export interface MenuItem {
  icon?: string;
  label: string;
  danger?: boolean;
  onClick: () => void;
}

interface MoreMenuProps {
  items: MenuItem[];
  label?: string;
}

/**
 * Ellipsis icon button that opens a dropdown menu
 * (design spec: white panel, border #E8DDD0, r12, pad 8,
 * items = icon 18 + Inter 14 label, destructive item in #8B0000).
 */
export default function MoreMenu({ items, label }: MoreMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={label ?? "更多選項"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 flex items-center justify-center rounded-full text-[#6A6963] hover:bg-[#EADCC5]/50 hover:text-[#1A1A1A] transition-colors"
      >
        <i className="fa-solid fa-ellipsis" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-30 w-[200px] rounded-xl border border-[#E8DDD0] bg-white py-2 shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-[#EADCC5]/40 ${
                item.danger ? "text-[#8B0000]" : "text-[#1A1A1A]"
              }`}
            >
              {item.icon && (
                <i
                  className={`fa-solid ${item.icon} w-[18px] text-center ${
                    item.danger ? "text-[#8B0000]" : "text-[#6A6963]"
                  }`}
                />
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
