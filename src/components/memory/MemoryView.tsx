"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PageShell } from "@/components/shell/PageShell";
import { Button } from "@/components/ui/Button";
import { WriteIcon } from "@/components/ui/icons";
import { Switch } from "@/components/ui/Switch";
import { useStore } from "@/lib/data/StoreProvider";
import { MEMORY_CATEGORIES, MEMORY_CATEGORY_LABELS, type Memory } from "@/lib/data/types";

type Forgotten = { memory: Memory; timer: ReturnType<typeof setTimeout> };

export function MemoryView() {
  const { store, profile, updateProfile } = useStore();
  const [memories, setMemories] = useState<Memory[] | null>(null);
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState("");
  const [newFact, setNewFact] = useState("");
  const [forgotten, setForgotten] = useState<Forgotten | null>(null);
  const forgottenRef = useRef<Forgotten | null>(null);

  const reload = useCallback(async () => setMemories(await store.listMemories()), [store]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads from the store
    void reload();
  }, [reload]);
  useEffect(
    () => () => {
      if (forgottenRef.current) clearTimeout(forgottenRef.current.timer);
    },
    [],
  );

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!newFact.trim()) return;
    await store.addMemory({ fact: newFact.trim(), category: "other", sourceSessionId: null });
    setNewFact("");
    await reload();
  }

  async function forget(memory: Memory) {
    if (forgottenRef.current) clearTimeout(forgottenRef.current.timer);
    await store.deleteMemory(memory.id);
    const timer = setTimeout(() => {
      forgottenRef.current = null;
      setForgotten(null);
    }, 8000);
    forgottenRef.current = { memory, timer };
    setForgotten(forgottenRef.current);
    await reload();
  }

  async function undo() {
    const f = forgottenRef.current;
    if (!f) return;
    clearTimeout(f.timer);
    forgottenRef.current = null;
    setForgotten(null);
    await store.addMemory({ fact: f.memory.fact, category: f.memory.category, sourceSessionId: f.memory.sourceSessionId });
    await reload();
  }

  async function saveSummary() {
    await updateProfile({ clientSummary: summaryDraft.trim() || null, clientSummaryUpdatedAt: new Date().toISOString() });
    setEditingSummary(false);
  }

  const grouped = MEMORY_CATEGORIES.map((c) => ({ category: c, items: (memories ?? []).filter((m) => m.category === c) })).filter((g) => g.items.length);

  return (
    <PageShell
      title={
        <>
          What I <span className="accent">remember</span>
        </>
      }
      subtitle="These are my notes about you. Change or remove anything. I only use what's here."
    >
      <div className="flex flex-col gap-5">
        {profile && (
          <div className="flex items-center justify-between gap-3 rounded-md bg-band py-1.5 pr-1.5 pl-4">
            <span className="text-[15px]">{profile.memoryEnabled ? "Remembering is on" : "Remembering is off. I'm not using these notes."}</span>
            <Switch checked={profile.memoryEnabled} onChange={(on) => void updateProfile({ memoryEnabled: on })} label="Remember between conversations" />
          </div>
        )}

        <section className="flex flex-col gap-2 rounded-lg border border-border bg-surface px-5 py-[18px] shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted">In short</h2>
            {!editingSummary && (
              <button
                type="button"
                onClick={() => {
                  setSummaryDraft(profile?.clientSummary ?? "");
                  setEditingSummary(true);
                }}
                className="-my-2.5 -mr-2.5 min-h-11 px-2.5 text-[15px] font-medium text-accent-strong"
              >
                Edit
              </button>
            )}
          </div>
          {editingSummary ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="summary" className="sr-only">
                Notes
              </label>
              <textarea
                id="summary"
                value={summaryDraft}
                onChange={(e) => setSummaryDraft(e.target.value)}
                rows={4}
                maxLength={1200}
                className="voice-person rounded-sm border border-border bg-bg p-3 text-xl leading-[1.4] text-text focus:border-accent-strong focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditingSummary(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={saveSummary}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className={profile?.clientSummary ? "voice-person text-xl leading-[1.4] text-pretty" : "text-muted"}>
              {profile?.clientSummary ?? "Nothing yet. After we talk, I'll write a short note about what's going on for you."}
            </p>
          )}
        </section>

        {forgotten && (
          <div role="status" className="flex items-center justify-between gap-3 rounded-md border border-dashed border-border py-1 pr-1 pl-4">
            <span className="text-[15px] text-muted">Forgotten.</span>
            <Button variant="ghost" onClick={undo} className="!text-accent-strong font-medium">
              Undo
            </Button>
          </div>
        )}

        {memories && memories.length === 0 && (
          <p className="text-muted">I don&apos;t remember anything specific yet. As we talk, the things that matter to you will show up here.</p>
        )}

        {grouped.map((g) => (
          <section key={g.category} aria-labelledby={`cat-${g.category}`} className="flex flex-col gap-1.5">
            <h2 id={`cat-${g.category}`} className="text-sm font-medium text-muted">
              {MEMORY_CATEGORY_LABELS[g.category]}
            </h2>
            {g.items.map((m) => (
              <MemoryItem key={m.id} memory={m} onChange={reload} onForget={forget} />
            ))}
          </section>
        ))}

        <form onSubmit={add} className="flex min-h-14 items-center gap-2 rounded-pill border border-dashed border-border pr-1.5 pl-[18px]">
          <label htmlFor="new-fact" className="sr-only">
            Add something I should know
          </label>
          <input
            id="new-fact"
            value={newFact}
            onChange={(e) => setNewFact(e.target.value)}
            maxLength={300}
            placeholder="Add something I should know"
            className="min-h-11 flex-1 bg-transparent text-text placeholder:text-faint focus:outline-none"
          />
          <Button type="submit" disabled={!newFact.trim()} className="border-0 bg-surface-strong !shadow-none">
            Add
          </Button>
        </form>
      </div>
    </PageShell>
  );
}

function MemoryItem({ memory, onChange, onForget }: { memory: Memory; onChange: () => Promise<void>; onForget: (m: Memory) => void }) {
  const { store } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(memory.fact);

  async function save() {
    if (!draft.trim()) return;
    await store.updateMemory(memory.id, { fact: draft.trim() });
    setEditing(false);
    await onChange();
  }

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="flex flex-col gap-2 rounded-md border-2 border-accent-strong bg-surface p-3.5"
      >
        <label htmlFor={`m-${memory.id}`} className="text-[13px] font-medium text-accent-strong">
          Editing
        </label>
        <input
          id={`m-${memory.id}`}
          value={draft}
          autoFocus
          maxLength={300}
          onChange={(e) => setDraft(e.target.value)}
          className="min-h-11 bg-transparent text-text focus:outline-none"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex min-h-[52px] items-center gap-2 rounded-md border border-border bg-surface py-1 pr-1 pl-4">
      <span className="flex-1 text-pretty">{memory.fact}</span>
      <button
        type="button"
        aria-label={`Edit: ${memory.fact}`}
        onClick={() => setEditing(true)}
        className="inline-flex size-11 shrink-0 items-center justify-center text-muted"
      >
        <WriteIcon size={18} />
      </button>
      <button type="button" aria-label={`Forget: ${memory.fact}`} onClick={() => onForget(memory)} className="min-h-11 shrink-0 px-2.5 text-sm text-muted">
        Forget
      </button>
    </div>
  );
}
