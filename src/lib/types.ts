/**
 * API types — single source of truth lives in src/server/types/api.ts
 * (derived from the Drizzle schema). This is a type-only re-export;
 * it is erased at build time so no server code reaches the client.
 */
export type {
  SpacedRepetition,
  Card,
  Deck,
  DeckSummary,
  User,
  Folder,
} from "@/server/types/api";

// ---- Test mode (frontend-only concepts) ----

export type QuestionType = "multiple-choice" | "true-false" | "written";

export interface TestQuestion {
  id: string;
  type: QuestionType;
  cardId: string;
  prompt: string;
  correctAnswer: string;
  options?: string[];
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface TestConfig {
  questionTypes: QuestionType[];
  questionCount: number;
}
