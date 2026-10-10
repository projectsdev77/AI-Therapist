"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/history", label: "Your skies" },
  { href: "/patterns", label: "Your patterns" },
  { href: "/memory", label: "What I remember" },
  { href: "/breathe", label: "Breathe" },
  { href: "/settings", label: "Settings" },
];

export function NavMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        aria-expanded={open}
        aria-controls="nav-menu"
        aria-label="Menu"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-pill text-muted transition-colors hover:bg-surface hover:text-text"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
          <path d={open ? "M6 6l12 12M18 6L6 18" : "M4 8h16M4 16h16"} />
        </svg>
      </button>
      {open && (
        <nav
          id="nav-menu"
          className="absolute right-0 top-12 w-56 overflow-hidden rounded-md border border-border bg-bg shadow-2xl"
        >
          <ul>
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === l.href ? "page" : undefined}
                  className="block px-4 py-3 text-[0.95rem] transition-colors hover:bg-surface aria-[current=page]:text-accent"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
