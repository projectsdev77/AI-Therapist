"use client";

import { useSyncExternalStore } from "react";

/** The design's breakpoint: phone layout below ~720px, desktop at and above. */
export const DESKTOP_QUERY = "(min-width: 720px)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(DESKTOP_QUERY).matches, () => false);
}
