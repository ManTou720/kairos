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
  folderId?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface DeckSummary {
  id: string;
  title: string;
  description: string;
  folderId: string | null;
  cardCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface User {
  id: string;
  username: string;
}

export interface Folder {
  id: string;
  name: string;
  deckCount: number;
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
