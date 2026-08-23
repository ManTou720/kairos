import { describe, it, expect } from "vitest";
import { calculateSM2, type SrState } from "../src/lib/sr";

const NOW = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

function freshState(overrides: Partial<SrState> = {}): SrState {
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
    const sr = calculateSM2(freshState(), 4, NOW);
    expect(sr.interval).toBe(1);
    expect(sr.repetitions).toBe(1);
    expect(sr.nextReview).toBe(NOW + 1 * DAY);
    expect(sr.lastReview).toBe(NOW);
  });

  it("second correct answer sets interval to 6 days", () => {
    const sr = calculateSM2(
      freshState({ interval: 1, repetitions: 1 }),
      4,
      NOW
    );
    expect(sr.interval).toBe(6);
    expect(sr.repetitions).toBe(2);
    expect(sr.nextReview).toBe(NOW + 6 * DAY);
  });

  it("subsequent correct answers multiply interval by ease factor", () => {
    const sr = calculateSM2(
      freshState({ interval: 6, repetitions: 2, easeFactor: 2.5 }),
      4,
      NOW
    );
    expect(sr.interval).toBe(Math.round(6 * 2.5));
  });

  it("incorrect answer resets interval and repetitions", () => {
    const sr = calculateSM2(
      freshState({ interval: 15, repetitions: 3, easeFactor: 2.5 }),
      1,
      NOW
    );
    expect(sr.interval).toBe(0);
    expect(sr.repetitions).toBe(0);
    expect(sr.nextReview).toBe(NOW); // due immediately
  });

  it("ease factor decreases with low quality and never goes below 1.3", () => {
    let state = freshState();
    for (let i = 0; i < 20; i++) {
      state = calculateSM2(state, 0, NOW);
    }
    expect(state.easeFactor).toBeCloseTo(1.3);
  });

  it("ease factor increases with high quality", () => {
    const sr = calculateSM2(freshState(), 5, NOW);
    expect(sr.easeFactor).toBeGreaterThan(2.5);
  });

  it("clamps quality into the 0-5 range and rounds fractions", () => {
    // q=9 behaves like q=5
    const up = calculateSM2(freshState(), 9, NOW);
    expect(up.easeFactor).toBeGreaterThan(2.5);
    // q=-3 behaves like q=0
    const down = calculateSM2(freshState(), -3, NOW);
    expect(down.interval).toBe(0);
  });

  it("quality exactly 3 counts as correct but lowers ease factor", () => {
    const sr = calculateSM2(freshState(), 3, NOW);
    expect(sr.repetitions).toBe(1);
    expect(sr.interval).toBe(1);
    expect(sr.easeFactor).toBeLessThan(2.5);
  });
});
