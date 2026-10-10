"use client";

import { useEffect, useState } from "react";

export interface ServiceStatus {
  claude: boolean;
  voice: boolean;
  accounts: boolean;
}

let cached: Promise<ServiceStatus> | null = null;

export function fetchServiceStatus(): Promise<ServiceStatus> {
  cached ??= fetch("/api/status")
    .then((r) => r.json() as Promise<ServiceStatus>)
    .catch(() => ({ claude: false, voice: false, accounts: false }));
  return cached;
}

/** Which backend services are configured (null while loading). */
export function useServiceStatus(): ServiceStatus | null {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchServiceStatus().then((s) => !cancelled && setStatus(s));
    return () => {
      cancelled = true;
    };
  }, []);
  return status;
}
