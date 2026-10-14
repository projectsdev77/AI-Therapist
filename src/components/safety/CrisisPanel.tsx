"use client";

import { HelpIcon } from "@/components/ui/icons";
import type { RiskLevel } from "@/lib/conversation/types";
import { callLabel, resourcesFor, smsHref } from "@/lib/safety/resources";
import { useRegion } from "@/lib/safety/useRegion";

export interface CrisisPanelProps {
  risk: RiskLevel;
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  /** Opens the full Get help sheet. */
  onMoreOptions: () => void;
}

const pill = "inline-flex min-h-11 items-center rounded-pill px-5 text-[15px] font-medium";

/**
 * Non-modal support panel between the captions and the composer. Never covers either.
 * Elevated: an outlined "Support options" pill that expands. Acute: opens on its own;
 * after "I'm safe right now" it stays as a filled "Talk to someone now" pill.
 */
export function CrisisPanel({ risk, expanded, onExpand, onCollapse, onMoreOptions }: CrisisPanelProps) {
  const region = useRegion();
  const res = resourcesFor(region);
  const line = res.lines[0];
  const acute = risk === "acute";

  if (!expanded) {
    return acute ? (
      <button type="button" onClick={onExpand} className={`${pill} gap-2 self-start bg-care-strong text-on-care`}>
        <HelpIcon size={16} /> Talk to someone now
      </button>
    ) : (
      <button type="button" onClick={onExpand} className={`${pill} gap-2 self-start border border-care bg-care-surface text-care`}>
        <HelpIcon size={16} /> Support options
      </button>
    );
  }

  return (
    <section aria-label="Support options" className="panel-in flex flex-col gap-2 rounded-lg bg-care-surface px-4 pt-3.5 pb-1.5">
      <div className="flex flex-col gap-1">
        <h2 className="text-[19px] font-medium" aria-live="assertive">
          {acute ? "Please reach out to someone now." : "You don't have to carry this alone."}
        </h2>
        <p className="text-[15px] text-muted text-pretty">
          {acute
            ? "A person can be with you tonight. I'll stay right here while you call."
            : "If it feels like too much, someone is there to listen, any time. I'm still here too."}
        </p>
      </div>
      {line && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-[150px] flex-1 text-[15px] font-medium">
            {line.shortName ?? line.name} <span className="font-normal text-muted">· free, 24/7</span>
          </span>
          {line.call && (
            <a href={`tel:${line.call}`} className={`${pill} bg-care-strong text-on-care`}>
              {callLabel(line)}
            </a>
          )}
          {line.text && (
            <a href={smsHref(line.text)} className={`${pill} border border-care text-care`}>
              Text
            </a>
          )}
          {line.url && (
            <a href={line.url} target="_blank" rel="noreferrer" className={`${pill} bg-care-strong text-on-care`}>
              {line.display}
            </a>
          )}
        </div>
      )}
      <div className="-mx-2 -mt-1 flex items-center justify-between">
        <button type="button" onClick={onMoreOptions} className="min-h-11 px-2 text-[15px] font-medium text-care">
          More options
        </button>
        <button type="button" onClick={onCollapse} className="min-h-11 px-2 text-[15px] text-muted">
          {acute ? "I'm safe right now" : "Not now"}
        </button>
      </div>
    </section>
  );
}
