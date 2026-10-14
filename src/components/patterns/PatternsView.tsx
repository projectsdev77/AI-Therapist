"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Backdrop } from "@/components/shell/Backdrop";
import { TopBar } from "@/components/shell/TopBar";
import { LinkButton } from "@/components/ui/Button";
import { useStore } from "@/lib/data/StoreProvider";
import type { Reflection } from "@/lib/data/types";
import { buildConstellation } from "@/lib/patterns/constellation";

const dateFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** A night garden in both themes. Brighter means more often. */
export function PatternsView() {
  const { store } = useStore();
  const [reflections, setReflections] = useState<Reflection[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    store.listReflections(500).then((r) => !cancelled && setReflections(r));
    return () => {
      cancelled = true;
    };
  }, [store]);

  const { stars, links } = useMemo(
    () => buildConstellation((reflections ?? []).map((r) => ({ themes: r.themes, sessionId: r.sessionId, createdAt: r.createdAt }))),
    [reflections],
  );
  const pos = new Map(stars.map((s) => [s.id, s]));
  const maxCount = Math.max(1, ...stars.map((s) => s.count));
  // Default to the theme that comes up most.
  const current = selected ?? [...stars].sort((a, b) => b.count - a.count)[0]?.id ?? null;
  const currentStar = current ? pos.get(current) : undefined;
  const items = (reflections ?? []).filter((r) => currentStar?.sessionIds.includes(r.sessionId));

  return (
    <div className="relative flex min-h-dvh flex-col text-night-label" data-theme="dark">
      <Backdrop weather={null} night />
      <TopBar back />
      <div className="relative mx-auto w-full max-w-[640px] px-4 pt-3">
        <h1 className="heading text-night-star">
          Your <span className="accent">patterns</span>
        </h1>
        <p className="mt-1 text-night-label">Things that keep coming up. Brighter means more often.</p>
      </div>

      {reflections && reflections.length < 2 ? (
        <div className="relative mx-auto flex w-full max-w-[640px] flex-col items-start gap-4 px-4 pt-8">
          <p>Patterns appear after a couple of conversations. Each one adds stars to your sky.</p>
          <LinkButton href="/talk?mode=voice" variant="primary">
            Start talking
          </LinkButton>
        </div>
      ) : (
        <>
          <div className="relative mx-auto min-h-[300px] w-full max-w-[640px] flex-1">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden className="absolute inset-0 size-full">
              {links.map((l) => {
                const a = pos.get(l.a)!;
                const b = pos.get(l.b)!;
                const active = current === l.a || current === l.b;
                return (
                  <line
                    key={`${l.a}-${l.b}`}
                    x1={a.x * 100}
                    y1={a.y * 100}
                    x2={b.x * 100}
                    y2={b.y * 100}
                    stroke="var(--night-line)"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                    opacity={active ? 0.7 : 0.3}
                  />
                );
              })}
            </svg>
            {stars.map((s) => {
              const f = s.count / maxCount;
              const size = 5 + 5 * f;
              const isSel = current === s.id;
              // Stars near the right edge put their label on the left so it never clips.
              const labelLeft = s.x > 0.68;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={isSel}
                  aria-label={`${capitalize(s.id)}, ${s.count} conversation${s.count === 1 ? "" : "s"}`}
                  onClick={() => setSelected(s.id)}
                  className={`absolute flex min-h-11 min-w-11 -translate-y-[22px] flex-col ${labelLeft ? "translate-x-[22px] items-end" : "-translate-x-[22px] items-start"}`}
                  style={labelLeft ? { right: `${(1 - s.x) * 100}%`, top: `${s.y * 100}%` } : { left: `${s.x * 100}%`, top: `${s.y * 100}%` }}
                >
                  <span className="flex size-11 items-center justify-center">
                    <span
                      className="block rounded-full bg-night-star"
                      style={{
                        width: size,
                        height: size,
                        opacity: 0.6 + 0.4 * s.recency,
                        boxShadow: `0 0 ${8 + 16 * f}px ${1 + 5 * f}px var(--night-glow)`,
                      }}
                    />
                  </span>
                  <span className={`-mt-2 text-sm whitespace-nowrap ${labelLeft ? "mr-3" : "ml-3"} ${isSel ? "font-medium text-night-star" : ""}`}>{capitalize(s.id)}</span>
                </button>
              );
            })}
          </div>

          {currentStar && (
            <section
              aria-live="polite"
              className="relative mx-auto flex w-full max-w-[640px] flex-col gap-1.5 rounded-t-lg bg-[rgba(244,246,232,0.07)] px-4 pt-[18px] pb-[30px]"
            >
              <h2 className="text-sm">
                {capitalize(currentStar.id)} · {currentStar.count} conversation{currentStar.count === 1 ? "" : "s"}
              </h2>
              <ul>
                {items.map((r, i) => (
                  <li key={r.id}>
                    <Link
                      href={`/history/${r.sessionId}`}
                      className={`flex min-h-11 items-center justify-between gap-3 text-night-star ${
                        i < items.length - 1 ? "border-b border-[rgba(244,246,232,0.12)]" : ""
                      }`}
                    >
                      {r.title}
                      <span className="shrink-0 text-sm text-night-label">{dateFmt.format(new Date(r.createdAt))}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
