"use client";

import { ChevronDownIcon, GlobeIcon } from "@/components/ui/icons";
import { callLabel, INTERNATIONAL, linesWithEmergency, REGIONS, resourcesFor, smsHref, textLabel } from "@/lib/safety/resources";

const action = "inline-flex min-h-11 items-center rounded-pill px-5 text-[15px] font-medium";

export function RegionPicker({ region, onChange }: { region: string | null; onChange: (code: string) => void }) {
  const res = resourcesFor(region);
  return (
    <label className="relative inline-flex min-h-11 items-center gap-2 self-start rounded-pill border border-border bg-surface pr-3 pl-3.5 text-[15px] shadow-soft">
      <GlobeIcon size={16} />
      <span className="sr-only">Showing help for</span>
      <span aria-hidden>{res.name}</span>
      <ChevronDownIcon size={14} />
      <select
        value={res.code}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Region for crisis lines"
      >
        {[...REGIONS, INTERNATIONAL].map((r) => (
          <option key={r.code} value={r.code}>
            {r.name}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Crisis lines for a region: filled Call, outlined Text. */
export function CrisisResources({ region }: { region: string | null }) {
  const res = resourcesFor(region);
  const lines = linesWithEmergency(res);
  return (
    <ul className="flex flex-col gap-3">
      {lines.map((line) => (
        <li key={line.name} className="flex flex-col gap-2.5 rounded-md bg-care-surface px-4 py-3.5">
          <div>
            <p className="font-medium">{line.name}</p>
            <p className="text-sm text-muted">{line.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {line.call && (
              <a href={`tel:${line.call}`} className={`${action} bg-care-strong text-on-care`}>
                {callLabel(line)}
              </a>
            )}
            {line.text &&
              (line.call ? (
                <a href={smsHref(line.text)} className={`${action} border border-care text-care`}>
                  {textLabel(line)}
                </a>
              ) : (
                <a href={smsHref(line.text)} className={`${action} bg-care-strong text-on-care`}>
                  {textLabel(line)}
                </a>
              ))}
            {line.url && (
              <a href={line.url} target="_blank" rel="noreferrer" className={`${action} bg-care-strong text-on-care`}>
                {line.display}
              </a>
            )}
          </div>
        </li>
      ))}
      {!/^\d+$/.test(res.emergency) && (
        <li className="px-1 text-sm text-muted">In immediate danger? Call {res.emergency}.</li>
      )}
    </ul>
  );
}
