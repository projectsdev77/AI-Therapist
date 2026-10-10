"use client";

import { REGIONS, INTERNATIONAL, resourcesFor, smsHref } from "@/lib/safety/resources";
import { MessageIcon, PhoneIcon } from "@/components/ui/icons";

export interface CrisisResourcesProps {
  region: string | null;
  onRegionChange?: (code: string) => void;
  compact?: boolean;
}

export function CrisisResources({ region, onRegionChange, compact = false }: CrisisResourcesProps) {
  const res = resourcesFor(region);
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {res.lines.map((line) => (
          <li key={line.name} className="rounded-md border border-border bg-care-surface p-4">
            <p className="font-medium">{line.name}</p>
            {!compact && <p className="text-sm text-muted">{line.description}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {line.call && (
                <a href={`tel:${line.call}`} className="inline-flex h-11 items-center gap-2 rounded-pill bg-care px-4 font-medium text-bg">
                  <PhoneIcon size={18} /> Call
                </a>
              )}
              {line.text && (
                <a href={smsHref(line.text)} className="inline-flex h-11 items-center gap-2 rounded-pill border border-care px-4 font-medium text-care">
                  <MessageIcon size={18} /> Text
                </a>
              )}
              {line.url && (
                <a href={line.url} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center rounded-pill border border-care px-4 font-medium text-care">
                  {line.display}
                </a>
              )}
            </div>
            {(line.call || line.text) && <p className="mt-2 text-sm text-muted">{line.display}</p>}
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted">
        In immediate danger? Call <strong className="text-text">{res.emergency}</strong>.
      </p>
      {onRegionChange && (
        <label className="flex items-center gap-2 text-sm text-muted">
          Showing help for
          <select
            value={res.code}
            onChange={(e) => onRegionChange(e.target.value)}
            className="rounded-sm border border-border bg-surface px-2 py-1 text-text"
          >
            {[...REGIONS, INTERNATIONAL].map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
