/**
 * TTS 共用邏輯（client / server 皆可 import，不可含瀏覽器或 Node 專屬 API）。
 *
 * 語言解析沿用 useTTS 的規則；語音對應表指向 Microsoft Azure 神經語音
 * （edge-tts 與 Azure Speech 使用同一批音色）。
 */

/** UI 語言代碼 → BCP-47 完整標籤 */
export const LANG_TO_BCP47: Record<string, string> = {
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
export function detectLang(text: string): string | null {
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

/** 正規化使用者指定的語言代碼為 BCP-47 完整標籤；auto/null → null */
export function normalizeLang(lang?: string | null): string | null {
  if (!lang || lang === "auto") return null;
  if (LANG_TO_BCP47[lang]) return LANG_TO_BCP47[lang];
  // 已是完整標籤（含 -）就直接用；否則視為短碼
  return lang.includes("-") ? lang : LANG_TO_BCP47[lang.toLowerCase()] ?? lang;
}

/** BCP-47 → Azure 神經語音 ShortName */
const BCP47_TO_VOICE: Record<string, string> = {
  "en-US": "en-US-JennyNeural",
  "en-GB": "en-GB-SoniaNeural",
  "ja-JP": "ja-JP-NanamiNeural",
  "ko-KR": "ko-KR-SunHiNeural",
  "fr-FR": "fr-FR-DeniseNeural",
  "de-DE": "de-DE-KatjaNeural",
  "es-ES": "es-ES-ElviraNeural",
  "it-IT": "it-IT-ElsaNeural",
  "pt-BR": "pt-BR-FranciscaNeural",
  "zh-TW": "zh-TW-HsiaoChenNeural",
  "zh-CN": "zh-CN-XiaoxiaoNeural",
};

const DEFAULT_VOICE = "en-US-JennyNeural";

/** 由 BCP-47 標籤挑出神經語音：完全相符 > 主語言前綴 > 預設英文 */
export function voiceForLang(bcp47?: string | null): string {
  if (!bcp47) return DEFAULT_VOICE;
  const target = bcp47.toLowerCase().replace("_", "-");
  if (BCP47_TO_VOICE[target]) return BCP47_TO_VOICE[target];
  const base = target.split("-")[0];
  const prefixMatch = Object.entries(BCP47_TO_VOICE).find(
    ([tag]) => tag.split("-")[0] === base
  );
  return prefixMatch?.[1] ?? DEFAULT_VOICE;
}

/**
 * 解析最終語音：明確指定 > 內容偵測 > 預設。
 */
export function resolveVoice(text: string, lang?: string | null): string {
  return voiceForLang(normalizeLang(lang) ?? detectLang(text));
}
