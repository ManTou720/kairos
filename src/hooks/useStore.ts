"use client";

import { useSyncExternalStore, useCallback, useRef } from "react";
import { subscribe, getStore, getDeck } from "@/lib/storage";
import { KairosStore, Deck } from "@/lib/types";

const serverSnapshot: KairosStore | null = null;

export function useStore(): KairosStore | null {
  return useSyncExternalStore(subscribe, getStore, () => serverSnapshot);
}

export function useDecks(): Deck[] | null {
  const store = useSyncExternalStore(subscribe, getStore, () => serverSnapshot);
  return store?.decks ?? null;
}

export function useDeck(id: string): Deck | null {
  const prevRef = useRef<Deck | null>(null);
  const prevStoreRef = useRef<KairosStore | null>(null);

  const getter = useCallback(() => {
    const store = getStore();
    // If store reference hasn't changed, return cached result
    if (store === prevStoreRef.current) return prevRef.current;
    prevStoreRef.current = store;
    const found = store.decks.find((d) => d.id === id) ?? null;
    prevRef.current = found;
    return found;
  }, [id]);

  return useSyncExternalStore(subscribe, getter, () => null);
}
