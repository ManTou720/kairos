"use client";

import { useEffect } from "react";

export function useKeyboard(
  handlers: Record<string, (e: KeyboardEvent) => void>
) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Don't capture when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const handler = handlers[e.key] || handlers[e.code];
      if (handler) {
        handler(e);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}
