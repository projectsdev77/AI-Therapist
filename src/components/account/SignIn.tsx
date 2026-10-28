"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Backdrop } from "@/components/shell/Backdrop";
import { TopBar } from "@/components/shell/TopBar";
import { Button, LinkButton } from "@/components/ui/Button";
import { MailIcon } from "@/components/ui/icons";
import { useStore } from "@/lib/data/StoreProvider";
import { HOME } from "@/lib/routes";
import { getSupabase } from "@/lib/supabase/client";
import { accountsEnabled } from "@/lib/supabase/config";

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" />
      <path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2z" />
      <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6z" />
    </svg>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_MS = 30_000;

export function SignIn() {
  const params = useSearchParams();
  const { user } = useStore();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(params.get("error") ? "error" : "idle");
  const [invalid, setInvalid] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(0);

  // A once-a-second clock while "Send it again" is waiting.
  useEffect(() => {
    if (!resendAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [resendAt]);

  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(params.get("next") ?? HOME)}`;

  async function send() {
    const sb = getSupabase();
    if (!sb) return;
    setState("sending");
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });
    setState(error ? "error" : "sent");
    const t = Date.now();
    setNow(t);
    setResendAt(t + RESEND_MS);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    await send();
  }

  async function google() {
    await getSupabase()?.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } });
  }

  const h1 = "m-0 mt-[clamp(8px,4vw,48px)] text-[clamp(30px,3vw,38px)] leading-[1.1] font-semibold tracking-[-0.04em]";
  const wait = Math.max(0, Math.ceil((resendAt - now) / 1000));

  let body: React.ReactNode;
  if (!accountsEnabled) {
    body = (
      <>
        <h1 className={h1}>Accounts are coming soon</h1>
        <p className="m-0 text-base text-muted">For now, everything is saved privately on this device. You don&apos;t need an account to talk.</p>
        <LinkButton href={HOME} variant="primary" size="xl" className="mt-2">
          Back home
        </LinkButton>
      </>
    );
  } else if (user) {
    body = (
      <>
        <h1 className={h1}>You&apos;re signed in</h1>
        <p className="m-0 text-base text-muted">{user.email}</p>
        <LinkButton href={HOME} variant="primary" size="xl" className="mt-2">
          Continue
        </LinkButton>
      </>
    );
  } else if (state === "sent") {
    body = (
      <div role="status" className="mt-[clamp(16px,6vw,64px)] flex flex-col items-center gap-3 text-center">
        <span aria-hidden className="flex size-16 items-center justify-center rounded-full bg-glass-strong text-accent-strong">
          <MailIcon size={28} />
        </span>
        <h1 className="m-0 text-[30px] font-semibold tracking-[-0.035em]">Check your email</h1>
        <p className="m-0 max-w-[340px] text-base text-muted">
          I sent a sign-in link to <strong className="font-semibold text-text">{email}</strong>. It works once.
        </p>
        <Button variant="secondary" size="lg" className="mt-2" disabled={wait > 0} onClick={() => void send()}>
          {wait > 0 ? `Send it again in ${wait}s` : "Send it again"}
        </Button>
        <Button variant="tertiary" onClick={() => setState("idle")}>
          Use a different email
        </Button>
      </div>
    );
  } else {
    body = (
      <>
        <h1 className={h1}>Keep your conversations safe</h1>
        <p className="m-0 text-base text-muted">
          An account keeps your cards, skies and notes private and lets you use them on any device. You don&apos;t need one to talk.
        </p>
        <button
          type="button"
          onClick={() => void google()}
          className="press mt-2 flex min-h-14 items-center justify-center gap-2.5 rounded-pill bg-[#effcfa] text-base font-semibold text-[#0b2a35]"
        >
          <GoogleMark /> Continue with Google
        </button>
        <div aria-hidden className="flex items-center gap-3 text-[13px] text-faint">
          <span className="h-px flex-1 bg-edge-hi" />
          or
          <span className="h-px flex-1 bg-edge-hi" />
        </div>
        <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[14px] font-semibold text-muted">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              placeholder="you@example.com"
              aria-invalid={invalid || undefined}
              aria-describedby={invalid ? "email-error" : undefined}
              onChange={(e) => setEmail(e.target.value)}
              className={`min-h-[52px] rounded-sm border bg-field px-4 text-base text-text placeholder:text-faint focus:outline-none ${
                invalid ? "border-danger-edge" : "border-edge-hi focus:border-[rgba(143,240,232,.6)]"
              }`}
            />
            {invalid && (
              <span id="email-error" role="alert" className="text-[14px] text-danger-text">
                That doesn&apos;t look like an email address.
              </span>
            )}
          </label>
          <Button type="submit" variant="primary" disabled={state === "sending"} className="min-h-[52px] text-base">
            {state === "sending" ? "Sending…" : "Email me a sign-in link"}
          </Button>
        </form>
        {state === "error" && (
          <p role="alert" className="m-0 text-[14px] text-danger-text">
            That didn&apos;t work. Please try again.
          </p>
        )}
        <p className="m-0 mt-1 text-[13px] text-faint">
          No password. We&apos;ll only use your email to sign you in. <Link href="/privacy">Privacy</Link>
        </p>
      </>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col">
      <Backdrop />
      <TopBar title="Sign in" />
      <main className="relative z-[1] flex flex-1 flex-col items-center px-5 pt-6 pb-12">
        <div className="flex w-full max-w-[420px] flex-col gap-4">{body}</div>
      </main>
    </div>
  );
}
