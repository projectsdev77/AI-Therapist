"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Presence } from "@/components/presence/Presence";
import { TopBar } from "@/components/shell/TopBar";
import { Button, LinkButton } from "@/components/ui/Button";
import { ArrowLeftIcon, DownloadIcon, TrashIcon } from "@/components/ui/icons";
import { useStore } from "@/lib/data/StoreProvider";
import type { Message, Reflection, Session } from "@/lib/data/types";
import { saveCardImage } from "@/lib/reflection/cardImage";
import { finalizeSession } from "@/lib/reflection/finalize";
import { ReflectionCard } from "./ReflectionCard";

type State =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "folding" }
  | { kind: "error"; message: string }
  | { kind: "ready"; session: Session; reflection: Reflection | null; messages: Message[] };

export function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { store, profile, refreshProfile } = useStore();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [showTranscript, setShowTranscript] = useState(false);

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
    setState({ kind: "ready", session: (await store.getSession(id)) ?? session, reflection, messages });
  }, [id, profile, store, refreshProfile]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads from the local store
    void load();
  }, [load]);

  async function remove() {
    if (!confirm("Delete this conversation, its reflection, and anything remembered from it? This can't be undone.")) return;
    await store.deleteSession(id);
    router.push("/history");
  }

  return (
    <div className="min-h-dvh">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        <Link href="/history" className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-text">
          <ArrowLeftIcon size={18} /> Your skies
        </Link>

        {state.kind === "loading" && <p className="text-muted">Loading…</p>}
        {state.kind === "missing" && <p className="text-muted">This conversation isn&apos;t here anymore.</p>}
        {state.kind === "folding" && (
          <div className="flex flex-col items-center gap-4 py-10 text-center" role="status">
            <Presence state="thinking" className="w-48" />
            <p className="font-display text-xl">Folding your conversation into a reflection…</p>
          </div>
        )}
        {state.kind === "error" && (
          <div className="flex flex-col items-start gap-3">
            <p role="alert" className="text-care">{state.message}</p>
            <Button onClick={() => void load()}>Try again</Button>
          </div>
        )}
        {state.kind === "ready" && (
          <div className="flex flex-col gap-6">
            {state.reflection ? (
              <ReflectionCard reflection={state.reflection} id="reflection-card" />
            ) : (
              <p className="text-muted">This conversation was too short for a reflection.</p>
            )}

            <div className="flex flex-wrap gap-2">
              <LinkButton href="/talk?mode=voice" variant="primary">
                Talk again
              </LinkButton>
              {state.reflection && (
                <Button onClick={() => void saveCardImage(state.reflection!)}>
                  <DownloadIcon size={18} /> Save image
                </Button>
              )}
              <Button onClick={() => setShowTranscript((s) => !s)} aria-expanded={showTranscript}>
                {showTranscript ? "Hide conversation" : "Read the conversation"}
              </Button>
              <Button variant="ghost" onClick={remove} className="ml-auto">
                <TrashIcon size={18} /> Delete
              </Button>
            </div>

            {showTranscript && (
              <ol className="flex flex-col gap-4 rounded-lg border border-border p-5">
                {state.messages.map((m) => (
                  <li key={m.id}>
                    <p className="text-xs uppercase tracking-widest text-faint">{m.role === "user" ? "You" : "Companion"}</p>
                    <p className={m.role === "user" ? "mt-1 text-muted" : "mt-1 font-display text-lg"}>{m.content}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
