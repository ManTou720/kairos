import { describe, expect, it } from "vitest";
import {
  detectLang,
  effectiveRatePct,
  normalizeLang,
  resolveVoice,
  splitForSpeech,
  voiceForLang,
} from "./tts";

describe("splitForSpeech", () => {
  it("returns single chunk for short text", () => {
    expect(splitForSpeech("ciao")).toEqual(["ciao"]);
  });

  it("splits long text at sentence boundaries", () => {
    const t = "第一句話。".repeat(30); // 150 字,句號分隔
    const parts = splitForSpeech(t);
    expect(parts.length).toBeGreaterThan(1);
    for (const p of parts) expect(p.length).toBeLessThanOrEqual(100);
  });

  it("falls back to clause breaks inside long sentences", () => {
    const t = Array.from({ length: 40 }, (_, i) => `詞語${i}`).join("，");
    const parts = splitForSpeech(t);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.every((p) => p.length <= 100)).toBe(true);
  });

  it("hard-splits text without any punctuation", () => {
    const t = "a".repeat(250);
    const parts = splitForSpeech(t);
    expect(parts.every((p) => p.length <= 100)).toBe(true);
  });
});

describe("effectiveRatePct", () => {
  it("maps multiplier to SSML percent", () => {
    expect(effectiveRatePct("ciao", 1)).toBe(0);
    expect(effectiveRatePct("ciao", 0.8)).toBe(-20);
    expect(effectiveRatePct("ciao", 0.6)).toBe(-40);
  });

  it("auto-slows long sentences", () => {
    const long = "a".repeat(45);
    expect(effectiveRatePct(long, 1)).toBe(-10);
    const veryLong = "a".repeat(95);
    expect(effectiveRatePct(veryLong, 0.8)).toBe(-40);
  });

  it("clamps to [-60, 40]", () => {
    expect(effectiveRatePct("a".repeat(200), 0.6)).toBe(-60);
  });
});

describe("detectLang", () => {
  it("detects Japanese kana", () => {
    expect(detectLang("こんにちは")).toBe("ja-JP");
  });
  it("detects Korean hangul", () => {
    expect(detectLang("안녕하세요")).toBe("ko-KR");
  });
  it("defaults han characters to zh-TW", () => {
    expect(detectLang("你好世界")).toBe("zh-TW");
  });
  it("accented è matches French first (heuristic limit; rely on explicit lang)", () => {
    // è 同時存在於法/義；字元集法無法區分，實務上靠卡片的 termLang 明確指定
    expect(detectLang("un caffè")).toBe("fr-FR");
    expect(detectLang("più o meno")).toBe("fr-FR");
  });
  it("treats pure ASCII as English", () => {
    expect(detectLang("hello world")).toBe("en-US");
  });
});

describe("normalizeLang", () => {
  it("maps short codes to BCP-47", () => {
    expect(normalizeLang("it")).toBe("it-IT");
    expect(normalizeLang("zh-TW")).toBe("zh-TW");
  });
  it("returns null for auto or missing", () => {
    expect(normalizeLang("auto")).toBeNull();
    expect(normalizeLang(null)).toBeNull();
  });
});

describe("voiceForLang / resolveVoice", () => {
  it("exact-maps known locales", () => {
    expect(voiceForLang("it-IT")).toBe("it-IT-ElsaNeural");
    expect(voiceForLang("zh-TW")).toBe("zh-TW-HsiaoChenNeural");
  });
  it("falls back by language prefix", () => {
    expect(voiceForLang("it-CH")).toBe("it-IT-ElsaNeural");
  });
  it("falls back to English default for unknown", () => {
    expect(voiceForLang("xx-YY")).toBe("en-US-JennyNeural");
    expect(voiceForLang(null)).toBe("en-US-JennyNeural");
  });
  it("resolveVoice prefers explicit lang over detection", () => {
    // 內容是 ASCII（會被偵測成英文），但明確指定義大利文
    expect(resolveVoice("pane", "it")).toBe("it-IT-ElsaNeural");
  });
  it("resolveVoice detects from content when lang is auto", () => {
    // 純 ASCII 義大利文無重音可資判別 → 回落英文預設；明確指定才會命中義大利語音
    expect(resolveVoice("grazie mille", "auto")).toBe("en-US-JennyNeural");
    expect(resolveVoice("こんにちは", "auto")).toBe("ja-JP-NanamiNeural");
  });
});
