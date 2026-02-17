"use client";

interface FlashcardCardProps {
  term: string;
  definition: string;
  flipped: boolean;
  onFlip: () => void;
}

export default function FlashcardCard({
  term,
  definition,
  flipped,
  onFlip,
}: FlashcardCardProps) {
  return (
    <div
      className="flip-card w-full cursor-pointer"
      style={{ minHeight: "280px" }}
      onClick={onFlip}
    >
      <div className={`flip-card-inner relative w-full h-full ${flipped ? "flipped" : ""}`} style={{ minHeight: "280px" }}>
        <div className="flip-card-front absolute inset-0 flex items-center justify-center rounded-2xl border border-[#E8DDD0] bg-white p-8 shadow-sm">
          <p className="font-[family-name:var(--font-display)] text-2xl text-center text-[#1A1A1A]">{term}</p>
        </div>
        <div className="flip-card-back absolute inset-0 flex items-center justify-center rounded-2xl border border-[#E8DDD0] bg-[#D4AF3710] p-8 shadow-sm">
          <p className="text-xl text-center text-[#1A1A1A]">{definition}</p>
        </div>
      </div>
    </div>
  );
}
