"use client";

import { useEffect, useRef } from "react";

/** True when a key press belongs to a text field, or a dialog is open over the page. */
export function shortcutBlocked(e: KeyboardEvent): boolean {
  if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return true;
  const t = e.target as HTMLElement | null;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return true;
  return modalOpen();
}

/** An open dialog (one still fading out, or left behind by a hidden route, doesn't count). */
function modalOpen(): boolean {
  return Boolean(document.querySelector('[data-state="open"] [aria-modal="true"]'));
}

/**
 * Single-key desktop shortcuts (desktop handoff: N new, ] panel, ? shortcuts, Space talk, …).
 * Keys are matched against `event.key`; handlers return false to let the key through.
 */
export function useShortcuts(map: Record<string, (() => void | boolean) | undefined>, enabled = true) {
  const ref = useRef(map);
  useEffect(() => {
    ref.current = map;
  });
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" && shortcutBlocked(e)) return;
      if (e.key === "Escape" && modalOpen()) return;
      const fn = ref.current[e.key === " " ? "Space" : e.key];
      if (!fn) return;
      if (fn() !== false) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}
