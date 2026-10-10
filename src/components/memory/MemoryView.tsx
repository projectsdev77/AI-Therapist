"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageShell } from "@/components/shell/PageShell";
import { Button } from "@/components/ui/Button";
import { PencilIcon, TrashIcon } from "@/components/ui/icons";
import { useStore } from "@/lib/data/StoreProvider";
import { MEMORY_CATEGORIES, MEMORY_CATEGORY_LABELS, type Memory, type MemoryCategory } from "@/lib/data/types";

export function MemoryView() {
  const { store, profile, updateProfile } = useStore();
  const [memories, setMemories] = useState<Memory[] | null>(null);
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState("");
  const [newFact, setNewFact] = useState("");
  const [newCategory, setNewCategory] = useState<MemoryCategory>("person");

  const reload = useCallback(async () => setMemories(await store.listMemories()), [store]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads from the store
    void reload();
  }, [reload]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!newFact.trim()) return;
    await store.addMemory({ fact: newFact.trim(), category: newCategory, sourceSessionId: null });
    setNewFact("");
    await reload();
  }

  async function saveSummary() {
    await updateProfile({ clientSummary: summaryDraft.trim() || null, clientSummaryUpdatedAt: new Date().toISOString() });
    setEditingSummary(false);
  }

  const grouped = MEMORY_CATEGORIES.map((c) => ({ category: c, items: (memories ?? []).filter((m) => m.category === c) })).filter((g) => g.items.length);

  return (
    <PageShell
      title="What I remember about you"
      subtitle="Like a counselor's notes. Everything here is yours to see, change, or delete."
    >
      {profile && !profile.memoryEnabled && (
        <div className="mb-8 flex flex-col gap-3 rounded-lg border border-care bg-care-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <p>Memory is off. I&apos;m not using or adding to these notes.</p>
          <Button variant="secondary" onClick={() => updateProfile({ memoryEnabled: true })}>
            Turn memory on
          </Button>
        </div>
      )}

      <section aria-labelledby="summary-h" className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 id="summary-h" className="font-display text-xl">
            My notes on you
          </h2>
          {!editingSummary && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit notes"
              onClick={() => {
                setSummaryDraft(profile?.clientSummary ?? "");
                setEditingSummary(true);
              }}
            >
              <PencilIcon size={18} />
            </Button>
          )}
        </div>
        {editingSummary ? (
          <div className="mt-3 flex flex-col gap-2">
            <label htmlFor="summary" className="sr-only">
              Notes
            </label>
            <textarea
              id="summary"
              value={summaryDraft}
              onChange={(e) => setSummaryDraft(e.target.value)}
              rows={5}
              maxLength={1200}
              className="rounded-md border border-border bg-bg p-3 text-text focus:border-accent focus:outline-none"
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
          <p className="mt-2 leading-relaxed text-muted">
            {profile?.clientSummary ?? "Nothing yet. After we talk, I'll write a short note about what's going on for you."}
          </p>
        )}
      </section>

      <div className="mt-10 flex flex-col gap-8">
        {memories && memories.length === 0 && (
          <p className="text-muted">
            I don&apos;t remember anything specific yet. As we talk, things that matter to you will show up here.
          </p>
        )}
        {grouped.map((g) => (
          <section key={g.category} aria-labelledby={`cat-${g.category}`}>
            <h2 id={`cat-${g.category}`} className="mb-3 text-xs uppercase tracking-widest text-faint">
              {MEMORY_CATEGORY_LABELS[g.category]}
            </h2>
            <ul className="flex flex-col gap-2">
              {g.items.map((m) => (
                <MemoryItem key={m.id} memory={m} onChange={reload} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      <form onSubmit={add} className="mt-10 flex flex-col gap-3 rounded-lg border border-dashed border-border p-5">
        <h2 className="font-display text-lg">Tell me something to remember</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="new-cat" className="sr-only">
            Kind
          </label>
          <select
            id="new-cat"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
            className="h-11 rounded-md border border-border bg-surface px-3 text-text"
          >
            {MEMORY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {MEMORY_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <label htmlFor="new-fact" className="sr-only">
            What to remember
          </label>
          <input
            id="new-fact"
            value={newFact}
            onChange={(e) => setNewFact(e.target.value)}
            maxLength={300}
            placeholder="e.g. My dog Biscuit always cheers me up"
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-text placeholder:text-faint focus:border-accent focus:outline-none sm:w-auto sm:flex-1"
          />
          <Button type="submit" variant="primary" disabled={!newFact.trim()}>
            Add
          </Button>
        </div>
      </form>

      <p className="mt-8 text-sm text-faint">
        Want me to stop remembering? Turn memory off in <Link href="/settings" className="underline">Settings</Link>.
      </p>
    </PageShell>
  );
}

function MemoryItem({ memory, onChange }: { memory: Memory; onChange: () => Promise<void> }) {
  const { store } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(memory.fact);

  async function save() {
    if (!draft.trim()) return;
    await store.updateMemory(memory.id, { fact: draft.trim() });
    setEditing(false);
    await onChange();
  }

  async function remove() {
    await store.deleteMemory(memory.id);
    await onChange();
  }

  return (
    <li className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2">
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          className="flex flex-1 gap-2"
        >
          <label htmlFor={`m-${memory.id}`} className="sr-only">
            Edit memory
          </label>
          <input
            id={`m-${memory.id}`}
            value={draft}
            autoFocus
            maxLength={300}
            onChange={(e) => setDraft(e.target.value)}
            className="h-10 flex-1 rounded-sm border border-border bg-bg px-3 text-text focus:border-accent focus:outline-none"
          />
          <Button type="submit" variant="primary">
            Save
          </Button>
          <Button variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </form>
      ) : (
        <>
          <p className="flex-1 py-1.5">{memory.fact}</p>
          <Button variant="ghost" size="icon" aria-label={`Edit: ${memory.fact}`} onClick={() => setEditing(true)}>
            <PencilIcon size={18} />
          </Button>
          <Button variant="ghost" size="icon" aria-label={`Forget: ${memory.fact}`} onClick={remove}>
            <TrashIcon size={18} />
          </Button>
        </>
      )}
    </li>
  );
}
