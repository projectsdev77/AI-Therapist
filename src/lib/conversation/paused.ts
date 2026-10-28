/**
 * Conversations the person left with "I'll be back". They stay open longer before the app
 * finishes them on its own (see reflection/pending.ts). Kept per device in localStorage.
 */
const KEY = "haven:paused";

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids.slice(-20)));
  } catch {
    // Storage unavailable: it just finishes on the normal schedule.
  }
}

export function markPaused(id: string) {
  write([...read().filter((x) => x !== id), id]);
}

export function clearPaused(id: string) {
  write(read().filter((x) => x !== id));
}

export function isPaused(id: string): boolean {
  return read().includes(id);
}
