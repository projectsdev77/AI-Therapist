"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const UNDO_MS = 6000;

/**
 * Forget with Undo (README "Undo for Forget: 6s, then commit"). A forgotten note shows as
 * "Forgotten." with Undo; after 6s, or when the page goes away, the delete is committed.
 */
export function usePendingForget(commit: (id: string) => Promise<void>) {
  const [pending, setPending] = useState<string[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const commitRef = useRef(commit);
  useEffect(() => {
    commitRef.current = commit;
  });

  const finish = useCallback((id: string) => {
    timers.current.delete(id);
    setPending((p) => p.filter((x) => x !== id));
    void commitRef.current(id);
  }, []);

  const forget = useCallback(
    (id: string) => {
      if (timers.current.has(id)) return;
      setPending((p) => [...p, id]);
      timers.current.set(
        id,
        setTimeout(() => finish(id), UNDO_MS),
      );
    },
    [finish],
  );

  const undo = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setPending((p) => p.filter((x) => x !== id));
  }, []);

  // Leaving the page commits whatever is still waiting.
  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const [id, t] of map) {
        clearTimeout(t);
        void commitRef.current(id);
      }
      map.clear();
    };
  }, []);

  return { pending, forget, undo };
}
