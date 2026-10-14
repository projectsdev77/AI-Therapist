import { Sky } from "@/components/sky/Sky";
import type { Weather } from "@/lib/conversation/types";

/** The sky plus the soft mesh of three radial washes, fixed behind every screen. */
export function Backdrop({ weather, night = false }: { weather: Weather | null; night?: boolean }) {
  if (night) {
    return (
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(60% 40% at 50% 45%, rgba(181,217,138,.10), transparent 70%), linear-gradient(180deg, var(--night-top), var(--night-bottom))",
        }}
      />
    );
  }
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0">
      <Sky weather={weather} />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 45% at 0% 74%, var(--mesh-a), transparent 70%), radial-gradient(65% 40% at 100% 32%, var(--mesh-b), transparent 70%), radial-gradient(60% 30% at 70% 0%, var(--mesh-c), transparent 70%)",
        }}
      />
    </div>
  );
}
