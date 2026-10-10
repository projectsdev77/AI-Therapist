"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useStore } from "@/lib/data/StoreProvider";
import type { SessionMode } from "@/lib/data/types";

/** Opens the consent sheet first if needed, then goes to /talk in the chosen mode. */
export function useStartConversation() {
  const router = useRouter();
  const { profile } = useStore();
  const [pendingMode, setPendingMode] = useState<SessionMode | null>(null);

  const start = useCallback(
    (mode: SessionMode) => {
      if (profile?.consentedAt) router.push(`/talk?mode=${mode}`);
      else setPendingMode(mode);
    },
    [profile, router],
  );

  const consentProps = {
    open: pendingMode !== null,
    onAccept: () => {
      const mode = pendingMode ?? "voice";
      setPendingMode(null);
      router.push(`/talk?mode=${mode}`);
    },
    onCancel: () => setPendingMode(null),
  };

  return { start, consentProps };
}
