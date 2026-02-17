import { getToken } from "./auth";
import type { Deck, DeckSummary, Folder, SpacedRepetition, User } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

// Auth
export async function login(username: string): Promise<{ token: string; user: User }> {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

export async function getMe(): Promise<{ user: User }> {
  return request("/api/auth/me");
}

// Decks
export async function getDecks(): Promise<DeckSummary[]> {
  return request("/api/decks");
}

export async function getDeck(id: string): Promise<Deck> {
  return request(`/api/decks/${id}`);
}

export async function createDeck(data: {
  title: string;
  description: string;
  folderId?: string;
  cards: { term: string; definition: string }[];
}): Promise<Deck> {
  return request("/api/decks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDeck(
  id: string,
  data: {
    title: string;
    description: string;
    folderId?: string | null;
    cards: { id?: string; term: string; definition: string }[];
  }
): Promise<Deck> {
  return request(`/api/decks/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteDeck(id: string): Promise<void> {
  return request(`/api/decks/${id}`, { method: "DELETE" });
}

// Cards
export async function updateCardSR(
  cardId: string,
  sr: SpacedRepetition
): Promise<void> {
  return request(`/api/cards/${cardId}/sr`, {
    method: "PATCH",
    body: JSON.stringify({
      interval: sr.interval,
      easeFactor: sr.easeFactor,
      repetitions: sr.repetitions,
      nextReview: sr.nextReview,
      lastReview: sr.lastReview,
    }),
  });
}

// Folders
export async function getFolders(): Promise<Folder[]> {
  return request("/api/folders");
}

export async function createFolder(name: string): Promise<Folder> {
  return request("/api/folders", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function updateFolder(
  id: string,
  name: string
): Promise<Folder> {
  return request(`/api/folders/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export async function deleteFolder(id: string): Promise<void> {
  return request(`/api/folders/${id}`, { method: "DELETE" });
}

// Search
export async function searchDecks(query: string): Promise<DeckSummary[]> {
  return request(`/api/search?q=${encodeURIComponent(query)}`);
}
