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
  /**
   * While a reply is being spoken: the part already said, so captions follow the voice word by word.
   * null when nothing is being spoken (show the full text).
   */
  spoken: string | null;
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
  const [spoken, setSpoken] = useState<string | null>(null);
  // Caption sync: sentences already said, the one being said, and how much of it.
  const said = useRef({ base: "", sentence: "", shown: 0, timer: 0 as ReturnType<typeof setInterval> | 0 });

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

  const clearSync = useCallback(() => {
    if (said.current.timer) clearInterval(said.current.timer);
    said.current = { base: "", sentence: "", shown: 0, timer: 0 };
    setSpoken(null);
  }, []);

  const showWords = useCallback(() => {
    const { base, sentence, shown } = said.current;
    setSpoken(`${base}${sentence.slice(0, shown)}`.trimEnd());
  }, []);

  /** A sentence started: reveal it word by word over its length (or as the browser reports words). */
  const onSentence = useCallback(
    (sentence: string, durationMs: number | null) => {
      const s = said.current;
      if (s.timer) clearInterval(s.timer);
      if (s.sentence) s.base += `${s.sentence} `;
      s.sentence = sentence;
      s.shown = 0;
      const words = sentence.split(/(?<=\s)/);
      // Unknown length (browser voice): about 2.4 words a second at the calm rate we use.
      const perWord = Math.max(120, (durationMs ?? (words.length / 2.4) * 1000) / Math.max(1, words.length));
      let i = 0;
      s.timer = setInterval(() => {
        i++;
        const upTo = words.slice(0, i).join("").length;
        if (upTo > said.current.shown) said.current.shown = upTo;
        showWords();
        if (i >= words.length && said.current.timer) clearInterval(said.current.timer);
      }, perWord);
      showWords();
    },
    [showWords],
  );

  const onWord = useCallback(
    (charIndex: number) => {
      const s = said.current;
      const end = s.sentence.slice(charIndex).search(/\s|$/);
      const upTo = charIndex + Math.max(0, end);
      if (upTo > s.shown) {
        s.shown = upTo;
        showWords();
      }
    },
    [showWords],
  );

  const backToListening = useCallback(() => {
    clearSync();
    replyActive.current = false;
    recognizerRef.current?.resume();
    if (recognizerRef.current) set("listening");
  }, [set, clearSync]);

  const stop = useCallback(() => {
    recognizerRef.current?.stop();
    recognizerRef.current = null;
    speakerRef.current?.dispose();
    speakerRef.current = null;
    chunker.current.reset();
    replyActive.current = false;
    clearSync();
    setPartial("");
    set("off");
  }, [set, clearSync]);

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
      speaker.onSentence = onSentence;
      speaker.onWord = onWord;
      speakerRef.current = speaker;

      const events = {
        onSpeechStart: () => {
          const s = statusRef.current;
          if (s === "speaking" || (s === "thinking" && replyActive.current)) {
            // Barge-in: stop talking and listen.
            speakerRef.current?.stop();
            chunker.current.reset();
            replyActive.current = false;
            clearSync();
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
  }, [serverVoice, voiceId, set, backToListening, onSentence, onWord, clearSync]);

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
    clearSync();
    handlersRef.current.onBargeIn();
    recognizerRef.current?.resume();
    if (recognizerRef.current) set("listening");
  }, [set, clearSync]);

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
        clearSync();
        // Nothing said yet: captions wait for the voice.
        setSpoken("");
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
    [set, clearSync],
  );

  return { status, error, partial, muted, supported, start, stop, setMuted, interrupt, getLevel, spoken, callbacks };
}
