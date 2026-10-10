"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CaptionLine } from "@/components/captions/Captions";
import { useStore } from "@/lib/data/StoreProvider";
import { newId, type Session, type SessionMode } from "@/lib/data/types";
import { keywordRisk, maxRisk, riskAtLeast } from "@/lib/safety/keywords";
import { ConverseError, converse } from "./client";
import { buildCompanionContext } from "./context";
import type { Analysis, ChatTurn, CompanionContext } from "./protocol";
import type { RiskLevel, Tone } from "./types";

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
  start: () => Promise<void>;
  send: (text: string) => Promise<void>;
  /** Stops the companion mid-reply (barge-in). */
  interrupt: () => void;
  /** Ends the session and returns it. */
  end: () => Promise<Session | null>;
  /** Number of things the person said this session. */
  userTurns: number;
}

export function useConversation(mode: SessionMode, callbacks: ConversationCallbacks = {}): Conversation {
  const { store, profile } = useStore();
  const [session, setSession] = useState<Session | null>(null);
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

    const finish = async (interrupted: boolean) => {
      if (!text) return;
      const content = interrupted ? `${text.trimEnd()}…` : text;
      historyRef.current.push({ role: "assistant", content });
      updateLine(lineId, { pending: false, text: content });
      await store.addMessage({ sessionId: s.id, role: "companion", content, tone: toneRef.current, riskLevel: null, interrupted });
      callbacksRef.current.onReplyEnd?.(content, interrupted);
    };

    try {
      const request = { history: historyRef.current, context: { ...ctx, mode: modeRef.current } };
      for await (const event of converse(request, controller.signal)) {
        if (event.type === "delta") {
          if (!text) {
            setPhase("streaming");
            setLines((prev) => [...prev, { id: lineId, speaker: "companion", text: "", pending: true }]);
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

  const start = useCallback(async () => {
    if (startedRef.current || !profile) return;
    startedRef.current = true;
    setupRef.current = (async () => {
      const s = await store.createSession(modeRef.current);
      sessionRef.current = s;
      contextRef.current = await buildCompanionContext(store, profile, modeRef.current, s.id);
      setSession(s);
    })();
    await setupRef.current;
    await runTurn();
  }, [store, profile, runTurn]);

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
      setLines((prev) => [...prev, { id: newId(), speaker: "user", text }]);
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

  const send = useCallback(
    (raw: string) => {
      const next = sendChainRef.current.then(() => sendNow(raw));
      sendChainRef.current = next.catch(() => undefined);
      return next;
    },
    [sendNow],
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

  return { session, lines, phase, tone, tones, sessionRisk, latestRisk, themes, demo, error, start, send, interrupt, end, userTurns };
}
