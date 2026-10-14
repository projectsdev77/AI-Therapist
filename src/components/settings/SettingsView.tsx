"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PageShell } from "@/components/shell/PageShell";
import { Button } from "@/components/ui/Button";
import { ChevronIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { useAmbientSettings, writeAmbient } from "@/lib/ambient/settings";
import { AMBIENT_LABELS, type AmbientKind } from "@/lib/ambient/sources";
import { useStore } from "@/lib/data/StoreProvider";
import { INTERNATIONAL, REGIONS, resourcesFor } from "@/lib/safety/resources";
import { useRegion } from "@/lib/safety/useRegion";
import { accountsEnabled } from "@/lib/supabase/config";
import { getThemePref, setThemePref, type ThemePref } from "@/lib/theme";
import Link from "next/link";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="ml-1 text-sm font-medium text-muted">{title}</h2>
      <div className="overflow-hidden rounded-md border border-border bg-surface shadow-soft [&>*+*]:border-t [&>*+*]:border-border">{children}</div>
    </section>
  );
}

function RowText({ label, hint, color }: { label: string; hint?: string; color?: string }) {
  return (
    <span className="flex flex-1 flex-col text-left">
      <span className={color}>{label}</span>
      {hint && <span className="text-sm text-muted">{hint}</span>}
    </span>
  );
}

const rowClass = "flex min-h-14 w-full items-center gap-3 py-1 pr-2 pl-4";

/** A row that opens something, showing its current value. */
function ValueRow({ label, hint, value, onClick, color }: { label: string; hint?: string; value?: string; onClick: () => void; color?: string }) {
  return (
    <button type="button" onClick={onClick} className={`${rowClass} transition-colors duration-[var(--motion-base)] hover:bg-surface-strong`}>
      <RowText label={label} hint={hint} color={color} />
      <span className="flex min-h-11 items-center gap-1.5 px-2 text-[15px] text-muted">
        {value}
        <ChevronIcon size={16} />
      </span>
    </button>
  );
}

/** A value row backed by a native select (accessible, platform picker). */
function SelectRow({ label, hint, value, options, onChange }: { label: string; hint?: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  const current = options.find((o) => o.value === value)?.label ?? "";
  return (
    <label className={`${rowClass} relative cursor-pointer hover:bg-surface-strong`}>
      <RowText label={label} hint={hint} />
      <span className="flex min-h-11 items-center gap-1.5 px-2 text-[15px] text-muted">
        {current}
        <ChevronIcon size={16} />
      </span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="absolute inset-0 cursor-pointer opacity-0">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SettingsView() {
  const { store, profile, updateProfile, user, signOut } = useStore();
  const region = useRegion();
  const [theme, setTheme] = useState<ThemePref>("system");
  const [voices, setVoices] = useState<{ id: string; name: string }[]>([]);
  const [sheet, setSheet] = useState<null | "name" | "account" | "delete">(null);
  const [nameDraft, setNameDraft] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  // Optimistic so the switch responds instantly while the save happens.
  const [memoryOn, setMemoryOn] = useState<boolean | null>(null);
  const ambient = useAmbientSettings();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser-only preferences
    setTheme(getThemePref());
    fetch("/api/voices")
      .then((r) => r.json())
      .then((d: { voices: { id: string; name: string }[] }) => setVoices(d.voices))
      .catch(() => undefined);
  }, []);

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
    // Full reload on purpose: clears every in-memory copy of the deleted data.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/");
  }

  if (!profile) return <PageShell title="Settings">{null}</PageShell>;
  const remembering = memoryOn ?? profile.memoryEnabled;

  return (
    <PageShell title="Settings">
      <div className="flex flex-col gap-[18px]">
        <Group title="You">
          <ValueRow
            label="Name"
            value={profile.displayName ?? "Add"}
            onClick={() => {
              setNameDraft(profile.displayName ?? "");
              setSheet("name");
            }}
          />
          <SelectRow
            label="Region"
            hint="Used for crisis lines"
            value={resourcesFor(region).code}
            options={[...REGIONS, INTERNATIONAL].map((r) => ({ value: r.code, label: r.name }))}
            onChange={(code) => void updateProfile({ region: code })}
          />
        </Group>

        <Group title="Conversations">
          <div className={rowClass}>
            <RowText label="Remember between conversations" hint="See everything in What I remember" />
            <Switch
              checked={remembering}
              label="Remember between conversations"
              onChange={(on) => {
                setMemoryOn(on);
                void updateProfile({ memoryEnabled: on }).catch(() => setMemoryOn(null));
              }}
            />
          </div>
          {voices.length > 0 && (
            <SelectRow
              label="Voice"
              value={profile.voiceId ?? ""}
              options={[{ value: "", label: "Default" }, ...voices.map((v) => ({ value: v.id, label: v.name }))]}
              onChange={(v) => void updateProfile({ voiceId: v || null })}
            />
          )}
          <div className={rowClass}>
            <RowText label="Ambient sound" hint="Soft sound while we talk, on this device" />
            <Switch checked={ambient.enabled} label="Ambient sound" onChange={(on) => writeAmbient({ enabled: on })} />
          </div>
          {ambient.enabled && (
            <>
              <div className={rowClass}>
                <RowText label="Match my sky" hint="Rain for heavy skies, a hum when it's breaking" />
                <Switch checked={ambient.matchSky} label="Match my sky" onChange={(on) => writeAmbient({ matchSky: on })} />
              </div>
              {!ambient.matchSky && (
                <SelectRow
                  label="Sound"
                  value={ambient.kind}
                  options={(Object.keys(AMBIENT_LABELS) as AmbientKind[]).map((k) => ({ value: k, label: AMBIENT_LABELS[k] }))}
                  onChange={(v) => writeAmbient({ kind: v as AmbientKind })}
                />
              )}
            </>
          )}
        </Group>

        <Group title="Look">
          <div className={rowClass}>
            <RowText label="Theme" />
            <div role="radiogroup" aria-label="Theme" className="flex gap-0.5 rounded-pill bg-surface-strong p-[3px]">
              {(
                [
                  ["dark", "Twilight"],
                  ["light", "Dawn"],
                  ["system", "Auto"],
                ] as const
              ).map(([t, label]) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={theme === t}
                  onClick={() => {
                    setTheme(t);
                    setThemePref(t);
                  }}
                  className={`min-h-11 rounded-pill px-3 text-sm ${theme === t ? "bg-accent font-medium text-on-accent" : "text-text"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </Group>

        <Group title="Your data">
          {accountsEnabled && (
            <ValueRow label="Account" value={user ? (user.email ?? "Signed in") : "Sign in"} onClick={() => setSheet("account")} />
          )}
          <ValueRow label="Export everything" value="JSON" onClick={() => void exportData()} />
          <ValueRow
            label="Delete everything"
            hint="Conversations, skies, notes. This can't be undone."
            color="text-care"
            onClick={() => {
              setConfirmText("");
              setSheet("delete");
            }}
          />
        </Group>

        <p className="text-sm text-faint">
          {store.kind === "local" ? "Everything is stored in this browser on this device." : "Everything is stored in your account."}{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy
          </Link>{" "}
          ·{" "}
          <Link href="/terms" className="underline underline-offset-2">
            Terms
          </Link>
        </p>
      </div>

      <Sheet open={sheet === "name"} onClose={() => setSheet(null)} label="Your name">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void updateProfile({ displayName: nameDraft.trim() || null }).then(() => setSheet(null));
          }}
        >
          <h2 className="heading heading-sheet">
            What should I <span className="accent">call you?</span>
          </h2>
          <label htmlFor="name" className="sr-only">
            Name
          </label>
          <input
            id="name"
            value={nameDraft}
            maxLength={80}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Your first name or a nickname"
            className="min-h-[52px] rounded-md border border-border bg-surface px-4 text-text placeholder:text-faint focus:border-accent-strong focus:outline-none"
          />
          <Button type="submit" variant="primary" size="lg">
            Save
          </Button>
        </form>
      </Sheet>

      <Sheet open={sheet === "account"} onClose={() => setSheet(null)} label="Account">
        <div className="flex flex-col gap-4">
          <h2 className="heading heading-sheet">{user ? "Your account" : "Keep your skies"}</h2>
          <p className="text-muted">
            {user ? `Signed in as ${user.email ?? "you"}.` : "You're using this device only. Sign in to keep everything across devices."}
          </p>
          {user ? (
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                setSheet(null);
                void signOut();
              }}
            >
              Sign out
            </Button>
          ) : (
            <Link href="/signin" className="inline-flex min-h-14 items-center justify-center rounded-pill bg-accent text-[17px] font-medium text-on-accent">
              Sign in
            </Link>
          )}
        </div>
      </Sheet>

      <Sheet open={sheet === "delete"} onClose={() => setSheet(null)} label="Delete everything">
        <div className="flex flex-col gap-4">
          <h2 className="heading heading-sheet">
            Delete <span className="accent">everything?</span>
          </h2>
          <p className="text-muted">
            Every conversation, reflection, sky, and note{user ? ", and your account" : ""} will be permanently deleted. This can&apos;t be undone.
          </p>
          <label htmlFor="confirm-delete" className="text-sm text-muted">
            Type DELETE to confirm
          </label>
          <input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            className="min-h-[52px] rounded-md border border-border bg-surface px-4 text-text focus:border-care focus:outline-none"
          />
          <Button variant="care" size="lg" disabled={confirmText !== "DELETE" || deleting} onClick={deleteEverything}>
            {deleting ? "Deleting…" : "Delete everything"}
          </Button>
        </div>
      </Sheet>
    </PageShell>
  );
}
