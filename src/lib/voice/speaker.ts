/** Speaks a queue of sentences; reports a live level for the Presence. */
export interface Speaker {
  enqueue(sentence: string): void;
  /** Called after the last sentence is queued; onDrained fires when playback finishes. */
  finish(): void;
  /** Stops immediately and clears the queue (barge-in). */
  stop(): void;
  getLevel(): number;
  readonly speaking: boolean;
  onDrained?: () => void;
  onStart?: () => void;
  dispose(): void;
}

/** ElevenLabs via /api/tts, played through Web Audio so we can meter it. */
export class ServerSpeaker implements Speaker {
  private ctx = new AudioContext();
  private analyser: AnalyserNode;
  private data: Float32Array<ArrayBuffer>;
  private queue: Promise<AudioBuffer | null>[] = [];
  private current: AudioBufferSourceNode | null = null;
  private playing = false;
  private finished = false;
  private generation = 0;
  speaking = false;
  onDrained?: () => void;
  onStart?: () => void;

  constructor(private voiceId?: string | null) {
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.connect(this.ctx.destination);
    this.data = new Float32Array(this.analyser.fftSize);
  }

  /** Must be called from a user gesture on iOS. */
  async unlock() {
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  enqueue(sentence: string) {
    const gen = this.generation;
    // Fetch immediately so the next sentence is ready when the current one ends.
    const audio = fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: sentence, voiceId: this.voiceId ?? undefined }),
    })
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`tts ${r.status}`))))
      .then((buf) => (gen === this.generation ? this.ctx.decodeAudioData(buf) : null))
      .catch((err) => {
        console.warn("tts failed", err);
        return null;
      });
    this.queue.push(audio);
    if (!this.playing) void this.pump();
  }

  finish() {
    this.finished = true;
    if (!this.playing && this.queue.length === 0) this.drain();
  }

  stop() {
    this.generation++;
    this.queue = [];
    this.finished = false;
    try {
      this.current?.stop();
    } catch {
      // Already stopped.
    }
    this.current = null;
    this.playing = false;
    this.speaking = false;
  }

  getLevel(): number {
    if (!this.speaking) return 0;
    this.analyser.getFloatTimeDomainData(this.data);
    let sum = 0;
    for (let i = 0; i < this.data.length; i++) sum += this.data[i] * this.data[i];
    return Math.min(1, Math.sqrt(sum / this.data.length) * 5);
  }

  dispose() {
    this.stop();
    void this.ctx.close();
  }

  private drain() {
    this.finished = false;
    this.speaking = false;
    this.onDrained?.();
  }

  private async pump() {
    const gen = this.generation;
    this.playing = true;
    while (this.queue.length > 0 && gen === this.generation) {
      const buffer = await this.queue.shift()!;
      if (gen !== this.generation) return;
      if (!buffer) continue;
      if (!this.speaking) {
        this.speaking = true;
        this.onStart?.();
      }
      await new Promise<void>((resolve) => {
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.analyser);
        source.onended = () => resolve();
        this.current = source;
        source.start();
      });
    }
    if (gen !== this.generation) return;
    this.playing = false;
    if (this.finished) this.drain();
  }
}

/** Browser speechSynthesis fallback (no API key). Level is approximated. */
export class BrowserSpeaker implements Speaker {
  private pending = 0;
  private finished = false;
  private generation = 0;
  speaking = false;
  onDrained?: () => void;
  onStart?: () => void;
  private voice: SpeechSynthesisVoice | null = null;
  // Chrome can drop events for utterances that get garbage-collected; keep references.
  private live = new Set<SpeechSynthesisUtterance>();

  constructor() {
    const pick = () => {
      const voices = speechSynthesis.getVoices();
      const lang = navigator.language.split("-")[0];
      this.voice =
        voices.find((v) => v.lang.startsWith(lang) && /natural|neural|premium|enhanced|samantha|google/i.test(v.name)) ??
        voices.find((v) => v.lang.startsWith(lang)) ??
        null;
    };
    pick();
    speechSynthesis.addEventListener?.("voiceschanged", pick);
  }

  enqueue(sentence: string) {
    const gen = this.generation;
    const u = new SpeechSynthesisUtterance(sentence);
    if (this.voice) u.voice = this.voice;
    u.rate = 0.97;
    u.pitch = 1;
    this.pending++;
    u.onstart = () => {
      if (gen !== this.generation) return;
      if (!this.speaking) {
        this.speaking = true;
        this.onStart?.();
      }
    };
    this.live.add(u);
    const done = () => {
      this.live.delete(u);
      if (gen !== this.generation) return;
      this.pending--;
      if (this.pending === 0 && this.finished) this.drain();
    };
    u.onend = done;
    u.onerror = done;
    speechSynthesis.speak(u);
  }

  finish() {
    this.finished = true;
    if (this.pending === 0) this.drain();
  }

  stop() {
    this.generation++;
    this.pending = 0;
    this.finished = false;
    this.speaking = false;
    this.live.clear();
    speechSynthesis.cancel();
  }

  getLevel(): number {
    if (!this.speaking) return 0;
    const t = performance.now() / 1000;
    return 0.35 + 0.3 * Math.max(0, Math.sin(t * 11) * Math.sin(t * 3.1));
  }

  dispose() {
    this.stop();
  }

  private drain() {
    this.finished = false;
    this.speaking = false;
    this.onDrained?.();
  }
}
