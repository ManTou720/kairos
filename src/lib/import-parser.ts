/**
 * Kairos deck import parser.
 *
 * Design goal: accept JSON produced by ANY AI tool with minimal friction,
 * plus a plain-text (TSV) fallback for Quizlet-style pastes.
 *
 * Accepted shapes:
 * 1. Canonical wrapper:
 *    { "format": "kairos-deck", "version": 1, "title": "...",
 *      "description": "...", "cards": [{ "term": "...", "definition": "..." }] }
 * 2. Bare array: [{ "term": "...", "definition": "..." }, ...]
 * 3. Alias keys per card: term|front|word|詞語 / definition|back|meaning|定義,
 *    optional termLang|lang / defLang.
 * 4. Tuple entries: ["term", "definition"].
 * 5. Plain object map: { "term": "definition", ... }.
 * 6. Non-JSON text: line-based TSV ("term<TAB>definition" per line).
 */

export interface ImportCard {
  term: string;
  definition: string;
  termLang?: string;
  defLang?: string;
}

export interface ImportPayload {
  title: string;
  description: string;
  cards: ImportCard[];
}

export type ParseResult =
  | { ok: true; data: ImportPayload }
  | { ok: false; error: string };

const TERM_KEYS = ["term", "front", "word", "side1", "詞語", "詞"];
const DEF_KEYS = ["definition", "back", "meaning", "side2", "定義", "解釋"];
const TITLE_KEYS = ["title", "name", "deckTitle", "標題", "名稱"];
const DESC_KEYS = ["description", "desc", "描述", "說明"];

function asTrimmedString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

/** Find the first present alias key in an object. */
function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function normalizeCard(entry: unknown, index: number): ImportCard | string {
  // Tuple form: [term, definition]
  if (Array.isArray(entry)) {
    const t = asTrimmedString(entry[0]);
    const d = asTrimmedString(entry[1]);
    if (!t || !d) return `第 ${index + 1} 筆格式錯誤：需要 ["詞語", "定義"]`;
    return { term: t, definition: d };
  }

  if (typeof entry === "object" && entry !== null) {
    const obj = entry as Record<string, unknown>;
    const rawTerm = pick(obj, TERM_KEYS);
    const rawDef = pick(obj, DEF_KEYS);
    const t = asTrimmedString(rawTerm);
    const d = asTrimmedString(rawDef);
    if (!t) return `第 ${index + 1} 筆缺少詞語（term/front/word）`;
    if (!d) return `第 ${index + 1} 筆缺少定義（definition/back/meaning）`;
    const lang = asTrimmedString(pick(obj, ["termLang", "lang"]));
    return {
      term: t,
      definition: d,
      ...(lang ? { termLang: lang } : {}),
      ...(asTrimmedString(pick(obj, ["defLang"]))
        ? { defLang: asTrimmedString(pick(obj, ["defLang"]))! }
        : {}),
    };
  }

  return `第 ${index + 1} 筆不是可辨識的卡片格式`;
}

export function parseImport(raw: string): ParseResult {
  const text = raw.trim();
  if (!text) return { ok: false, error: "內容是空的" };

  let title = "";
  let description = "";
  let entries: unknown[] | null = null;

  try {
    const parsed: unknown = JSON.parse(text);

    if (Array.isArray(parsed)) {
      entries = parsed;
    } else if (typeof parsed === "object" && parsed !== null) {
      const obj = parsed as Record<string, unknown>;

      const rawCards =
        obj.cards ??
        (obj.deck as Record<string, unknown> | undefined)?.cards ??
        obj.words;
      if (Array.isArray(rawCards)) {
        entries = rawCards;
        title = asTrimmedString(pick(obj, TITLE_KEYS)) ?? "";
        description = asTrimmedString(pick(obj, DESC_KEYS)) ?? "";
      } else {
        // Plain object map: { "term": "definition", ... }
        const mapEntries = Object.entries(obj).filter(
          ([k, v]) => typeof v === "string" && k.trim().length > 0
        );
        if (mapEntries.length === 0) {
          return {
            ok: false,
            error:
              "找不到卡片資料：需要有 cards 陣列，或 { \"詞語\": \"定義\" } 形式的物件",
          };
        }
        entries = mapEntries.map(([k, v]) => ({ term: k, definition: v }));
      }
    }
  } catch {
    // Not JSON — fall through to TSV parsing below.
  }

  if (!entries) {
    // TSV fallback: each non-empty line = "term<TAB>definition"
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const tsvCards: ImportCard[] = [];
    for (const line of lines) {
      const idx = line.indexOf("\t");
      if (idx <= 0) continue;
      const t = line.slice(0, idx).trim();
      const d = line.slice(idx + 1).trim();
      if (t && d) tsvCards.push({ term: t, definition: d });
    }
    if (tsvCards.length === 0) {
      return {
        ok: false,
        error: "無法解析：請貼上 JSON，或每行一張卡並以 Tab 分隔「詞語<Tab>定義」",
      };
    }
    return { ok: true, data: { title: "", description: "", cards: tsvCards } };
  }

  const cards: ImportCard[] = [];
  for (let i = 0; i < entries.length; i++) {
    const result = normalizeCard(entries[i], i);
    if (typeof result === "string") return { ok: false, error: result };
    cards.push(result);
  }

  if (cards.length === 0) {
    return { ok: false, error: "cards 是空的，至少需要一張卡片" };
  }

  return { ok: true, data: { title, description, cards } };
}
