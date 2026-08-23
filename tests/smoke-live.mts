/**
 * Smoke test against the deployed Vercel production URL.
 * Usage: npx tsx tests/smoke-live.mts [baseUrl]
 */
const BASE = (process.argv[2] || "https://kairos-v3.vercel.app").replace(/\/$/, "");

let failures = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) console.log(`  ✓ ${name}`);
  else {
    failures++;
    console.error(`  ✗ ${name}`, detail ?? "");
  }
}

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

(async () => {
  console.log(`Smoke testing ${BASE}\n`);

  // 1. unauthenticated decks → 401
  const anon = await api("/api/decks");
  check("GET /api/decks anonymous → 401", anon.status === 401, anon);

  // 2. login creates a fresh account
  const username = `live_smoke_${Date.now()}`;
  const login = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
  check("POST /api/auth/login → 200", login.status === 200, login);
  const token = (login.body as { token?: string }).token ?? "";
  const auth = { Authorization: `Bearer ${token}` };

  // 3. /auth/me returns the user
  const me = await api("/api/auth/me", { headers: auth });
  check("GET /api/auth/me → 200", me.status === 200 && (me.body as { username?: string }).username === username, me);

  // 4. create deck + cards
  const deck = await api("/api/decks", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ title: "Live Smoke", description: "deployed!", cards: [
      { term: "hello", definition: "world" },
      { term: "SM-2", definition: "spaced repetition" },
    ]}),
  });
  check("POST /api/decks → 201/200", deck.status === 200 || deck.status === 201, deck);
  const deckId = (deck.body as { id?: string; deck?: { id?: string } }).id
    ?? (deck.body as { deck?: { id?: string } }).deck?.id;

  // 5. list decks shows it
  const list = await api("/api/decks", { headers: auth });
  const found = (list.body as Array<{ id?: string }>).some?.((d) => d.id === deckId)
    ?? (list.body as { decks?: Array<{ id?: string }> }).decks?.some((d) => d.id === deckId);
  check("GET /api/decks contains new deck", Boolean(found), list);

  // 6. search matches card term (regression: EXISTS subquery bug)
  const search = await api("/api/search?q=hello", { headers: auth });
  const searchOk = JSON.stringify(search.body).includes("hello");
  check("GET /api/search?q=hello finds card", searchOk, search);

  // 7. grade a card → SR fields update server-side
  if (deckId) {
    const detail = await api(`/api/decks/${deckId}`, { headers: auth }) as { status: number; body: { cards?: Array<{ id: string; repetitions: number }> } };
    const cardId = detail.body.cards?.[0]?.id;
    if (cardId) {
      const rev = await api(`/api/cards/${cardId}/review`, {
        method: "POST",
        headers: auth,
        body: JSON.stringify({ quality: 4 }),
      });
      const rb = rev.body as { repetitions?: number };
      check("POST review quality=4 → repetitions=1", rev.status === 200 && rb.repetitions === 1, rev);
    } else {
      check("deck detail has cards", false, detail);
    }

    // 8. cleanup
    const del = await api(`/api/decks/${deckId}`, { method: "DELETE", headers: auth });
    check("DELETE deck → ok", del.status < 300, del);
  } else {
    check("created deck has id", false, deck);
  }

  console.log(failures === 0 ? "\nAll checks passed ✅" : `\n${failures} failure(s) ❌`);
  process.exit(failures === 0 ? 0 : 1);
})();
