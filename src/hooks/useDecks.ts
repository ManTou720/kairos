"use client";

import useSWR from "swr";
import * as api from "@/lib/api";
import type { Deck, DeckSummary, Folder } from "@/lib/types";
import { getToken } from "@/lib/auth";

function authedKey(key: string) {
  const token = getToken();
  return token ? key : null;
}

export function useDecks() {
  return useSWR<DeckSummary[]>(authedKey("/api/decks"), () => api.getDecks());
}

export function useDeck(id: string | null) {
  return useSWR<Deck>(id ? authedKey(`/api/decks/${id}`) : null, () =>
    api.getDeck(id!)
  );
}

export function useFolders() {
  return useSWR<Folder[]>(authedKey("/api/folders"), () => api.getFolders());
}
