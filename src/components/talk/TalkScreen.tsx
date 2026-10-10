"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BreatheMode } from "@/components/breathe/BreatheMode";
import { Captions } from "@/components/captions/Captions";
import { ConsentSheet } from "@/components/consent/ConsentSheet";
import { Presence } from "@/components/presence/Presence";
import { CrisisPanel } from "@/components/safety/CrisisPanel";
import { HelpSheet } from "@/components/safety/HelpSheet";
import { Sky } from "@/components/sky/Sky";
import { Button } from "@/components/ui/Button";
import { HeartHandIcon, KeyboardIcon, MicIcon, TranscriptIcon, WindIcon } from "@/components/ui/icons";
import type { PresenceState, RiskLevel } from "@/lib/conversation/types";
import { useConversation } from "@/lib/conversation/useConversation";
import { toneToWeather } from "@/lib/conversation/weather";
import { useStore } from "@/lib/data/StoreProvider";
import { riskAtLeast } from "@/lib/safety/keywords";
import type { SessionMode } from "@/lib/data/types";
import { TextComposer } from "./TextComposer";
import { TranscriptSheet } from "./TranscriptSheet";

export function TalkScreen({ initialMode }: { initialMode: SessionMode }) {
  const router = useRouter();
  const { profile } = useStore();
  const [mode, setMode] = useState<SessionMode>(initialMode);
  const [typing, setTyping] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [breathing, setBreathing] = useState(false);
  const [ending, setEnding] = useState(false);

  // Safety: the panel opens itself on acute risk and offers itself on elevated risk.
  const [panelRisk, setPanelRisk] = useState<RiskLevel | null>(null);
  const [panelExpanded, setPanelExpanded] = useState(false);

  const convo = useConversation(mode, {
    onRisk: (risk) => {
      setPanelRisk((prev) => (prev === "acute" ? prev : risk));
      if (risk === "acute") setPanelExpanded(true);
    },
  });
  const consented = Boolean(profile?.consentedAt);

  const { start } = convo;
  useEffect(() => {
    if (consented) void start();
  }, [consented, start]);

  const concerned = riskAtLeast(convo.latestRisk, "elevated") || panelRisk === "acute";
  const presence: PresenceState =
    convo.phase === "waiting"
      ? "thinking"
      : convo.phase === "streaming"
        ? "speaking"
        : concerned
          ? "concerned"
          : typing
            ? "listening"
            : "idle";

  async function endSession() {
    setEnding(true);
    const session = await convo.end();
    router.push(session && convo.userTurns > 0 ? `/history/${session.id}?new=1` : "/");
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      {/* In a hard moment the sky goes quiet rather than stormy. */}
      <Sky weather={concerned ? null : toneToWeather(convo.tone)} />

      <header className="relative z-10 flex items-center justify-between gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Button variant="secondary" onClick={endSession} disabled={ending} className="backdrop-blur">
          {ending ? "Ending…" : "End"}
        </Button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" onClick={() => setHelpOpen(true)} className="!text-care" aria-haspopup="dialog">
            <HeartHandIcon size={20} />
            <span className="hidden sm:inline">Get help</span>
            <span className="sr-only sm:hidden">Get help</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setBreathing((b) => !b)} aria-pressed={breathing} aria-label="Breathe">
            <WindIcon />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setTranscriptOpen(true)} aria-label="Show conversation" aria-haspopup="dialog">
            <TranscriptIcon />
          </Button>
        </div>
      </header>

      {convo.demo && (
        <p className="relative z-10 mx-auto mt-2 rounded-pill border border-border bg-surface px-3 py-1 text-xs text-muted backdrop-blur">
          Demo mode · replies are scripted
        </p>
      )}

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center-safe gap-4 overflow-y-auto px-4 py-2">
        {breathing ? (
          <div className="w-full max-w-md">
            <BreatheMode tone={convo.tone} onClose={() => setBreathing(false)} />
          </div>
        ) : (
          <>
            <Presence
              state={presence}
              tone={convo.tone}
              className={panelRisk && panelExpanded ? "w-[min(40vw,18dvh)]" : "w-[min(70vw,38dvh,22rem)]"}
            />
            <Captions lines={convo.lines} />
            {panelRisk && (
              <div className="w-full max-w-xl">
                <CrisisPanel
                  risk={panelRisk}
                  expanded={panelExpanded}
                  onExpand={() => setPanelExpanded(true)}
                  onCollapse={() => setPanelExpanded(false)}
                />
              </div>
            )}
            {convo.error && (
              <p role="alert" className="text-center text-sm text-care">
                {convo.error}
              </p>
            )}
          </>
        )}
      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-2xl items-end gap-2 px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {mode === "text" ? (
          <>
            <TextComposer onSend={convo.send} onTypingChange={setTyping} disabled={!convo.session} />
            <Button variant="ghost" size="icon" onClick={() => setMode("voice")} aria-label="Switch to talking">
              <MicIcon />
            </Button>
          </>
        ) : (
          <div className="flex w-full items-center justify-center gap-3">
            <p className="text-sm text-muted">Voice is coming in the next step.</p>
            <Button variant="ghost" size="icon" onClick={() => setMode("text")} aria-label="Switch to writing">
              <KeyboardIcon />
            </Button>
          </div>
        )}
      </footer>

      <TranscriptSheet open={transcriptOpen} onClose={() => setTranscriptOpen(false)} lines={convo.lines} />
      <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ConsentSheet open={profile !== null && !consented} onAccept={() => undefined} onCancel={() => router.push("/")} />
    </div>
  );
}
