import { describe, expect, it } from "vitest";
import { parseImport } from "./import-parser";

describe("parseImport", () => {
  it("parses the canonical kairos-deck wrapper", () => {
    const r = parseImport(
      JSON.stringify({
        format: "kairos-deck",
        version: 1,
        title: "義大利語入門",
        description: "問候語",
        cards: [
          { term: "ciao", definition: "你好", termLang: "it" },
          { term: "grazie", definition: "謝謝" },
        ],
      })
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.title).toBe("義大利語入門");
      expect(r.data.cards).toHaveLength(2);
      expect(r.data.cards[0].termLang).toBe("it");
    }
  });

  it("accepts a bare array of cards", () => {
    const r = parseImport('[{"term":"a","definition":"b"}]');
    expect(r.ok).toBe(true);
  });

  it("accepts alias keys front/back and word/meaning", () => {
    const r = parseImport(
      '[{"front":"hello","back":"你好"},{"word":"cat","meaning":"貓"}]'
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.cards[1].definition).toBe("貓");
  });

  it("accepts tuple entries", () => {
    const r = parseImport('[["dog","狗"],["cat","貓"]]');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.cards[0].term).toBe("dog");
  });

  it("accepts a plain object map", () => {
    const r = parseImport('{"ciao":"你好","grazie":"謝謝"}');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.cards).toHaveLength(2);
      expect(r.data.cards[0].term).toBe("ciao");
    }
  });

  it("falls back to TSV lines when input is not JSON", () => {
    const r = parseImport("hello\t你好\nworld\t世界");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.cards).toHaveLength(2);
  });

  it("trims whitespace and drops blank strings", () => {
    const r = parseImport('[{"term":"  a  ","definition":" b "}]');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.cards[0].term).toBe("a");
      expect(r.data.cards[0].definition).toBe("b");
    }
  });

  it("reports which entry is malformed", () => {
    const r = parseImport('[{"term":"a","definition":"b"},{"term":"x"}]');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("第 2 筆缺少定義");
  });

  it("rejects empty content", () => {
    expect(parseImport("   ").ok).toBe(false);
  });
});
