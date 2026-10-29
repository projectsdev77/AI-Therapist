"use client";

import { useSyncExternalStore } from "react";

/** The design's breakpoint: phone layout below ~720px, desktop at and above. */
export const DESKTOP_QUERY = "(min-width: 720px)";
/** The desktop app shell (sidebar + content + panel), from the desktop handoff (v3). */
export const WIDE_QUERY = "(min-width: 1024px)";
/** Full sidebar and an always-visible side panel; below this the shell is compact. */
export const FULL_QUERY = "(min-width: 1280px)";

function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useIsDesktop = () => useMedia(DESKTOP_QUERY);
/** 1024px and up: the desktop app shell. */
export const useIsWide = () => useMedia(WIDE_QUERY);
/** 1280px and up: the full shell (otherwise compact: icon sidebar, panel behind a toggle). */
export const useIsFull = () => useMedia(FULL_QUERY);
