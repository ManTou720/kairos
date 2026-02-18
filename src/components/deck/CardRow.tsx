"use client";

import { useState } from "react";

interface CardRowProps {
  index: number;
  term: string;
  definition: string;
  termLang: string;
  defLang: string;
  onChange: (field: "term" | "definition", value: string) => void;
  onChangeLang: (field: "termLang" | "defLang", value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  dragging?: boolean;
}

const LANGUAGES = [
  { code: "auto", label: "自動偵測" },
  { code: "zh-TW", label: "中文（繁體）" },
  { code: "zh-CN", label: "中文（簡體）" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
];

export default function CardRow({
  index,
  term,
  definition,
  termLang,
  defLang,
  onChange,
  onChangeLang,
  onRemove,
  canRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
  dragging,
}: CardRowProps) {
  const [canDrag, setCanDrag] = useState(false);

  return (
    <div
      draggable={canDrag}
      className={`rounded-xl border bg-white p-5 space-y-4 transition-all ${
        dragging ? "opacity-40 scale-[0.98]" : ""
      } border-[#D5C8B2]`}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragOver={onDragOver}
      onDragEnd={() => {
        setCanDrag(false);
        onDragEnd();
      }}
    >
      {/* Top bar: number + mic on left, drag + trash on right */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-[15px] font-bold text-[#1A1A1A]">{index + 1}</span>
          <button type="button" className="text-[#9A9A94] hover:text-[#1A1A1A] transition-colors" title="錄音">
            <i className="fa-solid fa-microphone text-sm" />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div
            className="text-[#9A9A94] hover:text-[#1A1A1A] transition-colors cursor-grab active:cursor-grabbing select-none"
            title="拖動排序"
            onMouseDown={() => setCanDrag(true)}
            onMouseUp={() => setCanDrag(false)}
          >
            <i className="fa-solid fa-grip text-lg" />
          </div>
          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove}
            className="text-[#9A9A94] hover:text-[#8B0000] disabled:opacity-30 disabled:hover:text-[#9A9A94] transition-colors"
            title="刪除卡片"
          >
            <i className="fa-solid fa-trash text-sm" />
          </button>
        </div>
      </div>

      {/* Content: term + definition (side by side on desktop, stacked on mobile) */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Term column */}
        <div className="flex-1 space-y-1">
          <input
            type="text"
            value={term}
            onChange={(e) => onChange("term", e.target.value)}
            className="w-full rounded bg-[#F6F4F0] px-2 h-11 text-sm text-[#1A1A1A] placeholder:text-[#9A9A94] border-none focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            placeholder="輸入詞語..."
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#6A6963]">詞語</span>
            <LanguageSelect value={termLang} onChange={(v) => onChangeLang("termLang", v)} />
          </div>
        </div>

        {/* Definition column */}
        <div className="flex-1 space-y-1">
          <input
            type="text"
            value={definition}
            onChange={(e) => onChange("definition", e.target.value)}
            className="w-full rounded bg-[#F6F4F0] px-2 h-11 text-sm text-[#1A1A1A] placeholder:text-[#9A9A94] border-none focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            placeholder="輸入定義..."
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#6A6963]">定義</span>
            <LanguageSelect value={defLang} onChange={(v) => onChangeLang("defLang", v)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function LanguageSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent text-[11px] font-bold text-[#D4AF37] cursor-pointer focus:outline-none pr-3"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
      <i className="fa-solid fa-chevron-down text-[8px] text-[#D4AF37] absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}
