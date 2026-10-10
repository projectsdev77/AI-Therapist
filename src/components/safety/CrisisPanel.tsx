"use client";

import { Button } from "@/components/ui/Button";
import { HeartHandIcon } from "@/components/ui/icons";
import type { RiskLevel } from "@/lib/conversation/types";
import { useStore } from "@/lib/data/StoreProvider";
import { useRegion } from "@/lib/safety/useRegion";
import { CrisisResources } from "./CrisisResources";

export interface CrisisPanelProps {
  risk: RiskLevel;
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
}

/**
 * Non-modal support panel shown during a conversation when risk is elevated or acute.
 * It never blocks the conversation; the companion stays present.
 */
export function CrisisPanel({ risk, expanded, onExpand, onCollapse }: CrisisPanelProps) {
  const { updateProfile } = useStore();
  const region = useRegion();

  if (!expanded) {
    return (
      <button
        onClick={onExpand}
        className="mx-auto flex items-center gap-2 rounded-pill border border-care bg-care-surface px-4 py-2 text-sm font-medium text-care backdrop-blur"
      >
        <HeartHandIcon size={18} /> Support options
      </button>
    );
  }

  return (
    <section
      role="region"
      aria-label="Support options"
      className="w-full rounded-lg border border-care bg-bg/95 p-4 shadow-2xl backdrop-blur sm:p-5"
    >
      <h2 className="font-display text-xl" aria-live="assertive">
        {risk === "acute" ? "Please reach out to someone now" : "You don't have to carry this alone"}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {risk === "acute"
          ? "If you might act on these thoughts or you're not safe, talk to a person who can help right now. It's free and confidential."
          : "If things feel like too much, these people are there to listen any time, day or night."}
      </p>
      <div className="mt-4">
        <CrisisResources region={region} onRegionChange={(code) => updateProfile({ region: code })} compact />
      </div>
      <div className="mt-3 flex justify-end">
        <Button variant="ghost" onClick={onCollapse}>
          {risk === "acute" ? "I'm safe right now" : "Not now"}
        </Button>
      </div>
    </section>
  );
}
