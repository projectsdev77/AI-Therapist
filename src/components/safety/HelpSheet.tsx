"use client";

import { Sheet } from "@/components/ui/Sheet";
import { useStore } from "@/lib/data/StoreProvider";
import { useRegion } from "@/lib/safety/useRegion";
import { CrisisResources, RegionPicker } from "./CrisisResources";

export function HelpSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { updateProfile } = useStore();
  const region = useRegion();
  return (
    <Sheet open={open} onClose={onClose} label="Get help now">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="heading heading-sheet">
            Talk to a <span className="accent">person</span>
          </h2>
          <p className="text-[15px] text-muted">Free and confidential. You can keep talking to me too.</p>
        </div>
        <RegionPicker region={region} onChange={(code) => void updateProfile({ region: code })} />
        <CrisisResources region={region} />
      </div>
    </Sheet>
  );
}
