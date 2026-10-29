"use client";

import { useCallback, useEffect, useState } from "react";
import { PageShell } from "@/components/shell/PageShell";
import { useIsWide } from "@/lib/useIsDesktop";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { useStore } from "@/lib/data/StoreProvider";
import { MEMORY_CATEGORIES, MEMORY_CATEGORY_LABELS, type Memory } from "@/lib/data/types";
import { usePendingForget } from "@/lib/memory/usePendingForget";
import { NoteRow } from "./NoteRow";

const input =
  "min-h-12 w-full rounded-sm border border-edge-hi bg-field px-3.5 py-[11px] text-base text-text placeholder:text-faint focus:border-[rgba(143,240,232,.6)] focus:outline-none";

/** "What I remember": the switch, the summary, notes by category with Edit and Forget (with Undo), Add, Forget everything. */
export function MemoryView() {
  const { store, profile, updateProfile } = useStore();
  const [memories, setMemories] = useState<Memory[] | null>(null);
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [newFact, setNewFact] = useState("");
  const [confirmAll, setConfirmAll] = useState(false);

  const reload = useCallback(async () => setMemories(await store.listMemories()), [store]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads from the store
    void reload();
  }, [reload]);

  const { pending, forget, undo } = usePendingForget(async (id) => {
    await store.deleteMemory(id);
    setMemories((m) => m?.filter((x) => x.id !== id) ?? null);
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!newFact.trim()) return;
    await store.addMemory({ fact: newFact.trim(), category: "other", sourceSessionId: null });
    setNewFact("");
    setAdding(false);
    await reload();
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editDraft.trim()) return;
    await store.updateMemory(editingId, { fact: editDraft.trim() });
    setEditingId(null);
    await reload();
  }

  async function saveSummary() {
    await updateProfile({ clientSummary: summaryDraft.trim() || null, clientSummaryUpdatedAt: new Date().toISOString() });
    setEditingSummary(false);
  }

  async function forgetEverything() {
    for (const m of memories ?? []) await store.deleteMemory(m.id);
    await updateProfile({ clientSummary: null, clientSummaryUpdatedAt: null });
    setConfirmAll(false);
    await reload();
  }

  const on = profile?.memoryEnabled ?? true;
  const grouped = MEMORY_CATEGORIES.map((c) => ({ category: c, items: (memories ?? []).filter((m) => m.category === c) })).filter((g) => g.items.length);
  const hasAnything = (memories?.length ?? 0) > 0 || Boolean(profile?.clientSummary);

  const wide = useIsWide();
  const memorySwitch = (
    <>
      {profile && (
        <div className="flex items-center gap-3 rounded-md border border-edge-hi bg-glass py-3 pr-1.5 pl-[18px]">
          <span className="flex flex-1 flex-col">
            <span className="text-base font-semibold">Remember our conversations</span>
            <span className="text-[14px] text-muted">{on ? "I keep short notes so you don't have to start over." : "Off. Turn it on whenever you like."}</span>
          </span>
          <Switch checked={on} onChange={(v) => void updateProfile({ memoryEnabled: v })} label="Remember our conversations" />
        </div>
      )}
    </>
  );
  const summary = (
        <div className="flex flex-col gap-1 rounded-md bg-glass-strong px-[18px] py-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-accent-strong">In short</span>
            {!editingSummary && (
              <button
                type="button"
                onClick={() => {
                  setSummaryDraft(profile?.clientSummary ?? "");
                  setEditingSummary(true);
                }}
                className="press -my-2.5 -mr-2 min-h-11 rounded-pill bg-transparent px-2.5 text-[14px] text-muted hover:text-text"
              >
                Edit
              </button>
            )}
          </div>
          {editingSummary ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="summary" className="sr-only">
                In short
              </label>
              <textarea id="summary" value={summaryDraft} onChange={(e) => setSummaryDraft(e.target.value)} rows={4} maxLength={1200} className={input} />
              <div className="flex justify-end gap-2">
                <Button variant="tertiary" onClick={() => setEditingSummary(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => void saveSummary()}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className={`m-0 text-base ${profile?.clientSummary ? "" : "text-muted"}`}>
              {profile?.clientSummary ?? "Nothing yet. After we talk, I'll write a short note about what's going on for you."}
            </p>
          )}
        </div>
  );
  const forgetAll = (
    <>
          {hasAnything && (
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => setConfirmAll(true)}
              className="min-h-11 rounded-pill bg-transparent px-3 text-[14px] text-muted underline underline-offset-[3px] hover:text-text"
            >
              Forget everything
            </button>
          )}
    </>
  );
  const panel = (
    <>
      {memorySwitch}
      {on && summary}
      <p className="m-0 text-[13px] text-muted">I use these notes so you don&apos;t have to start over. Only you can see them, and I never share them.</p>
      <div className="mt-auto">{forgetAll}</div>
    </>
  );

  return (
    <PageShell
      title="What I remember"
      width={640}
      subtitle={wide ? "Short notes I keep between conversations. Edit or forget anything." : undefined}
      panel={panel}
      panelLabel="Memory settings"
    >
      {!wide && memorySwitch}

      {!on && (
        <p role="status" className="m-0 rounded-md border border-dashed border-edge-hi px-4 py-3.5 text-[15px] text-muted">
          Remembering is off. I&apos;m not adding notes or using the ones below. They stay until you delete them.
        </p>
      )}

      <div className={`flex flex-col gap-[22px] ${on ? "" : "opacity-60"}`}>
        {!wide && summary}
        {memories && memories.length === 0 && (
          <p className="m-0 text-muted">I don&apos;t remember anything specific yet. As we talk, the things that matter to you will show up here.</p>
        )}

        {grouped.map((g) => (
          <section key={g.category} aria-labelledby={`cat-${g.category}`} className="flex flex-col gap-1.5">
            <h2 id={`cat-${g.category}`} className="t-group m-0 mb-0.5 ml-1">
              {MEMORY_CATEGORY_LABELS[g.category]}
            </h2>
            {g.items.map((m) =>
              editingId === m.id ? (
                <form key={m.id} onSubmit={saveEdit} className="flex flex-col gap-2 rounded-sm border border-[rgba(143,240,232,.45)] bg-glass p-3">
                  <label htmlFor={`m-${m.id}`} className="text-[13px] font-semibold text-accent-strong">
                    Editing
                  </label>
                  <input id={`m-${m.id}`} value={editDraft} autoFocus maxLength={300} onChange={(e) => setEditDraft(e.target.value)} className={input} />
                  <div className="flex justify-end gap-2">
                    <Button variant="tertiary" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                      Save
                    </Button>
                  </div>
                </form>
              ) : (
                <NoteRow
                  key={m.id}
                  text={m.fact}
                  gone={pending.includes(m.id)}
                  onForget={() => forget(m.id)}
                  onUndo={() => undo(m.id)}
                  onEdit={() => {
                    setEditingId(m.id);
                    setEditDraft(m.fact);
                  }}
                />
              ),
            )}
          </section>
        ))}

        {adding && (
          <form onSubmit={add} className="flex flex-col gap-2">
            <label htmlFor="new-fact" className="t-group ml-1">
              Add something I should know
            </label>
            <input id="new-fact" value={newFact} autoFocus maxLength={300} onChange={(e) => setNewFact(e.target.value)} className={input} />
            <div className="flex justify-end gap-2">
              <Button variant="tertiary" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={!newFact.trim()}>
                Add
              </Button>
            </div>
          </form>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          {!adding && (
            <Button variant="secondary" size="lg" onClick={() => setAdding(true)}>
              <PlusIcon size={16} />
              Add something
            </Button>
          )}
          {!wide && forgetAll}
        </div>
      </div>

      <Sheet
        open={confirmAll}
        onClose={() => setConfirmAll(false)}
        role="alertdialog"
        closeButton={false}
        title="Forget everything I remember?"
        subtitle="Every note and the short summary will be deleted. Your conversations and cards stay. This can't be undone."
      >
        <div className="flex flex-col gap-2">
          <Button variant="danger" onClick={() => void forgetEverything()} className="min-h-[52px] w-full text-base">
            Forget everything
          </Button>
          <Button variant="secondary" onClick={() => setConfirmAll(false)} className="min-h-[52px] w-full text-base">
            Keep them
          </Button>
        </div>
      </Sheet>
    </PageShell>
  );
}
