"use client";

import { use } from "react";
import Link from "next/link";
import { useDeck } from "@/hooks/useDecks";
import { useTestSession } from "@/features/test/useTestSession";
import { MIN_CARDS_FOR_TEST } from "@/lib/constants";
import { QuestionType } from "@/lib/types";
import Button from "@/components/ui/Button";

const TYPE_LABELS: Record<QuestionType, string> = {
  "multiple-choice": "選擇題",
  "true-false": "是非題",
  written: "填空題",
};

export default function TestPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = use(params);
  const { data: deck } = useDeck(deckId);
  const session = useTestSession(deck);

  if (!deck) {
    return <div className="text-center py-12 text-[#9A9A94]">載入中...</div>;
  }

  if (deck.cards.length < MIN_CARDS_FOR_TEST) {
    return (
      <div className="text-center py-16">
        <p className="text-[#6A6963] mb-4">
          測試模式至少需要 {MIN_CARDS_FOR_TEST} 張卡片。
        </p>
        <Link href={`/decks/${deckId}`}>
          <Button variant="secondary">返回學習集</Button>
        </Link>
      </div>
    );
  }

  const {
    phase,
    questions,
    gradedQuestions,
    selectedTypes,
    questionCount,
    answers,
    answeredCount: answered,
  } = session;

  // CONFIG PHASE
  if (phase === "config") {
    const types: { type: QuestionType; label: string }[] = [
      { type: "multiple-choice", label: "選擇題" },
      { type: "true-false", label: "是非題" },
      { type: "written", label: "填空題" },
    ];

    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <Link
          href={`/decks/${deckId}`}
          className="text-sm text-[#6A6963] hover:text-[#1A1A1A] mb-4 inline-block"
        >
          <i className="fa-solid fa-xmark mr-2" /> 返回
        </Link>
        <h1 className="font-display text-2xl font-bold text-[#1A1A1A] mb-6">
          測試設定
        </h1>

        <div className="rounded-xl border border-[#E8DDD0] bg-white p-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-[#1A1A1A] mb-3">
              題目類型
            </h3>
            <div className="flex flex-wrap gap-2">
              {types.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => session.toggleType(type)}
                  className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                    selectedTypes.includes(type)
                      ? "border-[#D4AF37] bg-[#D4AF3720] text-[#1A1A1A] font-medium"
                      : "border-[#E8DDD0] text-[#6A6963] hover:border-[#D5C8B2]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[#1A1A1A] mb-2">
              題目數量
            </h3>
            <input
              type="range"
              min={1}
              max={deck.cards.length}
              value={Math.min(questionCount, deck.cards.length)}
              onChange={(e) => session.setQuestionCount(Number(e.target.value))}
              className="w-full accent-[#D4AF37]"
            />
            <p className="text-sm text-[#9A9A94] mt-1">
              {Math.min(questionCount, deck.cards.length)} / {deck.cards.length} 張卡片
            </p>
          </div>

          <Button
            onClick={session.startTest}
            disabled={selectedTypes.length === 0}
            size="lg"
          >
            開始測試
          </Button>
        </div>
      </div>
    );
  }

  // TESTING PHASE — single-page scrollable with all questions
  if (phase === "testing") {
    return (
      <div className="flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between h-14 px-4 lg:px-6 bg-white border-b border-[#E8DDD0] shrink-0">
          <div className="flex items-center gap-3">
            <Link
              href={`/decks/${deckId}`}
              className="text-[#6A6963] hover:text-[#1A1A1A] transition-colors"
            >
              <i className="fa-solid fa-xmark text-lg" />
            </Link>
            <span className="font-semibold text-[#1A1A1A]">
              測試模式 — {deck.title}
            </span>
          </div>
          <Button
            onClick={session.submitTest}
            disabled={answered < questions.length}
            size="sm"
          >
            提交測試
          </Button>
        </div>

        {/* Scrollable question list */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[700px] mx-auto px-4 lg:px-0 py-8 lg:py-10 space-y-8">
            {questions.map((q, i) => (
              <div
                key={q.id}
                className="rounded-xl border border-[#D5C8B2] bg-white p-5 lg:p-7 space-y-4"
              >
                {/* Question number + type */}
                <span className="text-xs font-semibold text-[#D4AF37]">
                  {i + 1}. {TYPE_LABELS[q.type]}
                </span>

                {/* Prompt */}
                <p className="text-lg font-medium text-[#1A1A1A]">
                  {q.prompt}
                </p>

                {/* Answer area */}
                {q.type === "written" ? (
                  <input
                    type="text"
                    placeholder="在此輸入答案..."
                    value={answers[q.id] ?? ""}
                    onChange={(e) => session.selectAnswer(q.id, e.target.value)}
                    className="w-full rounded-lg border border-[#D5C8B2] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[#9A9A94] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                ) : q.type === "true-false" ? (
                  <div className="flex gap-3">
                    {q.options!.map((option) => (
                      <button
                        key={option}
                        onClick={() => session.selectAnswer(q.id, option)}
                        className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                          answers[q.id] === option
                            ? "border-[#D4AF37] bg-[#D4AF3720] text-[#1A1A1A]"
                            : "border-[#D5C8B2] bg-white text-[#1A1A1A] hover:border-[#D4AF37]"
                        }`}
                      >
                        {option === "True" ? "正確" : "錯誤"}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {q.options!.map((option) => (
                      <button
                        key={option}
                        onClick={() => session.selectAnswer(q.id, option)}
                        className={`w-full flex items-center gap-2.5 rounded-full border px-4 h-11 text-sm transition-colors ${
                          answers[q.id] === option
                            ? "border-[#D4AF37] bg-[#D4AF3715] text-[#1A1A1A] font-medium border-2"
                            : "border-[#D5C8B2] bg-white text-[#1A1A1A] hover:border-[#D4AF37]"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                            answers[q.id] === option
                              ? "border-[#D4AF37] bg-[#D4AF37]"
                              : "border-[#D5C8B2]"
                          }`}
                        >
                          {answers[q.id] === option && (
                            <div className="w-full h-full rounded-full bg-[#D4AF37] flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                        {option}
                      </button>
                    ))}
                    <button className="text-sm font-medium text-[#D4AF37] hover:underline mt-1">
                      不知道嗎？
                    </button>
                  </div>
                )}

                {/* Counter */}
                <p className="text-xs font-mono text-[#8B7355]">
                  {i + 1} / {questions.length}
                </p>
              </div>
            ))}

            {/* Submit button at bottom */}
            <div className="text-center pt-4 pb-8">
              <Button
                onClick={session.submitTest}
                disabled={answered < questions.length}
                size="lg"
              >
                提交測試
              </Button>
              <p className="text-sm text-[#9A9A94] mt-2">
                已回答 {answered} / {questions.length} 題
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RESULTS
  const correct = gradedQuestions.filter((q) => q.isCorrect).length;
  const pct = Math.round((correct / gradedQuestions.length) * 100);

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="text-center py-8 mb-6">
        <h2 className="font-display text-3xl font-bold text-[#1A1A1A] mb-2">
          測試完成！
        </h2>
        <p className="text-lg text-[#6A6963]">
          {correct} / {gradedQuestions.length} 正確（{pct}%）
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {gradedQuestions.map((q, i) => (
          <div
            key={q.id}
            className={`rounded-xl border p-4 ${
              q.isCorrect
                ? "border-[#2D6A4F] bg-[#2D6A4F10]"
                : "border-[#8B0000] bg-[#8B000010]"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-[#9A9A94]">
                  第 {i + 1} 題 &middot; {TYPE_LABELS[q.type]}
                </p>
                <p className="font-medium text-sm text-[#1A1A1A] mt-1">
                  {q.prompt}
                </p>
              </div>
              <span className="text-lg">
                {q.isCorrect ? "\u2713" : "\u2717"}
              </span>
            </div>
            {!q.isCorrect && (
              <div className="mt-2 text-sm">
                <p className="text-[#8B0000]">
                  你的答案：{q.userAnswer || "（未作答）"}
                </p>
                <p className="text-[#2D6A4F]">正確答案：{q.correctAnswer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-center">
        <Button onClick={session.restart}>再測一次</Button>
        <Link href={`/decks/${deckId}`}>
          <Button variant="secondary">返回學習集</Button>
        </Link>
      </div>
    </div>
  );
}
