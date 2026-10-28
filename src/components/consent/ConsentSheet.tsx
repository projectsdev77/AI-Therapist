"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { CheckIcon, FaceIcon, HelpIcon, LockIcon, MemoryIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { useStore } from "@/lib/data/StoreProvider";
import { resourcesFor } from "@/lib/safety/resources";
import { useRegion } from "@/lib/safety/useRegion";

export interface ConsentSheetProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

function Rule({ icon, care, title, children, end }: { icon: ReactNode; care?: boolean; title: string; children: ReactNode; end?: ReactNode }) {
  return (
    <li className={`flex gap-3 ${end ? "items-center" : ""}`}>
      <span
        aria-hidden
        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${care ? "bg-care-surface text-care" : "bg-glass-strong text-accent-strong"}`}
      >
        {icon}
      </span>
      <span className="flex flex-1 flex-col">
        <strong className="font-semibold">{title}</strong>
        <span className="text-[15px] text-muted">{children}</span>
      </span>
      {end}
    </li>
  );
}

/** One-time consent before the first conversation (docs/SPEC.md §3.1, §8). */
export function ConsentSheet({ open, onAccept, onCancel }: ConsentSheetProps) {
  const { profile, updateProfile } = useStore();
  const [adult, setAdult] = useState(false);
  const [remember, setRemember] = useState(profile?.memoryEnabled ?? true);
  const [saving, setSaving] = useState(false);
  const region = useRegion();
  const res = resourcesFor(region);
  const primary = res.lines[0];

  async function accept() {
    setSaving(true);
    await updateProfile({ consentedAt: new Date().toISOString(), region, memoryEnabled: remember });
    setSaving(false);
    onAccept();
  }

  return (
    <Sheet open={open} onClose={onCancel} title="Before we begin" closeButton={false}>
      <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
        <Rule icon={<FaceIcon size={18} />} title="I'm an AI companion, not a clinician.">
          I&apos;m here to listen and help you reflect. I can&apos;t diagnose or give medical advice.
        </Rule>
        <Rule icon={<HelpIcon size={18} />} care title="I'm not for emergencies.">
          If you might be in danger,{" "}
          {primary?.call ? (
            <>
              {primary.text ? "call or text" : "call"} <strong className="font-semibold text-care">{primary.callDisplay ?? primary.call}</strong>, or
              call {res.emergency}.
            </>
          ) : (
            <>
              call {res.emergency} or visit <strong className="font-semibold text-care">{primary?.display}</strong>.
            </>
          )}{" "}
          Get help is always at the top.
        </Rule>
        <Rule
          icon={<MemoryIcon size={18} />}
          title="I'll remember what matters."
          end={<Switch checked={remember} onChange={setRemember} label="Remember our conversations" />}
        >
          So you don&apos;t have to start over. You can see, edit or turn this off anytime.
        </Rule>
        <Rule icon={<LockIcon size={18} />} title="Your words stay private.">
          Never sold, never used for ads. To reply, I send your words to our AI provider, and speech to a speech service.{" "}
          <Link href="/privacy">How I handle your data</Link>
        </Rule>
      </ul>

      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-sm border border-edge-lo bg-glass px-3.5 text-base">
        <span className="relative flex size-6 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            checked={adult}
            onChange={(e) => setAdult(e.target.checked)}
            className="peer absolute inset-0 m-0 size-6 cursor-pointer appearance-none rounded-[7px] border-[1.5px] border-faint checked:border-transparent checked:bg-mic"
          />
          <CheckIcon size={16} strokeWidth={2.4} className="pointer-events-none relative hidden text-mic-fg peer-checked:block" />
        </span>
        I&apos;m 18 or older
      </label>

      <div className="flex flex-col gap-1.5">
        <Button variant="primary" size="xl" disabled={!adult || saving} onClick={accept} className="w-full">
          Let&apos;s begin
        </Button>
        <Button variant="tertiary" onClick={onCancel} className="w-full">
          Not now
        </Button>
      </div>
    </Sheet>
  );
}
