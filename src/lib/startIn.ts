"use client";

import { useSyncExternalStore } from "react";
import type { SessionMode } from "@/lib/data/types";

/** Desktop "Start in": what New conversation opens. Per device; writing by default. */
const KEY = "haven:start-in";
const listeners = new Set<() => void>();

function read(): SessionMode {
  try {
    return localStorage.getItem(KEY) === "voice" ? "voice" : "text";
  } catch {
    return "text";
  }
}

export function setStartIn(mode: SessionMode) {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* private mode: keep the default */
  }
  listeners.forEach((l) => l());
}

export function useStartIn(): SessionMode {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => "text",
  );
}
