import { SpacedRepetition } from "./types";

/**
 * SM-2 spaced repetition algorithm.
 * quality: 0-5 (0-2 = incorrect, 3-5 = correct with varying ease)
 */
export function calculateSR(
  prev: SpacedRepetition,
  quality: number
): SpacedRepetition {
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  let { easeFactor, repetitions, interval } = prev;

  if (q >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Incorrect response - reset
    repetitions = 0;
    interval = 0;
  }

  // Update ease factor
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const now = Date.now();
  const nextReview = now + interval * 24 * 60 * 60 * 1000;

  return {
    interval,
    easeFactor,
    repetitions,
    nextReview,
    lastReview: now,
  };
}

export function isDueForReview(sr: SpacedRepetition): boolean {
  return Date.now() >= sr.nextReview;
}
