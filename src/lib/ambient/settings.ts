import { useSyncExternalStore } from "react";
import type { Weather } from "@/lib/conversation/types";
import type { AmbientKind } from "./sources";

/** Per-device preference (sound is about this room, this speaker), kept in localStorage. */
export interface AmbientSettings {
  enabled: boolean;
  kind: AmbientKind;
  /** Pick the sound from the live sky instead of `kind`. */
  matchSky: boolean;
}

const KEY = "haven:ambient";
export const DEFAULT_AMBIENT: AmbientSettings = { enabled: false, kind: "rain", matchSky: false };

let cached: AmbientSettings | null = null;
let cachedRaw: string | null = null;
const listeners = new Set<() => void>();

export function readAmbient(): AmbientSettings {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    // Storage blocked: fall back to defaults.
  }
  if (cached && raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    const parsed = raw ? (JSON.parse(raw) as Partial<AmbientSettings>) : {};
    cached = {
      enabled: parsed.enabled === true,
      kind: parsed.kind === "room" || parsed.kind === "hum" ? parsed.kind : "rain",
      matchSky: parsed.matchSky === true,
    };
  } catch {
    cached = DEFAULT_AMBIENT;
  }
  return cached;
}

export function writeAmbient(patch: Partial<AmbientSettings>) {
  const next = { ...readAmbient(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Ignore: the setting just won't persist.
  }
  cached = next;
  cachedRaw = JSON.stringify(next);
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useAmbientSettings(): AmbientSettings {
  return useSyncExternalStore(subscribe, readAmbient, () => DEFAULT_AMBIENT);
}

/** The sound that suits the current sky. */
export function weatherToAmbient(weather: Weather | null): AmbientKind {
  if (weather === "drizzle" || weather === "storm") return "rain";
  if (weather === "breaking") return "hum";
  return "room";
}
