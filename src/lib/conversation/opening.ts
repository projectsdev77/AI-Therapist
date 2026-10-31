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

const TALK_KEY = "haven:talk-now";

/** A Talk button was pressed (Home, the landing page, New conversation): start talking on arrival. */
export function setTalkNow() {
  try {
    sessionStorage.setItem(TALK_KEY, "1");
  } catch {
    /* storage blocked: the person taps the mic on the conversation screen instead */
  }
}

/** Reads and clears the Talk request, so it's used once. */
export function takeTalkNow(): boolean {
  try {
    const on = sessionStorage.getItem(TALK_KEY) === "1";
    sessionStorage.removeItem(TALK_KEY);
    return on;
  } catch {
    return false;
  }
}

const FRESH_KEY = "haven:fresh";

/** "New conversation": start a new one even if an unfinished conversation is recent. */
export function setFresh() {
  try {
    sessionStorage.setItem(FRESH_KEY, "1");
  } catch {
    /* storage blocked: a recent conversation is continued instead */
  }
}

export function takeFresh(): boolean {
  try {
    const on = sessionStorage.getItem(FRESH_KEY) === "1";
    sessionStorage.removeItem(FRESH_KEY);
    return on;
  } catch {
    return false;
  }
}
