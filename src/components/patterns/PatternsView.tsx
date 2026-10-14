"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/shell/PageShell";
import { LinkButton } from "@/components/ui/Button";
import { useStore } from "@/lib/data/StoreProvider";
import type { Reflection } from "@/lib/data/types";
import { buildConstellation } from "@/lib/patterns/constellation";

const dateFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

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

  const constellation = useMemo(
    () => buildConstellation((reflections ?? []).map((r) => ({ themes: r.themes, sessionId: r.sessionId, createdAt: r.createdAt }))),
    [reflections],
  );
  const pos = new Map(constellation.stars.map((s) => [s.id, s]));
  const maxCount = Math.max(1, ...constellation.stars.map((s) => s.count));
  const selectedStar = selected ? pos.get(selected) : undefined;
  const selectedReflections = (reflections ?? []).filter((r) => selectedStar?.sessionIds.includes(r.sessionId));

  return (
    <PageShell title="Your patterns" subtitle="Things you keep coming back to, and how they connect." >
      {reflections && reflections.length < 2 ? (
        <div className="flex flex-col items-start gap-4">
          <p className="text-muted">Patterns appear after a couple of conversations. Each one adds stars to your sky.</p>
          <LinkButton href="/talk?mode=voice" variant="primary">
            Start talking
          </LinkButton>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_18rem]">
          <div
            className="relative aspect-square overflow-hidden rounded-lg border border-border"
            style={{ background: "radial-gradient(circle at 50% 35%, var(--night-top), var(--night-bottom) 80%)" }}
          >
            <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" role="group" aria-label="Theme constellation">
              {constellation.links.map((l) => {
                const a = pos.get(l.a)!;
                const b = pos.get(l.b)!;
                const active = selected === l.a || selected === l.b;
                return (
                  <line
                    key={`${l.a}-${l.b}`}
                    x1={a.x * 100}
                    y1={a.y * 100}
                    x2={b.x * 100}
                    y2={b.y * 100}
                    stroke="var(--night-line)"
                    strokeOpacity={active ? 0.6 : 0.12 + Math.min(l.weight, 4) * 0.06}
                    strokeWidth={active ? 0.35 : 0.2}
                  />
                );
              })}
              {constellation.stars.map((s) => {
                const r = 0.9 + (s.count / maxCount) * 1.8;
                const isSel = selected === s.id;
                return (
                  <g
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSel}
                    aria-label={`${s.id}: ${s.count} conversation${s.count === 1 ? "" : "s"}`}
                    onClick={() => setSelected(isSel ? null : s.id)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSelected(isSel ? null : s.id))}
                    className="cursor-pointer focus:outline-none"
                  >
                    <circle cx={s.x * 100} cy={s.y * 100} r={r * 3} fill="var(--night-glow)" opacity={0.1 + s.recency * 0.15} pointerEvents="none" />
                    <circle cx={s.x * 100} cy={s.y * 100} r={Math.max(r + 1.5, 3.5)} fill="transparent" />
                    <circle cx={s.x * 100} cy={s.y * 100} r={r} fill="var(--night-star)" opacity={0.55 + s.recency * 0.45} />
                    {isSel && <circle cx={s.x * 100} cy={s.y * 100} r={r + 1.2} fill="none" stroke="var(--color-focus)" strokeWidth={0.3} />}
                    <text
                      x={s.x * 100}
                      y={s.y * 100 + r + 3.2}
                      textAnchor="middle"
                      fontSize={2.6}
                      fill="var(--night-label)"
                      opacity={isSel ? 1 : 0.75}
                      pointerEvents="none"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {s.id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <aside aria-live="polite">
            {selectedStar ? (
              <>
                <h2 className="font-display text-2xl">{selectedStar.id}</h2>
                <p className="mt-1 text-sm text-muted">
                  Came up in {selectedStar.count} conversation{selectedStar.count === 1 ? "" : "s"}.
                </p>
                <ul className="mt-4 flex flex-col gap-2">
                  {selectedReflections.map((r) => (
                    <li key={r.id}>
                      <Link href={`/history/${r.sessionId}`} className="block rounded-md border border-border p-3 hover:bg-surface">
                        <p className="text-xs text-faint">{dateFmt.format(new Date(r.createdAt))}</p>
                        <p className="font-display">{r.title}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-muted">
                Each star is something you&apos;ve talked about. Bigger stars come up more often, brighter ones more recently, and lines
                connect things you talked about together. Tap a star to see those conversations.
              </p>
            )}
          </aside>
        </div>
      )}
    </PageShell>
  );
}
