/**
 * End-to-end smoke test against a running API + Postgres.
 * Usage: npx tsx tests/smoke.ts (with backend/.env DATABASE_URL set)
 */
import postgres from "postgres";

const BASE = `http://localhost:${process.env.PORT || 3001}`;
const sql = postgres(process.env.DATABASE_URL!);

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}/api${path}`, {
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
console.log("Applying migrations…");

const username = `smoke_${Date.now()}`;
const { token, user } = await api("/auth/login", {
  method: "POST",
  body: JSON.stringify({ username }),
});
check("login returns token + user", !!token && user.username === username);

const auth = { Authorization: `Bearer ${token}` };

const deck = await api(
  "/decks",
  {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      title: "Smoke Deck",
      cards: [
        { term: "apple", definition: "蘋果" },
        { term: "banana", definition: "香蕉" },
      ],
    }),
  }
);
check("deck created with 2 cards", deck.cards.length === 2);
check("new card sr defaults", deck.cards[0].sr.easeFactor === 2.5);

const cardId = deck.cards[0].id;

// Forge attempt: old PATCH endpoint must be gone (404)
const forged = await fetch(`${BASE}/api/cards/${cardId}/sr`, {
  method: "PATCH",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify({ interval: 99999, easeFactor: 99, repetitions: 9, nextReview: 0, lastReview: 0 }),
});
check("legacy PATCH /sr is removed (404)", forged.status === 404);

const r1 = await api(`/cards/${cardId}/review`, {
  method: "POST",
  headers: auth,
  body: JSON.stringify({ quality: 4 }),
});
check("review #1 correct → interval 1", r1.sr.interval === 1 && r1.sr.repetitions === 1);

const r2 = await api(`/cards/${cardId}/review`, {
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

const summaries = await api("/decks", { headers: auth });
check("deck summary exposes learnedCount", summaries[0]?.learnedCount === 1);

// Session expiry enforcement
await sql`UPDATE sessions SET expires_at = 0 WHERE token = ${token}`;
const expired = await fetch(`${BASE}/api/auth/me`, { headers: auth });
check("expired session rejected (401)", expired.status === 401);

await sql.end();
console.log(failures === 0 ? "\nALL SMOKE CHECKS PASSED" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
