"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { getLocalStore, useStore } from "@/lib/data/StoreProvider";
import { SupabaseStore } from "@/lib/data/supabaseStore";

const DISMISSED_KEY = "haven:move-dismissed";

/** After signing in, offers to move conversations saved on this device into the account. */
export function MovePrompt() {
  const { store, refreshProfile } = useStore();
  const [count, setCount] = useState(0);
  const [state, setState] = useState<"idle" | "moving" | "error">("idle");

  useEffect(() => {
    if (!(store instanceof SupabaseStore)) return;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISSED_KEY) === store.userId;
    } catch {
      // Storage unavailable; just ask.
    }
    if (dismissed) return;
    let cancelled = false;
    getLocalStore()
      .listSessions(10_000)
      .then((s) => !cancelled && setCount(s.length));
    return () => {
      cancelled = true;
    };
  }, [store]);

  if (!(store instanceof SupabaseStore) || count === 0) return null;
  const cloud = store;

  async function move() {
    setState("moving");
    try {
      const local = getLocalStore();
      await cloud.importBundle(await local.exportAll());
      await local.deleteEverything();
      await refreshProfile();
      setCount(0);
      window.location.reload();
    } catch (err) {
      console.error(err);
      setState("error");
    }
  }

  function keep() {
    try {
      localStorage.setItem(DISMISSED_KEY, cloud.userId);
    } catch {
      // Ignore.
    }
    setCount(0);
  }

  return (
    <Sheet open onClose={keep} label="Move your conversations">
      <h2 className="font-display text-2xl">Bring your conversations with you?</h2>
      <p className="mt-2 text-muted">
        This device has {count} conversation{count === 1 ? "" : "s"} from before you signed in. Move them into your account so
        they&apos;re on every device and I can keep remembering you. They&apos;ll be removed from this browser afterward.
      </p>
      {state === "error" && (
        <p role="alert" className="mt-3 text-care">
          Something went wrong moving them. Nothing was deleted. Try again?
        </p>
      )}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={keep} disabled={state === "moving"}>
          Keep them on this device
        </Button>
        <Button variant="primary" onClick={move} disabled={state === "moving"}>
          {state === "moving" ? "Moving…" : "Move them to my account"}
        </Button>
      </div>
    </Sheet>
  );
}
