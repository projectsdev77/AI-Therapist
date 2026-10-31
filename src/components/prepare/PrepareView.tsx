"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/shell/PageShell";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/lib/data/StoreProvider";
import type { PrepareOutput, PrepareRequest } from "@/lib/prepare/protocol";

const KEY = "haven:prepare";
const dateFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

type Draft = { goingOn: string; hopes: string; helps: string; questions: string };

const FIELDS: { key: keyof Draft; label: string; hint: string; rows: number }[] = [
  { key: "goingOn", label: "What's been going on", hint: "How things have been lately, and how it affects your days.", rows: 6 },
  { key: "hopes", label: "What I'd like to be different", hint: "If therapy helped, what would change?", rows: 4 },
  { key: "helps", label: "What helps, and what doesn't", hint: "Things you've tried so far.", rows: 3 },
  { key: "questions", label: "Questions to ask", hint: "One per line.", rows: 5 },
];

function read(): Draft | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function write(d: Draft | null) {
  try {
    if (d) localStorage.setItem(KEY, JSON.stringify(d));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage blocked: the draft lasts for this visit */
  }
}

const asText = (d: Draft) =>
  FIELDS.map((f) => `${f.label}\n${f.key === "questions" ? d.questions.split("\n").filter(Boolean).map((q) => `- ${q}`).join("\n") : d[f.key]}`).join("\n\n");

/**
 * "Bring this to your first appointment": a private, editable draft in the person's own words,
 * made from their notes and cards. Kept only on this device; shared only if they choose.
 */
export function PrepareView() {
  const { store, profile } = useStore();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [state, setState] = useState<"idle" | "working" | "error">("idle");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restores the saved draft from this device
    setDraft(read());
  }, []);

  function update(next: Draft | null) {
    setDraft(next);
    write(next);
  }

  async function makeDraft() {
    if (!profile) return;
    setState("working");
    try {
      const [notes, reflections, sessions] = await Promise.all([store.listMemories(), store.listReflections(12), store.listSessions(30)]);
      const memoryOn = profile.memoryEnabled;
      const body: PrepareRequest = {
        displayName: profile.displayName,
        clientSummary: memoryOn ? profile.clientSummary : null,
        notes: memoryOn ? notes.slice(0, 120).map((n) => ({ fact: n.fact, category: n.category })) : [],
        cards: reflections.map((r) => ({ date: dateFmt.format(new Date(r.createdAt)), title: r.title, insight: r.insight, nextStep: r.nextStep })),
        moods: sessions
          .filter((s) => s.moodStart != null || s.moodEnd != null)
          .map((s) => ({ date: dateFmt.format(new Date(s.startedAt)), start: s.moodStart, end: s.moodEnd })),
      };
      const res = await fetch("/api/prepare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("failed");
      const out = (await res.json()) as PrepareOutput;
      update({ goingOn: out.goingOn, hopes: out.hopes, helps: out.helps, questions: out.questions.join("\n") });
      setState("idle");
    } catch {
      setState("error");
    }
  }

  function download(d: Draft) {
    const url = URL.createObjectURL(new Blob([asText(d)], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "notes-for-my-first-appointment.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageShell
      title="My first appointment"
      subtitle="Starting therapy can feel like a lot. These notes, in your own words, can help you say what you came to say. They stay on this device, and you decide whether to share them."
    >
      {!draft ? (
        <div className="flex flex-col items-start gap-3 rounded-md border border-edge-hi bg-glass p-5">
          <p className="m-0 text-[15px]">
            I can draft notes from what you&apos;ve told me: what&apos;s been going on, what you&apos;d like to change, what helps, and some questions to ask.
            You can edit everything.
          </p>
          {state === "error" && (
            <p role="alert" className="m-0 text-sm text-danger">
              Couldn&apos;t draft it right now. Try again in a moment, or start with a blank page.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="lg" onClick={() => void makeDraft()} disabled={state === "working" || !profile}>
              {state === "working" ? "Drafting…" : "Draft my notes"}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => update({ goingOn: "", hopes: "", helps: "", questions: "" })}>
              Start blank
            </Button>
          </div>
        </div>
      ) : (
        <>
          {FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <label htmlFor={`prep-${f.key}`} className="text-[17px] font-semibold">
                {f.label}
              </label>
              <span className="text-[14px] text-muted">{f.hint}</span>
              <textarea
                id={`prep-${f.key}`}
                value={draft[f.key]}
                onChange={(e) => update({ ...draft, [f.key]: e.target.value })}
                rows={f.rows}
                maxLength={2000}
                className="w-full resize-y rounded-sm border border-edge-hi bg-field px-4 py-3 text-base leading-[1.5] text-text placeholder:text-faint focus:border-[rgba(143,240,232,.6)] focus:outline-none"
              />
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                void navigator.clipboard?.writeText(asText(draft)).then(() => setCopied(true), () => undefined);
              }}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => download(draft)}>
              Download
            </Button>
            <Button variant="tertiary" size="lg" onClick={() => void makeDraft()} disabled={state === "working"}>
              {state === "working" ? "Drafting…" : "Draft again"}
            </Button>
            <Button variant="tertiary" size="lg" onClick={() => update(null)}>
              Clear
            </Button>
          </div>
        </>
      )}
      <p className="m-0 text-[13px] text-faint">
        It&apos;s normal to feel nervous before a first appointment. You don&apos;t have to share everything at once, and you can bring these notes or read from them.
      </p>
    </PageShell>
  );
}
