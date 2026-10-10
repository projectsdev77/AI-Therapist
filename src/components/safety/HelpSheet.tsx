"use client";

import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/lib/data/StoreProvider";
import { useRegion } from "@/lib/safety/useRegion";
import { CrisisResources } from "./CrisisResources";

export function HelpSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { updateProfile } = useStore();
  const region = useRegion();
  return (
    <Sheet open={open} onClose={onClose} label="Get help now" tone="care">
      <h2 className="font-display text-2xl">You deserve support right now</h2>
      <p className="mt-2 text-muted">
        If you&apos;re thinking about hurting yourself, or you&apos;re not safe, please reach out to a person who can help.
        These services are free and confidential.
      </p>
      <div className="mt-5">
        <CrisisResources region={region} onRegionChange={(code) => updateProfile({ region: code })} />
      </div>
      <div className="mt-5 flex justify-end">
        <Button variant="ghost" onClick={onClose}>
          Back
        </Button>
      </div>
    </Sheet>
  );
}
