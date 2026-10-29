"use client";

/**
 * Words typed (or a starter chosen) on Home before the conversation opens. Handed to the
 * talk screen through sessionStorage, never the URL, so nothing personal lands in history
 * or server logs.
 */
const KEY = "haven:opening";

export type Opening = { text: string } | { starterId: string };

export function setOpening(opening: Opening) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(opening));
  } catch {
    /* storage blocked: the conversation just starts with a greeting */
  }
}

/** Reads and clears the opening, so it's used once. */
export function takeOpening(): Opening | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return raw ? (JSON.parse(raw) as Opening) : null;
  } catch {
    return null;
  }
}
