"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { PageShell } from "@/components/shell/PageShell";
import { Button, LinkButton } from "@/components/ui/Button";
import { DownloadIcon, TrashIcon } from "@/components/ui/icons";
import { useStore } from "@/lib/data/StoreProvider";
import { INTERNATIONAL, REGIONS } from "@/lib/safety/resources";
import { useRegion } from "@/lib/safety/useRegion";
import { accountsEnabled } from "@/lib/supabase/config";
import { getThemePref, setThemePref, type ThemePref } from "@/lib/theme";

function Section({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-t border-border py-7 first:border-t-0 first:pt-0">
      <h2 className="font-display text-xl">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function SettingsView() {
  const router = useRouter();
  const { store, profile, updateProfile, user, signOut } = useStore();
  const region = useRegion();
  const [name, setName] = useState("");
  const [theme, setTheme] = useState<ThemePref>("system");
  const [voices, setVoices] = useState<{ id: string; name: string }[]>([]);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser-only preferences
    setTheme(getThemePref());
    fetch("/api/voices")
      .then((r) => r.json())
      .then((d: { voices: { id: string; name: string }[] }) => setVoices(d.voices))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync the field once the profile loads
    if (profile) setName(profile.displayName ?? "");
  }, [profile]);

  async function exportData() {
    const bundle = await store.exportAll();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `haven-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function deleteEverything() {
    setDeleting(true);
    await store.deleteEverything();
    router.push("/");
    window.location.reload();
  }

  if (!profile) return <PageShell title="Settings">{null}</PageShell>;

  return (
    <PageShell title="Settings">
      <Section title="What should I call you?">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void updateProfile({ displayName: name.trim() || null });
          }}
        >
          <label htmlFor="name" className="sr-only">
            Name
          </label>
          <input
            id="name"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your first name or a nickname"
            className="h-11 flex-1 rounded-md border border-border bg-surface px-3 text-text placeholder:text-faint focus:border-accent focus:outline-none"
          />
          <Button type="submit" disabled={(profile.displayName ?? "") === name.trim()}>
            Save
          </Button>
        </form>
      </Section>

      <Section
        title="Memory"
        description={
          <>
            When memory is on, I remember what matters to you between conversations. You can see and edit everything in{" "}
            <Link href="/memory" className="underline">
              What I remember
            </Link>
            . Turning it off stops me from using or adding to my notes; your conversations stay in your history.
          </>
        }
      >
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            role="switch"
            checked={profile.memoryEnabled}
            onChange={(e) => void updateProfile({ memoryEnabled: e.target.checked })}
            className="size-5 accent-[var(--color-accent)]"
          />
          <span>{profile.memoryEnabled ? "Memory is on" : "Memory is off"}</span>
        </label>
      </Section>

      {voices.length > 0 && (
        <Section title="Voice">
          <label htmlFor="voice" className="sr-only">
            Companion voice
          </label>
          <select
            id="voice"
            value={profile.voiceId ?? ""}
            onChange={(e) => void updateProfile({ voiceId: e.target.value || null })}
            className="h-11 rounded-md border border-border bg-surface px-3 text-text"
          >
            <option value="">Default voice</option>
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </Section>
      )}

      <Section title="Appearance">
        <div role="radiogroup" aria-label="Theme" className="flex flex-wrap gap-2">
          {(["system", "dark", "light"] as const).map((t) => (
            <button
              key={t}
              role="radio"
              aria-checked={theme === t}
              onClick={() => {
                setTheme(t);
                setThemePref(t);
              }}
              className={`rounded-pill border px-4 py-2 text-sm ${theme === t ? "border-accent bg-surface-strong" : "border-border text-muted"}`}
            >
              {t === "system" ? "Match my device" : t === "dark" ? "Twilight" : "Dawn"}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Where you are" description="So the Get help button shows the right crisis lines.">
        <label htmlFor="region" className="sr-only">
          Region
        </label>
        <select
          id="region"
          value={region ?? "INTL"}
          onChange={(e) => void updateProfile({ region: e.target.value })}
          className="h-11 rounded-md border border-border bg-surface px-3 text-text"
        >
          {[...REGIONS, INTERNATIONAL].map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
      </Section>

      {accountsEnabled && (
        <Section
          title="Account"
          description={user ? `Signed in as ${user.email ?? "you"}.` : "You're using this device only. Sign in to keep everything across devices."}
        >
          {user ? (
            <Button onClick={() => void signOut()}>Sign out</Button>
          ) : (
            <LinkButton href="/signin" variant="primary">
              Sign in or create an account
            </LinkButton>
          )}
        </Section>
      )}

      <Section
        title="Your data"
        description={store.kind === "local" ? "Everything is stored in this browser on this device." : "Everything is stored in your account."}
      >
        <div className="flex flex-col gap-6">
          <Button onClick={exportData} className="self-start">
            <DownloadIcon size={18} /> Export everything
          </Button>
          <div className="rounded-lg border border-care p-4">
            <p className="font-medium">Delete everything</p>
            <p className="mt-1 text-sm text-muted">
              Permanently deletes every conversation, reflection, and memory{user ? ", and your account" : ""}. This can&apos;t be
              undone.
            </p>
            <label htmlFor="confirm-delete" className="mt-3 block text-sm text-muted">
              Type DELETE to confirm
            </label>
            <div className="mt-1 flex flex-col gap-2 sm:flex-row">
              <input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="h-11 w-full rounded-md border border-border bg-surface px-3 text-text focus:border-care focus:outline-none sm:w-40"
              />
              <Button variant="care" disabled={confirmText !== "DELETE" || deleting} onClick={deleteEverything} className="justify-center">
                <TrashIcon size={18} /> {deleting ? "Deleting…" : "Delete everything"}
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <p className="pt-4 text-sm text-faint">
        <Link href="/privacy" className="underline">
          Privacy summary
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="underline">
          Terms
        </Link>
      </p>
    </PageShell>
  );
}
