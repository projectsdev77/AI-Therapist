import type { Metadata } from "next";
import { PageShell } from "@/components/shell/PageShell";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <PageShell title="Terms" subtitle="Draft — to be finalized with legal review before launch.">
      <div className="flex flex-col gap-4 leading-relaxed text-muted">
        <p>{BRAND.name} is an AI companion for emotional support and self-reflection. It is not therapy, counseling, or medical care, and it is not a crisis service.</p>
        <p>You must be 18 or older to use {BRAND.name}.</p>
        <p>If you are in danger or thinking about harming yourself or someone else, contact your local emergency number or a crisis line right away. Use the Get help button at any time.</p>
        <p>AI can make mistakes. Don&apos;t rely on {BRAND.name} for medical, legal, or financial decisions.</p>
      </div>
    </PageShell>
  );
}
