"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogoMark, Wordmark } from "@/components/brand/Logo";
import { HelpSheet } from "@/components/safety/HelpSheet";
import { BackIcon, MenuIcon } from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";
import { NavMenu } from "./NavMenu";

/** Logo, Get help (always visible, never covered), and the menu. */
export function TopBar({ back = false, onBack }: { back?: boolean; onBack?: () => void }) {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function goBack() {
    if (onBack) return onBack();
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  return (
    <>
      <header className="relative z-50 flex shrink-0 items-center justify-between gap-3 px-[clamp(16px,3vw,40px)] pt-[max(20px,env(safe-area-inset-top))] pb-2">
        <div className="flex min-w-0 items-center gap-3">
          {back && (
            <button
              type="button"
              onClick={goBack}
              aria-label="Back"
              className="-ml-2.5 inline-flex size-11 items-center justify-center rounded-full text-text"
            >
              <BackIcon size={20} />
            </button>
          )}
          <Link href="/" aria-label={`${BRAND.name} home`} className="flex min-h-11 items-center gap-2 text-text">
            <LogoMark />
            <Wordmark />
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            aria-haspopup="dialog"
            className="min-h-11 rounded-pill bg-care-surface px-[18px] text-[15px] font-medium text-care transition-colors duration-[var(--motion-base)]"
          >
            Get help
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            className="inline-flex size-11 items-center justify-center rounded-full bg-surface text-text shadow-soft"
          >
            <MenuIcon size={20} />
          </button>
        </div>
      </header>
      <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
      <NavMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
