import { NextRequest, NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { createHash } from "crypto";
import { resolveVoice } from "@/lib/tts";

// 需要 Node.js WebSocket / stream 能力
export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 300;
const CACHE_LIMIT = 200;

/** 記憶體快取：同文字直接回快取，省 WebSocket 往返（serverless 實例存活期間有效） */
const audioCache = new Map<string, Buffer>();

function cacheKey(text: string, voice: string, rate?: number): string {
  return createHash("sha1")
    .update(`${voice}::${rate ?? 0}::${text}`)
    .digest("hex");
}

async function synthesize(
  text: string,
  voice: string,
  ratePct?: number
): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  try {
    const { audioStream } = tts.toStream(
      text,
      ratePct !== undefined && ratePct !== 0
        ? { rate: `${ratePct > 0 ? "+" : ""}${ratePct}%` }
        : undefined
    );
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    if (chunks.length === 0) throw new Error("empty audio stream");
    return Buffer.concat(chunks);
  } finally {
    tts.close();
  }
}

/**
 * GET /api/tts?text=...&lang=it
 * 以 Microsoft 神經語音合成 MP3；失敗時前端自動退回瀏覽器 Web Speech。
 */
export async function GET(req: NextRequest) {
  const text = (req.nextUrl.searchParams.get("text") ?? "").trim();
  const lang = req.nextUrl.searchParams.get("lang");

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `text too long (max ${MAX_TEXT_LENGTH})` },
      { status: 400 }
    );
  }

  let voice: string;
  try {
    voice = resolveVoice(text, lang);
  } catch {
    voice = "en-US-JennyNeural";
  }

  // 語速：SSML prosody 百分比（-60 ～ +40）
  const rawRate = Number(req.nextUrl.searchParams.get("rate"));
  const ratePct = Number.isFinite(rawRate) && rawRate !== 0
    ? Math.max(-60, Math.min(40, Math.round(rawRate)))
    : undefined;

  const key = cacheKey(text, voice, ratePct);
  const headers = {
    "Content-Type": "audio/mpeg",
    // 內容不可變（同 key 永遠同一音檔），可放心交給 CDN／瀏覽器快取
    "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
  };

  const cached = audioCache.get(key);
  if (cached) {
    // LRU 觸碰
    audioCache.delete(key);
    audioCache.set(key, cached);
    return new NextResponse(new Uint8Array(cached), { headers });
  }

  try {
    const audio = await synthesize(text, voice, ratePct);
    audioCache.set(key, audio);
    if (audioCache.size > CACHE_LIMIT) {
      // 淘汰最舊的一筆
      const oldest = audioCache.keys().next().value;
      if (oldest !== undefined) audioCache.delete(oldest);
    }
    return new NextResponse(new Uint8Array(audio), { headers });
  } catch (err) {
    console.error("[tts] synthesis failed:", err);
    return NextResponse.json(
      { error: "tts unavailable" },
      { status: 502 }
    );
  }
}
