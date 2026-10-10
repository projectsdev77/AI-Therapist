"use client";

import type { ReactNode } from "react";
import { MovePrompt } from "@/components/account/MovePrompt";
import { StoreProvider } from "@/lib/data/StoreProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      {children}
      <MovePrompt />
    </StoreProvider>
  );
}
