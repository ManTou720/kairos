/**
 * End-to-end smoke test against a running dev/prod server.
 * Usage: npm run build && npm start   (or npm run dev)
 *        npx tsx tests/smoke.ts       (DATABASE_URL must be set)
 */
import postgres from "postgres";

const BASE = `http://localhost:${process.env.PORT || 3000}`;
const sql = postgres(process.env.DATABASE_URL!);

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} → ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

let failures = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) console.log(`  ✓ ${name}`);
  else {
    failures++;
    console.error(`  ✗ ${name}`, detail ?? "");
  }
}

// --- run ---
const username = `smoke_${Date.now()}`;
const { token, user } = await api("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ username }),
});
check("login returns token + user", !!token && user.username === username);

const auth = { Authorization: `Bearer ${token}` };

const deck = await api("/api/decks", {
  method: "POST",
  headers: auth,
  body: JSON.stringify({
    title: "Smoke Deck",
    cards: [
      { term: "apple", definition: "蘋果" },
      { term: "banana", definition: "香蕉" },
    ],
  }),
});
check("deck created with 2 cards", deck.cards.length === 2);
check("new card sr defaults", deck.cards[0].sr.easeFactor === 2.5);

const cardId = deck.cards[0].id;

// Forge attempt: the legacy client-trusted PATCH endpoint must be gone.
const forged = await fetch(`${BASE}/api/cards/${cardId}/sr`, {
  method: "PATCH",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify({ interval: 99999, easeFactor: 99, repetitions: 9, nextReview: 0, lastReview: 0 }),
});
check("legacy PATCH /sr is removed (404)", forged.status === 404);

const r1 = await api(`/api/cards/${cardId}/review`, {
  method: "POST",
  headers: auth,
  body: JSON.stringify({ quality: 4 }),
});
check("review #1 correct → interval 1", r1.sr.interval === 1 && r1.sr.repetitions === 1);

const r2 = await api(`/api/cards/${cardId}/review`, {
  method: "POST",
  headers: auth,
  body: JSON.stringify({ quality: 4 }),
});
check("review #2 correct → interval 6", r2.sr.interval === 6 && r2.sr.repetitions === 2);

const bad = await fetch(`${BASE}/api/cards/${cardId}/review`, {
  method: "POST",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify({ quality: "hack" }),
});
check("non-numeric quality rejected (400)", bad.status === 400);

// Search matches card terms too (EXISTS subquery with qualified names).
const found = await api(`/api/search?q=${encodeURIComponent("蘋果")}`, { headers: auth });
check("search finds deck by card term", Array.isArray(found) && found.some((d: { id: string }) => d.id === deck.id));

// Folder count subquery (qualified correlation).
const folder = await api("/api/folders", {
  method: "POST",
  headers: auth,
  body: JSON.stringify({ name: "Smoke Folder" }),
});
await api(`/api/decks/${deck.id}`, {
  method: "PUT",
  headers: auth,
  body: JSON.stringify({ folderId: folder.id }),
});
const folders = await api("/api/folders", { headers: auth });
check(
  "folder deckCount counts its decks",
  folders.find((f: { id: string }) => f.id === folder.id)?.deckCount === 1
);

const summaries = await api("/api/decks", { headers: auth });
check("deck summary exposes learnedCount", summaries[0]?.learnedCount === 1);
check("deck summary exposes cardCount", summaries[0]?.cardCount === 2);

// Session expiry enforcement
await sql`UPDATE sessions SET expires_at = 0 WHERE token = ${token}`;
const expired = await fetch(`${BASE}/api/auth/me`, { headers: auth });
check("expired session rejected (401)", expired.status === 401);

await sql.end();
console.log(failures === 0 ? "\nALL SMOKE CHECKS PASSED" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
