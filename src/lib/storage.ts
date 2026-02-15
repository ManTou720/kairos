import { KairosStore, Deck, Card } from "./types";
import { STORAGE_KEY } from "./constants";
import { generateId } from "./utils";

const defaultStore: KairosStore = { version: 1, decks: [] };

let listeners: Array<() => void> = [];
let cachedSnapshot: KairosStore = defaultStore;
let cachedRaw: string | null = null;

function emitChange() {
  // Invalidate cache
  cachedRaw = null;
  for (const listener of listeners) {
    listener();
  }
}

export function subscribe(listener: () => void): () => void {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function getStore(): KairosStore {
  if (typeof window === "undefined") return defaultStore;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedSnapshot;
    if (!raw) {
      cachedRaw = raw;
      cachedSnapshot = defaultStore;
      return defaultStore;
    }
    cachedRaw = raw;
    cachedSnapshot = JSON.parse(raw) as KairosStore;
    return cachedSnapshot;
  } catch {
    return defaultStore;
  }
}

function saveStore(store: KairosStore) {
  const json = JSON.stringify(store);
  localStorage.setItem(STORAGE_KEY, json);
  cachedRaw = json;
  cachedSnapshot = store;
  for (const listener of listeners) {
    listener();
  }
}

export function getDecks(): Deck[] {
  return getStore().decks;
}

export function getDeck(id: string): Deck | undefined {
  return getStore().decks.find((d) => d.id === id);
}

function createDefaultSR(): Card["sr"] {
  return {
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    nextReview: Date.now(),
    lastReview: null,
  };
}

export function createDeck(
  title: string,
  description: string,
  cards: Array<{ term: string; definition: string }>
): Deck {
  const now = Date.now();
  const deck: Deck = {
    id: generateId(),
    title,
    description,
    cards: cards.map((c) => ({
      id: generateId(),
      term: c.term,
      definition: c.definition,
      sr: createDefaultSR(),
    })),
    createdAt: now,
    updatedAt: now,
  };
  const store = getStore();
  store.decks.push(deck);
  saveStore(store);
  return deck;
}

export function updateDeck(
  id: string,
  title: string,
  description: string,
  cards: Array<{ id?: string; term: string; definition: string }>
): Deck | undefined {
  const store = getStore();
  const idx = store.decks.findIndex((d) => d.id === id);
  if (idx === -1) return undefined;

  const existing = store.decks[idx];
  const existingCardMap = new Map(existing.cards.map((c) => [c.id, c]));

  store.decks[idx] = {
    ...existing,
    title,
    description,
    cards: cards.map((c) => {
      if (c.id && existingCardMap.has(c.id)) {
        const prev = existingCardMap.get(c.id)!;
        return { ...prev, term: c.term, definition: c.definition };
      }
      return {
        id: generateId(),
        term: c.term,
        definition: c.definition,
        sr: createDefaultSR(),
      };
    }),
    updatedAt: Date.now(),
  };
  saveStore(store);
  return store.decks[idx];
}

export function deleteDeck(id: string) {
  const store = getStore();
  store.decks = store.decks.filter((d) => d.id !== id);
  saveStore(store);
}

export function updateCardSR(deckId: string, cardId: string, sr: Card["sr"]) {
  const store = getStore();
  const deck = store.decks.find((d) => d.id === deckId);
  if (!deck) return;
  const card = deck.cards.find((c) => c.id === cardId);
  if (!card) return;
  card.sr = sr;
  deck.updatedAt = Date.now();
  saveStore(store);
}
