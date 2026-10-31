"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { BreatheMode } from "@/components/breathe/BreatheMode";
import { CaptionHistory, pickCaptions } from "@/components/captions/Captions";
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
import { takeFresh, takeOpening, takeTalkNow } from "@/lib/conversation/opening";
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
import { useIsDesktop, useIsWide } from "@/lib/useIsDesktop";
import { AppShell } from "@/components/shell/AppShell";
import { TalkTopBar } from "./TalkTopBar";
import { DesktopComposer } from "./DesktopComposer";
import { useVoice, type Voice } from "@/lib/voice/useVoice";
import { StyleSheet, TranscriptSheet, WrapUpSheet } from "./TalkSheets";
import { TextComposer } from "./TextComposer";
import { MoodScale } from "./MoodScale";
import type { Heard } from "@/lib/data/types";
import { ToolButton, VoiceDock } from "./VoiceControls";

const quiet = "press min-h-10 rounded-pill px-3.5 text-[14px] text-muted hover:bg-glass hover:text-text";

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
  const [moodAsked, setMoodAsked] = useState(false);

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
  // "New conversation" asks for a new one; otherwise a conversation from the last half hour continues.
  const freshRef = useRef<boolean | null>(null);
  const isFresh = () => (freshRef.current ??= takeFresh());
  useEffect(() => {
    if (!consented || mode !== "text") return;
    const opening = resumeId ? null : takeOpening();
    const starter = opening && "starterId" in opening ? starterById(opening.starterId) : undefined;
    if (starter?.supportStyle) setSupportStyle(starter.supportStyle);
    const first = starter?.message ?? (opening && "text" in opening ? opening.text : undefined) ?? (topic ? `I'd like to talk about ${topic}.` : undefined);
    void start(resumeId, first, { fresh: isFresh() || Boolean(topic) });
  }, [consented, mode, start, resumeId, topic, setSupportStyle]);

  async function startVoice() {
    await voice.start();
    void start(resumeId, undefined, { fresh: isFresh() });
  }

  // Arrived from a Talk button: start right away, as if the mic had been tapped here.
  const autoTalked = useRef(false);
  useEffect(() => {
    if (!consented || mode !== "voice" || autoTalked.current) return;
    autoTalked.current = true;
    if (takeTalkNow() && voice.supported) void startVoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on arrival
  }, [consented, mode]);

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

  async function wrapUp(feedback?: { mood: number | null; heard: Heard | null }) {
    setEnding(true);
    voice.stop();
    if (feedback?.mood != null) await convo.rateMood("end", feedback.mood).catch(() => undefined);
    let session = await convo.end();
    if (session && feedback?.heard) session = await store.updateSession(session.id, { heard: feedback.heard }).catch(() => session);
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
  // The conversation scrolls; it follows the newest words unless the person has scrolled up to read back.
  const captionsRef = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const lastText = convo.lines.at(-1)?.text;
  useEffect(() => {
    const el = captionsRef.current;
    if (!el) return;
    const onScroll = () => {
      following.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  });
  useEffect(() => {
    const el = captionsRef.current;
    if (el && following.current) el.scrollTop = el.scrollHeight;
  }, [lastText, convo.lines.length, voice.spoken, voice.partial, convo.slow, convo.error, ack]);

  const acuteOpen = panelRisk === "acute" && panelOpen;
  // A quick mood check after Haven's greeting, before the person's first words (once per conversation).
  const askMood =
    !moodAsked && !convo.moodRecent && !convo.resumed && convo.userTurns === 0 && convo.session?.moodStart == null && convo.lines.some((l) => l.speaker === "companion" && !l.pending) && !acuteOpen;
  const showPill = !acuteOpen && (panelRisk === "elevated" || panelRisk === "acute");
  // Captions follow the voice: while a reply is being spoken, show only the words already said.
  const shownLines = useMemo(() => {
    let lines = convo.lines;
    if (voiceActive && voice.spoken !== null) {
      const i = lines.findLastIndex((l) => l.speaker === "companion");
      if (i >= 0) lines = lines.map((l, j) => (j === i ? { ...l, text: voice.spoken ?? l.text, pending: true } : l));
    }
    return voice.partial ? [...lines, { id: "partial", speaker: "user" as const, text: voice.partial, pending: true }] : lines;
  }, [convo.lines, voiceActive, voice.spoken, voice.partial]);
  const view = pickCaptions(shownLines);
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

  // The conversation keeps its simple, distraction-free layout at every size; keyboard shortcuts on larger screens.
  const desktop = useIsDesktop();
  const wide = useIsWide();

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
    desktop && consented,
  );

  // What's said, and how to start (shared by the phone and desktop layouts).
  const words = (
    <>
            {voiceOff && !voiceBlocked && !convo.session ? (
              <p className="m-0 text-[clamp(20px,1.9vw,24px)] leading-[1.35] font-medium tracking-[-0.015em]">
                I&apos;ll say hello first. Tap the mic whenever you&apos;re ready.
              </p>
            ) : (
              <CaptionHistory lines={shownLines} live={!voiceActive} waiting={convo.phase === "waiting" && !convo.slow && convo.lines.length > 0}>
                {ack && (
                  <p role="status" className="m-0 flex items-center gap-2 text-[15px] text-muted">
                    <StyleIcon size={16} className="text-accent-strong" />
                    {ack}
                  </p>
                )}
                {convo.slow && (
                  <p role="status" className="m-0 flex items-center gap-3 text-[clamp(17px,1.5vw,19px)] text-muted">
                    <span aria-hidden className="pulse-dot-slow size-2 shrink-0 rounded-full bg-dot" />
                    Taking a little longer than usual…
                  </p>
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
                {askMood && (
                  <div className="mt-1 flex w-full max-w-[440px] flex-col gap-2">
                    <p className="m-0 text-[15px] text-muted">Before we start: how are you feeling right now?</p>
                    <MoodScale
                      label="How are you feeling right now?"
                      value={null}
                      onChange={(v) => {
                        setMoodAsked(true);
                        void convo.rateMood("start", v);
                      }}
                      compact
                    />
                    <button type="button" onClick={() => setMoodAsked(true)} className="min-h-10 self-center bg-transparent text-[14px] text-muted underline-offset-2 hover:underline">
                      Skip
                    </button>
                  </div>
                )}
              </CaptionHistory>
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
    </>
  );
  const startersBlock = (
    <>
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
    </>
  );
  const underway = convo.userTurns > 0 || voiceActive;

  // Desktop shell: the page sits inside the shell's <main>, so the conversation uses a div.
  const Main = wide ? "div" : "main";
  const content = (
    <>
      {convo.demo && (
        <p className="relative z-[1] mx-auto mt-2 mb-0 rounded-pill bg-glass px-3 py-0.5 text-[12px] text-faint">Demo mode · replies are scripted</p>
      )}

      {breathing ? (
        <Main className="relative z-[1] flex min-h-0 flex-1 flex-col">
          <BreatheMode onDone={() => setBreathing(false)} simple />
        </Main>
      ) : (
        <Main
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
            {words}
            {startersBlock}
          </div>

          {acuteOpen && (
            <div className="mt-4 flex w-full justify-center">
              <CarePanel onSafe={imSafe} />
            </div>
          )}

          <div className="h-4 shrink-0" />
          <div className="mb-[max(28px,env(safe-area-inset-bottom))] flex w-[min(640px,calc(100%-32px))] shrink-0 flex-col gap-3">
            {mode === "text" && <TextComposer onSend={send} onSwitchToVoice={() => switchMode("voice")} spaceToTalk={desktop} />}
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
        </Main>
      )}
    </>
  );
  const sheets = (
    <>
      <StyleSheet open={styleOpen} onClose={() => setStyleOpen(false)} value={convo.supportStyle} onChange={chooseStyle} />
      <TranscriptSheet open={transcriptOpen} onClose={() => setTranscriptOpen(false)} lines={convo.lines} startedAt={convo.session?.startedAt} />
      <WrapUpSheet open={wrapOpen} onClose={() => setWrapOpen(false)} onWrapUp={(f) => void wrapUp(f)} onLater={later} busy={ending} />
      <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ConsentSheet open={profile !== null && !consented} onAccept={() => undefined} onCancel={() => router.push(HOME)} />
    </>
  );

  if (wide) {
    // Desktop: the sidebar from Home stays while the conversation opens, then slides away once it's under way.
    return (
      <AppShell scroll={false} autoHideSidebar={underway} currentSessionId={convo.session?.id} refreshKey={convo.session?.id}>
        <TalkTopBar status={breathing ? "Breathing" : status} />
        {convo.demo && (
          <p className="relative z-[1] mx-auto mt-2 mb-0 rounded-pill bg-glass px-3 py-0.5 text-[12px] text-faint">Demo mode · replies are scripted</p>
        )}
        {breathing ? (
          <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
            <BreatheMode onDone={() => setBreathing(false)} simple />
          </div>
        ) : (
          // Laid out like Home: the orb, the words where Home's question is, then Home's text box.
          <div
            className="relative z-[1] flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-12 pt-2 pb-10 text-center"
            data-phase={convo.phase}
            data-replies={convo.lines.filter((l) => l.speaker === "companion" && !l.pending).length}
          >
            <div className="shrink-0">
              <Presence state={presence} size={underway ? 150 : 200} getLevel={voiceActive ? voice.getLevel : undefined} />
            </div>
            <div ref={captionsRef} className="flex max-h-[min(42vh,380px)] min-h-0 w-full max-w-[720px] shrink flex-col items-center gap-3 overflow-y-auto px-2">
              {words}
            </div>
            {acuteOpen && <CarePanel onSafe={imSafe} />}
            <div className="flex w-full max-w-[680px] shrink-0 flex-col gap-3">
              <DesktopComposer
                mode={mode}
                voice={voice}
                voiceActive={voiceActive}
                onSend={(t) => void send(t)}
                onStartVoice={() => void startVoice()}
                onSwitchMode={switchMode}
                onBreathe={() => setBreathing(true)}
              />
              {showStarters ? (
                <div role="group" aria-label="Ways to start" className="flex flex-wrap justify-center gap-1.5">
                  {STARTERS.filter((x) => x.id !== "stuck").map((x) => (
                    <button
                      key={x.id}
                      type="button"
                      onClick={() => starter(x)}
                      className="press min-h-10 rounded-pill px-3.5 text-[14px] text-muted hover:bg-glass hover:text-text"
                    >
                      {x.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-1">
                  {mode === "voice" && (
                    <button type="button" onClick={() => switchMode("text")} className={quiet}>
                      Write
                    </button>
                  )}
                  <button type="button" onClick={() => setStyleOpen(true)} aria-label={styleLabel} aria-haspopup="dialog" className={quiet}>
                    {convo.supportStyle ? `Style: ${SUPPORT_STYLE_LABELS[convo.supportStyle]}` : "Style"}
                  </button>
                  <button type="button" onClick={() => setTranscriptOpen(true)} aria-haspopup="dialog" className={quiet}>
                    Transcript
                  </button>
                  <button type="button" onClick={askToWrapUp} aria-label="Wrap up this conversation" aria-haspopup="dialog" className={quiet}>
                    Wrap up
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {sheets}
      </AppShell>
    );
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <Backdrop />
      <TopBar variant="talk" status={breathing ? "Breathing" : status} onBack={askToWrapUp} backLabel="Back to Home" />
      {content}
      {sheets}
    </div>
  );
}
