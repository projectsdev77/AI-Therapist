"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CaptionLine } from "@/components/captions/Captions";
import { useStore } from "@/lib/data/StoreProvider";
import { newId, type Session, type SessionMode } from "@/lib/data/types";
import { keywordRisk, maxRisk, riskAtLeast } from "@/lib/safety/keywords";
import { ConverseError, converse } from "./client";
import { buildCompanionContext } from "./context";
import type { Analysis, ChatTurn, CompanionContext } from "./protocol";
import type { Starter } from "./starters";
import type { RiskLevel, SupportStyle, Tone } from "./types";

/** After this long with no reply text, the conversation counts as slow. */
export const SLOW_REPLY_MS = 20_000;

export type TurnPhase = "idle" | "waiting" | "streaming";

export interface ConversationCallbacks {
  /** First text of a reply arrived. */
  onReplyStart?: () => void;
  /** Each chunk of reply text (voice mode speaks these). */
  onReplyDelta?: (text: string) => void;
  onReplyEnd?: (text: string, interrupted: boolean) => void;
  /** Fired whenever a turn's risk is elevated or acute. */
  onRisk?: (risk: RiskLevel) => void;
}

export interface Conversation {
  session: Session | null;
  lines: CaptionLine[];
  phase: TurnPhase;
  tone: Tone;
  /** Highest risk seen this session. */
  sessionRisk: RiskLevel;
  /** Risk of the latest user turn. */
  latestRisk: RiskLevel;
  themes: string[];
  tones: Tone[];
  demo: boolean;
  error: string | null;
  /**
   * Starts the conversation, or picks up an unfinished one by id. With `firstMessage`, the
   * person's words open the conversation instead of the companion's greeting.
   */
  start: (resumeId?: string, firstMessage?: string, opts?: { fresh?: boolean }) => Promise<void>;
  /** Asks again for the reply to the last message (after an error). */
  retry: () => void;
  /** True when this conversation was picked up from before. */
  resumed: boolean;
  send: (text: string) => Promise<void>;
  /** Stops the companion mid-reply (barge-in). */
  interrupt: () => void;
  /** Ends the session and returns it. */
  end: () => Promise<Session | null>;
  /** Number of things the person said this session. */
  userTurns: number;
  /** The kind of support the person chose (null = not chosen). Applies from the next reply. */
  supportStyle: SupportStyle | null;
  setSupportStyle: (style: SupportStyle | null) => void;
  /** Begins with one of the optional starters (see starters.ts). */
  sendStarter: (starter: Starter) => Promise<void>;
  /** A reply has been pending for SLOW_REPLY_MS with no text yet. */
  slow: boolean;
  /** They rated their mood in the last 3 hours, so don't ask again at the start. */
  moodRecent: boolean;
  /** The person's own 0–10 mood rating, at the start ("start") or at Wrap up ("end"). */
  rateMood: (when: "start" | "end", value: number) => Promise<void>;
}

/** Coming back within this long to an unfinished conversation continues it. */
const CONTINUE_WITHIN_MS = 30 * 60_000;
/** The start-of-conversation mood check is asked at most this often. */
const MOOD_EVERY_MS = 3 * 60 * 60_000;

export function useConversation(mode: SessionMode, callbacks: ConversationCallbacks = {}): Conversation {
  const { store, profile } = useStore();
  const [session, setSession] = useState<Session | null>(null);
  const [moodRecent, setMoodRecent] = useState(false);
  const [lines, setLines] = useState<CaptionLine[]>([]);
  const [phase, setPhase] = useState<TurnPhase>("idle");
  const [tone, setTone] = useState<Tone>("neutral");
  const [tones, setTones] = useState<Tone[]>([]);
  const [sessionRisk, setSessionRisk] = useState<RiskLevel>("none");
  const [latestRisk, setLatestRisk] = useState<RiskLevel>("none");
  const [themes, setThemes] = useState<string[]>([]);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userTurns, setUserTurns] = useState(0);
  const [supportStyle, setSupportStyleState] = useState<SupportStyle | null>(null);
  const [slow, setSlow] = useState(false);
  const [resumed, setResumed] = useState(false);

  const callbacksRef = useRef(callbacks);
  const modeRef = useRef(mode);
  useEffect(() => {
    callbacksRef.current = callbacks;
    modeRef.current = mode;
  });

  const sessionRef = useRef<Session | null>(null);
  const historyRef = useRef<ChatTurn[]>([]);
  const contextRef = useRef<CompanionContext | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const turnRef = useRef<Promise<void>>(Promise.resolve());
  // Resolves once the session and context exist, so an early send can't race the opening.
  const setupRef = useRef<Promise<void> | null>(null);
  // Sends run one at a time, in order; each new one interrupts the previous reply.
  const sendChainRef = useRef<Promise<void>>(Promise.resolve());
  const startedRef = useRef(false);
  const supportStyleRef = useRef<SupportStyle | null>(null);
  const toneRef = useRef<Tone>("neutral");
  const firstToneRef = useRef(true);

  const updateLine = useCallback((id: string, patch: Partial<CaptionLine>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  const handleAnalysis = useCallback(
    async (analysis: Analysis) => {
      const s = sessionRef.current;
      if (!s) return;
      toneRef.current = analysis.tone;
      setTone(analysis.tone);
      setTones((prev) => [...prev, analysis.tone]);
      setThemes((prev) => [...new Set([...prev, ...analysis.themes])]);
      setLatestRisk(analysis.risk);
      setSessionRisk((prev) => maxRisk(prev, analysis.risk));
      const patch: Partial<Session> = { toneEnd: analysis.tone };
      if (firstToneRef.current) {
        firstToneRef.current = false;
        patch.toneStart = analysis.tone;
      }
      await store.updateSession(s.id, patch);
      if (riskAtLeast(analysis.risk, "elevated")) {
        callbacksRef.current.onRisk?.(analysis.risk);
        await store.addSafetyEvent({ sessionId: s.id, riskLevel: analysis.risk, actionTaken: "resources_shown" });
      }
    },
    [store],
  );

  const runTurnInner = useCallback(async () => {
    const s = sessionRef.current;
    const ctx = contextRef.current;
    if (!s || !ctx) return;

    const controller = new AbortController();
    abortRef.current = controller;
    const lineId = newId();
    let text = "";
    setPhase("waiting");
    setError(null);
    setSlow(false);
    const slowTimer = setTimeout(() => setSlow(true), SLOW_REPLY_MS);

    const finish = async (interrupted: boolean) => {
      if (!text) return;
      const content = interrupted ? `${text.trimEnd()}…` : text;
      historyRef.current.push({ role: "assistant", content });
      updateLine(lineId, { pending: false, text: content });
      await store.addMessage({ sessionId: s.id, role: "companion", content, tone: toneRef.current, riskLevel: null, interrupted });
      callbacksRef.current.onReplyEnd?.(content, interrupted);
    };

    try {
      const minutesIn = Math.max(0, Math.round((Date.now() - Date.parse(s.startedAt)) / 60_000));
      const request = { history: historyRef.current, context: { ...ctx, mode: modeRef.current, supportStyle: supportStyleRef.current, ...(minutesIn <= 180 ? { minutesIn } : {}) } };
      for await (const event of converse(request, controller.signal)) {
        if (event.type === "delta") {
          if (!text) {
            clearTimeout(slowTimer);
            setSlow(false);
            setPhase("streaming");
            setLines((prev) => [...prev, { id: lineId, speaker: "companion", text: "", pending: true, at: Date.now() }]);
            callbacksRef.current.onReplyStart?.();
          }
          text += event.text;
          updateLine(lineId, { text });
          callbacksRef.current.onReplyDelta?.(event.text);
        } else if (event.type === "analysis") {
          void handleAnalysis(event.analysis);
        } else if (event.type === "done") {
          setDemo(event.demo);
        } else if (event.type === "error") {
          setError(event.message);
        }
      }
      await finish(false);
    } catch (err) {
      if (controller.signal.aborted) {
        await finish(true);
      } else {
        setError(err instanceof ConverseError ? err.message : "I couldn't reach the server. Check your connection and try again.");
        if (text) await finish(true);
      }
    } finally {
      clearTimeout(slowTimer);
      setSlow(false);
      if (abortRef.current === controller) {
        abortRef.current = null;
        setPhase("idle");
      }
    }
  }, [store, updateLine, handleAnalysis]);

  const runTurn = useCallback(() => {
    turnRef.current = runTurnInner();
    return turnRef.current;
  }, [runTurnInner]);

  const interrupt = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const sendNowRef = useRef<(text: string) => Promise<void>>(async () => undefined);
  const start = useCallback(
    async (resumeId?: string, firstMessage?: string, opts: { fresh?: boolean } = {}) => {
      if (startedRef.current || !profile) return;
      startedRef.current = true;
      let picked = false;
      setupRef.current = (async () => {
        let previous = resumeId ? await store.getSession(resumeId) : null;
        let earlier: Awaited<ReturnType<typeof store.listMessages>> | null = null;
        const recent = await store.listSessions(10);
        // Back within half an hour of an unfinished conversation: carry on with it, like stepping
        // back into the room, rather than a new greeting and check-in (unless they asked for a new one).
        if (!previous && !opts.fresh && recent[0] && !recent[0].endedAt) {
          const messages = await store.listMessages(recent[0].id);
          const lastAt = Date.parse(messages.at(-1)?.createdAt ?? recent[0].startedAt);
          if (Date.now() - lastAt < CONTINUE_WITHIN_MS) {
            previous = recent[0];
            earlier = messages;
          }
        }
        const rated = (iso: string | null) => iso !== null && Date.now() - Date.parse(iso) < MOOD_EVERY_MS;
        setMoodRecent(recent.some((x) => (x.moodStart != null && rated(x.startedAt)) || (x.moodEnd != null && rated(x.endedAt))));
        if (previous && !previous.endedAt) {
          // Pick up where we left off: same session, same words, no new greeting.
          const messages = earlier ?? (await store.listMessages(previous.id));
          historyRef.current = messages.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));
          setLines(messages.map((m) => ({ id: m.id, speaker: m.role === "user" ? "user" : "companion", text: m.content, at: Date.parse(m.createdAt) })));
          setUserTurns(messages.filter((m) => m.role === "user").length);
          const lastTone = [...messages].reverse().find((m) => m.tone)?.tone;
          if (lastTone) {
            toneRef.current = lastTone;
            setTone(lastTone);
            firstToneRef.current = false;
          }
          sessionRef.current = previous;
          picked = true;
        } else {
          sessionRef.current = await store.createSession(modeRef.current);
        }
        contextRef.current = await buildCompanionContext(store, profile, modeRef.current, sessionRef.current.id);
        setSession(sessionRef.current);
        setResumed(picked);
      })();
      await setupRef.current;
      if (picked) {
        // Words typed on Home still go in, carrying on the same conversation.
        if (firstMessage && !resumeId) await sendNowRef.current(firstMessage);
        return;
      }
      if (firstMessage) await sendNowRef.current(firstMessage);
      else await runTurn();
    },
    [store, profile, runTurn],
  );

  const retry = useCallback(() => {
    if (abortRef.current) return;
    if (historyRef.current.at(-1)?.role !== "user") return;
    void runTurn();
  }, [runTurn]);

  const sendNow = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      await setupRef.current;
      const s = sessionRef.current;
      if (!s) return;
      // Let an interrupted reply land in the history before the new turn.
      interrupt();
      await turnRef.current;
      const risk = keywordRisk(text);
      historyRef.current.push({ role: "user", content: text });
      setLines((prev) => [...prev, { id: newId(), speaker: "user", text, at: Date.now() }]);
      setUserTurns((n) => n + 1);
      if (riskAtLeast(risk, "elevated")) {
        // Keyword backstop reacts instantly; the model's analysis follows.
        setLatestRisk(risk);
        setSessionRisk((prev) => maxRisk(prev, risk));
        callbacksRef.current.onRisk?.(risk);
      }
      await store.addMessage({ sessionId: s.id, role: "user", content: text, tone: null, riskLevel: risk, interrupted: false });
      // Not awaited: the next send may interrupt this reply.
      void runTurn();
    },
    [store, interrupt, runTurn],
  );

  useEffect(() => {
    sendNowRef.current = sendNow;
  });

  const send = useCallback(
    (raw: string) => {
      const next = sendChainRef.current.then(() => sendNow(raw));
      sendChainRef.current = next.catch(() => undefined);
      return next;
    },
    [sendNow],
  );

  const setSupportStyle = useCallback((style: SupportStyle | null) => {
    supportStyleRef.current = style;
    setSupportStyleState(style);
  }, []);

  const sendStarter = useCallback(
    (starter: Starter) => {
      if (starter.supportStyle) setSupportStyle(starter.supportStyle);
      return send(starter.message);
    },
    [send, setSupportStyle],
  );

  const end = useCallback(async () => {
    interrupt();
    await turnRef.current;
    const s = sessionRef.current;
    if (!s) return null;
    const ended = await store.updateSession(s.id, { endedAt: new Date().toISOString(), mode: modeRef.current });
    sessionRef.current = ended;
    setSession(ended);
    return ended;
  }, [store, interrupt]);

  const rateMood = useCallback(
    async (when: "start" | "end", value: number) => {
      await setupRef.current;
      const s = sessionRef.current;
      if (!s) return;
      if (when === "start" && contextRef.current) contextRef.current = { ...contextRef.current, moodNow: value };
      const next = await store.updateSession(s.id, when === "start" ? { moodStart: value } : { moodEnd: value });
      sessionRef.current = next;
      setSession(next);
    },
    [store],
  );

  return {
    session,
    lines,
    phase,
    tone,
    tones,
    sessionRisk,
    latestRisk,
    themes,
    demo,
    error,
    start,
    retry,
    resumed,
    send,
    interrupt,
    end,
    userTurns,
    supportStyle,
    setSupportStyle,
    sendStarter,
    slow,
    rateMood,
    moodRecent,
  };
}
