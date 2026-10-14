"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Presence } from "@/components/presence/Presence";
import { Backdrop } from "@/components/shell/Backdrop";
import { TopBar } from "@/components/shell/TopBar";
import { Button, LinkButton } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { useStore } from "@/lib/data/StoreProvider";
import type { Message, Reflection, Session } from "@/lib/data/types";
import { ShareCardSheet } from "@/components/reflection/ShareCardSheet";
import { finalizeSession } from "@/lib/reflection/finalize";
import { accountsEnabled } from "@/lib/supabase/config";
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
  const { store, profile, refreshProfile, user } = useStore();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [showTranscript, setShowTranscript] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sharing, setSharing] = useState(false);

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
    await store.deleteSession(id);
    router.push("/history");
  }

  const weather = state.kind === "ready" ? (state.reflection?.weather ?? state.session.weather) : null;

  return (
    <div className="relative min-h-dvh">
      <Backdrop weather={weather} />
      <TopBar back />
      <main className="relative mx-auto flex w-full max-w-[600px] flex-col gap-4 px-4 pt-3 pb-8">
        {state.kind === "loading" && <p className="text-muted">Loading…</p>}
        {state.kind === "missing" && <p className="text-muted">This conversation isn&apos;t here anymore.</p>}
        {state.kind === "folding" && (
          <div className="flex flex-col items-center gap-4 py-10 text-center" role="status">
            <Presence state="thinking" className="w-48" />
            <p className="voice-companion text-[23px]">Folding our conversation into a card…</p>
          </div>
        )}
        {state.kind === "error" && (
          <div className="flex flex-col items-start gap-3">
            <p role="alert" className="text-care">
              {state.message}
            </p>
            <Button onClick={() => void load()}>Try again</Button>
          </div>
        )}
        {state.kind === "ready" && (
          <>
            {state.reflection ? (
              <ReflectionCard reflection={state.reflection} id="reflection-card" />
            ) : (
              <p className="text-muted">This conversation was too short for a reflection.</p>
            )}

            <div className="flex flex-wrap gap-2">
              {state.reflection && (
                <Button variant="primary" onClick={() => setSharing(true)} className="min-h-12">
                  Save image
                </Button>
              )}
              <Button onClick={() => setShowTranscript(true)} aria-haspopup="dialog" className="min-h-12">
                Read the conversation
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(true)} className="min-h-12">
                Delete
              </Button>
            </div>

            {accountsEnabled && !user && state.reflection && (
              <div className="flex flex-wrap items-center gap-3 rounded-md border border-border px-4 py-3.5">
                <span className="min-w-[180px] flex-1 text-[15px]">
                  <strong className="font-medium">Want to keep this?</strong>{" "}
                  <span className="text-muted">Sign in and your skies stay with you.</span>
                </span>
                <LinkButton href={`/signin?next=/history/${id}`} variant="secondary" className="!shadow-none">
                  Sign in
                </LinkButton>
              </div>
            )}

            <Sheet open={showTranscript} onClose={() => setShowTranscript(false)} label="Conversation transcript">
              <h2 className="heading heading-sheet">
                The <span className="accent">conversation</span>
              </h2>
              <ol className="mt-5 flex flex-col gap-4">
                {state.messages.map((m) => (
                  <li key={m.id}>
                    <p className="text-sm font-medium text-muted">{m.role === "user" ? "You" : "Companion"}</p>
                    <p className={m.role === "user" ? "voice-person mt-0.5 text-[19px]" : "voice-companion mt-0.5 text-[19px]"}>{m.content}</p>
                  </li>
                ))}
              </ol>
            </Sheet>

            <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} label="Delete this conversation">
              <h2 className="heading heading-sheet">
                Delete this <span className="accent">conversation?</span>
              </h2>
              <p className="mt-2 text-muted">Its card, its sky, and anything I remembered from it will be gone. This can&apos;t be undone.</p>
              <div className="mt-6 flex flex-col gap-2">
                <Button variant="care" size="lg" onClick={remove}>
                  Delete
                </Button>
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Keep it
                </Button>
              </div>
            </Sheet>

            {state.reflection && <ShareCardSheet open={sharing} onClose={() => setSharing(false)} reflection={state.reflection} />}
          </>
        )}
      </main>
    </div>
  );
}
