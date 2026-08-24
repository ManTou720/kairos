"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/** UI 語言代碼 → BCP-47 完整標籤（瀏覽器需要完整標籤才會配到正確語音） */
const LANG_TO_BCP47: Record<string, string> = {
  en: "en-US",
  ja: "ja-JP",
  ko: "ko-KR",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
  it: "it-IT",
  pt: "pt-BR",
  "zh-TW": "zh-TW",
  "zh-CN": "zh-CN",
};

/** 「自動偵測」時依字元集粗判語言 */
function detectLang(text: string): string | null {
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return "ja-JP"; // 平/片假名
  if (/[\uac00-\ud7af\u1100-\u11ff]/.test(text)) return "ko-KR"; // 諺文
  if (/[\u4e00-\u9fff]/.test(text)) return "zh-TW"; // 漢字 → 預設繁中
  if (/[àâäèéêëîïôöùûüç]/i.test(text)) return "fr-FR";
  if (/[áéíóúñ¿¡]/i.test(text)) return "es-ES";
  if (/[àèìòù]/i.test(text)) return "it-IT";
  if (/[äöüß]/i.test(text)) return "de-DE";
  if (/[ãõç]/i.test(text)) return "pt-BR";
  if (/^[\x00-\x7F]+$/.test(text)) return "en-US"; // 純 ASCII
  return null;
}

function normalizeLang(lang?: string | null): string | null {
  if (!lang || lang === "auto") return null;
  if (LANG_TO_BCP47[lang]) return LANG_TO_BCP47[lang];
  // 已是完整標籤（含 -）就直接用；否則視為短碼
  return lang.includes("-") ? lang : LANG_TO_BCP47[lang.toLowerCase()] ?? lang;
}

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const voicesLoadedRef = useRef(false);

  // 語音清單非同步載入，先快取起來供 speak() 即時挑選
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    function loadVoices() {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voicesRef.current = voices;
        voicesLoadedRef.current = true;
      }
    }

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    // 某些瀏覽器不觸發事件，輪詢一次
    const t = setTimeout(loadVoices, 500);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      clearTimeout(t);
    };
  }, []);

  /** 由已安裝語音中挑出最符合者：完全相符 > 前綴相符 */
  function pickVoice(bcp47: string): SpeechSynthesisVoice | null {
    const target = bcp47.toLowerCase();
    const base = target.split("-")[0];
    const exact = voicesRef.current.find(
      (v) => v.lang.toLowerCase().replace("_", "-") === target
    );
    if (exact) return exact;
    return (
      voicesRef.current.find((v) =>
        v.lang.toLowerCase().replace("_", "-").startsWith(base)
      ) ?? null
    );
  }

  const speak = useCallback((text: string, lang?: string | null) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (!text.trim()) return;

    window.speechSynthesis.cancel();

    const resolved =
      normalizeLang(lang) ?? detectLang(text) ?? undefined;

    const utterance = new SpeechSynthesisUtterance(text);
    if (resolved) {
      utterance.lang = resolved;
      const voice = pickVoice(resolved);
      if (voice) utterance.voice = voice; // 明確指定語音，避免系統用預設嗓音
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { speak, isSpeaking };
}
