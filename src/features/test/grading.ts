import type { TestQuestion } from "@/lib/types";

/**
 * Grade a full test: attach userAnswer + isCorrect to each question.
 * Written answers are graded case-insensitively after trimming.
 */
export function gradeWritten(userAnswer: string, correctAnswer: string): boolean {
  return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
}

export function gradeTest(
  questions: TestQuestion[],
  answers: Record<string, string>
): TestQuestion[] {
  return questions.map((q) => {
    const userAnswer = answers[q.id] ?? "";
    const isCorrect =
      q.type === "written"
        ? gradeWritten(userAnswer, q.correctAnswer)
        : userAnswer === q.correctAnswer;
    return { ...q, userAnswer, isCorrect };
  });
}
