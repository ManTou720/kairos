"use client";

import { useState, useCallback } from "react";
import { generateTest } from "@/lib/test-generator";
import { gradeTest } from "./grading";
import type { Deck, QuestionType, TestConfig, TestQuestion } from "@/lib/types";

export type TestPhase = "config" | "testing" | "results";

const ALL_TYPES: QuestionType[] = [
  "multiple-choice",
  "true-false",
  "written",
];

/**
 * Test-mode session state machine: config → testing → results.
 */
export function useTestSession(deck: Deck | undefined) {
  const [phase, setPhase] = useState<TestPhase>("config");
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [gradedQuestions, setGradedQuestions] = useState<TestQuestion[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(ALL_TYPES);
  const [questionCount, setQuestionCount] = useState(10);

  const startTest = useCallback(() => {
    if (!deck || selectedTypes.length === 0) return;
    const config: TestConfig = {
      questionTypes: selectedTypes,
      questionCount: Math.min(questionCount, deck.cards.length),
    };
    setQuestions(generateTest(deck.cards, config));
    setAnswers({});
    setPhase("testing");
  }, [deck, selectedTypes, questionCount]);

  const selectAnswer = useCallback((questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  const submitTest = useCallback(() => {
    setGradedQuestions(gradeTest(questions, answers));
    setPhase("results");
  }, [questions, answers]);

  const toggleType = useCallback((type: QuestionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  const restart = useCallback(() => {
    setPhase("config");
    setQuestions([]);
    setAnswers({});
    setGradedQuestions([]);
  }, []);

  return {
    phase,
    questions,
    gradedQuestions,
    selectedTypes,
    questionCount,
    answers,
    answeredCount: Object.keys(answers).length,
    setQuestionCount,
    startTest,
    selectAnswer,
    submitTest,
    toggleType,
    restart,
  };
}
