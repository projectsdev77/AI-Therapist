"use client";

import type { ReactNode } from "react";
import { StoreProvider } from "@/lib/data/StoreProvider";

export function Providers({ children }: { children: ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>;
}
