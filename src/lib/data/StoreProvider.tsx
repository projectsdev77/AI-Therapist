"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { LocalStore } from "./localStore";
import type { DataStore, Profile } from "./types";

interface StoreContextValue {
  store: DataStore;
  /** null while loading. */
  profile: Profile | null;
  updateProfile: (patch: Partial<Omit<Profile, "id" | "createdAt">>) => Promise<Profile>;
  refreshProfile: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

let localStoreSingleton: LocalStore | null = null;
export function getLocalStore(): LocalStore {
  localStoreSingleton ??= new LocalStore();
  return localStoreSingleton;
}

export function StoreProvider({ store: injected, children }: { store?: DataStore; children: ReactNode }) {
  const [store] = useState<DataStore>(() => injected ?? getLocalStore());
  const [profile, setProfile] = useState<Profile | null>(null);

  const refreshProfile = useCallback(async () => {
    setProfile(await store.getProfile());
  }, [store]);

  useEffect(() => {
    let cancelled = false;
    store.getProfile().then((p) => {
      if (!cancelled) setProfile(p);
    });
    return () => {
      cancelled = true;
    };
  }, [store]);

  const updateProfile = useCallback(
    async (patch: Partial<Omit<Profile, "id" | "createdAt">>) => {
      const next = await store.updateProfile(patch);
      setProfile(next);
      return next;
    },
    [store],
  );

  const value = useMemo(() => ({ store, profile, updateProfile, refreshProfile }), [store, profile, updateProfile, refreshProfile]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
