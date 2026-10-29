import type { Metadata } from "next";
import { PrivacyActionsFoot, PrivacyPanel } from "@/components/settings/PrivacyActions";
import { PageShell } from "@/components/shell/PageShell";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Privacy" };

const GROUPS: { name: string; rows: [string, string][] }[] = [
  {
    name: "Where your words go",
    rows: [
      ["Without an account", "Everything stays in this browser on this device. Clearing this site's data in your browser deletes it."],
      ["With an account", "It's stored in our database, encrypted at rest, and only your account can open it. Use it on any device."],
      [
        "To reply",
        "Your words, and your notes if memory is on, go to our AI provider (Anthropic, or Google's Gemini while we test). When you talk out loud, your voice goes to our speech provider (ElevenLabs). While we test on Gemini's free tier, Google may use what's sent to improve its products. Before launch we'll only use providers whose terms don't allow training on your conversations.",
      ],
      [
        "If voice falls back to your browser",
        "If our speech provider isn't available, your browser's own speech features are used. Some browsers send that audio to their maker (Chrome sends it to Google). Write instead if you'd rather avoid that.",
      ],
      ["Our server", `${BRAND.name}'s server passes your words and voice along but doesn't keep them.`],
    ],
  },
  {
    name: "What we never do",
    rows: [
      ["Sell or share for ads", "Never. Not your words, not your skies, not your notes."],
      ["Put conversations in analytics", "There are no analytics yet. If we add them, they'll count things like \"a conversation started\", never what was said."],
    ],
  },
  {
    name: "Your controls",
    rows: [
      [
        "See and edit memory",
        "Turn memory off before your first conversation or anytime. Off stops new notes and stops using old ones; existing notes stay until you delete them. Everything I remember is listed in What I remember.",
      ],
      ["Change any card", "Edit a reflection card's words, choose its sky, or delete a conversation, with or without the notes it produced."],
      ["Export or delete", "Take everything with you as one file, or delete it all at once."],
    ],
  },
];

export default function PrivacyPage() {
  return (
    <PageShell title="Privacy" heading={false} width={680} panel={<PrivacyPanel />} panelLabel="Your controls">
      <div className="flex flex-col gap-2">
        <h1 className="t-page-h1 m-0 hidden min-[720px]:block min-[1024px]:text-[40px]">Privacy, in plain words</h1>
        <p className="m-0 text-[17px] text-muted">What you share here is personal. Here is exactly what happens to it.</p>
        <p className="m-0 text-[13px] text-faint">Draft, to be finalized with legal review before launch.</p>
      </div>
      {GROUPS.map((g) => (
        <section key={g.name} className="flex flex-col gap-1.5">
          <h2 className="t-group m-0 mb-0.5 ml-1">{g.name}</h2>
          <div className="overflow-hidden rounded-md border border-edge-hi bg-glass [&>*+*]:border-t [&>*+*]:border-edge-lo">
            {g.rows.map(([t, d]) => (
              <div key={t} className="flex flex-col gap-0.5 px-4 py-3.5">
                <strong className="text-base font-semibold">{t}</strong>
                <span className="text-[15px] text-muted">{d}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
      <PrivacyActionsFoot />
    </PageShell>
  );
}
