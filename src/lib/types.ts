export interface SpacedRepetition {
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReview: number;
  lastReview: number | null;
}

export interface Card {
  id: string;
  term: string;
  definition: string;
  sr: SpacedRepetition;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  cards: Card[];
  createdAt: number;
  updatedAt: number;
}

export interface KairosStore {
  version: 1;
  decks: Deck[];
}

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
