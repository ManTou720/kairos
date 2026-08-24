"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import * as api from "@/lib/api";
import {
  parseImport,
  type ImportPayload,
} from "@/lib/import-parser";

/** 給任何 AI 工具（影片/圖片/PDF 轉單詞卡）的標準提示詞 */
const AI_PROMPT = `請將這份教材整理成單詞卡，嚴格只輸出以下 JSON 格式，不要加上任何說明文字或 markdown 代碼區塊：

{
  "format": "kairos-deck",
  "version": 1,
  "title": "學習集標題",
  "description": "一句話描述內容",
  "cards": [
    {
      "term": "詞語（保持教材原文）",
      "definition": "定義（繁體中文，一兩句以內）",
      "termLang": "en",
      "defLang": "zh-TW"
    }
  ]
}

規則：
1. term 保持教材的原文語言；definition 一律使用繁體中文。
2. termLang 使用 BCP-47 代碼（如 en、ja、ko、fr、de、es、it、zh-TW），defLang 填 zh-TW。
3. 擷取所有重要單字與片語，一張卡片一個概念；專有名詞也要收錄。
4. 不要重複，也不要遺漏任何章節。

以下是我的教材：
【在此貼上影片連結／圖片／PDF 內容】`;

export default function ImportPage() {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<ImportPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  function runParse(text: string) {
    setRaw(text);
    if (!text.trim()) {
      setParsed(null);
      setError(null);
      return;
    }
    const result = parseImport(text);
    if (result.ok) {
      setParsed(result.data);
      setError(null);
    } else {
      setParsed(null);
      setError(result.error);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    runParse(text);
    e.target.value = "";
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(AI_PROMPT);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch {
      /* clipboard 不可用時忽略 */
    }
  }

  async function handleImport() {
    if (!parsed || submitting) return;
    setSubmitting(true);
    try {
      const deck = await api.createDeck({
        title: parsed.title || "匯入的學習集",
        description: parsed.description,
        cards: parsed.cards,
      });
      mutate("/api/decks");
      router.push(`/decks/${deck.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "匯入失敗，請重試");
      setSubmitting(false);
    }
  }

  const sampleJson = JSON.stringify(
    {
      format: "kairos-deck",
      version: 1,
      title: "義大利語入門",
      description: "基礎問候語",
      cards: [
        { term: "ciao", definition: "你好", termLang: "it", defLang: "zh-TW" },
        { term: "grazie", definition: "謝謝", termLang: "it", defLang: "zh-TW" },
      ],
    },
    null,
    2
  );

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-bold text-[#1A1A1A]">
            匯入學習集
          </h1>
          <p className="text-sm text-[#6A6963] mt-1">
            貼上 AI 生成的 JSON、上傳檔案，或直接貼 Tab 分隔的文字
          </p>
        </div>
        <Link
          href="/library"
          aria-label="返回圖書室"
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#6A6963] hover:bg-[#EADCC5]/50 hover:text-[#1A1A1A] transition-colors"
        >
          <i className="fa-solid fa-xmark text-lg" />
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* 左：輸入區 */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#E8DDD0] bg-white p-5 shadow-sm space-y-4">
            <textarea
              value={raw}
              onChange={(e) => runParse(e.target.value)}
              placeholder={`貼上 JSON 或每行「詞語<Tab>定義」...\n\n範例：\n${sampleJson}`}
              rows={12}
              className="w-full rounded-xl border border-[#D5C8B2] bg-white px-4 py-3 text-xs font-mono leading-relaxed text-[#1A1A1A] placeholder:text-[#9A9A94]/70 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-colors resize-y"
            />
            <label className="inline-flex items-center gap-2 rounded-full border border-[#D5C8B2] bg-white px-4 py-2 text-sm font-medium text-[#1A1A1A] hover:bg-[#EADCC5]/30 cursor-pointer active:scale-[0.98] transition-all">
              <i className="fa-solid fa-file-arrow-up text-[#B8912C]" />
              上傳 .json 檔案
              <input
                type="file"
                accept=".json,.txt,application/json,text/plain"
                onChange={handleFile}
                className="hidden"
              />
            </label>
          </div>

          {/* 解析結果 */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-[#E85D3A]/40 bg-[#FFF3EE] px-4 py-3 text-sm text-[#E85D3A] animate-fade-in">
              <i className="fa-solid fa-circle-exclamation mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {parsed && (
            <div className="rounded-xl border border-[#2BAC6E]/30 bg-white p-4 animate-fade-in">
              <p className="text-sm font-semibold text-[#2BAC6E] mb-1">
                <i className="fa-solid fa-circle-check mr-1.5" />
                解析成功：共 {parsed.cards.length} 張卡片
              </p>
              {parsed.title && (
                <p className="text-xs text-[#9A9A94] mb-3">標題：{parsed.title}</p>
              )}
              <div className="divide-y divide-[#E8DDD0] max-h-48 overflow-y-auto">
                {parsed.cards.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex gap-3 py-2 text-sm">
                    <span className="font-medium text-[#1A1A1A] truncate flex-1">
                      {c.term}
                    </span>
                    <span className="text-[#6A6963] truncate flex-1">
                      {c.definition}
                    </span>
                  </div>
                ))}
              </div>
              {parsed.cards.length > 5 && (
                <p className="text-xs text-[#9A9A94] mt-2">
                  ...還有 {parsed.cards.length - 5} 張
                </p>
              )}
              <button
                onClick={handleImport}
                disabled={submitting}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] text-[#1A1A1A] font-semibold px-6 py-3 text-sm hover:bg-[#C9A02E] active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                <i
                  className={`fa-solid ${
                    submitting ? "fa-spinner fa-spin" : "fa-download"
                  } text-xs`}
                />
                {submitting ? "匯入中..." : `匯入這 ${parsed.cards.length} 張卡片`}
              </button>
            </div>
          )}
        </div>

        {/* 右：AI 提示詞 */}
        <div className="rounded-2xl border border-[#E8DDD0] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#1A1A1A]">
              <i className="fa-solid fa-wand-magic-sparkles text-[#B8912C] mr-2" />
              讓 AI 建立卡片
            </h2>
            <button
              onClick={copyPrompt}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.97] ${
                promptCopied
                  ? "bg-[#E8F5EE] text-[#2BAC6E]"
                  : "bg-[#F0EBDF] text-[#1A1A1A] hover:bg-[#E8DDD0]"
              }`}
            >
              <i
                className={`fa-solid ${promptCopied ? "fa-check" : "fa-copy"} text-[10px]`}
              />
              {promptCopied ? "已複製！" : "複製提示詞"}
            </button>
          </div>
          <ol className="text-xs text-[#6A6963] space-y-1.5 list-decimal list-inside mb-4 leading-relaxed">
            <li>複製左側提示詞</li>
            <li>
              貼到任何 AI 工具，附上你的{" "}
              <span className="font-medium text-[#1A1A1A]">
                影片連結、圖片或 PDF 內容
              </span>
            </li>
            <li>把 AI 回傳的 JSON 貼進左邊輸入框即可匯入</li>
          </ol>
          <pre className="rounded-xl bg-[#FBF7EF] border border-[#E8DDD0] p-4 text-[11px] font-mono leading-relaxed text-[#6A6963] whitespace-pre-wrap max-h-[360px] overflow-y-auto select-all">
{AI_PROMPT}
          </pre>
          <p className="text-[11px] text-[#9A9A94] mt-3 leading-relaxed">
            <i className="fa-solid fa-shield-halved mr-1" />
            解析器相容多種寫法：<code className="font-mono">term/definition</code>、
            <code className="font-mono">front/back</code>、
            <code className="font-mono">word/meaning</code>、
            <code className="font-mono">[&quot;詞語&quot;,&quot;定義&quot;]</code> 陣列、
            <code className="font-mono">{'{"詞語":"定義"}'}</code> 物件，
            以及純文字 Tab 分隔格式。
          </p>
        </div>
      </div>
    </div>
  );
}
