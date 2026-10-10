"use client";

import { useSyncExternalStore } from "react";
import { useStore } from "@/lib/data/StoreProvider";
import { guessRegion } from "./resources";

const noop = () => () => {};

/** The user's region for crisis resources: saved choice, else browser locale. Hydration-safe. */
export function useRegion(): string | null {
  const { profile } = useStore();
  const guessed = useSyncExternalStore(noop, guessRegion, () => null);
  return profile?.region ?? guessed;
}
