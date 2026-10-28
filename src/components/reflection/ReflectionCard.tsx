"use client";

import type { ReactNode } from "react";
import { CloseIcon } from "@/components/ui/icons";
import { WEATHER_LABELS } from "@/lib/conversation/types";
import type { Reflection } from "@/lib/data/types";
import { skyGradient } from "@/lib/design/skies";
import { CARD_LIMITS, type CardEdit } from "@/lib/reflection/edit";

const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" });
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

function SkyHeader({ reflection, editing }: { reflection: Reflection; editing?: boolean }) {
  const d = new Date(reflection.createdAt);
  return (
    <div className="relative h-[132px]" style={{ background: skyGradient(reflection.weather) }}>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "radial-gradient(60% 80% at 80% 0%, rgba(255,255,255,.3), transparent 60%), linear-gradient(180deg, transparent 30%, rgba(8,24,34,.6))" }}
      />
      <div className="absolute inset-x-5 bottom-3.5 flex justify-between gap-3 text-[14px] font-medium">
        <span>
          {dateFmt.format(d)} · {timeFmt.format(d)}
        </span>
        <span>{WEATHER_LABELS[reflection.weather]}</span>
      </div>
      {editing && <span className="absolute top-3.5 left-4 rounded-pill bg-[rgba(8,24,34,.7)] px-2.5 py-1 text-[13px] font-semibold">Editing</span>}
    </div>
  );
}

/** A conversation folded into a card: sky header, title, the person's words, one insight, an optional next step, tags. */
export function ReflectionCard({ reflection, id }: { reflection: Reflection; id?: string }) {
  return (
    <article id={id} aria-labelledby={`${id ?? "card"}-title`} className="overflow-hidden rounded-lg border border-edge-hi bg-glass backdrop-blur-[18px]">
      <SkyHeader reflection={reflection} />
      <div className="flex flex-col gap-[18px] px-[22px] pt-[22px] pb-6">
        <h1 id={`${id ?? "card"}-title`} className="t-card m-0">
          {reflection.title}
        </h1>
        {reflection.quotes.length > 0 && (
          <section aria-label="In your words" className="flex flex-col gap-2.5 border-l-2 border-[rgba(143,240,232,.4)] pl-3.5">
            {reflection.quotes.map((q) => (
              <p key={q} className="m-0 text-[18px] leading-[1.4]">
                &ldquo;{q}&rdquo;
              </p>
            ))}
          </section>
        )}
        <p className="m-0 text-base text-muted">{reflection.insight}</p>
        {reflection.nextStep && (
          <div className="flex flex-col gap-0.5 rounded-md bg-glass-strong px-4 py-3.5">
            <span className="text-[13px] font-semibold text-accent-strong">A small next step</span>
            <span className="text-base">{reflection.nextStep}</span>
          </div>
        )}
        {reflection.themes.length > 0 && (
          <ul aria-label="Themes" className="m-0 flex list-none flex-wrap gap-1.5 p-0">
            {reflection.themes.map((t) => (
              <li key={t} className="rounded-pill bg-glass px-3 py-[5px] text-[13px] text-muted capitalize">
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

function Field({ label, count, children, onRemove, removeLabel }: { label: string; count?: string; children: ReactNode; onRemove?: () => void; removeLabel?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex justify-between text-[13px] font-semibold text-muted">
        {label}
        {count && <span className="font-normal text-faint">{count}</span>}
      </span>
      <span className="flex items-start gap-1">
        {children}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onRemove();
            }}
            aria-label={removeLabel}
            className="press flex h-12 w-11 shrink-0 items-center justify-center rounded-sm text-muted hover:bg-glass hover:text-text"
          >
            <CloseIcon size={18} strokeWidth={1.7} />
          </button>
        )}
      </span>
    </label>
  );
}

const field =
  "min-h-12 flex-1 resize-none rounded-sm border border-edge-hi bg-field px-3.5 py-[11px] text-base leading-[1.35] text-text focus:border-[rgba(143,240,232,.6)] focus:outline-none field-sizing-content";

/** Edit mode: every part of the card becomes a field. Quotes and the next step can be removed. */
export function ReflectionCardEditor({ reflection, draft, onChange }: { reflection: Reflection; draft: Required<CardEdit>; onChange: (d: Required<CardEdit>) => void }) {
  const left = CARD_LIMITS.title - draft.title.length;
  return (
    <article aria-label="Editing this card" className="overflow-hidden rounded-lg border border-[rgba(143,240,232,.45)] bg-glass backdrop-blur-[18px]">
      <SkyHeader reflection={reflection} editing />
      <div className="flex flex-col gap-4 px-[18px] pt-[18px] pb-[22px]">
        <Field label="Title" count={`${left} left`}>
          <textarea
            rows={1}
            value={draft.title}
            maxLength={CARD_LIMITS.title}
            onChange={(e) => onChange({ ...draft, title: e.target.value })}
            className={`${field} border-[rgba(143,240,232,.6)] text-[22px] font-semibold tracking-[-0.02em]`}
          />
        </Field>
        {draft.quotes.map((q, i) => (
          <Field
            key={i}
            label="What you said"
            onRemove={() => onChange({ ...draft, quotes: draft.quotes.filter((_, j) => j !== i) })}
            removeLabel={`Remove quote ${i + 1}`}
          >
            <textarea
              rows={1}
              value={q}
              maxLength={CARD_LIMITS.quote}
              onChange={(e) => onChange({ ...draft, quotes: draft.quotes.map((x, j) => (j === i ? e.target.value : x)) })}
              className={field}
            />
          </Field>
        ))}
        <Field label="What I noticed">
          <textarea
            rows={2}
            value={draft.insight}
            maxLength={CARD_LIMITS.insight}
            onChange={(e) => onChange({ ...draft, insight: e.target.value })}
            className={field}
          />
        </Field>
        {draft.nextStep !== null && (
          <Field label="A small next step" onRemove={() => onChange({ ...draft, nextStep: null })} removeLabel="Remove the next step">
            <textarea
              rows={1}
              value={draft.nextStep}
              maxLength={CARD_LIMITS.nextStep}
              onChange={(e) => onChange({ ...draft, nextStep: e.target.value })}
              className={field}
            />
          </Field>
        )}
      </div>
    </article>
  );
}
