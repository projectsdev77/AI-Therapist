"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { NoteRow } from "@/components/memory/NoteRow";
import { Presence } from "@/components/presence/Presence";
import { ShareCardSheet } from "@/components/reflection/ShareCardSheet";
import { Backdrop } from "@/components/shell/Backdrop";
import { TopBar } from "@/components/shell/TopBar";
import { TranscriptSheet } from "@/components/talk/TalkSheets";
import { Button, LinkButton } from "@/components/ui/Button";
import { CheckIcon, ChevronIcon, CloseIcon, DownloadIcon, WriteIcon } from "@/components/ui/icons";
import { WEATHER_LABELS } from "@/lib/conversation/types";
import { useStore } from "@/lib/data/StoreProvider";
import type { Memory, Message, Reflection, ReflectionFeedback, Session } from "@/lib/data/types";
import { skyGradient } from "@/lib/design/skies";
import { usePendingForget } from "@/lib/memory/usePendingForget";
import { cleanCardEdit, editCard, memoriesFromConversation, rewriteCard, setCardFeedback, setConversationSky, type CardEdit } from "@/lib/reflection/edit";
import { finalizeSession } from "@/lib/reflection/finalize";
import { accountsEnabled } from "@/lib/supabase/config";
import { ReflectionCard, ReflectionCardEditor } from "./ReflectionCard";
import { DeleteReflection, SkyChoices, SkyPicker } from "./ReflectionSheets";
import { AppShell } from "@/components/shell/AppShell";
import { useShortcuts } from "@/lib/shortcuts";
import { useIsWide } from "@/lib/useIsDesktop";

type State =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "folding" }
  | { kind: "error"; message: string }
  | { kind: "ready"; session: Session; reflection: Reflection | null; messages: Message[] };

const dayLabel = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" });

const GUEST_KEY = "haven:keep-dismissed";

export function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { store, profile, refreshProfile, user } = useStore();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [notes, setNotes] = useState<Memory[]>([]);
  const [sheet, setSheet] = useState<null | "transcript" | "sky" | "delete" | "share">(null);
  const [draft, setDraft] = useState<Required<CardEdit> | null>(null);
  const [guestDismissed, setGuestDismissed] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [fixNote, setFixNote] = useState("");
  const [fixState, setFixState] = useState<"idle" | "working" | "error">("idle");

  const load = useCallback(async () => {
    if (!profile) return;
    const session = await store.getSession(id);
    if (!session) return setState({ kind: "missing" });
    const messages = await store.listMessages(id);
    let reflection = await store.getReflection(id);
    if (!reflection && messages.some((m) => m.role === "user")) {
      setState({ kind: "folding" });
      try {
        reflection = await finalizeSession(store, profile, id);
        await refreshProfile();
      } catch (err) {
        return setState({ kind: "error", message: err instanceof Error ? err.message : "Something went wrong." });
      }
    }
    setNotes(await memoriesFromConversation(store, id));
    setState({ kind: "ready", session: (await store.getSession(id)) ?? session, reflection, messages });
  }, [id, profile, store, refreshProfile]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads from the store
    void load();
    try {
      setGuestDismissed(localStorage.getItem(GUEST_KEY) === "1");
    } catch {
      setGuestDismissed(false);
    }
  }, [load]);

  const { pending, forget, undo } = usePendingForget(async (memoryId) => {
    await store.deleteMemory(memoryId);
    setNotes((n) => n.filter((m) => m.id !== memoryId));
  });

  const reflection = state.kind === "ready" ? state.reflection : null;
  const setReflection = (r: Reflection) => setState((s) => (s.kind === "ready" ? { ...s, reflection: r } : s));

  async function feedback(value: ReflectionFeedback) {
    if (!reflection) return;
    const next = reflection.feedback === value ? null : value;
    setReflection(await setCardFeedback(store, id, next));
    // "Not quite" asks what's off, so the card can be rewritten with their correction.
    setFixing(next === "not_quite");
  }

  async function fixCard() {
    if (!profile || !fixNote.trim()) return;
    setFixState("working");
    try {
      setReflection(await rewriteCard(store, id, fixNote.trim(), profile));
      setFixing(false);
      setFixNote("");
      setFixState("idle");
    } catch {
      setFixState("error");
    }
  }

  async function saveEdits() {
    if (!draft || !reflection) return;
    setReflection(await editCard(store, id, draft));
    setDraft(null);
  }

  async function remove(forgetNotes: boolean) {
    await store.deleteSession(id, { keepMemories: !forgetNotes });
    router.push("/history");
  }

  function dismissGuest() {
    setGuestDismissed(true);
    try {
      localStorage.setItem(GUEST_KEY, "1");
    } catch {
      // Fine: it just shows again next time.
    }
  }

  const editing = draft !== null && reflection !== null;
  const memoryOn = profile?.memoryEnabled ?? true;
  const wide = useIsWide();
  const [skyInline, setSkyInline] = useState(false);

  useShortcuts(
    {
      e: () => (reflection && !editing ? setDraft(cleanCardEdit({}, reflection)) : false),
      E: () => (reflection && !editing ? setDraft(cleanCardEdit({}, reflection)) : false),
      Escape: () => (editing ? setDraft(null) : false),
    },
    wide,
  );
  // ⌘/Ctrl Enter saves an edited card, even from inside a text field.
  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        void saveEdits();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const yourSay = (desktop: boolean) => reflection && (
              <section aria-labelledby="your-say" className={`flex min-w-0 flex-col gap-[22px] ${desktop ? "flex-1" : ""}`}>
                <div className="flex flex-col gap-2">
                  <h2 id="your-say" className="t-group m-0 ml-1">
                    Your say
                  </h2>
                  <div className="overflow-hidden rounded-md border border-edge-hi bg-glass">
                    <button
                      type="button"
                      onClick={() => setDraft(cleanCardEdit({}, reflection))}
                      className="press flex min-h-16 w-full items-center gap-3 bg-transparent px-4 py-2.5 text-left text-text hover:bg-glass"
                    >
                      <span className="flex flex-1 flex-col">
                        <span className="text-base">Edit this card</span>
                        <span className="text-sm text-muted">Change any words that don&apos;t fit</span>
                      </span>
                      <WriteIcon size={18} className="text-accent-strong" />
                    </button>
                    <button
                      type="button"
                      aria-haspopup={desktop ? undefined : "dialog"}
                      aria-expanded={desktop ? skyInline : undefined}
                      onClick={() => (desktop ? setSkyInline((o) => !o) : setSheet("sky"))}
                      className={`press flex min-h-16 w-full items-center gap-3 border-t border-edge-lo px-4 py-2.5 text-left text-text hover:bg-glass ${
                        skyInline && desktop ? "bg-glass" : "bg-transparent"
                      }`}
                    >
                      <span className="flex flex-1 flex-col">
                        <span className="text-base">Sky</span>
                        <span className="text-sm text-muted">
                          {WEATHER_LABELS[reflection.weather]}
                          {reflection.weatherByPerson ? " · chosen by you" : ""}
                        </span>
                      </span>
                      <span aria-hidden className="size-[30px] rounded-full" style={{ background: skyGradient(reflection.weather) }} />
                      {!desktop && <ChevronIcon size={18} className="text-faint" />}
                    </button>
                    {desktop && skyInline && (
                      <div className="flex flex-col gap-2.5 border-t border-edge-lo px-3.5 pt-3 pb-3.5">
                        <SkyChoices
                          compact
                          current={reflection.weather}
                          byPerson={reflection.weatherByPerson}
                          onChoose={(w) => void setConversationSky(store, id, w).then(setReflection)}
                          onClose={() => setSkyInline(false)}
                        />
                      </div>
                    )}
                  </div>
                  <p className="m-0 mx-1 mt-0.5 text-sm text-muted">Your sky is how our conversation sounded to me, not a measure of you. You can change it.</p>
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="t-group m-0 ml-1">What I&apos;ll remember from this</h2>
                  {!memoryOn ? (
                    <p className="m-0 rounded-sm border border-dashed border-edge-hi px-4 py-3 text-[15px] text-muted">
                      Remembering is off, so I didn&apos;t keep notes from this conversation.
                    </p>
                  ) : notes.length === 0 ? (
                    <p className="m-0 rounded-sm border border-dashed border-edge-hi px-4 py-3 text-[15px] text-muted">Nothing new to remember from this one.</p>
                  ) : (
                    notes.map((n) => (
                      <NoteRow key={n.id} text={n.fact} gone={pending.includes(n.id)} onForget={() => forget(n.id)} onUndo={() => undo(n.id)} />
                    ))
                  )}
                  <Link href="/memory" className="flex min-h-11 items-center self-start px-1 text-[15px] font-medium text-accent-strong no-underline">
                    See everything I remember
                  </Link>
                </div>
                {desktop && (
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={() => setSheet("delete")}
                    className="press mt-auto flex min-h-10 items-center gap-2 self-start px-1 text-[14px] text-muted hover:text-danger"
                  >
                    <CloseIcon size={15} />
                    Delete this reflection
                  </button>
                )}
              </section>
  );

  const body = (
    <>
        {state.kind === "loading" && <p className="text-center text-muted">Loading…</p>}
        {state.kind === "missing" && <p className="text-center text-muted">This conversation isn&apos;t here anymore.</p>}
        {state.kind === "folding" && (
          <div role="status" className="flex flex-col items-center gap-4 py-10 text-center">
            <Presence state="thinking" size={170} />
            <p className="m-0 text-[23px] font-medium tracking-[-0.02em]">Folding our conversation into a card…</p>
          </div>
        )}
        {state.kind === "error" && (
          <div role="alert" className="mx-auto flex max-w-[520px] flex-col items-start gap-3 rounded-md border border-edge-hi bg-glass p-4">
            <p className="m-0">{state.message}</p>
            <Button variant="primary" onClick={() => void load()}>
              Try again
            </Button>
          </div>
        )}

        {state.kind === "ready" && (
          <div className={wide ? "flex flex-col gap-4" : "mx-auto grid max-w-[1040px] grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-start gap-7"}>
            <div className="flex min-w-0 flex-col gap-4">
              {reflection ? (
                editing ? (
                  <ReflectionCardEditor reflection={reflection} draft={draft} onChange={setDraft} />
                ) : (
                  <ReflectionCard reflection={reflection} id="reflection-card" />
                )
              ) : (
                <div className="rounded-lg border border-edge-hi bg-glass p-6 text-muted">This conversation was too short for a reflection.</div>
              )}

              {editing ? (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" size="lg" onClick={() => void saveEdits()} className="px-[22px]">
                      Save changes
                    </Button>
                    <Button variant="tertiary" size="lg" onClick={() => setDraft(null)}>
                      Cancel
                    </Button>
                  </div>
                  <p className="m-0 text-sm text-muted">
                    Empty fields keep their old words. The saved image uses your changes.
                  </p>
                </div>
              ) : (
                <>
                  {reflection && (
                    <div role="group" aria-label="Does this feel right?" className="flex flex-wrap items-center gap-2">
                      <span className="min-w-[120px] flex-1 text-[15px] text-muted">Does this feel right?</span>
                      {(
                        [
                          ["right", "Feels right"],
                          ["not_quite", "Not quite"],
                        ] as const
                      ).map(([value, label]) => {
                        const on = reflection.feedback === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={on}
                            onClick={() => void feedback(value)}
                            className={`press flex min-h-11 items-center gap-1.5 rounded-pill px-4 text-[15px] ${
                              on ? "bg-mic font-semibold text-mic-fg" : "border border-edge-hi bg-glass text-text hover:bg-glass-strong"
                            }`}
                          >
                            {on && <CheckIcon size={16} />}
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {reflection && fixing && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void fixCard();
                      }}
                      className="flex flex-col gap-2 rounded-md border border-edge-hi bg-glass p-3.5"
                    >
                      <label htmlFor="fix-note" className="text-[15px] font-medium">
                        What&apos;s off? I&apos;ll rewrite the card.
                      </label>
                      <textarea
                        id="fix-note"
                        value={fixNote}
                        onChange={(e) => setFixNote(e.target.value)}
                        rows={3}
                        maxLength={600}
                        placeholder="e.g. It wasn't really about work, it was about my dad"
                        className="w-full resize-none rounded-sm border border-edge-hi bg-field px-4 py-3 text-base text-text placeholder:text-faint focus:border-[rgba(143,240,232,.6)] focus:outline-none"
                      />
                      {fixState === "error" && (
                        <p role="alert" className="m-0 text-sm text-danger">
                          Couldn&apos;t rewrite it right now. Try again in a moment, or edit the card yourself.
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Button type="submit" variant="primary" disabled={!fixNote.trim() || fixState === "working"}>
                          {fixState === "working" ? "Rewriting…" : "Rewrite my card"}
                        </Button>
                        <Button variant="tertiary" onClick={() => setFixing(false)}>
                          Not now
                        </Button>
                      </div>
                    </form>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {reflection && (
                      <Button variant="primary" size="lg" onClick={() => setSheet("share")}>
                        <DownloadIcon size={16} />
                        Save image
                      </Button>
                    )}
                    <Button variant="secondary" size="lg" onClick={() => setSheet("transcript")} aria-haspopup="dialog" className="font-normal">
                      Read the conversation
                    </Button>
                    {!wide && (
                      <Button variant="tertiary" size="lg" onClick={() => setSheet("delete")} aria-haspopup="dialog" className="px-3.5">
                        Delete
                      </Button>
                    )}
                  </div>
                  {accountsEnabled && !user && reflection && !guestDismissed && (
                    <div className="flex flex-col gap-2.5 rounded-md border border-dashed border-edge-hi px-[18px] py-4">
                      <div className="flex flex-col gap-0.5">
                        <strong className="text-base font-semibold">Want to keep this?</strong>
                        <span className="text-sm text-muted">Right now your cards live only on this device. Sign in to keep them safe and see them anywhere.</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <LinkButton href={`/signin?next=/history/${id}`} variant="secondary">
                          Sign in
                        </LinkButton>
                        <Button variant="tertiary" onClick={dismissGuest}>
                          Not now
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {!wide && reflection && !editing && yourSay(false)}
          </div>
        )}
    </>
  );

  const sheets = state.kind === "ready" && (
        <>
          <TranscriptSheet
            open={sheet === "transcript"}
            onClose={() => setSheet(null)}
            startedAt={state.session.startedAt}
            lines={state.messages.map((m) => ({ id: m.id, speaker: m.role === "user" ? "user" : "companion", text: m.content, at: Date.parse(m.createdAt) }))}
          />
          <DeleteReflection open={sheet === "delete"} onClose={() => setSheet(null)} noteCount={notes.length} onDelete={(f) => void remove(f)} />
          {reflection && (
            <>
              <SkyPicker
                key={`${reflection.weather}-${sheet === "sky"}`}
                open={sheet === "sky"}
                onClose={() => setSheet(null)}
                current={reflection.weather}
                byPerson={reflection.weatherByPerson}
                onChoose={(w) => void setConversationSky(store, id, w).then(setReflection)}
              />
              <ShareCardSheet open={sheet === "share"} onClose={() => setSheet(null)} reflection={reflection} />
            </>
          )}
        </>
  );

  if (wide) {
    const ready = state.kind === "ready";
    return (
      <AppShell panel={ready && reflection && !editing ? yourSay(true) : undefined} panelLabel="Your say">
        <div className="px-10 pt-7 pb-10">
          <div className="mx-auto flex max-w-[720px] flex-col gap-4">
            {ready && (
              <p className="m-0 text-[13px] text-muted">
                <Link href="/history" className="text-muted no-underline hover:text-text">
                  Your skies
                </Link>{" "}
                / {dayLabel.format(new Date(state.session.startedAt))}
              </p>
            )}
            {body}
          </div>
        </div>
        {sheets}
      </AppShell>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col">
      <Backdrop />
      <TopBar title={editing ? "Edit card" : "Reflection"} />
      <main className="relative z-[1] flex-1 px-4 pt-4 pb-12">{body}</main>
      {sheets}
    </div>
  );
}
