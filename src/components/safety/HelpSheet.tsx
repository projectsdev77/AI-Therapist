"use client";

import { Sheet } from "@/components/ui/Sheet";
import { PhoneIcon } from "@/components/ui/icons";
import { useStore } from "@/lib/data/StoreProvider";
import { callLabel, INTERNATIONAL, REGIONS, resourcesFor, smsHref, textLabel } from "@/lib/safety/resources";
import { useRegion } from "@/lib/safety/useRegion";

const act =
  "press flex min-h-11 items-center justify-center rounded-pill border border-[rgba(220,207,255,.45)] px-3 text-center text-[14px] font-semibold text-care no-underline hover:bg-care-surface hover:text-care";

export const HELP_TITLE = "Talk to a person now";
export const HELP_SUBTITLE = "You deserve support. These are free and confidential.";

/** "Talk to a person now": the emergency number first, then the region's lines, then the region picker. */
export function HelpSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title={HELP_TITLE} subtitle={HELP_SUBTITLE} care>
      <HelpContent />
    </Sheet>
  );
}

/** The help body, shared by the phone sheet and the desktop side panel. */
export function HelpContent({ footer = "Free, confidential, any time. Closing this keeps our conversation right where it was." }: { footer?: string }) {
  const { updateProfile } = useStore();
  const region = useRegion();
  const res = resourcesFor(region);
  const emergencyNumber = /^\d+$/.test(res.emergency);

  return (
    <>
      {emergencyNumber ? (
        <a
          href={`tel:${res.emergency}`}
          className="press flex min-h-14 items-center gap-3 rounded-md bg-care px-[18px] text-base font-semibold text-on-care no-underline hover:text-on-care"
        >
          <PhoneIcon size={18} />
          <span className="flex-1">In immediate danger? Call {res.emergency}</span>
        </a>
      ) : (
        <p className="m-0 rounded-md bg-care-surface px-[18px] py-3.5 text-base font-semibold text-care">In immediate danger? Call {res.emergency}.</p>
      )}
      {res.lines.map((line) => (
        <div key={line.name} className="flex flex-col gap-2.5 rounded-md border border-edge-hi bg-glass px-4 py-3.5">
          <span className="flex flex-col">
            <strong className="text-base font-semibold">{line.name}</strong>
            <span className="text-sm text-muted">{line.description}</span>
          </span>
          <span className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
            {line.call && (
              <a href={`tel:${line.call}`} className={act}>
                {callLabel(line)}
              </a>
            )}
            {line.text && (
              <a href={smsHref(line.text)} className={act}>
                {textLabel(line)}
              </a>
            )}
            {line.url && (
              <a href={line.url} target="_blank" rel="noreferrer" className={act}>
                {line.display}
              </a>
            )}
          </span>
        </div>
      ))}
      <label className="press relative flex min-h-[52px] cursor-pointer items-center justify-between rounded-sm border border-edge-lo px-4 text-[15px] hover:bg-glass">
        <span>
          Showing lines for <strong className="font-semibold">{res.name}</strong>
        </span>
        <span className="font-medium text-accent-strong">Change</span>
        <select
          value={res.code}
          onChange={(e) => void updateProfile({ region: e.target.value })}
          aria-label="Region for crisis lines"
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {[...REGIONS, INTERNATIONAL].map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <p className="m-0 text-sm text-muted">{footer}</p>
    </>
  );
}
