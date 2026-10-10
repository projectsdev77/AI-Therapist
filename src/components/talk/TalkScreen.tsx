"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { BreatheMode } from "@/components/breathe/BreatheMode";
import { Captions } from "@/components/captions/Captions";
import { ConsentSheet } from "@/components/consent/ConsentSheet";
import { Presence } from "@/components/presence/Presence";
import { CrisisPanel } from "@/components/safety/CrisisPanel";
import { HelpSheet } from "@/components/safety/HelpSheet";
import { Sky } from "@/components/sky/Sky";
import { Button } from "@/components/ui/Button";
import { HeartHandIcon, MicIcon, TranscriptIcon, WindIcon } from "@/components/ui/icons";
import type { PresenceState, RiskLevel } from "@/lib/conversation/types";
import { useConversation, type ConversationCallbacks } from "@/lib/conversation/useConversation";
import { toneToWeather } from "@/lib/conversation/weather";
import { useStore } from "@/lib/data/StoreProvider";
import { riskAtLeast } from "@/lib/safety/keywords";
import { useServiceStatus } from "@/lib/serviceStatus";
import { useVoice, type Voice } from "@/lib/voice/useVoice";
import type { SessionMode } from "@/lib/data/types";
import { TextComposer } from "./TextComposer";
import { TranscriptSheet } from "./TranscriptSheet";
import { VoiceControls } from "./VoiceControls";

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

  // Voice and conversation depend on each other; the voice's reply callbacks go through a ref.
  const voiceRef = useRef<Voice | null>(null);
  const callbacks = useMemo<ConversationCallbacks>(
    () => ({
      onRisk: (risk) => {
        setPanelRisk((prev) => (prev === "acute" ? prev : risk));
        if (risk === "acute") setPanelExpanded(true);
      },
      onReplyStart: () => voiceRef.current?.callbacks.onReplyStart?.(),
      onReplyDelta: (t) => voiceRef.current?.callbacks.onReplyDelta?.(t),
      onReplyEnd: (t, i) => voiceRef.current?.callbacks.onReplyEnd?.(t, i),
    }),
    [],
  );
  const convo = useConversation(mode, callbacks);
  const services = useServiceStatus();
  const voice = useVoice({
    serverVoice: Boolean(services?.voice),
    voiceId: profile?.voiceId,
    phase: convo.phase,
    onUtterance: convo.send,
    onBargeIn: convo.interrupt,
  });
  useEffect(() => {
    voiceRef.current = voice;
  });
  const consented = Boolean(profile?.consentedAt);

  // Text starts right away; voice waits for a tap so the greeting can be heard.
  const { start } = convo;
  useEffect(() => {
    if (consented && mode === "text") void start();
  }, [consented, mode, start]);

  async function startVoice() {
    await voice.start();
    void start();
  }

  function switchMode(next: SessionMode) {
    if (next === "text") voice.stop();
    setMode(next);
  }

  const voiceActive = mode === "voice" && voice.status !== "off" && voice.status !== "error" && voice.status !== "unsupported";
  const lines = voice.partial ? [...convo.lines, { id: "partial", speaker: "user" as const, text: voice.partial, pending: true }] : convo.lines;

  const concerned = riskAtLeast(convo.latestRisk, "elevated") || panelRisk === "acute";
  const presence: PresenceState = voiceActive
    ? voice.status === "speaking"
      ? "speaking"
      : voice.status === "thinking" || voice.status === "transcribing" || convo.phase === "waiting"
        ? "thinking"
        : concerned
          ? "concerned"
          : "listening"
    : convo.phase === "waiting"
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
    voice.stop();
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
              getLevel={voiceActive ? voice.getLevel : undefined}
              className={panelRisk && panelExpanded ? "w-[min(40vw,18dvh)]" : "w-[min(70vw,38dvh,22rem)]"}
            />
            <Captions lines={lines} />
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
            <TextComposer onSend={convo.send} onTypingChange={setTyping} />
            <Button variant="ghost" size="icon" onClick={() => switchMode("voice")} aria-label="Switch to talking">
              <MicIcon />
            </Button>
          </>
        ) : (
          <VoiceControls voice={voice} onStart={startVoice} onSwitchToText={() => switchMode("text")} />
        )}
      </footer>

      <TranscriptSheet open={transcriptOpen} onClose={() => setTranscriptOpen(false)} lines={convo.lines} />
      <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ConsentSheet open={profile !== null && !consented} onAccept={() => undefined} onCancel={() => router.push("/")} />
    </div>
  );
}
