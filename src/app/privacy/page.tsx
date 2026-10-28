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
            encrypted in our database so you can use it on any device. Only you can access it. Your ambient sound
            choice always stays on the device.
          </p>
        </section>
        <section>
          <h2>Who processes it</h2>
          <p>
            To reply, your words, along with your notes if memory is on, are sent to our AI provider (Anthropic). When
            you talk out loud, your voice is sent to our speech provider (ElevenLabs) to be turned into text, and the
            replies are turned back into speech there. We only use providers whose terms don&apos;t allow training on
            your conversations (to be confirmed with each provider before launch).
          </p>
          <p>
            If our speech provider isn&apos;t available, your browser&apos;s own speech features are used instead.
            Some browsers send that audio to their maker (for example, Chrome sends it to Google) under the
            browser&apos;s privacy terms. If you&apos;d rather avoid that, write instead of talking.
          </p>
          <p>Our own server passes your words and voice along but doesn&apos;t keep them.</p>
        </section>
        <section>
          <h2>What we never do</h2>
          <p>No advertising. No selling data. No training AI on your conversations. No conversation content in analytics.</p>
        </section>
        <section>
          <h2>Your controls</h2>
          <p>
            You can turn memory off (before your first conversation, or anytime in Settings), see and edit everything
            remembered, delete single conversations along with what was learned
            from them, export everything, or delete everything permanently. Turning memory off stops new notes and
            stops using old ones; existing notes stay until you delete them.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
