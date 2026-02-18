"use client";

import Input from "@/components/ui/Input";

interface CardRowProps {
  index: number;
  term: string;
  definition: string;
  onChange: (field: "term" | "definition", value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export default function CardRow({
  index,
  term,
  definition,
  onChange,
  onRemove,
  canRemove,
}: CardRowProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-[#E8DDD0] bg-white p-4">
      <span className="mt-2 text-sm font-medium text-[#9A9A94] w-6 text-right shrink-0">
        {index + 1}
      </span>
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          placeholder="詞語"
          value={term}
          onChange={(e) => onChange("term", e.target.value)}
        />
        <Input
          placeholder="定義"
          value={definition}
          onChange={(e) => onChange("definition", e.target.value)}
        />
      </div>
      <div className="flex items-center gap-1 mt-2">
        <button
          type="button"
          className="text-[#9A9A94] hover:text-[#1A1A1A] transition-colors"
          title="發音"
        >
          <i className="fa-solid fa-volume-high text-sm" />
        </button>
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
  );
}
