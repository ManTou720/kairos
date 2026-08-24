"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useDeck } from "@/hooks/useDecks";
import { useTestSession } from "@/features/test/useTestSession";
import { MIN_CARDS_FOR_TEST } from "@/lib/constants";
import { QuestionType } from "@/lib/types";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

const TYPE_LABELS: Record<QuestionType, string> = {
  "multiple-choice": "選擇題",
  "true-false": "是非題",
  written: "填空題",
};

const TYPE_ICONS: Record<QuestionType, string> = {
  "multiple-choice": "fa-list-check",
  "true-false": "fa-code-compare",
  written: "fa-pen",
};

export default function TestPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = use(params);
  const { data: deck } = useDeck(deckId);
  const session = useTestSession(deck);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  if (!deck) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#9A9A94]">
        <i className="fa-solid fa-spinner fa-spin mr-2" />
        載入中...
      </div>
    );
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

  /* ---------- CONFIG PHASE ---------- */
  if (phase === "config") {
    const types: { type: QuestionType; label: string; desc: string }[] = [
      { type: "multiple-choice", label: "選擇題", desc: "從四個選項中選出答案" },
      { type: "true-false", label: "是非題", desc: "判斷配對是否正確" },
      { type: "written", label: "填空題", desc: "親手輸入答案，最挑戰" },
    ];
    const count = Math.min(questionCount, deck.cards.length);

    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto animate-fade-in">
        <Link
          href={`/decks/${deckId}`}
          className="text-sm text-[#6A6963] hover:text-[#1A1A1A] mb-4 inline-block"
        >
          <i className="fa-solid fa-xmark mr-2" /> 返回
        </Link>
        <h1 className="font-display text-3xl font-bold text-[#1A1A1A] mb-6">
          測試設定
        </h1>

        <div className="rounded-2xl border border-[#E8DDD0] bg-white p-6 lg:p-7 space-y-7 shadow-sm">
          {/* 題目類型 */}
          <div>
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">題目類型</h3>
            <div className="grid sm:grid-cols-3 gap-2.5">
              {types.map(({ type, label, desc }) => {
                const active = selectedTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => session.toggleType(type)}
                    aria-pressed={active}
                    className={`text-left rounded-xl border px-4 py-3.5 transition-all active:scale-[0.98] ${
                      active
                        ? "border-[#D4AF37] bg-[#D4AF3715]"
                        : "border-[#E8DDD0] bg-white hover:border-[#D5C8B2]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1">
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: active ? "#D4AF3725" : "#F0EBDF" }}
                      >
                        <i
                          className={`fa-solid ${TYPE_ICONS[type]} text-xs ${
                            active ? "text-[#B8912C]" : "text-[#9A9A94]"
                          }`}
                        />
                      </span>
                      <span
                        className={`text-sm ${
                          active
                            ? "font-semibold text-[#1A1A1A]"
                            : "text-[#6A6963]"
                        }`}
                      >
                        {label}
                      </span>
                      <span className="ml-auto w-4 h-4 rounded-full border flex items-center justify-center shrink-0"
                        style={{
                          borderColor: active ? "#D4AF37" : "#D5C8B2",
                          background: active ? "#D4AF37" : "transparent",
                        }}
                      >
                        {active && (
                          <i className="fa-solid fa-check text-[9px] text-white" />
                        )}
                      </span>
                    </div>
                    <p className="text-[11px] leading-snug text-[#9A9A94]">{desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 題目數量 */}
          <div>
            <div className="flex items-end justify-between mb-2">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">題目數量</h3>
              <span className="font-display font-bold text-3xl text-[#D4AF37] tabular-nums leading-none">
                {count}
                <span className="text-sm font-medium text-[#6A6963] ml-1">
                  / {deck.cards.length} 題
                </span>
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={deck.cards.length}
              value={count}
              onChange={(e) => session.setQuestionCount(Number(e.target.value))}
              className="w-full accent-[#D4AF37]"
            />
          </div>

          {/* 開始 */}
          <button
            onClick={session.startTest}
            disabled={selectedTypes.length === 0}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] text-[#1A1A1A] font-semibold px-6 py-3.5 text-sm hover:bg-[#C9A02E] active:scale-[0.99] transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            <i className="fa-solid fa-play text-xs" />
            開始測試
          </button>
        </div>
      </div>
    );
  }

  /* ---------- TESTING PHASE ---------- */
  if (phase === "testing") {
    const progressPercent =
      questions.length > 0 ? Math.round((answered / questions.length) * 100) : 0;

    return (
      <div className="flex flex-col h-full animate-fade-in">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-[#FBF7EF]/95 backdrop-blur border-b border-[#E8DDD0] shrink-0">
          <div className="flex items-center justify-between h-14 px-4 lg:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href={`/decks/${deckId}`}
                aria-label="離開測試"
                className="w-9 h-9 -ml-2 rounded-full flex items-center justify-center text-[#6A6963] hover:bg-[#EADCC5]/50 hover:text-[#1A1A1A] transition-colors shrink-0"
              >
                <i className="fa-solid fa-xmark text-lg" />
              </Link>
              <span className="font-semibold text-sm text-[#1A1A1A] truncate" title={deck.title}>
                測試 — {deck.title}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs text-[#6A6963] tabular-nums">
                已回答 {answered} / {questions.length}
              </span>
              <button
                onClick={() =>
                  answered >= questions.length
                    ? session.submitTest()
                    : setConfirmSubmit(true)
                }
                className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] text-[#1A1A1A] font-semibold px-5 py-2 text-sm hover:bg-[#C9A02E] active:scale-[0.97] transition-all"
              >
                <i className="fa-solid fa-paper-plane text-xs" />
                提交測試
              </button>
            </div>
          </div>
          <div className="h-1 bg-[#E8DDD0]">
            <div
              className="h-full bg-[#D4AF37] transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Scrollable question list */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[700px] mx-auto px-4 lg:px-0 py-8 lg:py-10 space-y-5 pb-24">
            {questions.map((q, i) => {
              const isAnswered =
                answers[q.id] !== undefined && answers[q.id] !== "";
              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-[#E8DDD0] bg-white p-5 lg:p-7 space-y-4 shadow-sm"
                >
                  {/* Number badge + type chip */}
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-[#D4AF3715] text-[#B8912C] text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-[#9A9A94]">
                      {TYPE_LABELS[q.type]}
                    </span>
                    {isAnswered && (
                      <span className="ml-auto text-[11px] text-[#2BAC6E]">
                        <i className="fa-solid fa-check mr-1" />已回答
                      </span>
                    )}
                  </div>

                  {/* Prompt */}
                  <p className="text-lg font-semibold text-[#1A1A1A] leading-snug">
                    {q.prompt}
                  </p>

                  {/* Answer area */}
                  {q.type === "written" ? (
                    <input
                      type="text"
                      placeholder="在此輸入答案..."
                      value={answers[q.id] ?? ""}
                      onChange={(e) => session.selectAnswer(q.id, e.target.value)}
                      className="w-full rounded-xl border border-[#D5C8B2] bg-white px-4 py-3.5 text-sm text-[#1A1A1A] placeholder:text-[#9A9A94] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                    />
                  ) : q.type === "true-false" ? (
                    <div className="flex gap-3">
                      {q.options!.map((option) => {
                        const active = answers[q.id] === option;
                        return (
                          <button
                            key={option}
                            onClick={() => session.selectAnswer(q.id, option)}
                            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl border py-3.5 text-sm transition-all active:scale-[0.98] ${
                              active
                                ? "border-[#D4AF37] bg-[#D4AF3715] text-[#1A1A1A] font-semibold"
                                : "border-[#D5C8B2] bg-white text-[#1A1A1A] hover:border-[#D4AF37] hover:-translate-y-0.5"
                            }`}
                          >
                            <i
                              className={`fa-solid text-xs ${
                                option === "True"
                                  ? "fa-circle-check"
                                  : "fa-circle-xmark"
                              } ${active ? "text-[#B8912C]" : "text-[#9A9A94]"}`}
                            />
                            {option === "True" ? "正確" : "錯誤"}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {q.options!.map((option) => {
                        const active = answers[q.id] === option;
                        return (
                          <button
                            key={option}
                            onClick={() => session.selectAnswer(q.id, option)}
                            className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all active:scale-[0.99] ${
                              active
                                ? "border-[#D4AF37] bg-[#D4AF3715] text-[#1A1A1A] font-semibold"
                                : "border-[#D5C8B2] bg-white text-[#1A1A1A] hover:border-[#D4AF37] hover:-translate-y-0.5"
                            }`}
                          >
                            <span
                              className="w-[18px] h-[18px] rounded-full border-2 shrink-0 flex items-center justify-center"
                              style={{
                                borderColor: active ? "#D4AF37" : "#D5C8B2",
                              }}
                            >
                              {active && (
                                <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                              )}
                            </span>
                            <span className="leading-snug">{option}</span>
                          </button>
                        );
                      })}
                      <button
                        onClick={() => session.selectAnswer(q.id, "")}
                        className="text-sm font-medium text-[#B8912C] hover:text-[#D4AF37] hover:underline mt-1"
                      >
                        不知道嗎？
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bottom submit */}
            <div className="text-center pt-2 pb-4">
              <button
                onClick={() =>
                  answered >= questions.length
                    ? session.submitTest()
                    : setConfirmSubmit(true)
                }
                className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] text-[#1A1A1A] font-semibold px-8 py-3.5 text-sm hover:bg-[#C9A02E] active:scale-[0.98] transition-all"
              >
                <i className="fa-solid fa-paper-plane text-xs" />
                提交測試
              </button>
              <p className="text-xs text-[#9A9A94] mt-3">
                已回答 {answered} / {questions.length} 題
                {answered < questions.length &&
                  ` · 尚有 ${questions.length - answered} 題未作答`}
              </p>
            </div>
          </div>
        </div>

        {/* 未答完確認 Modal */}
        <Modal open={confirmSubmit} onClose={() => setConfirmSubmit(false)} title="確定要提交？">
          <p className="text-sm text-[#6A6963] mb-4">
            還有 {questions.length - answered} 題未作答，未作答的題目將計為錯誤。
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setConfirmSubmit(false)}>
              繼續作答
            </Button>
            <Button
              onClick={() => {
                setConfirmSubmit(false);
                session.submitTest();
              }}
            >
              提交測試
            </Button>
          </div>
        </Modal>
      </div>
    );
  }

  /* ---------- RESULTS PHASE ---------- */
  const correct = gradedQuestions.filter((q) => q.isCorrect).length;
  const pct =
    gradedQuestions.length > 0
      ? Math.round((correct / gradedQuestions.length) * 100)
      : 0;

  return (
    <div className="max-w-2xl mx-auto p-6 lg:p-8 animate-fade-in">
      {/* Hero score */}
      <div className="text-center py-8">
        <p
          className="font-display font-bold text-7xl tabular-nums leading-none"
          style={{ color: pct >= 60 ? "#2BAC6E" : "#E85D3A" }}
        >
          {pct}
          <span className="text-3xl">%</span>
        </p>
        <p className="text-sm text-[#6A6963] mt-3">
          答對 {correct} 題 · 答錯 {gradedQuestions.length - correct} 題 · 共{" "}
          {gradedQuestions.length} 題
        </p>
        {pct === 100 && (
          <span className="inline-flex items-center gap-1.5 mt-3 rounded-full bg-[#D4AF3715] text-[#B8912C] text-xs font-semibold px-3.5 py-1.5">
            <i className="fa-solid fa-star text-[10px]" />
            滿分！完美通過
          </span>
        )}
      </div>

      {/* Review list */}
      <div className="space-y-2.5 mb-8">
        {gradedQuestions.map((q, i) => (
          <div
            key={q.id}
            className={`rounded-xl border p-4 ${
              q.isCorrect
                ? "border-[#2BAC6E]/30 bg-[#E8F5EE]/50"
                : "border-[#E85D3A]/40 bg-[#FFF3EE]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] text-[#9A9A94]">
                  第 {i + 1} 題 · {TYPE_LABELS[q.type]}
                </p>
                <p className="font-semibold text-sm text-[#1A1A1A] mt-1 leading-snug">
                  {q.prompt}
                </p>
              </div>
              <span
                className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                  q.isCorrect
                    ? "bg-[#2BAC6E15] text-[#2BAC6E]"
                    : "bg-[#E85D3A15] text-[#E85D3A]"
                }`}
              >
                <i
                  className={`fa-solid text-xs ${
                    q.isCorrect ? "fa-check" : "fa-xmark"
                  }`}
                />
              </span>
            </div>
            {!q.isCorrect && (
              <div className="mt-2.5 space-y-1 text-sm">
                <p className="text-[#E85D3A]">
                  你的答案：
                  <span className="font-medium">
                    {q.userAnswer || "（未作答）"}
                  </span>
                </p>
                <p className="text-[#2BAC6E]">
                  正確答案：
                  <span className="font-semibold text-[#1A1A1A]">
                    {q.correctAnswer}
                  </span>
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center pb-8">
        <button
          onClick={session.restart}
          className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] text-[#1A1A1A] font-semibold px-6 py-3 text-sm hover:bg-[#C9A02E] active:scale-[0.97] transition-all"
        >
          <i className="fa-solid fa-rotate-right" />
          再測一次
        </button>
        <Link href={`/decks/${deckId}`}>
          <button className="inline-flex items-center gap-2 rounded-full bg-white border border-[#D5C8B2] text-[#1A1A1A] font-medium px-6 py-3 text-sm hover:bg-[#EADCC5]/30 active:scale-[0.97] transition-all">
            返回學習集
          </button>
        </Link>
      </div>
    </div>
  );
}
