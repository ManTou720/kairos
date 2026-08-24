"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { detectLang, normalizeLang } from "@/lib/tts";

export { LANG_TO_BCP47 } from "@/lib/tts";

const SERVER_TTS_TIMEOUT_MS = 4000;

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const voicesLoadedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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

  /** 停掉目前任何播放（雲端音檔與系統語音） */
  const stopCurrent = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    abortRef.current?.abort();
    abortRef.current = null;
    setIsSpeaking(false);
  }, []);

  /** 瀏覽器內建 Web Speech（離線備援） */
  const speakWithBrowser = useCallback(
    (text: string, resolved?: string) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

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
    },
    []
  );

  /** 優先使用伺服器端神經語音（/api/tts），失敗退回 Web Speech */
  const speakWithServer = useCallback(async (text: string, lang?: string | null) => {
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), SERVER_TTS_TIMEOUT_MS);

    try {
      const params = new URLSearchParams({ text });
      if (lang && lang !== "auto") params.set("lang", lang);
      const res = await fetch(`/api/tts?${params.toString()}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return false;

      const blob = await res.blob();
      if (!blob.type.startsWith("audio/")) return false;

      stopCurrent(); // 取代舊的播放（不會 abort 自己，因為已換新 controller）
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (audioRef.current === audio) {
          audioRef.current = null;
          setIsSpeaking(false);
        }
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        if (audioRef.current === audio) {
          audioRef.current = null;
          setIsSpeaking(false);
        }
      };
      await audio.play();
      return true;
    } catch {
      clearTimeout(timeout);
      return false;
    }
  }, [stopCurrent]);

  const speak = useCallback(
    (text: string, lang?: string | null) => {
      if (!text.trim()) return;
      stopCurrent();

      const resolved = normalizeLang(lang) ?? detectLang(text) ?? undefined;

      speakWithServer(text, lang)
        .then((ok) => {
          if (!ok) speakWithBrowser(text, resolved);
        })
        .catch(() => speakWithBrowser(text, resolved));
    },
    [speakWithServer, speakWithBrowser, stopCurrent]
  );

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { speak, isSpeaking };
}
