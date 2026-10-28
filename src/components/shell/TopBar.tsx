"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogoMark, Wordmark } from "@/components/brand/Logo";
import { HelpSheet } from "@/components/safety/HelpSheet";
import { BackIcon, HelpIcon, MenuIcon } from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";
import { HOME } from "@/lib/routes";
import { useIsDesktop } from "@/lib/useIsDesktop";
import { NavMenu } from "./NavMenu";

const NAV = [
  { href: HOME, label: "Talk", match: [HOME, "/talk", "/breathe"] },
  { href: "/history", label: "Your skies", match: ["/history"] },
  { href: "/patterns", label: "Patterns", match: ["/patterns"] },
  { href: "/memory", label: "What I remember", match: ["/memory"] },
];

export interface TopBarProps {
  /**
   * "home": logo on phone too. "page": Back + title on phone. "talk": full focus — Back and a
   * status pill, no nav, and no menu on phone.
   */
  variant?: "home" | "page" | "talk";
  /** Phone sub-page title (16/600). */
  title?: string;
  /** Talk status pill text (Ready / Listening / Speaking / Thinking / In conversation). */
  status?: string;
  onBack?: () => void;
  backLabel?: string;
}

const glassSquare =
  "press inline-flex size-11 items-center justify-center rounded-sm border border-edge-hi bg-glass text-text backdrop-blur-[14px] hover:bg-glass-strong";

/** One top bar on every screen (README "Top bar"). Get help is always on the right. */
export function TopBar({ variant = "page", title, status, onBack, backLabel }: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const desktop = useIsDesktop();
  const [helpOpen, setHelpOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const showBack = !desktop && variant !== "home";
  const showLogo = desktop || variant === "home";
  const showMenu = desktop || variant !== "talk";

  function goBack() {
    if (onBack) return onBack();
    if (window.history.length > 1) router.back();
    else router.push(HOME);
  }

  return (
    <>
      <header className="relative z-50 grid shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center min-[720px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2.5 px-[clamp(16px,2.5vw,32px)] pt-[max(clamp(12px,1.9vw,24px),env(safe-area-inset-top))]">
        <div className="flex items-center gap-2 justify-self-start">
          {showBack && (
            <button type="button" onClick={goBack} aria-label={backLabel ?? (variant === "talk" ? "Back to Home" : "Back")} className={glassSquare}>
              <BackIcon size={20} />
            </button>
          )}
          {showLogo && (
            <Link href={HOME} aria-label={`${BRAND.name} home`} className="flex min-h-11 items-center gap-[9px] text-text no-underline hover:text-text">
              <LogoMark />
              <Wordmark />
            </Link>
          )}
        </div>

        <div className="flex min-w-0 justify-center">
          {variant === "talk" && status && (
            <span role="status" className="flex min-h-9 items-center gap-2 rounded-pill bg-glass px-3.5 text-[13px] font-medium whitespace-nowrap text-muted">
              <span aria-hidden className="size-[7px] rounded-full bg-dot" />
              {status}
            </span>
          )}
          {variant !== "talk" && desktop && (
            <nav aria-label="Main" className="flex gap-0.5 rounded-pill border border-edge-hi bg-glass p-1 backdrop-blur-[14px]">
              {NAV.map((n) => {
                const current = n.match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    aria-current={current ? "page" : undefined}
                    className={`press flex min-h-10 items-center rounded-pill px-4 text-[15px] font-medium whitespace-nowrap no-underline hover:text-text ${
                      current ? "bg-glass-strong text-text" : "text-muted"
                    }`}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          )}
          {variant === "page" && !desktop && title && <span className="truncate text-base font-semibold tracking-[-0.01em] whitespace-nowrap">{title}</span>}
        </div>

        <div className="flex items-center gap-2 justify-self-end">
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            aria-haspopup="dialog"
            className="press flex min-h-11 items-center gap-1.5 rounded-pill bg-care-surface px-3.5 text-[14px] font-semibold whitespace-nowrap text-care hover:bg-[rgba(220,207,255,.18)]"
          >
            <HelpIcon size={15} />
            Get help
          </button>
          {showMenu && (
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              className={`${glassSquare} ${menuOpen ? "bg-glass-strong" : ""}`}
            >
              <MenuIcon size={20} />
            </button>
          )}
        </div>
      </header>
      <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
      <NavMenu open={menuOpen} onClose={() => setMenuOpen(false)} onHelp={() => setHelpOpen(true)} />
    </>
  );
}
