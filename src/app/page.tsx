import type { Metadata } from "next";
import { Landing } from "@/components/landing/Landing";
import { BRAND } from "@/lib/brand";

const title = `${BRAND.name} · a calm AI companion to talk things through`;
const description =
  "Talk or write to a calm AI companion. Untangle a thought, get through a hard moment, or check in with yourself. No account needed. Not therapy, not for emergencies.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  openGraph: { title, description: "Talk or write to a calm AI companion. No account needed. Private by default.", type: "website" },
};

export default function Page() {
  return <Landing />;
}
