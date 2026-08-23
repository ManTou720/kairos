import { describe, expect, it } from "vitest";
import { calculateSM2, type SrState } from "@/server/lib/sr";

const NOW = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

function state(overrides: Partial<SrState> = {}): SrState {
  return {
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    nextReview: NOW,
    lastReview: null,
    ...overrides,
  };
}

describe("calculateSM2", () => {
  it("first correct answer sets interval to 1 day", () => {
    const next = calculateSM2(state(), 4, NOW);
    expect(next.interval).toBe(1);
    expect(next.repetitions).toBe(1);
  });

  it("second consecutive correct answer sets interval to 6 days", () => {
    const prev = { ...state(), interval: 1, repetitions: 1 };
    const next = calculateSM2(prev, 4, NOW);
    expect(next.interval).toBe(6);
    expect(next.repetitions).toBe(2);
  });

  it("third correct answer multiplies by ease factor", () => {
    const prev = { ...state(), interval: 6, repetitions: 2, easeFactor: 2.5 };
    const next = calculateSM2(prev, 4, NOW);
    expect(next.interval).toBe(Math.round(6 * 2.5));
    expect(next.repetitions).toBe(3);
  });

  it("incorrect answer resets repetitions and interval", () => {
    const prev = { ...state(), interval: 15, repetitions: 3, easeFactor: 2.5 };
    const next = calculateSM2(prev, 1, NOW);
    expect(next.repetitions).toBe(0);
    expect(next.interval).toBe(0);
  });

  it("quality 3 keeps learning but lowers ease factor", () => {
    const next = calculateSM2(state(), 3, NOW);
    expect(next.interval).toBe(1); // still counts as correct
    expect(next.easeFactor).toBeCloseTo(2.36, 5); // 2.5 + (0.1 - 2*0.12)
  });

  it("ease factor never drops below 1.3", () => {
    let s = state();
    for (let i = 0; i < 20; i++) {
      // quality 0 drives the ease formula far below the floor
      s = calculateSM2({ ...s, interval: 0, repetitions: 0 }, 0, NOW);
    }
    expect(s.easeFactor).toBe(1.3);
  });

  it("schedules nextReview one interval after `now`", () => {
    const next = calculateSM2(state(), 5, NOW);
    expect(next.nextReview).toBe(NOW + 1 * DAY);
    expect(next.lastReview).toBe(NOW);
  });

  it("clamps out-of-range quality into 0-5", () => {
    const tooHigh = calculateSM2(state(), 99, NOW);
    const tooLow = calculateSM2(state(), -7, NOW);
    // 99 clamps to 5 (max ease gain), -7 clamps to 0 (reset)
    expect(tooHigh.easeFactor).toBeGreaterThan(2.5);
    expect(tooLow.repetitions).toBe(0);
  });
});
