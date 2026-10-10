"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { BRAND } from "@/lib/brand";
import { useStore } from "@/lib/data/StoreProvider";
import { resourcesFor } from "@/lib/safety/resources";
import { useRegion } from "@/lib/safety/useRegion";

export interface ConsentSheetProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

/** One-time consent before the first conversation (docs/SPEC.md §3.1, §8). */
export function ConsentSheet({ open, onAccept, onCancel }: ConsentSheetProps) {
  const { updateProfile } = useStore();
  const [adult, setAdult] = useState(false);
  const [saving, setSaving] = useState(false);
  const region = useRegion();
  const resources = resourcesFor(region);
  const primaryLine = resources.lines[0];

  async function accept() {
    setSaving(true);
    await updateProfile({ consentedAt: new Date().toISOString(), region });
    setSaving(false);
    onAccept();
  }

  return (
    <Sheet open={open} onClose={onCancel} label="Before we talk">
      <h2 className="font-display text-2xl">Before we talk</h2>
      <ul className="mt-4 flex flex-col gap-4 text-[0.97rem] leading-relaxed">
        <li>
          <strong className="font-medium">I&apos;m an AI companion, not a therapist.</strong>{" "}
          <span className="text-muted">
            I can listen, help you reflect, and suggest small steps. I can&apos;t diagnose or treat anything, and I&apos;m not a
            replacement for professional care.
          </span>
        </li>
        <li>
          <strong className="font-medium">I&apos;m not for emergencies.</strong>{" "}
          <span className="text-muted">
            If you&apos;re in danger, call {resources.emergency}
            {primaryLine ? (
              <>
                {" "}or reach {primaryLine.name} ({primaryLine.display})
              </>
            ) : null}
            . The <span className="text-care">Get help</span> button is always at the top of the screen.
          </span>
        </li>
        <li>
          <strong className="font-medium">I remember our conversations.</strong>{" "}
          <span className="text-muted">
            Your conversations are saved so I can remember what matters to you, the way a counselor keeps notes. You can see,
            edit, or delete anything I remember, or turn memory off, in Settings.
          </span>
        </li>
        <li>
          <strong className="font-medium">Your privacy.</strong>{" "}
          <span className="text-muted">
            Conversations are never used for advertising or to train AI models. Read the{" "}
            <Link href="/privacy" className="underline underline-offset-2">
              privacy summary
            </Link>
            .
          </span>
        </li>
      </ul>

      <label className="mt-6 flex items-center gap-3 rounded-md border border-border bg-surface p-3">
        <input
          type="checkbox"
          checked={adult}
          onChange={(e) => setAdult(e.target.checked)}
          className="size-5 accent-[var(--color-accent)]"
        />
        <span>I&apos;m 18 or older</span>
      </label>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancel}>
          Not now
        </Button>
        <Button variant="primary" disabled={!adult || saving} onClick={accept}>
          I understand
        </Button>
      </div>
      <p className="mt-3 text-center text-xs text-faint sm:text-right">{BRAND.name} is for adults 18 and over.</p>
    </Sheet>
  );
}
