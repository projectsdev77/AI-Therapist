import type { Metadata } from "next";
import { PageShell } from "@/components/shell/PageShell";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <PageShell title="Privacy, in plain words" subtitle="Draft — to be finalized with legal review before launch.">
      <div className="flex flex-col gap-6 leading-relaxed text-muted [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-text">
        <section>
          <h2>What we save</h2>
          <p>
            Your conversations, the reflection cards made from them, and short notes about what matters to you (people,
            situations, what helps). {BRAND.name} saves these by default so it can remember you between conversations.
          </p>
        </section>
        <section>
          <h2>Where it lives</h2>
          <p>
            Without an account, everything stays in this browser on this device. With an account, it&apos;s stored
            encrypted in our database so you can use it on any device. Only you can access it.
          </p>
        </section>
        <section>
          <h2>Who processes it</h2>
          <p>
            To reply, your words are sent to our AI provider (Anthropic). Voice is processed by our speech provider
            (ElevenLabs). Neither may use your conversations to train their models under our agreements.
          </p>
        </section>
        <section>
          <h2>What we never do</h2>
          <p>No advertising. No selling data. No training AI on your conversations. No conversation content in analytics.</p>
        </section>
        <section>
          <h2>Your controls</h2>
          <p>
            In Settings you can turn memory off, see and edit everything remembered, delete single conversations, export
            everything, or delete everything permanently.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
