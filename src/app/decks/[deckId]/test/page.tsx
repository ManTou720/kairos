"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useDeck } from "@/hooks/useStore";
import { generateTest, gradeWritten } from "@/lib/test-generator";
import { MIN_CARDS_FOR_TEST } from "@/lib/constants";
import { TestQuestion, TestConfig, QuestionType } from "@/lib/types";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";

type Phase = "config" | "testing" | "results";

export default function TestPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = use(params);
  const deck = useDeck(deckId);
  const [phase, setPhase] = useState<Phase>("config");
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [gradedQuestions, setGradedQuestions] = useState<TestQuestion[]>([]);

  // Config state
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    "multiple-choice",
    "true-false",
    "written",
  ]);
  const [questionCount, setQuestionCount] = useState(10);

  if (!deck) {
    return <div className="text-center py-12 text-gray-400">Loading...</div>;
  }

  if (deck.cards.length < MIN_CARDS_FOR_TEST) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">
          Need at least {MIN_CARDS_FOR_TEST} cards to use Test mode.
        </p>
        <Link href={`/decks/${deckId}`}>
          <Button variant="secondary">Back to deck</Button>
        </Link>
      </div>
    );
  }

  function startTest() {
    if (selectedTypes.length === 0) return;
    const config: TestConfig = {
      questionTypes: selectedTypes,
      questionCount: Math.min(questionCount, deck!.cards.length),
    };
    const q = generateTest(deck!.cards, config);
    setQuestions(q);
    setCurrent(0);
    setAnswers({});
    setPhase("testing");
  }

  function selectAnswer(questionId: string, answer: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }

  function submitTest() {
    const graded = questions.map((q) => {
      const userAnswer = answers[q.id] ?? "";
      const isCorrect =
        q.type === "written"
          ? gradeWritten(userAnswer, q.correctAnswer)
          : userAnswer === q.correctAnswer;
      return { ...q, userAnswer, isCorrect };
    });
    setGradedQuestions(graded);
    setPhase("results");
  }

  function toggleType(type: QuestionType) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  // CONFIG PHASE
  if (phase === "config") {
    const types: { type: QuestionType; label: string }[] = [
      { type: "multiple-choice", label: "Multiple Choice" },
      { type: "true-false", label: "True / False" },
      { type: "written", label: "Written" },
    ];

    return (
      <div>
        <Link
          href={`/decks/${deckId}`}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold mb-6">Test Configuration</h1>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Question types
            </h3>
            <div className="flex flex-wrap gap-2">
              {types.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                    selectedTypes.includes(type)
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Number of questions
            </h3>
            <input
              type="range"
              min={1}
              max={deck.cards.length}
              value={Math.min(questionCount, deck.cards.length)}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-sm text-gray-400 mt-1">
              {Math.min(questionCount, deck.cards.length)} of {deck.cards.length}{" "}
              cards
            </p>
          </div>

          <Button
            onClick={startTest}
            disabled={selectedTypes.length === 0}
            size="lg"
          >
            Start Test
          </Button>
        </div>
      </div>
    );
  }

  // TESTING PHASE
  if (phase === "testing") {
    const q = questions[current];
    const answered = Object.keys(answers).length;

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-400">
            Question {current + 1} / {questions.length}
          </span>
          <span className="text-sm text-gray-400">
            {answered} answered
          </span>
        </div>

        <ProgressBar value={current + 1} max={questions.length} className="mb-6" />

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
            {q.type.replace("-", " ")}
          </p>
          <p className="text-lg font-semibold">{q.prompt}</p>
        </div>

        {q.type === "written" ? (
          <input
            type="text"
            placeholder="Type your answer..."
            value={answers[q.id] ?? ""}
            onChange={(e) => selectAnswer(q.id, e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        ) : (
          <div className="space-y-2">
            {q.options!.map((option) => (
              <button
                key={option}
                onClick={() => selectAnswer(q.id, option)}
                className={`w-full text-left rounded-lg border p-4 text-sm transition-colors ${
                  answers[q.id] === option
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button
            variant="secondary"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
          >
            Previous
          </Button>
          <div className="flex gap-2">
            {current < questions.length - 1 ? (
              <Button onClick={() => setCurrent((c) => c + 1)}>Next</Button>
            ) : (
              <Button
                onClick={submitTest}
                disabled={answered < questions.length}
              >
                Submit Test
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // RESULTS PHASE
  const correct = gradedQuestions.filter((q) => q.isCorrect).length;
  const pct = Math.round((correct / gradedQuestions.length) * 100);

  return (
    <div>
      <div className="text-center py-8 mb-6">
        <div className="text-5xl mb-4">{pct >= 70 ? "🎉" : "📖"}</div>
        <h2 className="text-2xl font-bold mb-2">Test Complete!</h2>
        <p className="text-lg text-gray-600">
          {correct} / {gradedQuestions.length} correct ({pct}%)
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {gradedQuestions.map((q, i) => (
          <div
            key={q.id}
            className={`rounded-lg border p-4 ${
              q.isCorrect
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  Q{i + 1} · {q.type.replace("-", " ")}
                </p>
                <p className="font-medium text-sm mt-1">{q.prompt}</p>
              </div>
              <span className="text-lg">{q.isCorrect ? "✓" : "✗"}</span>
            </div>
            {!q.isCorrect && (
              <div className="mt-2 text-sm">
                <p className="text-red-600">Your answer: {q.userAnswer || "(empty)"}</p>
                <p className="text-green-700">Correct: {q.correctAnswer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-center">
        <Button
          onClick={() => {
            setPhase("config");
            setQuestions([]);
            setAnswers({});
            setGradedQuestions([]);
          }}
        >
          Take another test
        </Button>
        <Link href={`/decks/${deckId}`}>
          <Button variant="secondary">Back to deck</Button>
        </Link>
      </div>
    </div>
  );
}
