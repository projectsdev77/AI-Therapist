"use client";

import { HelpIcon, PhoneIcon } from "@/components/ui/icons";
import { resourcesFor, smsHref } from "@/lib/safety/resources";
import { useRegion } from "@/lib/safety/useRegion";

/** Elevated risk (or after "I'm safe right now"): a lilac pill under the reply that opens Get help. Offered, never forced. */
export function SupportPill({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      className="press flex min-h-11 items-center gap-2 rounded-pill border border-care-edge bg-care-surface px-4 text-[15px] font-semibold text-care"
    >
      <HelpIcon size={15} />
      Support options
    </button>
  );
}

/**
 * Acute risk: a care panel that opens on its own, with the region's main line to call or
 * text. It never covers the composer, so the conversation keeps going.
 */
export function CarePanel({ onSafe }: { onSafe: () => void }) {
  const region = useRegion();
  const res = resourcesFor(region);
  const line = res.lines[0];
  const number = line?.callDisplay ?? line?.call;

  return (
    <section
      aria-labelledby="care-title"
      className="panel-in flex w-[min(640px,calc(100%-32px))] shrink-0 flex-col gap-3 self-center rounded-md border border-[rgba(220,207,255,.3)] px-[18px] py-4"
      style={{ background: "linear-gradient(160deg, rgba(220,207,255,.14), rgba(10,20,50,.4))" }}
    >
      <div className="flex flex-col gap-0.5">
        <h2 id="care-title" aria-live="assertive" className="m-0 text-[17px] font-semibold text-care">
          You don&apos;t have to carry this alone
        </h2>
        <p className="m-0 text-[15px] text-muted">You can talk to a person right now, free and any time. I&apos;ll stay right here.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {line?.call ? (
          <a
            href={`tel:${line.call}`}
            className="press flex min-h-12 items-center justify-center gap-2 rounded-pill bg-care text-[15px] font-semibold text-on-care no-underline hover:text-on-care"
          >
            <PhoneIcon size={16} />
            Call {number}
          </a>
        ) : (
          <a
            href={line?.url ?? "https://findahelpline.com"}
            target="_blank"
            rel="noreferrer"
            className="press col-span-2 flex min-h-12 items-center justify-center rounded-pill bg-care text-[15px] font-semibold text-on-care no-underline hover:text-on-care"
          >
            Find a helpline
          </a>
        )}
        {line?.call && line.text ? (
          <a
            href={smsHref(line.text)}
            className="press flex min-h-12 items-center justify-center rounded-pill border border-[rgba(220,207,255,.5)] text-[15px] font-semibold text-care no-underline hover:text-care"
          >
            Text {line.text.to}
          </a>
        ) : line?.call ? (
          <a
            href={`tel:${res.emergency}`}
            className="press flex min-h-12 items-center justify-center rounded-pill border border-[rgba(220,207,255,.5)] text-[15px] font-semibold text-care no-underline hover:text-care"
          >
            Call {res.emergency}
          </a>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onSafe}
        className="min-h-11 self-start bg-transparent px-1 text-[15px] text-text underline decoration-[rgba(239,252,250,.35)] underline-offset-[3px]"
      >
        I&apos;m safe right now
      </button>
    </section>
  );
}
