"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { BreatheMode } from "@/components/breathe/BreatheMode";
import { Captions, pickCaptions } from "@/components/captions/Captions";
import { ConsentSheet } from "@/components/consent/ConsentSheet";
import { Presence } from "@/components/presence/Presence";
import { CarePanel, SupportPill } from "@/components/safety/CrisisPanel";
import { HelpSheet } from "@/components/safety/HelpSheet";
import { Backdrop } from "@/components/shell/Backdrop";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { AlertIcon, BreatheIcon, CheckIcon, StyleIcon, TranscriptIcon, WriteIcon } from "@/components/ui/icons";
import { useAmbientSettings, weatherToAmbient } from "@/lib/ambient/settings";
import { useAmbient } from "@/lib/ambient/useAmbient";
import { markPaused } from "@/lib/conversation/paused";
import { takeOpening } from "@/lib/conversation/opening";
import { STARTERS, starterById } from "@/lib/conversation/starters";
import { SUPPORT_STYLE_LABELS, SUPPORT_STYLE_OPTIONS, type PresenceState, type RiskLevel, type SupportStyle } from "@/lib/conversation/types";
import { useConversation, type ConversationCallbacks } from "@/lib/conversation/useConversation";
import { toneToWeather } from "@/lib/conversation/weather";
import type { SessionMode } from "@/lib/data/types";
import { useStore } from "@/lib/data/StoreProvider";
import { finalizeSession } from "@/lib/reflection/finalize";
import { HOME } from "@/lib/routes";
import { riskAtLeast } from "@/lib/safety/keywords";
import { useServiceStatus } from "@/lib/serviceStatus";
import { useShortcuts } from "@/lib/shortcuts";
import { useIsFull, useIsWide } from "@/lib/useIsDesktop";
import { useVoice, type Voice } from "@/lib/voice/useVoice";
import { AppShell } from "@/components/shell/AppShell";
import { DesktopCarePanel, DesktopTalkHeader, DesktopTalkPanel, DesktopVoice, DesktopWriting, type DesktopTalkProps } from "./DesktopTalk";
import { StyleSheet, TranscriptSheet, WrapUpSheet } from "./TalkSheets";
import { TextComposer } from "./TextComposer";
import { ToolButton, VoiceDock } from "./VoiceControls";

export function TalkScreen({ initialMode, resumeId, topic }: { initialMode: SessionMode; resumeId?: string; topic?: string }) {
  const router = useRouter();
  const { store, profile } = useStore();
  const [mode, setMode] = useState<SessionMode>(initialMode);
  const [helpOpen, setHelpOpen] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [wrapOpen, setWrapOpen] = useState(false);
  const [breathing, setBreathing] = useState(false);
  const [ending, setEnding] = useState(false);
  const [ack, setAck] = useState<string | null>(null);

  // Safety: the care panel opens itself on acute risk; elevated risk offers a pill.
  const [panelRisk, setPanelRisk] = useState<RiskLevel | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // Voice and conversation depend on each other; the voice's reply callbacks go through a ref.
  const voiceRef = useRef<Voice | null>(null);
  const callbacks = useMemo<ConversationCallbacks>(
    () => ({
      onRisk: (risk) => {
        setPanelRisk((prev) => (prev === "acute" ? prev : risk));
        if (risk === "acute") setPanelOpen(true);
      },
      onReplyStart: () => voiceRef.current?.callbacks.onReplyStart?.(),
      onReplyDelta: (t) => voiceRef.current?.callbacks.onReplyDelta?.(t),
      onReplyEnd: (t, i) => voiceRef.current?.callbacks.onReplyEnd?.(t, i),
    }),
    [],
  );
  const convo = useConversation(mode, callbacks);
  const services = useServiceStatus();
  const send = (text: string) => {
    setAck(null);
    return convo.send(text);
  };
  const voice = useVoice({
    serverVoice: Boolean(services?.voice),
    voiceId: profile?.voiceId,
    phase: convo.phase,
    onUtterance: send,
    onBargeIn: convo.interrupt,
  });
  useEffect(() => {
    voiceRef.current = voice;
  });
  const consented = Boolean(profile?.consentedAt);

  // Write starts right away; voice waits for a tap so the greeting can be heard.
  const { start } = convo;
  const { setSupportStyle } = convo;
  useEffect(() => {
    if (!consented || mode !== "text") return;
    const opening = resumeId ? null : takeOpening();
    const starter = opening && "starterId" in opening ? starterById(opening.starterId) : undefined;
    if (starter?.supportStyle) setSupportStyle(starter.supportStyle);
    const first = starter?.message ?? (opening && "text" in opening ? opening.text : undefined) ?? (topic ? `I'd like to talk about ${topic}.` : undefined);
    void start(resumeId, first);
  }, [consented, mode, start, resumeId, topic, setSupportStyle]);

  async function startVoice() {
    await voice.start();
    void start(resumeId);
  }

  function switchMode(next: SessionMode) {
    if (next === "text") voice.stop();
    setMode(next);
  }

  const voiceActive = mode === "voice" && voice.status !== "off" && voice.status !== "error" && voice.status !== "unsupported";
  const voiceBlocked = mode === "voice" && (voice.status === "error" || voice.status === "unsupported" || !voice.supported);
  const voiceOff = mode === "voice" && !voiceActive;

  const concerned = riskAtLeast(convo.latestRisk, "elevated") || (panelRisk === "acute" && panelOpen);
  const voiceSpeaking = voiceActive && voice.status === "speaking";
  const voiceListening = voiceActive && !voice.muted && (voice.status === "listening" || voice.status === "hearing");
  const waiting = convo.phase === "waiting" || (voiceActive && (voice.status === "thinking" || voice.status === "transcribing"));
  // Safety (concerned) > speaking > listening > waiting (thinking) > idle.
  const presence: PresenceState = concerned
    ? "concerned"
    : voiceSpeaking || (mode === "text" && convo.phase === "streaming")
      ? "speaking"
      : voiceListening
        ? "listening"
        : waiting
          ? "thinking"
          : "idle";

  const status = voiceListening
    ? "Listening"
    : voiceSpeaking || convo.phase === "streaming"
      ? "Speaking"
      : waiting
        ? "Thinking"
        : convo.userTurns === 0
          ? "Ready"
          : "In conversation";

  // Ambient sound: quiet under every word, silent while breathing or when the care panel is open.
  const ambient = useAmbientSettings();
  const weather = concerned ? null : toneToWeather(convo.tone);
  useAmbient(ambient.matchSky ? weatherToAmbient(weather) : ambient.kind, {
    enabled: ambient.enabled,
    inConversation: consented && !ending && (mode === "voice" ? voiceActive : Boolean(convo.session)),
    breathing,
    crisisPanelOpen: panelRisk === "acute" && panelOpen,
    someoneSpeaking: voice.status === "hearing" || voice.status === "speaking",
    micListening: voiceActive,
  });

  async function wrapUp() {
    setEnding(true);
    voice.stop();
    const session = await convo.end();
    // Start the card now, so it's made even if the tab closes before the card page loads.
    if (session && profile && convo.userTurns > 0) void finalizeSession(store, profile, session.id).catch(() => undefined);
    router.push(session && convo.userTurns > 0 ? `/history/${session.id}?new=1` : HOME);
  }

  /** "I'll be back": leave it open to pick up later. */
  function later() {
    voice.stop();
    convo.interrupt();
    if (convo.session) markPaused(convo.session.id);
    router.push(HOME);
  }

  function askToWrapUp() {
    if (convo.userTurns === 0) {
      void wrapUp();
      return;
    }
    setWrapOpen(true);
  }

  function chooseStyle(style: SupportStyle | null) {
    convo.setSupportStyle(style);
    setAck(SUPPORT_STYLE_OPTIONS.find((o) => o.id === style)?.ack ?? null);
  }

  function imSafe() {
    setPanelOpen(false);
    if (convo.session) void store.addSafetyEvent({ sessionId: convo.session.id, riskLevel: "acute", actionTaken: "dismissed_safe" });
  }

  // Long replies scroll inside the caption area; keep the newest words in view.
  const captionsRef = useRef<HTMLDivElement>(null);
  const lastText = convo.lines.at(-1)?.text;
  useEffect(() => {
    const el = captionsRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastText, convo.slow, convo.error, ack]);

  const acuteOpen = panelRisk === "acute" && panelOpen;
  const showPill = !acuteOpen && (panelRisk === "elevated" || panelRisk === "acute");
  const view = pickCaptions(voice.partial ? [...convo.lines, { id: "partial", speaker: "user", text: voice.partial, pending: true }] : convo.lines);
  const showStarters = convo.userTurns === 0 && !convo.resumed && !voice.partial && (voiceOff ? !voiceBlocked : view.companion !== null);
  const styleLabel = convo.supportStyle ? `Reply style: ${SUPPORT_STYLE_LABELS[convo.supportStyle]}` : "Reply style";

  const tools =
    mode === "voice"
      ? [
          { label: "Write", aria: "Switch to writing", icon: <WriteIcon size={18} />, onClick: () => switchMode("text") },
          { label: "Style", aria: styleLabel, icon: <StyleIcon size={18} />, onClick: () => setStyleOpen(true), popup: true, dot: !!convo.supportStyle, active: styleOpen },
          { label: "Breathe", icon: <BreatheIcon size={18} />, onClick: () => setBreathing(true) },
          { label: "Transcript", icon: <TranscriptIcon size={18} />, onClick: () => setTranscriptOpen(true), popup: true, active: transcriptOpen },
        ]
      : [
          { label: "Style", aria: styleLabel, icon: <StyleIcon size={18} />, onClick: () => setStyleOpen(true), popup: true, dot: !!convo.supportStyle, active: styleOpen },
          { label: "Breathe", icon: <BreatheIcon size={18} />, onClick: () => setBreathing(true) },
          { label: "Transcript", icon: <TranscriptIcon size={18} />, onClick: () => setTranscriptOpen(true), popup: true, active: transcriptOpen },
          { label: "Wrap up", aria: "Wrap up this conversation", icon: <CheckIcon size={18} strokeWidth={1.8} />, onClick: askToWrapUp, popup: true, active: wrapOpen },
        ];

  const wide = useIsWide();
  const full = useIsFull();

  function starter(s: (typeof STARTERS)[number]) {
    void (async () => {
      if (voiceOff && !voiceBlocked) await startVoice();
      setAck(null);
      void convo.sendStarter(s);
    })();
  }

  // Desktop keyboard (desktop handoff): Space talk/pause, W write, M mute, B breathe, 1–4 style, Esc wrap up.
  useShortcuts(
    {
      Space: () => {
        if (mode === "text") switchMode("voice");
        else if (!voiceActive) void startVoice();
        else if (voice.status === "speaking") voice.interrupt();
        else voice.setMuted(!voice.muted);
      },
      w: () => (mode === "voice" ? switchMode("text") : false),
      W: () => (mode === "voice" ? switchMode("text") : false),
      m: () => (voiceActive ? voice.setMuted(!voice.muted) : false),
      M: () => (voiceActive ? voice.setMuted(!voice.muted) : false),
      b: () => setBreathing(true),
      B: () => setBreathing(true),
      "1": () => chooseStyle(SUPPORT_STYLE_OPTIONS[0].id),
      "2": () => chooseStyle(SUPPORT_STYLE_OPTIONS[1].id),
      "3": () => chooseStyle(SUPPORT_STYLE_OPTIONS[2].id),
      "4": () => chooseStyle(SUPPORT_STYLE_OPTIONS[3].id),
      Escape: () => (breathing ? setBreathing(false) : askToWrapUp()),
    },
    wide && consented,
  );

  if (wide) {
    const d: DesktopTalkProps = {
      convo,
      voice,
      mode,
      presence,
      status: breathing ? "Breathing" : voiceOff ? "Ready" : status === "In conversation" || status === "Ready" ? "Your turn" : status,
      weather,
      voiceActive,
      voiceOff,
      voiceBlocked,
      showPill,
      showStarters,
      ack,
      onStartVoice: () => void startVoice(),
      onSwitchMode: switchMode,
      onSend: (t) => void send(t),
      onWrapUp: askToWrapUp,
      onBreathe: () => setBreathing(true),
      onChooseStyle: chooseStyle,
      onStarter: starter,
    };
    return (
      <>
        <AppShell
          scroll={false}
          panel={breathing ? undefined : acuteOpen ? <DesktopCarePanel onSafe={imSafe} /> : <DesktopTalkPanel {...d} />}
          panelLabel={acuteOpen ? "Get help" : "This conversation"}
          panelCare={acuteOpen}
          currentSessionId={convo.session?.id}
          refreshKey={convo.session?.id}
        >
          {breathing ? (
            <BreatheMode onDone={() => setBreathing(false)} backLabel="Back to conversation" />
          ) : (
            <div
              className="flex min-h-0 flex-1 flex-col"
              data-phase={convo.phase}
              data-replies={convo.lines.filter((l) => l.speaker === "companion" && !l.pending).length}
            >
              <DesktopTalkHeader {...d} compact={!full} />
              {convo.demo && (
                <p className="relative mx-auto mt-2 mb-0 rounded-pill bg-glass px-3 py-0.5 text-[12px] text-faint">Demo mode · replies are scripted</p>
              )}
              {mode === "text" ? <DesktopWriting {...d} /> : <DesktopVoice {...d} />}
            </div>
          )}
        </AppShell>
        <WrapUpSheet open={wrapOpen} onClose={() => setWrapOpen(false)} onWrapUp={() => void wrapUp()} onLater={later} busy={ending} />
        <ConsentSheet open={profile !== null && !consented} onAccept={() => undefined} onCancel={() => router.push(HOME)} />
      </>
    );
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <Backdrop />
      <TopBar variant="talk" status={breathing ? "Breathing" : status} onBack={askToWrapUp} backLabel="Back to Home" />

      {convo.demo && (
        <p className="relative z-[1] mx-auto mt-2 mb-0 rounded-pill bg-glass px-3 py-0.5 text-[12px] text-faint">Demo mode · replies are scripted</p>
      )}

      {breathing ? (
        <main className="relative z-[1] flex min-h-0 flex-1 flex-col">
          <BreatheMode onDone={() => setBreathing(false)} />
        </main>
      ) : (
        <main
          className="relative z-[1] flex min-h-0 flex-1 flex-col items-center"
          data-phase={convo.phase}
          data-replies={convo.lines.filter((l) => l.speaker === "companion" && !l.pending).length}
        >
          <div className="flex min-h-[112px] flex-[1_1_auto] items-center justify-center overflow-hidden py-2">
            <Presence
              state={presence}
              size={acuteOpen ? 104 : mode === "voice" ? 180 : 130}
              desktopSize={acuteOpen ? 130 : mode === "voice" ? 230 : 170}
              getLevel={voiceActive ? voice.getLevel : undefined}
            />
          </div>

          <div
            ref={captionsRef}
            className="flex min-h-0 w-full max-w-[720px] shrink flex-col items-start gap-3 overflow-y-auto px-7 text-left min-[720px]:items-center min-[720px]:text-center"
          >
            {voiceOff && !voiceBlocked && !convo.session ? (
              <p className="m-0 text-[clamp(23px,2.4vw,30px)] leading-[1.3] font-medium tracking-[-0.02em]">
                I&apos;ll say hello first. Tap the mic whenever you&apos;re ready.
              </p>
            ) : (
              <Captions view={view} waiting={convo.phase === "waiting" && !convo.slow && convo.lines.length > 0}>
                {ack && (
                  <p role="status" className="m-0 flex items-center gap-2 text-[15px] text-muted">
                    <StyleIcon size={16} className="text-accent-strong" />
                    {ack}
                  </p>
                )}
                {convo.slow && (
                  <div role="status" className="flex flex-col items-start gap-3 min-[720px]:items-center">
                    <p className="m-0 flex items-center gap-3 text-[clamp(19px,1.8vw,22px)] text-muted">
                      <span aria-hidden className="pulse-dot-slow size-2 shrink-0 rounded-full bg-dot" />
                      Taking a little longer than usual…
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={convo.cancelReply}>
                        Stop waiting
                      </Button>
                      {mode === "voice" && (
                        <Button variant="tertiary" onClick={() => switchMode("text")}>
                          Switch to writing
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {convo.error && convo.phase === "idle" && (
                  <div role="alert" className="flex flex-wrap items-center gap-3 rounded-md border border-edge-hi bg-glass py-2.5 pr-2.5 pl-4">
                    <AlertIcon size={18} className="shrink-0 text-accent-strong" />
                    <span className="min-w-[180px] flex-1 text-left text-[15px]">That didn&apos;t send. Your words are still here.</span>
                    <Button variant="primary" size="sm" onClick={convo.retry}>
                      Try again
                    </Button>
                  </div>
                )}
                {showPill && <SupportPill onOpen={() => setHelpOpen(true)} />}
              </Captions>
            )}
            {voiceBlocked && (
              <div role="alert" className="flex flex-wrap items-center gap-3 rounded-md border border-edge-hi bg-glass py-2.5 pr-2.5 pl-4">
                <AlertIcon size={18} className="shrink-0 text-accent-strong" />
                <span className="min-w-[180px] flex-1 text-left text-[15px]">{voice.error ?? "Voice isn't available in this browser."}</span>
                <Button variant="primary" size="sm" onClick={() => switchMode("text")}>
                  Write instead
                </Button>
              </div>
            )}
            {showStarters && (
              <div role="group" aria-label="Ways to start" className="mt-1 flex flex-wrap justify-start gap-1.5 min-[720px]:justify-center">
                {STARTERS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => starter(s)}
                    className="press min-h-11 rounded-pill border border-edge-lo bg-transparent px-3.5 text-[14px] text-muted hover:bg-glass hover:text-text"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {acuteOpen && (
            <div className="mt-4 flex w-full justify-center">
              <CarePanel onSafe={imSafe} />
            </div>
          )}

          <div className="h-4 shrink-0" />
          <div className="mb-[max(28px,env(safe-area-inset-bottom))] flex w-[min(640px,calc(100%-32px))] shrink-0 flex-col gap-3">
            {mode === "text" && <TextComposer onSend={send} onSwitchToVoice={() => switchMode("voice")} />}
            <div className="grid grid-cols-4 gap-1.5">
              {tools.map((t) => (
                <ToolButton
                  key={t.label}
                  label={t.label}
                  ariaLabel={t.aria}
                  icon={t.icon}
                  onClick={t.onClick}
                  haspopup={t.popup}
                  dot={t.dot}
                  active={t.active}
                />
              ))}
            </div>
            {mode === "voice" && (
              <VoiceDock voice={voice} started={voiceActive} onStart={() => void startVoice()} onWrapUp={askToWrapUp} />
            )}
          </div>
        </main>
      )}

      <StyleSheet open={styleOpen} onClose={() => setStyleOpen(false)} value={convo.supportStyle} onChange={chooseStyle} />
      <TranscriptSheet open={transcriptOpen} onClose={() => setTranscriptOpen(false)} lines={convo.lines} startedAt={convo.session?.startedAt} />
      <WrapUpSheet open={wrapOpen} onClose={() => setWrapOpen(false)} onWrapUp={() => void wrapUp()} onLater={later} busy={ending} />
      <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ConsentSheet open={profile !== null && !consented} onAccept={() => undefined} onCancel={() => router.push(HOME)} />
    </div>
  );
}
