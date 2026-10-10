"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageShell } from "@/components/shell/PageShell";
import { Button, LinkButton } from "@/components/ui/Button";
import { useStore } from "@/lib/data/StoreProvider";
import { getSupabase } from "@/lib/supabase/client";
import { accountsEnabled } from "@/lib/supabase/config";

export function SignIn() {
  const params = useSearchParams();
  const { user } = useStore();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(params.get("error") ? "error" : "idle");

  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(params.get("next") ?? "/")}`;

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setState("sending");
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });
    setState(error ? "error" : "sent");
  }

  async function google() {
    await getSupabase()?.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } });
  }

  if (!accountsEnabled) {
    return (
      <PageShell title="Accounts are coming soon" subtitle="For now, everything is saved privately on this device.">
        <LinkButton href="/" variant="primary">
          Back home
        </LinkButton>
      </PageShell>
    );
  }

  if (user) {
    return (
      <PageShell title="You're signed in" subtitle={user.email ?? undefined}>
        <LinkButton href="/" variant="primary">
          Continue
        </LinkButton>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Keep your conversations"
      subtitle="Sign in to keep your skies, reflections, and everything I remember about you — on any device. It's free."
    >
      {state === "sent" ? (
        <div role="status" className="rounded-lg border border-border bg-surface p-5">
          <p className="font-display text-xl">Check your email</p>
          <p className="mt-1 text-muted">We sent a sign-in link to {email}. You can close this tab.</p>
        </div>
      ) : (
        <div className="flex max-w-md flex-col gap-5">
          <Button variant="secondary" size="lg" onClick={google} className="justify-center">
            Continue with Google
          </Button>
          <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-faint">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <form onSubmit={sendLink} className="flex flex-col gap-3">
            <label htmlFor="email" className="text-sm text-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-md border border-border bg-surface px-4 text-text focus:border-accent focus:outline-none"
            />
            <Button type="submit" variant="primary" size="lg" disabled={state === "sending"} className="justify-center">
              {state === "sending" ? "Sending…" : "Email me a sign-in link"}
            </Button>
          </form>
          {state === "error" && (
            <p role="alert" className="text-care">
              That didn&apos;t work. Please try again.
            </p>
          )}
          <p className="text-sm text-faint">
            By continuing you agree to the <Link href="/terms" className="underline">terms</Link> and{" "}
            <Link href="/privacy" className="underline">privacy summary</Link>.
          </p>
        </div>
      )}
    </PageShell>
  );
}
