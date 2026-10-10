"use client";

import Link from "next/link";
import { useState } from "react";
import { HelpSheet } from "@/components/safety/HelpSheet";
import { Button } from "@/components/ui/Button";
import { HeartHandIcon } from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";
import { NavMenu } from "./NavMenu";

export function TopBar({ transparent = false }: { transparent?: boolean }) {
  const [helpOpen, setHelpOpen] = useState(false);
  return (
    <>
      <header
        className={`relative z-20 flex items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 ${
          transparent ? "" : "border-b border-border bg-bg/80 backdrop-blur"
        }`}
      >
        <Link href="/" className="font-display text-xl tracking-tight">
          {BRAND.name}
        </Link>
        <div className="flex items-center gap-1">
          <Button variant="ghost" onClick={() => setHelpOpen(true)} className="!text-care" aria-haspopup="dialog">
            <HeartHandIcon size={20} />
            <span>Get help</span>
          </Button>
          <NavMenu />
        </div>
      </header>
      <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
