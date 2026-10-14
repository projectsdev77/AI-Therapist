"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LinkButton } from "@/components/ui/Button";
import { BreatheIcon, HomeIcon, MemoryIcon, PatternsIcon, SettingsIcon, SkiesIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/Sheet";
import { useStore } from "@/lib/data/StoreProvider";
import { accountsEnabled } from "@/lib/supabase/config";

const LINKS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/history", label: "Your skies", Icon: SkiesIcon },
  { href: "/patterns", label: "Your patterns", Icon: PatternsIcon },
  { href: "/memory", label: "What I remember", Icon: MemoryIcon },
  { href: "/breathe", label: "Breathe", Icon: BreatheIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
];

/** Bottom sheet on mobile, a 396px panel at the top right on desktop. */
export function NavMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user } = useStore();
  return (
    <Sheet open={open} onClose={onClose} label="Menu" placement="side">
      <nav aria-label="Menu" className="flex flex-col">
        {LINKS.map(({ href, label, Icon }) => {
          const current = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              aria-current={current ? "page" : undefined}
              className={`flex min-h-14 items-center gap-3.5 rounded-md px-3 text-lg font-light transition-colors duration-[var(--motion-base)] hover:bg-surface ${
                current ? "bg-surface-strong" : ""
              }`}
            >
              <Icon size={20} className="text-accent-strong" />
              {label}
            </Link>
          );
        })}
      </nav>
      {accountsEnabled && !user && (
        <LinkButton href="/signin" onClick={onClose} variant="secondary" size="lg" className="mt-4 w-full font-normal">
          Sign in
        </LinkButton>
      )}
    </Sheet>
  );
}
