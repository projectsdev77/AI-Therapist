import { MicInput } from "./mic";

export interface RecognizerEvents {
  /** Someone started speaking (used for barge-in and the "hearing" state). */
  onSpeechStart?: () => void;
  /** Live, unfinished transcript (browser recognizer only). */
  onPartial?: (text: string) => void;
  /** A finished utterance. */
  onUtterance?: (text: string) => void;
  onTranscribing?: () => void;
  onError?: (message: string) => void;
}

export interface Recognizer {
  start(): Promise<void>;
  stop(): void;
  /** Stop transcribing (companion is speaking); speech still triggers onSpeechStart for barge-in. */
  pause(): void;
  resume(): void;
  setMuted(muted: boolean): void;
  getLevel(): number;
  readonly paused: boolean;
}

const BARGE_IN_BOOST = 2.2;

/** Records each utterance and transcribes it with ElevenLabs via /api/stt. */
export class ServerRecognizer implements Recognizer {
  private mic: MicInput;
  paused = false;
  private stopped = false;

  constructor(private events: RecognizerEvents) {
    this.mic = new MicInput({
      onSpeechStart: () => this.events.onSpeechStart?.(),
      onSpeechEnd: () => void this.handleSpeechEnd(),
    });
  }

  async start() {
    this.stopped = false;
    await this.mic.start();
    this.mic.startRecording();
  }

  stop() {
    this.stopped = true;
    this.mic.stop();
  }

  pause() {
    this.paused = true;
    this.mic.thresholdBoost = BARGE_IN_BOOST;
    void this.mic.stopRecording();
  }

  resume() {
    this.paused = false;
    this.mic.thresholdBoost = 1;
    this.mic.startRecording();
  }

  setMuted(muted: boolean) {
    this.mic.setMuted(muted);
  }

  getLevel() {
    return this.mic.getLevel();
  }

  private async handleSpeechEnd() {
    if (this.paused || this.stopped) return;
    const blob = await this.mic.stopRecording();
    if (!this.paused && !this.stopped) this.mic.startRecording();
    if (!blob) return;
    this.events.onTranscribing?.();
    try {
      const form = new FormData();
      form.append("file", blob, "utterance.webm");
      const res = await fetch("/api/stt", { method: "POST", body: form });
      if (!res.ok) throw new Error(`stt ${res.status}`);
      const { text } = (await res.json()) as { text: string };
      if (text.trim()) this.events.onUtterance?.(text.trim());
      else this.events.onPartial?.("");
    } catch (err) {
      console.warn(err);
      this.events.onError?.("I couldn't catch that. Could you say it again?");
    }
  }
}

// Minimal typings for the Web Speech API (not in every TS DOM lib).
interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export function browserRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Browser speech recognition fallback (no API key). Gives live partial captions. */
export class BrowserRecognizer implements Recognizer {
  private mic = new MicInput({ onSpeechStart: () => this.paused && this.events.onSpeechStart?.() });
  private recognition: SpeechRecognitionLike;
  private finalText = "";
  private endTimer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  paused = false;

  constructor(private events: RecognizerEvents) {
    const Ctor = browserRecognitionCtor();
    if (!Ctor) throw new Error("Speech recognition is not supported");
    this.recognition = new Ctor();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = navigator.language || "en-US";
    this.recognition.onresult = (e) => this.handleResult(e);
    this.recognition.onend = () => {
      // Browsers end recognition after silence; keep it going while active.
      if (this.running && !this.paused) this.safeStart();
    };
    this.recognition.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        this.running = false;
        this.events.onError?.("Microphone access was blocked. You can allow it in your browser settings, or write instead.");
      }
    };
  }

  async start() {
    this.running = true;
    // The level meter is a nice-to-have; recognition works without it.
    await this.mic.start().catch(() => undefined);
    this.mic.thresholdBoost = 1;
    this.safeStart();
  }

  stop() {
    this.running = false;
    this.clearTimer();
    this.recognition.abort();
    this.mic.stop();
  }

  pause() {
    this.paused = true;
    this.clearTimer();
    this.finalText = "";
    this.mic.thresholdBoost = BARGE_IN_BOOST;
    this.recognition.abort();
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.mic.thresholdBoost = 1;
    if (this.running) this.safeStart();
  }

  setMuted(muted: boolean) {
    this.mic.setMuted(muted);
    if (muted) this.recognition.abort();
    else if (this.running && !this.paused) this.safeStart();
  }

  getLevel() {
    return this.mic.getLevel();
  }

  private safeStart() {
    try {
      this.recognition.start();
    } catch {
      // Already started.
    }
  }

  private clearTimer() {
    if (this.endTimer) clearTimeout(this.endTimer);
    this.endTimer = null;
  }

  private handleResult(e: SpeechRecognitionEventLike) {
    if (this.paused) return;
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) this.finalText += `${r[0].transcript} `;
      else interim += r[0].transcript;
    }
    if (!interim) this.events.onSpeechStart?.();
    this.events.onPartial?.(`${this.finalText}${interim}`.trim());
    this.clearTimer();
    // End of utterance: a short pause after the last words.
    this.endTimer = setTimeout(() => {
      const text = `${this.finalText}${interim}`.trim();
      this.finalText = "";
      if (text) this.events.onUtterance?.(text);
    }, interim ? 1600 : 900);
  }
}
