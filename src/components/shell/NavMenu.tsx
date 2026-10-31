"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentType } from "react";
import { BreatheIcon, HelpIcon, LockIcon, MemoryIcon, PatternsIcon, SettingsIcon, SignInIcon, SkiesIcon, TalkNavIcon, WriteIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/Sheet";
import { useStore } from "@/lib/data/StoreProvider";
import { HOME } from "@/lib/routes";
import { accountsEnabled } from "@/lib/supabase/config";

type Item = { href: string; label: string; Icon: ComponentType<{ size?: number; className?: string }>; value?: string; divider?: boolean };

/** A sheet on phone, a right side panel on desktop. Get help sits at the end in lilac. */
export function NavMenu({ open, onClose, onHelp }: { open: boolean; onClose: () => void; onHelp: () => void }) {
  const { store, user } = useStore();
  const [notes, setNotes] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    store.listMemories().then(
      (m) => !cancelled && setNotes(m.length),
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [open, store]);

  const items: Item[] = [
    { href: HOME, label: "Talk", Icon: TalkNavIcon },
    { href: "/history", label: "Your skies", Icon: SkiesIcon, value: "30 days" },
    { href: "/patterns", label: "Your patterns", Icon: PatternsIcon },
    { href: "/memory", label: "What I remember", Icon: MemoryIcon, value: notes === null ? undefined : `${notes} ${notes === 1 ? "note" : "notes"}` },
    { href: "/exercises", label: "Exercises", Icon: BreatheIcon },
    { href: "/safety-plan", label: "My safety plan", Icon: HelpIcon, divider: true },
    { href: "/prepare", label: "My first appointment", Icon: WriteIcon },
    { href: "/settings", label: "Settings", Icon: SettingsIcon, divider: true },
    ...(accountsEnabled && !user ? [{ href: "/signin", label: "Sign in", Icon: SignInIcon, value: "Keep your cards" }] : []),
    { href: "/privacy", label: "Privacy", Icon: LockIcon },
  ];

  return (
    <Sheet open={open} onClose={onClose} title="Menu" placement="side">
      <nav aria-label="Menu" className="flex flex-col gap-0.5">
        {items.map(({ href, label, Icon, value, divider }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={`press flex min-h-14 items-center gap-3.5 rounded-sm px-3 text-[17px] text-text no-underline hover:bg-glass hover:text-text ${divider ? "border-t border-edge-lo" : ""}`}
          >
            <Icon size={20} className="text-accent-strong" />
            <span className="flex-1">{label}</span>
            {value && <span className="text-sm text-muted">{value}</span>}
          </Link>
        ))}
      </nav>
      <button
        type="button"
        onClick={() => {
          onClose();
          onHelp();
        }}
        className="press flex min-h-[52px] items-center gap-3 rounded-sm bg-care-surface px-4 text-left text-base font-semibold text-care"
      >
        <HelpIcon size={18} />
        Get help · crisis lines
      </button>
    </Sheet>
  );
}
