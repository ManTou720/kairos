"use client";

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
}

export default function ProgressBar({ value, max, className }: ProgressBarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className ?? ""}`}>
      <div
        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
