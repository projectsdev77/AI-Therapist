"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { finishPendingSessions } from "@/lib/reflection/pending";
import { syncReturningCookie } from "@/lib/returning";
import { getSupabase } from "@/lib/supabase/client";
import { LocalStore } from "./localStore";
import { SupabaseStore } from "./supabaseStore";
import type { DataStore, Profile } from "./types";

interface StoreContextValue {
  /** LocalStore for guests, SupabaseStore when signed in. */
  store: DataStore;
  /** null while loading. */
  profile: Profile | null;
  /** Signed-in user, or null for guests. */
  user: User | null;
  /** True until we know whether someone is signed in. */
  authLoading: boolean;
  updateProfile: (patch: Partial<Omit<Profile, "id" | "createdAt">>) => Promise<Profile>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const caughtUp = new WeakSet<DataStore>();

let localStoreSingleton: LocalStore | null = null;
export function getLocalStore(): LocalStore {
  localStoreSingleton ??= new LocalStore();
  return localStoreSingleton;
}

export function StoreProvider({ store: injected, children }: { store?: DataStore; children: ReactNode }) {
  const supabase = injected ? null : getSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUser(data.user ?? null);
      setAuthLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser((prev) => (prev?.id === session?.user?.id ? prev : (session?.user ?? null)));
    });
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  const store = useMemo<DataStore>(() => {
    if (injected) return injected;
    if (supabase && user) return new SupabaseStore(supabase, user.id);
    return getLocalStore();
  }, [injected, supabase, user]);

  const refreshProfile = useCallback(async () => {
    setProfile(await store.getProfile());
  }, [store]);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    store.getProfile().then(
      (p) => !cancelled && setProfile(p),
      (err) => console.error("profile load failed", err),
    );
    return () => {
      cancelled = true;
    };
  }, [store, authLoading]);

  const updateProfile = useCallback(
    async (patch: Partial<Omit<Profile, "id" | "createdAt">>) => {
      // Optimistic: controls respond instantly; the saved profile replaces it after.
      setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
      try {
        const next = await store.updateProfile(patch);
        setProfile(next);
        return next;
      } catch (err) {
        setProfile(await store.getProfile().catch(() => null));
        throw err;
      }
    },
    [store],
  );

  // Keep the "returning visitor" cookie in step with consent (and clear it after Delete everything).
  useEffect(() => {
    if (profile) syncReturningCookie(Boolean(profile.consentedAt));
  }, [profile]);

  // Once per store, after load: finish conversations whose card never got made.
  const loaded = profile !== null && !authLoading;
  useEffect(() => {
    if (injected || !loaded || caughtUp.has(store)) return;
    const timer = setTimeout(() => {
      caughtUp.add(store);
      finishPendingSessions(store)
        .then((n) => (n > 0 ? refreshProfile() : undefined))
        .catch((err) => console.warn("pending reflections", err));
    }, 1500);
    return () => clearTimeout(timer);
  }, [injected, loaded, store, refreshProfile]);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    setUser(null);
  }, [supabase]);

  const value = useMemo(
    () => ({ store, profile: authLoading ? null : profile, user, authLoading, updateProfile, refreshProfile, signOut }),
    [store, profile, user, authLoading, updateProfile, refreshProfile, signOut],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
