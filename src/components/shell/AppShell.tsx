"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { ConsentSheet } from "@/components/consent/ConsentSheet";
import { HELP_SUBTITLE, HELP_TITLE, HelpContent } from "@/components/safety/HelpSheet";
import {
  ChevronUpIcon,
  CloseIcon,
  HelpIcon,
  KeyboardIcon,
  LockIcon,
  MemoryIcon,
  PanelIcon,
  PatternsIcon,
  PlusIcon,
  SettingsIcon,
  SignInIcon,
  SkiesIcon,
  TalkNavIcon,
} from "@/components/ui/icons";
import { Sheet } from "@/components/ui/Sheet";
import { BRAND } from "@/lib/brand";
import { useStartConversation } from "@/lib/conversation/startConversation";
import { useStore } from "@/lib/data/StoreProvider";
import type { Weather } from "@/lib/conversation/types";
import type { Session } from "@/lib/data/types";
import { SKY_COLORS, skyGradient } from "@/lib/design/skies";
import { HOME } from "@/lib/routes";
import { useShortcuts } from "@/lib/shortcuts";
import { useStartIn } from "@/lib/startIn";
import { accountsEnabled } from "@/lib/supabase/config";
import { useIsFull } from "@/lib/useIsDesktop";

/**
 * The desktop app shell (docs/design-handoff/from-designer-v3): a sidebar with navigation and
 * recent conversations, the page in the middle, and a side panel on the right. At 1024–1279px
 * it is compact: an icon sidebar, and the panel folds away behind a toggle (shortcut ]).
 * Get help replaces the panel instead of covering the page.
 */

interface ShellApi {
  /** The sidebar is tucked away (a conversation under way); `toggleSidebar` brings it back or hides it. */
  sidebarHidden: boolean;
  toggleSidebar: () => void;
  openHelp: () => void;
  openShortcuts: () => void;
  closeHelp: () => void;
  helpOpen: boolean;
  compact: boolean;
}
const ShellContext = createContext<ShellApi | null>(null);

/** Shell controls for pages inside the desktop shell (null on phone layouts). */
export const useShell = () => useContext(ShellContext);

const NAV: { href: string; label: string; Icon: ComponentType<{ size?: number }>; match: string[] }[] = [
  { href: HOME, label: "Talk", Icon: TalkNavIcon, match: [HOME, "/talk", "/breathe"] },
  { href: "/history", label: "Your skies", Icon: SkiesIcon, match: ["/history"] },
  { href: "/patterns", label: "Patterns", Icon: PatternsIcon, match: ["/patterns"] },
  { href: "/memory", label: "What I remember", Icon: MemoryIcon, match: ["/memory"] },
];

export const PANEL_BG = "#0a1f2a";
export const CARE_PANEL_BG = "linear-gradient(180deg, rgba(40,30,80,.55), #0a1f2a 60%)";

const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" });

function relDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const days = Math.round((new Date(today.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return dayFmt.format(d);
  return dateFmt.format(d);
}

type Recent = { session: Session; title: string; weather: Weather | null; open: boolean };

function useRecent(limit: number, refreshKey: string) {
  const { store } = useStore();
  const [recent, setRecent] = useState<Recent[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [sessions, reflections] = await Promise.all([store.listSessions(limit), store.listReflections(limit * 2)]);
      if (cancelled) return;
      const byId = new Map(reflections.map((r) => [r.sessionId, r]));
      setRecent(
        sessions.map((s) => {
          const r = byId.get(s.id);
          return { session: s, title: r?.title ?? s.title ?? (!r && !s.endedAt ? "Unfinished conversation" : "A conversation"), weather: r?.weather ?? s.weather, open: !r && !s.endedAt };
        }),
      );
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [store, limit, refreshKey]);
  return { recent };
}

export interface AppShellProps {
  children: ReactNode;
  /** Right panel content. Omit for pages without a panel (settings, breathe, sign in). */
  panel?: ReactNode;
  /** The panel's accessible name ("This conversation", "Your say", "Details"). */
  panelLabel?: string;
  /** A care panel (lilac wash), e.g. the acute safety panel. */
  panelCare?: boolean;
  /** Highlight this conversation in Recent. */
  currentSessionId?: string;
  /** Bumps the Recent list (e.g. after a conversation is created or renamed). */
  refreshKey?: string;
  /** The main area scrolls (pages) or the page manages its own layout (talk). */
  scroll?: boolean;
  /**
   * The conversation: the sidebar shows when it opens (so Home → Talk is one continuous move) and
   * slides away once the person starts talking or writing. They can bring it back.
   */
  autoHideSidebar?: boolean;
}

export function AppShell({ children, panel, panelLabel = "Details", panelCare = false, currentSessionId, refreshKey = "", scroll = true, autoHideSidebar }: AppShellProps) {
  const full = useIsFull();
  const compact = !full;
  const pathname = usePathname();
  const router = useRouter();
  const { profile, user } = useStore();
  const startIn = useStartIn();
  const { start, consentProps } = useStartConversation();
  const [helpOpen, setHelpOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { recent } = useRecent(4, `${pathname}|${refreshKey}`);

  const openHelp = useCallback(() => {
    setHelpOpen(true);
    setMenuOpen(false);
  }, []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);
  const openShortcuts = useCallback(() => setShortcutsOpen(true), []);
  // null = follow autoHideSidebar; true/false = the person chose.
  const [sidebarPref, setSidebarPref] = useState<boolean | null>(null);
  const sidebarHidden = sidebarPref === null ? Boolean(autoHideSidebar) : !sidebarPref;
  const toggleSidebar = useCallback(() => setSidebarPref(sidebarHidden), [sidebarHidden]);
  const api = useMemo(
    () => ({ sidebarHidden, toggleSidebar, openHelp, openShortcuts, closeHelp, helpOpen, compact }),
    [sidebarHidden, toggleSidebar, openHelp, openShortcuts, closeHelp, helpOpen, compact],
  );

  const newConversation = useCallback(() => start(startIn), [start, startIn]);
  useShortcuts({
    n: newConversation,
    N: newConversation,
    "]": () => (compact && panel ? setPanelOpen((o) => !o) : false),
    "?": () => setShortcutsOpen(true),
    ",": () => router.push("/settings"),
  });

  const showPanel = helpOpen || (panel !== undefined && panel !== null && (full || panelOpen));
  const care = helpOpen || panelCare;
  const panelBody = helpOpen ? (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-start gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <h2 className="m-0 text-[20px] leading-[1.2] font-semibold tracking-[-0.02em] text-care">{HELP_TITLE}</h2>
          <p className="m-0 text-sm text-muted">{HELP_SUBTITLE}</p>
        </div>
        <button
          type="button"
          onClick={closeHelp}
          aria-label="Close help"
          className="press flex size-9 shrink-0 items-center justify-center rounded-full border border-edge-hi bg-glass text-text hover:bg-glass-strong"
        >
          <CloseIcon size={16} />
        </button>
      </div>
      <HelpContent footer="Free and confidential. Your conversation stays open beside this." />
    </div>
  ) : (
    panel
  );

  const name = profile?.displayName?.trim();
  const guest = !user;
  const acctName = `${name || "Guest"}${guest && name ? " · guest" : ""}`;

  return (
    <ShellContext.Provider value={api}>
      <div
        className="relative grid h-dvh min-h-[600px] overflow-hidden bg-ink-deep text-[15px] leading-normal text-text"
        style={{
          gridTemplateColumns: `${sidebarHidden ? "0px" : compact ? "76px" : "264px"} minmax(0,1fr)${showPanel && !compact ? " 340px" : ""}`,
          transition: "grid-template-columns 480ms cubic-bezier(.2,.7,.2,1)",
        }}
      >
        <aside
          aria-label="Sidebar"
          aria-hidden={sidebarHidden || undefined}
          inert={sidebarHidden}
          className={`relative z-[2] flex min-h-0 flex-col gap-5 border-r border-edge-lo pt-5 pb-4 transition-opacity duration-300 ${compact ? "items-center px-3" : "items-stretch px-3.5"} ${
            sidebarHidden ? "overflow-hidden border-r-0 opacity-0" : "opacity-100"
          }`}
          style={{ background: PANEL_BG }}
        >
          {autoHideSidebar !== undefined && !sidebarHidden && (
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Hide menu"
              title="Hide menu"
              className={`press flex size-10 items-center justify-center rounded-[12px] text-muted hover:bg-glass hover:text-text ${compact ? "" : "absolute top-5 right-3.5"}`}
            >
              <PanelIcon size={18} />
            </button>
          )}
          <Link
            href={HOME}
            aria-label={`${BRAND.name} home`}
            className="flex min-h-10 items-center gap-2.5 px-2 text-[18px] font-semibold tracking-[-0.025em] text-text no-underline hover:text-text"
          >
            <LogoMark />
            {!compact && <span>{BRAND.name}</span>}
          </Link>
          <button
            type="button"
            onClick={newConversation}
            aria-label={compact ? "New conversation" : undefined}
            title="New conversation (N)"
            className={`press flex min-h-11 min-w-11 items-center justify-center gap-2.5 rounded-sm bg-mic font-semibold text-mic-fg hover:bg-mic-hover ${compact ? "px-0" : "px-3.5 pl-3"}`}
          >
            <PlusIcon size={18} />
            {!compact && (
              <>
                <span className="flex-1 text-left">New conversation</span>
              </>
            )}
          </button>
          <nav aria-label="Main" className="flex w-full flex-col gap-0.5">
            {NAV.map(({ href, label, Icon, match }) => {
              const current = match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={current ? "page" : undefined}
                  aria-label={compact ? label : undefined}
                  title={label}
                  className={`press flex min-h-11 items-center gap-3 rounded-[12px] px-2.5 text-[15px] no-underline hover:bg-glass hover:text-text ${
                    compact ? "justify-center" : ""
                  } ${current ? "bg-glass-strong font-semibold text-text" : "text-muted"}`}
                >
                  <Icon size={18} />
                  {!compact && (
                    <>
                      <span className="flex-1">{label}</span>
                    </>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="flex min-h-0 w-full flex-1 flex-col gap-1 overflow-y-auto">
            {!compact && (
              <>
                <h2 className="m-0 mx-2.5 mb-1 text-[12px] font-semibold tracking-[.06em] text-faint uppercase">Recent</h2>
                {recent && recent.length === 0 && (
                  <p className="m-0 mx-2.5 rounded-[12px] border border-dashed border-edge-hi p-3.5 text-[13px] text-muted">
                    Your conversations will appear here, each with its sky.
                  </p>
                )}
                {recent?.map(({ session, title, weather, open }) => {
                  const current = session.id === currentSessionId || pathname === `/history/${session.id}`;
                  const w = weather ?? "quiet";
                  return (
                    <Link
                      key={session.id}
                      href={open ? `/talk?resume=${session.id}` : `/history/${session.id}`}
                      aria-current={current ? "page" : undefined}
                      className={`press flex min-h-[52px] items-center gap-3 rounded-[12px] px-2.5 py-1.5 text-text no-underline hover:bg-glass hover:text-text ${current ? "bg-glass" : ""}`}
                    >
                      <span
                        aria-hidden
                        className="size-[22px] shrink-0 rounded-full"
                        style={{ background: skyGradient(w), boxShadow: `0 0 10px ${SKY_COLORS[w][1]}55` }}
                      />
                      <span className="flex min-w-0 flex-1 flex-col leading-[1.3]">
                        <span className="truncate text-[14px]">{title}</span>
                        <span className="text-[12px] text-faint">{open ? `${relDay(session.startedAt)} · not wrapped up` : relDay(session.startedAt)}</span>
                      </span>
                    </Link>
                  );
                })}
              </>
            )}
          </div>
          <div className="relative flex w-full flex-col gap-1.5 border-t border-edge-lo pt-3">
            <button
              type="button"
              onClick={() => (helpOpen ? closeHelp() : openHelp())}
              aria-label={compact ? "Get help, crisis lines" : undefined}
              aria-pressed={helpOpen}
              title="Get help"
              className={`press flex min-h-11 items-center gap-2.5 rounded-[12px] bg-care-surface px-3 text-[14px] font-semibold text-care hover:bg-[rgba(220,207,255,.18)] ${compact ? "justify-center" : ""}`}
            >
              <HelpIcon size={16} />
              {!compact && <span>Get help · crisis lines</span>}
            </button>
            <AccountMenu
              open={menuOpen}
              onOpenChange={setMenuOpen}
              compact={compact}
              initial={(name || "Guest").charAt(0).toUpperCase()}
              name={acctName}
              guest={guest}
              email={user?.email ?? null}
              onShortcuts={() => setShortcutsOpen(true)}
              onHelp={openHelp}
            />
          </div>
        </aside>

        <main
          className={`relative z-[1] flex min-h-0 min-w-0 flex-col ${scroll ? "overflow-y-auto" : "overflow-hidden"}`}
          style={{ background: "var(--lg-bg)" }}
        >
          <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
            <div
              className="absolute rounded-[50%]"
              style={{ width: "140%", height: 180, left: "-30%", top: 160, background: "var(--lg-streak-a)", filter: "blur(64px)", transform: "rotate(-14deg)" }}
            />
            <div
              className="absolute rounded-[50%]"
              style={{ width: "110%", height: 180, right: "-40%", top: "48%", background: "var(--lg-streak-b)", filter: "blur(70px)", transform: "rotate(12deg)" }}
            />
            <div className="absolute rounded-[50%]" style={{ width: "110%", height: 220, left: "-10%", bottom: -110, background: "var(--lg-streak-c)", filter: "blur(70px)" }} />
          </div>
          {compact && panel && !helpOpen && (
            <button
              type="button"
              onClick={() => setPanelOpen((o) => !o)}
              aria-label={panelOpen ? "Hide side panel" : "Show side panel"}
              aria-expanded={panelOpen}
              title="Side panel (])"
              className="press absolute top-4 right-4 z-[3] flex size-11 items-center justify-center rounded-sm border border-edge-hi bg-glass text-text hover:bg-glass-strong"
            >
              <PanelIcon size={20} />
            </button>
          )}
          <div className="relative flex min-h-full flex-col">{children}</div>
        </main>

        {showPanel && (
          <aside
            aria-label={helpOpen ? "Get help" : panelLabel}
            className={`z-[4] flex min-h-0 min-w-0 flex-col gap-[22px] overflow-y-auto border-l border-edge-lo px-5 py-[22px] ${
              compact ? "absolute top-0 right-0 bottom-0 w-[340px] shadow-[-24px_0_60px_rgba(0,0,0,.45)]" : "relative"
            }`}
            style={{ backgroundColor: PANEL_BG, backgroundImage: care ? CARE_PANEL_BG : "none" }}
          >
            {panelBody}
          </aside>
        )}
      </div>
      <ShortcutsSheet open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <ConsentSheet {...consentProps} />
    </ShellContext.Provider>
  );
}

function AccountMenu({
  open,
  onOpenChange,
  compact,
  initial,
  name,
  guest,
  email,
  onShortcuts,
  onHelp,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compact: boolean;
  initial: string;
  name: string;
  guest: boolean;
  email: string | null;
  onShortcuts: () => void;
  onHelp: () => void;
}) {
  const { signOut } = useStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !buttonRef.current?.contains(e.target as Node)) onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => {
      const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
      const i = items.indexOf(document.activeElement as HTMLElement);
      if (e.key === "Escape") {
        onOpenChange(false);
        buttonRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        items[(i + 1) % items.length]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        items[(i - 1 + items.length) % items.length]?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  const close = () => onOpenChange(false);
  const item = "press flex min-h-10 w-full items-center gap-3 rounded-[10px] px-3 text-left text-[14px] text-text no-underline hover:bg-glass hover:text-text focus-visible:bg-glass";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account and settings"
        className={`press flex min-h-12 items-center gap-2.5 rounded-[12px] px-2.5 text-left text-text hover:bg-glass ${compact ? "justify-center" : ""} ${open ? "bg-glass" : ""}`}
      >
        <span aria-hidden className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-glass-strong text-[13px] font-semibold">
          {initial}
        </span>
        {!compact && (
          <>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-[14px]">{name}</span>
              <span className="text-[12px] text-faint">Settings &amp; privacy</span>
            </span>
            <ChevronUpIcon size={16} className="text-faint" />
          </>
        )}
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Account"
          className="absolute bottom-[60px] left-0 z-20 flex w-[236px] flex-col gap-0.5 rounded-md border border-edge-hi p-1.5 shadow-[0_24px_60px_rgba(0,0,0,.5)]"
          style={{ background: "rgba(10,34,44,.98)" }}
        >
          <div className="mb-1 flex flex-col border-b border-edge-lo px-3 pt-2.5 pb-2">
            <span className="text-[14px] font-semibold">{guest ? "Guest" : (email ?? "Signed in")}</span>
            <span className="text-[12px] text-muted">{guest ? "Everything stays on this device" : "Saved to your account"}</span>
          </div>
          <Link role="menuitem" href="/settings" onClick={close} className={item}>
            <SettingsIcon size={18} />
            <span className="flex-1">Settings</span>
            <kbd className="font-mono text-[11px] text-faint">,</kbd>
          </Link>
          <Link role="menuitem" href="/privacy" onClick={close} className={item}>
            <LockIcon size={18} />
            <span className="flex-1">Privacy</span>
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              close();
              onShortcuts();
            }}
            className={item}
          >
            <KeyboardIcon size={18} />
            <span className="flex-1">Keyboard shortcuts</span>
            <kbd className="font-mono text-[11px] text-faint">?</kbd>
          </button>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              close();
              onHelp();
            }}
            className={item}
          >
            <HelpIcon size={18} />
            <span className="flex-1">Help and crisis lines</span>
          </button>
          {guest && accountsEnabled && (
            <Link role="menuitem" href="/signin" onClick={close} className={`${item} font-semibold`}>
              <SignInIcon size={18} />
              <span className="flex-1">Sign in to keep your cards</span>
            </Link>
          )}
          {!guest && (
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                close();
                void signOut();
              }}
              className={item}
            >
              <SignInIcon size={18} />
              <span className="flex-1">Sign out</span>
            </button>
          )}
        </div>
      )}
    </>
  );
}

const SHORTCUTS: { group: string; keys: [string, string][] }[] = [
  {
    group: "Anywhere",
    keys: [
      ["N", "New conversation"],
      ["]", "Show or hide the side panel (narrow windows)"],
      [",", "Settings"],
      ["?", "Keyboard shortcuts"],
    ],
  },
  {
    group: "In a conversation",
    keys: [
      ["Space", "Talk, or pause listening"],
      ["W", "Switch to writing"],
      ["M", "Mute the mic"],
      ["B", "Breathe"],
      ["1–4", "Reply style"],
      ["Esc", "Wrap up"],
    ],
  },
  {
    group: "Elsewhere",
    keys: [
      ["Esc", "Leave Breathe"],
      ["⌘ / Ctrl Enter", "Save an edited card"],
    ],
  },
];

function ShortcutsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Keyboard shortcuts" subtitle="They work when you're not typing in a text box.">
      {SHORTCUTS.map((g) => (
        <section key={g.group} className="flex flex-col gap-1">
          <h3 className="t-group m-0 ml-1">{g.group}</h3>
          <dl className="m-0 overflow-hidden rounded-md border border-edge-hi bg-glass [&>*+*]:border-t [&>*+*]:border-edge-lo">
            {g.keys.map(([k, d]) => (
              <div key={k + d} className="flex min-h-12 items-center gap-3 px-4">
                <dd className="m-0 flex-1 text-[15px]">{d}</dd>
                <dt>
                  <kbd className="rounded-[6px] border border-edge-hi bg-glass px-2 py-0.5 font-mono text-[12px]">{k}</kbd>
                </dt>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </Sheet>
  );
}
