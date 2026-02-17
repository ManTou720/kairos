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
          placeholder="Term"
          value={term}
          onChange={(e) => onChange("term", e.target.value)}
        />
        <Input
          placeholder="Definition"
          value={definition}
          onChange={(e) => onChange("definition", e.target.value)}
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className="mt-2 text-[#9A9A94] hover:text-[#8B0000] disabled:opacity-30 disabled:hover:text-[#9A9A94] transition-colors"
        title="Remove card"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
