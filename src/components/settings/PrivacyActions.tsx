"use client";

import { useState } from "react";
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
