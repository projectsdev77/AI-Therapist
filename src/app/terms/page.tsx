import type { Metadata } from "next";
import { PageShell } from "@/components/shell/PageShell";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Terms" };

const ROWS: [string, string][] = [
  ["What it is", `${BRAND.name} is an AI companion for emotional support and self-reflection. It is not therapy, counseling, or medical care, and it is not a crisis service.`],
  ["Who it's for", `You must be 18 or older to use ${BRAND.name}.`],
  ["In an emergency", "If you are in danger or thinking about harming yourself or someone else, contact your local emergency number or a crisis line right away. Get help is at the top of every screen."],
  ["AI makes mistakes", `Don't rely on ${BRAND.name} for medical, legal, or financial decisions.`],
];

export default function TermsPage() {
  return (
    <PageShell title="Terms" subtitle="Draft, to be finalized with legal review before launch." width={680}>
      <div className="overflow-hidden rounded-md border border-edge-hi bg-glass [&>*+*]:border-t [&>*+*]:border-edge-lo">
        {ROWS.map(([t, d]) => (
          <div key={t} className="flex flex-col gap-0.5 px-4 py-3.5">
            <strong className="text-base font-semibold">{t}</strong>
            <span className="text-[15px] text-muted">{d}</span>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
