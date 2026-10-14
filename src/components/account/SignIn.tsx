"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Presence } from "@/components/presence/Presence";
import { Backdrop } from "@/components/shell/Backdrop";
import { TopBar } from "@/components/shell/TopBar";
import { Button, LinkButton } from "@/components/ui/Button";
import { useStore } from "@/lib/data/StoreProvider";
import { getSupabase } from "@/lib/supabase/client";
import { accountsEnabled } from "@/lib/supabase/config";

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.5z" />
      <path fill="#34A853" d="M12 23.5c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3A11.5 11.5 0 0 0 12 23.5z" />
      <path fill="#FBBC05" d="M5.6 14.2a6.9 6.9 0 0 1 0-4.4v-3H1.8a11.5 11.5 0 0 0 0 10.4z" />
      <path fill="#EA4335" d="M12 5.1c1.7 0 3.2.6 4.4 1.7l3.3-3.3A11.5 11.5 0 0 0 1.8 6.8l3.8 3C6.5 7.1 9 5.1 12 5.1z" />
    </svg>
  );
}

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

  let body: React.ReactNode;
  if (!accountsEnabled) {
    body = (
      <>
        <div className="text-center">
          <h1 className="heading">
            Accounts are <span className="accent">coming soon</span>
          </h1>
          <p className="mt-1.5 text-muted">For now, everything is saved privately on this device.</p>
        </div>
        <LinkButton href="/" variant="primary" size="lg">
          Back home
        </LinkButton>
      </>
    );
  } else if (user) {
    body = (
      <>
        <div className="text-center">
          <h1 className="heading">
            You&apos;re <span className="accent">signed in</span>
          </h1>
          <p className="mt-1.5 text-muted">{user.email}</p>
        </div>
        <LinkButton href="/" variant="primary" size="lg">
          Continue
        </LinkButton>
      </>
    );
  } else if (state === "sent") {
    body = (
      <div role="status" className="text-center">
        <h1 className="heading">
          Check your <span className="accent">email</span>
        </h1>
        <p className="mt-1.5 text-muted">We sent a sign-in link to {email}. You can close this tab.</p>
      </div>
    );
  } else {
    body = (
      <>
        <div className="flex flex-col gap-1.5 text-center">
          <h1 className="heading text-[32px]">
            Keep your <span className="accent">skies</span>
          </h1>
          <p className="text-muted">Sign in so I remember you on any device.</p>
        </div>
        <Button variant="secondary" onClick={google} className="min-h-[52px] text-base font-medium">
          <GoogleMark /> Continue with Google
        </Button>
        <div className="flex items-center gap-3 text-sm text-faint">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={sendLink} className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5 text-sm text-muted">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-[52px] rounded-md border border-border bg-surface px-4 text-base text-text shadow-soft focus:border-accent-strong focus:outline-none"
            />
          </label>
          <Button type="submit" variant="primary" disabled={state === "sending"} className="min-h-[52px] text-base">
            {state === "sending" ? "Sending…" : "Send me a sign-in link"}
          </Button>
        </form>
        {state === "error" && (
          <p role="alert" className="text-center text-care">
            That didn&apos;t work. Please try again.
          </p>
        )}
        <p className="text-center text-sm text-faint">
          No password. The link works once. By continuing you agree to the{" "}
          <Link href="/terms" className="underline">
            terms
          </Link>
          .
        </p>
      </>
    );
  }

  return (
    <div className="relative min-h-dvh">
      <Backdrop weather="breaking" />
      <TopBar back />
      <main className="relative mx-auto flex w-full max-w-[440px] flex-col gap-5 px-4 pt-10 pb-8">
        <div className="flex justify-center">
          <Presence state="idle" tone="hopeful" className="w-[140px]" />
        </div>
        {body}
      </main>
    </div>
  );
}
