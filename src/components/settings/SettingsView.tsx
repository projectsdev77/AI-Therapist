"use client";

import { useEffect, useState } from "react";
import { DeleteEverythingSheet } from "@/components/settings/DeleteEverythingSheet";
import { HelpSheet } from "@/components/safety/HelpSheet";
import { PageShell } from "@/components/shell/PageShell";
import { Button, LinkButton } from "@/components/ui/Button";
import { ChevronIcon } from "@/components/ui/icons";
import { Group, Row, RowButton, RowLink } from "@/components/ui/List";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { useAmbientSettings, writeAmbient } from "@/lib/ambient/settings";
import { AMBIENT_LABELS, type AmbientKind } from "@/lib/ambient/sources";
import { BRAND } from "@/lib/brand";
import { exportData } from "@/lib/data/exportData";
import { useStore } from "@/lib/data/StoreProvider";
import { INTERNATIONAL, REGIONS, resourcesFor } from "@/lib/safety/resources";
import { useRegion } from "@/lib/safety/useRegion";
import { accountsEnabled } from "@/lib/supabase/config";

/** A row backed by a native select (accessible, platform picker), styled as a link row. */
function SelectRow({ title, subtitle, value, options, onChange }: { title: string; subtitle?: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  const current = options.find((o) => o.value === value)?.label ?? "";
  return (
    <label className="press relative flex min-h-16 w-full cursor-pointer items-center gap-3 py-2 pr-2 pl-4 hover:bg-glass">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-base">{title}</span>
        {subtitle && <span className="text-sm text-muted">{subtitle}</span>}
      </span>
      <span className="flex min-h-11 items-center gap-1.5 px-1.5 text-sm text-muted">
        {current}
        <ChevronIcon size={18} className="text-faint" />
      </span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={title} className="absolute inset-0 cursor-pointer opacity-0">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const input = "min-h-[52px] w-full rounded-sm border border-edge-hi bg-field px-4 text-base text-text placeholder:text-faint focus:border-[rgba(143,240,232,.6)] focus:outline-none";

export function SettingsView() {
  const { store, profile, updateProfile, user, signOut } = useStore();
  const region = useRegion();
  const ambient = useAmbientSettings();
  const [voices, setVoices] = useState<{ id: string; name: string }[]>([]);
  const [sheet, setSheet] = useState<null | "name" | "delete" | "help">(null);
  const [nameDraft, setNameDraft] = useState("");

  useEffect(() => {
    fetch("/api/voices")
      .then((r) => r.json())
      .then((d: { voices: { id: string; name: string }[] }) => setVoices(d.voices))
      .catch(() => undefined);
  }, []);

  if (!profile) return <PageShell title="Settings">{null}</PageShell>;

  return (
    <PageShell title="Settings">
      <Group title="Account">
        {user ? (
          <Row title="Signed in" subtitle={user.email ?? "Your account"}>
            <Button variant="secondary" size="sm" onClick={() => void signOut()} className="px-4 font-semibold">
              Sign out
            </Button>
          </Row>
        ) : (
          <Row
            title={`You're using ${BRAND.name} without an account`}
            subtitle={accountsEnabled ? "Everything stays on this device." : "Everything stays on this device. Accounts are coming soon."}
          >
            {accountsEnabled && (
              <LinkButton href="/signin" variant="secondary" size="sm" className="px-4 font-semibold">
                Sign in
              </LinkButton>
            )}
          </Row>
        )}
        <RowButton
          title="Name"
          subtitle="What I call you"
          value={profile.displayName ?? "Add"}
          haspopup
          onClick={() => {
            setNameDraft(profile.displayName ?? "");
            setSheet("name");
          }}
        />
        <SelectRow
          title="Region"
          subtitle="Which crisis lines I show"
          value={resourcesFor(region).code}
          options={[...REGIONS, INTERNATIONAL].map((r) => ({ value: r.code, label: r.name }))}
          onChange={(code) => void updateProfile({ region: code })}
        />
      </Group>

      <Group title="Conversations">
        <RowLink href="/memory" title="Remember our conversations" subtitle="See or change everything in What I remember" value={profile.memoryEnabled ? "On" : "Off"} />
        <Row title="Ambient sound" subtitle="Soft rain, room tone or a low hum while you talk">
          <Switch checked={ambient.enabled} label="Ambient sound" onChange={(on) => writeAmbient({ enabled: on })} />
        </Row>
        <Row title="Match my sky" subtitle="Let the sound follow the weather" dim={!ambient.enabled}>
          <Switch checked={ambient.matchSky} disabled={!ambient.enabled} label="Match my sky" onChange={(on) => writeAmbient({ matchSky: on })} />
        </Row>
        {ambient.enabled && !ambient.matchSky && (
          <SelectRow
            title="Sound"
            subtitle="What plays while we talk"
            value={ambient.kind}
            options={(Object.keys(AMBIENT_LABELS) as AmbientKind[]).map((k) => ({ value: k, label: AMBIENT_LABELS[k] }))}
            onChange={(v) => writeAmbient({ kind: v as AmbientKind })}
          />
        )}
        {voices.length > 0 && (
          <SelectRow
            title="Voice"
            subtitle="How I sound when I speak"
            value={profile.voiceId ?? ""}
            options={[{ value: "", label: "Default" }, ...voices.map((v) => ({ value: v.id, label: v.name }))]}
            onChange={(v) => void updateProfile({ voiceId: v || null })}
          />
        )}
      </Group>

      <Group title="Your data">
        <RowButton title="Export everything" subtitle="Your conversations, cards and notes as one file" onClick={() => void exportData(store)} />
        <RowButton
          title="Delete everything"
          subtitle="Conversations, cards, skies and notes. This can't be undone."
          haspopup
          onClick={() => setSheet("delete")}
        />
        <RowLink href="/privacy" title="How I handle your data" />
      </Group>

      <Group title="About">
        <RowLink href="/terms" title="Terms" />
        <RowButton title="Help and crisis lines" haspopup onClick={() => setSheet("help")} />
      </Group>

      <p className="m-0 mx-1 text-[13px] text-faint">{BRAND.name} · Made for everyday reflection, not emergencies.</p>

      <Sheet open={sheet === "name"} onClose={() => setSheet(null)} title="What should I call you?">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void updateProfile({ displayName: nameDraft.trim() || null }).then(() => setSheet(null));
          }}
        >
          <label htmlFor="name" className="sr-only">
            Name
          </label>
          <input id="name" value={nameDraft} maxLength={80} onChange={(e) => setNameDraft(e.target.value)} placeholder="Your first name or a nickname" className={input} />
          <Button type="submit" variant="primary" size="xl">
            Save
          </Button>
        </form>
      </Sheet>

      <DeleteEverythingSheet open={sheet === "delete"} onClose={() => setSheet(null)} />

      <HelpSheet open={sheet === "help"} onClose={() => setSheet(null)} />
    </PageShell>
  );
}
