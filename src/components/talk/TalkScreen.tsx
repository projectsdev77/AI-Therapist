"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { BreatheMode } from "@/components/breathe/BreatheMode";
import { Captions } from "@/components/captions/Captions";
import { ConsentSheet } from "@/components/consent/ConsentSheet";
import { Presence } from "@/components/presence/Presence";
import { CrisisPanel } from "@/components/safety/CrisisPanel";
import { HelpSheet } from "@/components/safety/HelpSheet";
import { Backdrop } from "@/components/shell/Backdrop";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { BreatheIcon, TranscriptIcon } from "@/components/ui/icons";
import { weatherToAmbient, useAmbientSettings } from "@/lib/ambient/settings";
import { useAmbient } from "@/lib/ambient/useAmbient";
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
import { VoiceBand, VoiceStart } from "./VoiceControls";

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

  // Ambient sound: quiet under every word, silent while breathing or when the help panel is open.
  const ambient = useAmbientSettings();
  const weather = concerned ? null : toneToWeather(convo.tone);
  useAmbient(ambient.matchSky ? weatherToAmbient(weather) : ambient.kind, {
    enabled: ambient.enabled,
    inConversation: consented && !ending && (mode === "voice" ? voiceActive : Boolean(convo.session)),
    breathing,
    crisisPanelOpen: panelRisk !== null && panelExpanded,
    someoneSpeaking: voice.status === "hearing" || voice.status === "speaking",
    micListening: voiceActive,
  });

  async function endSession() {
    setEnding(true);
    voice.stop();
    const session = await convo.end();
    router.push(session && convo.userTurns > 0 ? `/history/${session.id}?new=1` : "/");
  }

  const voiceOff = mode === "voice" && !voiceActive;
  const thinking = convo.phase === "waiting" && convo.lines.length > 0;

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      {/* In a hard moment the sky goes quiet rather than stormy. */}
      <Backdrop weather={weather} />
      <TopBar />

      {convo.demo && (
        <p className="relative mx-auto -mt-1 rounded-pill border border-border bg-surface px-3 py-0.5 text-xs text-muted">
          Demo mode · replies are scripted
        </p>
      )}

      <main className="relative flex min-h-0 flex-1 flex-col">
        {breathing ? (
          <div className="mx-auto flex min-h-0 w-full max-w-[600px] flex-1 flex-col px-4 pb-8">
            <BreatheMode tone={convo.tone} onDone={() => setBreathing(false)} />
          </div>
        ) : (
          <>
            <div className="flex min-h-0 flex-1 items-center justify-center py-1">
              <Presence
                state={presence}
                tone={convo.tone}
                getLevel={voiceActive ? voice.getLevel : undefined}
                className={`h-full w-auto ${panelRisk === "acute" && panelExpanded ? "max-h-[120px]" : "max-h-[300px]"} max-w-[86vw]`}
              />
            </div>

            {voiceOff ? (
              <VoiceStart voice={voice} onStart={startVoice} onSwitchToText={() => switchMode("text")} />
            ) : (
              <>
                <Captions lines={lines} thinking={thinking} />
                <div className="mx-auto flex w-full max-w-[600px] flex-col px-4">
                  {panelRisk && (
                    <div className={`mt-3 flex flex-col ${panelExpanded ? "" : "px-3"}`}>
                      <CrisisPanel
                        risk={panelRisk}
                        expanded={panelExpanded}
                        onExpand={() => setPanelExpanded(true)}
                        onCollapse={() => setPanelExpanded(false)}
                        onMoreOptions={() => setHelpOpen(true)}
                      />
                    </div>
                  )}
                  {convo.error && (
                    <p role="alert" className="mt-3 px-3 text-[15px] text-care">
                      {convo.error}
                    </p>
                  )}
                </div>

                <div className="mx-auto mt-4 flex w-full max-w-[640px] flex-col gap-2.5 rounded-t-lg bg-band px-4 pt-3.5 pb-[max(26px,env(safe-area-inset-bottom))]">
                  {mode === "text" ? (
                    <>
                      <TextComposer onSend={convo.send} onTypingChange={setTyping} onSwitchToVoice={() => switchMode("voice")} />
                      <div className="flex justify-center gap-2">
                        <Button variant="ghost" onClick={() => setBreathing(true)} className="px-3.5">
                          <BreatheIcon size={18} /> Breathe
                        </Button>
                        <Button variant="ghost" onClick={() => setTranscriptOpen(true)} aria-haspopup="dialog" className="px-3.5">
                          <TranscriptIcon size={18} /> Transcript
                        </Button>
                        <Button variant="ghost" onClick={endSession} disabled={ending} className="px-3.5">
                          {ending ? "Ending…" : "End"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <VoiceBand voice={voice} onSwitchToText={() => switchMode("text")} onEnd={endSession} ending={ending} />
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>

      <TranscriptSheet open={transcriptOpen} onClose={() => setTranscriptOpen(false)} lines={convo.lines} />
      <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ConsentSheet open={profile !== null && !consented} onAccept={() => undefined} onCancel={() => router.push("/")} />
    </div>
  );
}
