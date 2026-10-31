"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Backdrop } from "@/components/shell/Backdrop";
import { TopBar } from "@/components/shell/TopBar";
import { Button, LinkButton } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { useStore } from "@/lib/data/StoreProvider";
import type { Reflection } from "@/lib/data/types";
import { skyGradient } from "@/lib/design/skies";
import { buildConstellation } from "@/lib/patterns/constellation";
import { HOME } from "@/lib/routes";
import { AppShell } from "@/components/shell/AppShell";
import { CloseIcon } from "@/components/ui/icons";
import { useIsWide } from "@/lib/useIsDesktop";

const dateFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Topics the person hid on this device.
const HIDDEN_KEY = "haven:hidden-topics";
const listeners = new Set<() => void>();
let hiddenCache: { raw: string | null; value: string[] } = { raw: null, value: [] };
function readHidden(): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(HIDDEN_KEY);
  } catch {
    // Storage blocked.
  }
  if (raw !== hiddenCache.raw) {
    let value: string[] = [];
    try {
      const parsed = JSON.parse(raw ?? "[]");
      value = Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
    } catch {
      value = [];
    }
    hiddenCache = { raw, value };
  }
  return hiddenCache.value;
}
function writeHidden(value: string[]) {
  try {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(value));
  } catch {
    // Ignore: it just won't stick.
  }
  listeners.forEach((l) => l());
}
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const EMPTY: string[] = [];

/** "Your patterns": a constellation of recurring topics (brighter = more often). */
export function PatternsView() {
  const router = useRouter();
  const { store } = useStore();
  const [reflections, setReflections] = useState<Reflection[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const hidden = useSyncExternalStore(subscribe, readHidden, () => EMPTY);

  useEffect(() => {
    let cancelled = false;
    store.listReflections(500).then((r) => !cancelled && setReflections(r));
    return () => {
      cancelled = true;
    };
  }, [store]);

  const { stars, links } = useMemo(
    () =>
      buildConstellation(
        (reflections ?? []).map((r) => ({ themes: r.themes.filter((t) => !hidden.includes(t)), sessionId: r.sessionId, createdAt: r.createdAt })),
      ),
    [reflections, hidden],
  );
  const pos = new Map(stars.map((s) => [s.id, s]));
  const maxCount = Math.max(1, ...stars.map((s) => s.count));
  const star = selected ? pos.get(selected) : undefined;
  const convos = (reflections ?? []).filter((r) => star?.sessionIds.includes(r.sessionId));
  // Stars sit in an 8%-padded box so labels stay on screen.
  const at = (v: number) => 8 + v * 84;

  const wide = useIsWide();
  // Nothing to show yet: just the gentle empty state, centred, with no title or footnotes.
  const empty = reflections !== null && stars.length === 0;
  const ranked = [...stars].sort((x, y) => y.count - x.count).slice(0, 8);
  const constellation = (
    <>
        {reflections && stars.length === 0 ? (
          <div className="m-auto flex max-w-[420px] flex-col items-center gap-3 px-5 py-10 text-center">
            <h1 className="m-0 text-[22px] font-semibold tracking-[-0.02em]">Your first stars are waiting</h1>
            <p className="m-0 text-[15px] text-muted">The things that matter to you will show up here as we talk.</p>
            <LinkButton href={HOME} variant="primary" size="lg" className="mt-1.5">
              Start a conversation
            </LinkButton>
          </div>
        ) : (
          <div className="relative mx-auto min-h-[340px] w-full max-w-[760px] flex-1">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden className="absolute inset-0 size-full">
              {links.map((l) => {
                const a = pos.get(l.a)!;
                const b = pos.get(l.b)!;
                return (
                  <line
                    key={`${l.a}-${l.b}`}
                    x1={at(a.x)}
                    y1={at(a.y)}
                    x2={at(b.x)}
                    y2={at(b.y)}
                    stroke="#8ff0e8"
                    strokeWidth={0.3 + Math.min(l.weight, 4) * 0.15}
                    opacity={0.35}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </svg>
            {stars.map((s) => {
              const f = s.count / maxCount;
              const size = Math.round(5 + f * 6);
              const on = s.id === selected;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`${capitalize(s.id)}, ${s.count} conversation${s.count === 1 ? "" : "s"}`}
                  aria-pressed={on}
                  aria-haspopup="dialog"
                  onClick={() => setSelected(s.id)}
                  className="absolute flex min-h-11 min-w-11 -translate-x-[22px] -translate-y-[22px] flex-col items-start bg-transparent p-0"
                  style={{ left: `${at(s.x)}%`, top: `${at(s.y)}%` }}
                >
                  <span className="flex size-11 items-center justify-center">
                    <span
                      className="rounded-full bg-[#effcfa]"
                      style={{
                        width: size,
                        height: size,
                        opacity: 0.55 + 0.45 * s.recency,
                        boxShadow: `0 0 ${8 + f * 16}px ${1 + f * 5}px rgba(111,240,230,.55)`,
                        outline: on ? "1.5px solid #8ff0e8" : "none",
                        outlineOffset: 6,
                      }}
                    />
                  </span>
                  <span className={`-mt-2 text-[14px] whitespace-nowrap ${on ? "font-semibold text-text" : "text-muted"}`}>{capitalize(s.id)}</span>
                </button>
              );
            })}
          </div>
        )}

    </>
  );
  const footer = (
        <div className="mx-auto mb-12 flex w-full max-w-[760px] flex-col items-start gap-1 px-6">
          <p className="m-0 text-[14px] text-muted">Only you can say what they mean.</p>
          {hidden.length > 0 && (
            <button type="button" onClick={() => writeHidden([])} className="min-h-11 bg-transparent px-0 text-[14px] text-accent-strong">
              Show {hidden.length} hidden {hidden.length === 1 ? "topic" : "topics"}
            </button>
          )}
        </div>
  );
  const topicBody = (
    <>
        <div className="flex flex-col">
          {convos.map((r, i) => (
            <Link
              key={r.id}
              href={`/history/${r.sessionId}`}
              className={`press flex min-h-[60px] items-center gap-3 px-1 text-text no-underline hover:bg-glass hover:text-text ${i ? "border-t border-edge-lo" : ""}`}
            >
              <span aria-hidden className="size-6 shrink-0 rounded-full" style={{ background: skyGradient(r.weather) }} />
              <span className="flex-1 text-base">{r.title}</span>
              <span className="text-[14px] text-muted">{dateFmt.format(new Date(r.createdAt))}</span>
            </Link>
          ))}
        </div>
        {star && (
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="lg" onClick={() => router.push(`/talk?mode=text&topic=${encodeURIComponent(star.id)}`)}>
              Talk about this
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                writeHidden([...hidden, star.id]);
                setSelected(null);
              }}
            >
              Hide this topic
            </Button>
          </div>
        )}
    </>
  );

  if (wide) {
    const panel =
      reflections && stars.length > 0 ? (
        star ? (
          <>
            <div className="flex items-start gap-2.5">
              <div className="flex flex-1 flex-col gap-0.5">
                <h2 className="m-0 text-[26px] font-semibold tracking-[-0.03em]">{capitalize(star.id)}</h2>
                <p className="m-0 text-[14px] text-muted">
                  Came up in {star.count} conversation{star.count === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close topic"
                onClick={() => setSelected(null)}
                className="press flex size-10 shrink-0 items-center justify-center rounded-full border border-edge-lo bg-glass text-text hover:bg-glass-strong"
              >
                <CloseIcon size={16} />
              </button>
            </div>
            <div className="[&>div:first-child]:overflow-hidden [&>div:first-child]:rounded-md [&>div:first-child]:border [&>div:first-child]:border-edge-hi [&>div:first-child]:bg-glass [&>div:first-child>a]:px-3.5">
              {topicBody}
            </div>
          </>
        ) : (
          <>
            <h2 className="m-0 text-[12px] font-semibold tracking-[.06em] text-faint uppercase">Most often</h2>
            <ol className="m-0 flex list-none flex-col gap-0.5 p-0">
              {ranked.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(r.id)}
                    className="press grid min-h-12 w-full grid-cols-[minmax(0,1fr)_90px_28px] items-center gap-2.5 rounded-[12px] px-3 text-left text-[14px] text-text hover:bg-glass"
                  >
                    <span className="truncate">{capitalize(r.id)}</span>
                    <span aria-hidden className="h-1.5 overflow-hidden rounded-[3px] bg-[rgba(255,255,255,.08)]">
                      <span className="block h-full bg-accent" style={{ width: `${(r.count / maxCount) * 100}%` }} />
                    </span>
                    <span className="text-right text-[13px] text-muted">{r.count}</span>
                  </button>
                </li>
              ))}
            </ol>
            <p className="m-0 mx-0.5 text-[12px] text-faint">Select a star or a topic to see where it came up.</p>
          </>
        )
      ) : undefined;
    return (
      <AppShell panel={panel} panelLabel={star ? capitalize(star.id) : "Most often"}>
        {empty ? (
          <div className="flex min-h-full flex-1 flex-col">{constellation}</div>
        ) : (
          <div className="flex min-h-full flex-col px-10 pt-8 pb-6">
            <div className="mx-auto flex w-full max-w-[880px] flex-col gap-1">
              <h1 className="m-0 text-[40px] leading-[1.1] font-semibold tracking-[-0.04em]">Your patterns</h1>
              <p className="m-0 text-muted">Things that keep coming up.</p>
            </div>
            <div className="mx-auto mt-3 flex min-h-[480px] w-full max-w-[880px] flex-1 flex-col">{constellation}</div>
            <div className="mx-auto w-full max-w-[880px] [&>div]:mb-0 [&>div]:px-0">{footer}</div>
          </div>
        )}
      </AppShell>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col">
      <Backdrop />
      <TopBar title={empty ? undefined : "Your patterns"} />
      <main className="relative z-[1] flex flex-1 flex-col">
        {!empty && (
          <div className="mx-auto w-full max-w-[760px] px-5 pt-4">
            <h1 className="t-page-h1 m-0 mb-1 hidden min-[720px]:block">Your patterns</h1>
            <p className="m-0 text-muted">Things that keep coming up.</p>
          </div>
        )}

        {constellation}

        {!empty && footer}
      </main>

      <Sheet
        open={star !== undefined}
        onClose={() => setSelected(null)}
        title={star ? capitalize(star.id) : ""}
        subtitle={star ? `Came up in ${star.count} conversation${star.count === 1 ? "" : "s"}` : undefined}
      >
        {topicBody}
      </Sheet>
    </div>
  );
}
