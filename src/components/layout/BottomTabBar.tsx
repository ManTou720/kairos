"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", icon: "fa-house", label: "首頁" },
  { href: "/search", icon: "fa-magnifying-glass", label: "搜尋" },
  { href: "/library", icon: "fa-book-open", label: "圖書室" },
  { href: "/folders", icon: "fa-user", label: "帳號" },
];

/**
 * Material 3 風格底部導覽列：
 * 作用中項目 = 圓角藥丸底色包住圖示 + 深色圖示與標籤；
 * 非作用中 = 無底色、灰色圖示。標籤永遠顯示。
 */
export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#E8DDD0]/70 bg-[#FBF8F1]/95 backdrop-blur"
      style={{
        // 手勢導航列留白：真機用系統安全距離，至少保留 14px 不讓內容貼底
        paddingBottom: "max(env(safe-area-inset-bottom), 14px)",
      }}
      aria-label="主要導覽"
    >
      <div className="flex h-[64px] items-stretch">
        {tabs.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 flex-col items-center justify-center gap-[3px] pt-1 transition-transform active:scale-[0.96]"
            >
              {/* M3 藥丸指示器：作用中才浮現 */}
              <span
                className={`flex h-8 w-16 items-center justify-center rounded-full transition-colors duration-200 ${
                  active ? "bg-[#0D2275]/[0.08]" : "bg-transparent"
                }`}
              >
                <i
                  className={`fa-solid ${tab.icon} text-lg transition-colors duration-200 ${
                    active ? "text-[#0D2275]" : "text-[#6A6963]"
                  }`}
                />
              </span>
              <span
                className={`text-[11px] leading-none transition-colors duration-200 ${
                  active
                    ? "font-semibold text-[#0D2275]"
                    : "font-medium text-[#6A6963]"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
