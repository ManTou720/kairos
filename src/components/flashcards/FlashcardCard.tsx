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
        <div className="flip-card-front absolute inset-0 flex items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-xl font-semibold text-center">{term}</p>
        </div>
        <div className="flip-card-back absolute inset-0 flex items-center justify-center rounded-2xl border border-gray-200 bg-indigo-50 p-8 shadow-sm">
          <p className="text-xl text-center text-gray-700">{definition}</p>
        </div>
      </div>
    </div>
  );
}
