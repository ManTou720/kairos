import { describe, it, expect } from "vitest";
import { generateTest } from "./test-generator";
import { gradeTest, gradeWritten } from "@/features/test/grading";
import type { Card, TestConfig } from "./types";

function makeCards(n: number): Card[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `card-${i}`,
    term: `term ${i}`,
    definition: `definition ${i}`,
    termLang: null,
    defLang: null,
    sr: {
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      nextReview: Date.now(),
      lastReview: null,
    },
  }));
}

describe("generateTest", () => {
  const config: TestConfig = {
    questionTypes: ["multiple-choice", "true-false", "written"],
    questionCount: 10,
  };

  it("generates at most questionCount questions (and at most card count)", () => {
    const cards = makeCards(4);
    expect(generateTest(cards, config)).toHaveLength(4);
    expect(generateTest(makeCards(20), config)).toHaveLength(10);
  });

  it("only uses the configured question types", () => {
    const onlyWritten: TestConfig = { questionTypes: ["written"], questionCount: 8 };
    const qs = generateTest(makeCards(12), onlyWritten);
    expect(qs.every((q) => q.type === "written")).toBe(true);
  });

  it("multiple-choice options include the correct answer and 3 distractors", () => {
    const qs = generateTest(makeCards(6), {
      questionTypes: ["multiple-choice"],
      questionCount: 3,
    });
    for (const q of qs) {
      expect(q.options).toHaveLength(4);
      expect(q.options).toContain(q.correctAnswer);
      expect(new Set(q.options).size).toBe(4);
    }
  });

  it("true-false prompts reference a real term/definition pair or mismatch", () => {
    const cards = makeCards(6);
    const qs = generateTest(cards, {
      questionTypes: ["true-false"],
      questionCount: 6,
    });
    for (const q of qs) {
      if (q.correctAnswer === "True") {
        const card = cards.find((c) => q.prompt === `"${c.term}" = "${c.definition}"`);
        expect(card).toBeDefined();
      } else {
        expect(q.prompt.endsWith("= \"definition")).toBe(false); // some other definition
      }
      expect(q.options).toEqual(["True", "False"]);
    }
  });

  it("cycles through question types when there are fewer types than questions", () => {
    const qs = generateTest(makeCards(10), config);
    const typeSet = new Set(qs.map((q) => q.type));
    // With cycling, all three configured types should eventually appear.
    expect(typeSet.size).toBe(3);
  });
});

describe("gradeTest / gradeWritten", () => {
  it("grades written answers case-insensitively with trimming", () => {
    expect(gradeWritten("  Hello ", "hello")).toBe(true);
    expect(gradeWritten("hello", "world")).toBe(false);
  });

  it("marks correct/incorrect per question and records the user answer", () => {
    const [a, b] = makeCards(2);
    const questions = [
      {
        id: "q1",
        type: "written" as const,
        cardId: a.id,
        prompt: a.term,
        correctAnswer: a.definition,
      },
      {
        id: "q2",
        type: "multiple-choice" as const,
        cardId: b.id,
        prompt: b.term,
        correctAnswer: b.definition,
        options: [b.definition, "x", "y", "z"],
      },
    ];
    const graded = gradeTest(questions, {
      q1: `  ${a.definition.toUpperCase()} `,
      q2: "wrong option",
    });
    expect(graded[0].isCorrect).toBe(true);
    expect(graded[1].isCorrect).toBe(false);
    expect(graded[1].userAnswer).toBe("wrong option");
  });

  it("treats unanswered questions as incorrect", () => {
    const [a] = makeCards(1);
    const graded = gradeTest(
      [
        {
          id: "q1",
          type: "written",
          cardId: a.id,
          prompt: a.term,
          correctAnswer: a.definition,
        },
      ],
      {}
    );
    expect(graded[0].isCorrect).toBe(false);
    expect(graded[0].userAnswer).toBe("");
  });
});
