"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ConversationCallbacks, TurnPhase } from "@/lib/conversation/useConversation";
import { BrowserRecognizer, browserRecognitionCtor, ServerRecognizer, type Recognizer } from "./recognizer";
import { SentenceChunker } from "./sentences";
import { BrowserSpeaker, ServerSpeaker, type Speaker } from "./speaker";

export type VoiceStatus =
  | "off"
  | "starting"
  | "listening"
  | "hearing"
  | "transcribing"
  | "thinking"
  | "speaking"
  | "unsupported"
  | "error";

export interface UseVoiceOptions {
  /** Use ElevenLabs (server) for speech; otherwise browser speech APIs. */
  serverVoice: boolean;
  voiceId?: string | null;
  phase: TurnPhase;
  onUtterance: (text: string) => void;
  /** The person started talking over the companion. */
  onBargeIn: () => void;
}

export interface Voice {
  status: VoiceStatus;
  error: string | null;
  /** Live words while the person is speaking (browser recognizer). */
  partial: string;
  muted: boolean;
  supported: boolean;
  start: () => Promise<void>;
  stop: () => void;
  setMuted: (muted: boolean) => void;
  /** Stops the companion mid-sentence and goes back to listening (tap to interrupt). */
  interrupt: () => void;
  getLevel: () => number;
  /** Pass to useConversation so replies are spoken. */
  callbacks: ConversationCallbacks;
}

export function voiceSupported(serverVoice: boolean): boolean {
  if (typeof window === "undefined") return false;
  const hasMic = Boolean(navigator.mediaDevices?.getUserMedia);
  if (serverVoice) return hasMic && typeof MediaRecorder !== "undefined" && typeof AudioContext !== "undefined";
  return browserRecognitionCtor() !== null && "speechSynthesis" in window;
}

export function useVoice({ serverVoice, voiceId, phase, onUtterance, onBargeIn }: UseVoiceOptions): Voice {
  const [status, setStatus] = useState<VoiceStatus>("off");
  const [error, setError] = useState<string | null>(null);
  const [partial, setPartial] = useState("");
  const [muted, setMutedState] = useState(false);
  const [supported, setSupported] = useState(true);

  const recognizerRef = useRef<Recognizer | null>(null);
  const speakerRef = useRef<Speaker | null>(null);
  const chunker = useRef(new SentenceChunker());
  const statusRef = useRef<VoiceStatus>("off");
  const replyActive = useRef(false);
  const handlersRef = useRef({ onUtterance, onBargeIn });
  useEffect(() => {
    handlersRef.current = { onUtterance, onBargeIn };
  });

  const set = useCallback((s: VoiceStatus) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- capability check needs the browser
    setSupported(voiceSupported(serverVoice));
  }, [serverVoice]);

  const backToListening = useCallback(() => {
    replyActive.current = false;
    recognizerRef.current?.resume();
    if (recognizerRef.current) set("listening");
  }, [set]);

  const stop = useCallback(() => {
    recognizerRef.current?.stop();
    recognizerRef.current = null;
    speakerRef.current?.dispose();
    speakerRef.current = null;
    chunker.current.reset();
    replyActive.current = false;
    setPartial("");
    set("off");
  }, [set]);

  const start = useCallback(async () => {
    if (recognizerRef.current) return;
    if (!voiceSupported(serverVoice)) {
      set("unsupported");
      return;
    }
    set("starting");
    setError(null);
    try {
      const speaker: Speaker = serverVoice ? new ServerSpeaker(voiceId) : new BrowserSpeaker();
      if (speaker instanceof ServerSpeaker) await speaker.unlock();
      speaker.onStart = () => set("speaking");
      speaker.onDrained = backToListening;
      speakerRef.current = speaker;

      const events = {
        onSpeechStart: () => {
          const s = statusRef.current;
          if (s === "speaking" || (s === "thinking" && replyActive.current)) {
            // Barge-in: stop talking and listen.
            speakerRef.current?.stop();
            chunker.current.reset();
            replyActive.current = false;
            handlersRef.current.onBargeIn();
            recognizerRef.current?.resume();
          }
          if (statusRef.current !== "transcribing") set("hearing");
        },
        onPartial: (text: string) => {
          setPartial(text);
          if (!text && statusRef.current === "transcribing") set("listening");
        },
        onTranscribing: () => set("transcribing"),
        onUtterance: (text: string) => {
          setPartial("");
          set("thinking");
          handlersRef.current.onUtterance(text);
        },
        onError: (message: string) => {
          setError(message);
          if (statusRef.current === "transcribing") set("listening");
        },
      };
      const recognizer: Recognizer = serverVoice ? new ServerRecognizer(events) : new BrowserRecognizer(events);
      recognizerRef.current = recognizer;
      await recognizer.start();
      set("listening");
    } catch (err) {
      console.warn(err);
      recognizerRef.current = null;
      speakerRef.current?.dispose();
      speakerRef.current = null;
      setError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone access was blocked. You can allow it in your browser settings, or write instead."
          : "I couldn't start the microphone. You can write instead.",
      );
      set("error");
    }
  }, [serverVoice, voiceId, set, backToListening]);

  // If a turn ends without any spoken reply (e.g. an error), go back to listening.
  useEffect(() => {
    if (phase === "idle" && !replyActive.current && !speakerRef.current?.speaking && statusRef.current === "thinking") {
      backToListening();
    }
  }, [phase, backToListening]);

  useEffect(() => stop, [stop]);

  const setMuted = useCallback((m: boolean) => {
    setMutedState(m);
    recognizerRef.current?.setMuted(m);
  }, []);

  const interrupt = useCallback(() => {
    if (statusRef.current !== "speaking" && !(statusRef.current === "thinking" && replyActive.current)) return;
    speakerRef.current?.stop();
    chunker.current.reset();
    replyActive.current = false;
    handlersRef.current.onBargeIn();
    recognizerRef.current?.resume();
    if (recognizerRef.current) set("listening");
  }, [set]);

  const getLevel = useCallback(() => {
    const speaker = speakerRef.current;
    if (speaker?.speaking) return speaker.getLevel();
    return recognizerRef.current?.getLevel() ?? 0;
  }, []);

  const callbacks = useMemo<ConversationCallbacks>(
    () => ({
      onReplyStart: () => {
        if (!recognizerRef.current) return;
        replyActive.current = true;
        chunker.current.reset();
        recognizerRef.current.pause();
        if (statusRef.current !== "speaking") set("thinking");
      },
      onReplyDelta: (text) => {
        if (!replyActive.current) return;
        for (const sentence of chunker.current.push(text)) speakerRef.current?.enqueue(sentence);
      },
      onReplyEnd: (_text, interrupted) => {
        if (!replyActive.current) return;
        if (interrupted) return;
        const rest = chunker.current.flush();
        if (rest) speakerRef.current?.enqueue(rest);
        speakerRef.current?.finish();
      },
    }),
    [set],
  );

  return { status, error, partial, muted, supported, start, stop, setMuted, interrupt, getLevel, callbacks };
}
