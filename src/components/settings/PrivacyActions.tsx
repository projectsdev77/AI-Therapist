"use client";

import Link from "next/link";
import { useState } from "react";
import { useIsWide } from "@/lib/useIsDesktop";
import { Button } from "@/components/ui/Button";
import { exportData } from "@/lib/data/exportData";
import { useStore } from "@/lib/data/StoreProvider";
import { DeleteEverythingSheet } from "./DeleteEverythingSheet";

/** Export everything and Delete everything, at the foot of the privacy page. */
export function PrivacyActions() {
  const { store } = useStore();
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="lg" onClick={() => void exportData(store)}>
        Export everything
      </Button>
      <Button variant="dangerOutline" size="lg" aria-haspopup="dialog" onClick={() => setDeleting(true)}>
        Delete everything
      </Button>
      <DeleteEverythingSheet open={deleting} onClose={() => setDeleting(false)} />
    </div>
  );
}

/** Desktop: the same controls in the side panel ("Your controls"); the page foot hides them. */
export function PrivacyPanel() {
  const { store } = useStore();
  const [deleting, setDeleting] = useState(false);
  return (
    <>
      <h2 className="m-0 text-[12px] font-semibold tracking-[.06em] text-faint uppercase">Your controls</h2>
      <Button variant="secondary" size="lg" onClick={() => void exportData(store)} className="w-full">
        Export everything
      </Button>
      <Button variant="dangerOutline" size="lg" aria-haspopup="dialog" onClick={() => setDeleting(true)} className="w-full">
        Delete everything
      </Button>
      <Link href="/memory" className="flex min-h-10 items-center text-[14px] no-underline">
        Manage what I remember
      </Link>
      <DeleteEverythingSheet open={deleting} onClose={() => setDeleting(false)} />
    </>
  );
}

/** The page-foot actions, shown only where there's no side panel. */
export function PrivacyActionsFoot() {
  return useIsWide() ? null : <PrivacyActions />;
}
