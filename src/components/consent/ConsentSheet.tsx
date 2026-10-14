"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { useStore } from "@/lib/data/StoreProvider";
import { callLabel, resourcesFor } from "@/lib/safety/resources";
import { useRegion } from "@/lib/safety/useRegion";

export interface ConsentSheetProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

/** One-time consent before the first conversation (docs/SPEC.md §3.1, §8). */
export function ConsentSheet({ open, onAccept, onCancel }: ConsentSheetProps) {
  const { profile, updateProfile } = useStore();
  const [adult, setAdult] = useState(false);
  const [remember, setRemember] = useState(profile?.memoryEnabled ?? true);
  const [saving, setSaving] = useState(false);
  const region = useRegion();
  const resources = resourcesFor(region);
  const primary = resources.lines[0];

  async function accept() {
    setSaving(true);
    await updateProfile({ consentedAt: new Date().toISOString(), region, memoryEnabled: remember });
    setSaving(false);
    onAccept();
  }

  return (
    <Sheet open={open} onClose={onCancel} label="Before we begin">
      <div className="flex flex-col gap-4">
        <h2 className="heading heading-sheet">
          Before we <span className="accent">begin</span>
        </h2>
        <ul className="flex flex-col gap-3.5">
          <li className="flex flex-col">
            <strong className="font-medium">I&apos;m an AI companion, not a clinician.</strong>
            <span className="text-[15px] text-muted">I&apos;m here to listen and help you reflect. I can&apos;t diagnose or give medical advice.</span>
          </li>
          <li className="flex flex-col">
            <strong className="font-medium">I&apos;m not for emergencies.</strong>
            <span className="text-[15px] text-muted">
              If you might be in danger,{" "}
              {primary?.call ? (
                <>
                  {primary.text ? "call or text" : "call"} <span className="font-medium text-care">{primary.callDisplay ?? primary.call}</span>, or{" "}
                  {resources.emergency}.
                </>
              ) : (
                <>
                  call {resources.emergency} or visit <span className="font-medium text-care">{primary?.display}</span>.
                </>
              )}
            </span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="flex flex-1 flex-col">
              <strong className="font-medium">I&apos;ll remember our conversations.</strong>
              <span className="text-[15px] text-muted">So you don&apos;t have to start over. See or change it anytime in What I remember.</span>
            </span>
            <Switch checked={remember} onChange={setRemember} label="Remember between conversations" />
          </li>
          <li className="flex flex-col">
            <strong className="font-medium">Your words stay private.</strong>
            <span className="text-[15px] text-muted">
              Never sold, never used for ads.{" "}
              <Link href="/privacy" className="text-accent-strong underline underline-offset-2">
                How I handle your data
              </Link>
            </span>
          </li>
        </ul>

        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <span className="relative flex size-6 shrink-0 items-center justify-center">
            <input
              type="checkbox"
              checked={adult}
              onChange={(e) => setAdult(e.target.checked)}
              className="peer absolute inset-0 m-0 size-6 cursor-pointer appearance-none rounded-[7px] border border-border bg-surface checked:border-transparent checked:bg-accent"
            />
            <CheckIcon size={16} strokeWidth={2.2} className="pointer-events-none relative hidden text-on-accent peer-checked:block" />
          </span>
          I&apos;m 18 or older
        </label>

        <Button variant="primary" size="lg" disabled={!adult || saving} onClick={accept} className="w-full">
          Let&apos;s begin
        </Button>
        <Button variant="ghost" onClick={onCancel} className="-mt-2 w-full">
          Not now
        </Button>
        {primary?.call && <span className="sr-only">{callLabel(primary)}</span>}
      </div>
    </Sheet>
  );
}
