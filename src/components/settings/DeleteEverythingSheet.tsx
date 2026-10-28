"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { useStore } from "@/lib/data/StoreProvider";
import { HOME } from "@/lib/routes";

/** "Delete everything?" — needs DELETE typed before the destructive button works. */
export function DeleteEverythingSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { store, user } = useStore();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function deleteEverything() {
    setDeleting(true);
    await store.deleteEverything();
    // Full reload on purpose: clears every in-memory copy of the deleted data.
    window.location.assign(HOME);
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      role="alertdialog"
      closeButton={false}
      title="Delete everything?"
      subtitle={`Every conversation, card, sky and note${user ? ", and your account" : ""} will be permanently deleted. This can't be undone.`}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm-delete" className="text-sm font-semibold text-muted">
          Type DELETE to confirm
        </label>
        <input
          id="confirm-delete"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          autoComplete="off"
          className="min-h-[52px] w-full rounded-sm border border-edge-hi bg-field px-4 text-base text-text focus:border-danger-edge focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Button variant="danger" disabled={confirmText !== "DELETE" || deleting} onClick={() => void deleteEverything()} className="min-h-[52px] w-full text-base">
          {deleting ? "Deleting…" : "Delete everything"}
        </Button>
        <Button variant="secondary" onClick={onClose} className="min-h-[52px] w-full text-base">
          Keep it
        </Button>
      </div>
    </Sheet>
  );
}
