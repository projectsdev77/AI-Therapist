"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useStore } from "@/lib/data/StoreProvider";
import type { SessionMode } from "@/lib/data/types";
import { setOpening, type Opening } from "./opening";

/** Opens the consent sheet first if needed, then goes to /talk in the chosen mode. */
export function useStartConversation() {
  const router = useRouter();
  const { profile } = useStore();
  const [pendingMode, setPendingMode] = useState<SessionMode | null>(null);

  /** With an opening (desktop Home's text box or a starter), the conversation begins with those words. */
  const start = useCallback(
    (mode: SessionMode, opening?: Opening) => {
      if (opening) setOpening(opening);
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
