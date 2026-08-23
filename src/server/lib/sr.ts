/**
 * SM-2 spaced repetition algorithm (server-side source of truth).
 * quality: 0-5 (0-2 = incorrect, 3-5 = correct with varying ease)
 */

export interface SrState {
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReview: number;
  lastReview: number | null;
}

export function calculateSM2(
  prev: SrState,
  quality: number,
  now: number = Date.now()
): SrState {
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

  return {
    interval,
    easeFactor,
    repetitions,
    nextReview: now + interval * 24 * 60 * 60 * 1000,
    lastReview: now,
  };
}
