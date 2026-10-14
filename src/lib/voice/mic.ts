/**
 * Microphone input with a level meter and a simple energy-based voice activity detector.
 */
export interface MicOptions {
  /** Level (0..1) above which we consider someone speaking. */
  threshold?: number;
  /** Speech must last this long to count as starting (ms). */
  startMs?: number;
  /** Silence this long ends an utterance (ms). */
  endMs?: number;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

/**
 * Background-noise floor: drops at once to quieter levels and creeps up slowly, so it
 * settles on steady noise (a fan, ambient sound, a busy room) but not on speech, whose
 * pauses keep pulling it back down.
 */
export function nextNoiseFloor(floor: number, level: number): number {
  if (level < floor) return level;
  return Math.min(0.3, floor + Math.min(0.0005, level - floor));
}

/** Speech must clear both the base threshold and the noise floor with some margin. */
export function vadThreshold(base: number, boost: number, floor: number): number {
  return Math.max(base * boost, floor * 2.5 + 0.03);
}

export class MicInput {
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private data: Float32Array<ArrayBuffer> | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private level = 0;
  private floor = 0;
  private speaking = false;
  private aboveSince = 0;
  private belowSince = 0;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  /** When false, VAD events are not emitted (e.g. while the companion speaks). */
  vadEnabled = true;
  /** Raised threshold used for barge-in while the companion is speaking. */
  thresholdBoost = 1;

  constructor(private opts: MicOptions = {}) {}

  get active() {
    return this.stream !== null;
  }

  get mediaStream() {
    return this.stream;
  }

  async start(): Promise<void> {
    if (this.stream) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    this.ctx = new AudioContext();
    const source = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    source.connect(this.analyser);
    this.data = new Float32Array(this.analyser.fftSize);
    this.timer = setInterval(() => this.tick(), 50);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.stopRecording();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    void this.ctx?.close();
    this.ctx = null;
    this.analyser = null;
    this.level = 0;
    this.floor = 0;
    this.speaking = false;
  }

  /** Smoothed loudness 0..1. */
  getLevel(): number {
    return this.level;
  }

  setMuted(muted: boolean) {
    this.stream?.getAudioTracks().forEach((t) => (t.enabled = !muted));
  }

  /** Starts capturing audio for server-side transcription. */
  startRecording() {
    if (!this.stream || this.recorder) return;
    const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((t) => MediaRecorder.isTypeSupported(t));
    this.chunks = [];
    this.recorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);
    this.recorder.ondataavailable = (e) => e.data.size > 0 && this.chunks.push(e.data);
    this.recorder.start(250);
  }

  /** Stops capturing and returns the recorded audio, if any. */
  async stopRecording(): Promise<Blob | null> {
    const recorder = this.recorder;
    if (!recorder) return null;
    this.recorder = null;
    if (recorder.state === "inactive") return null;
    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });
    const blob = new Blob(this.chunks, { type: recorder.mimeType || "audio/webm" });
    this.chunks = [];
    return blob.size > 0 ? blob : null;
  }

  private tick() {
    if (!this.analyser || !this.data) return;
    this.analyser.getFloatTimeDomainData(this.data);
    let sum = 0;
    for (let i = 0; i < this.data.length; i++) sum += this.data[i] * this.data[i];
    const rms = Math.sqrt(sum / this.data.length);
    // Map RMS (roughly 0..0.3 for speech) to 0..1 with a soft curve.
    const instant = Math.min(1, Math.pow(rms * 6, 0.8));
    this.level = this.level * 0.6 + instant * 0.4;

    const now = performance.now();
    this.floor = nextNoiseFloor(this.floor, this.level);
    const threshold = vadThreshold(this.opts.threshold ?? 0.12, this.thresholdBoost, this.floor);
    const above = this.level > threshold;
    if (above) {
      this.belowSince = 0;
      if (!this.aboveSince) this.aboveSince = now;
      if (!this.speaking && now - this.aboveSince >= (this.opts.startMs ?? 180)) {
        this.speaking = true;
        if (this.vadEnabled) this.opts.onSpeechStart?.();
      }
    } else {
      this.aboveSince = 0;
      if (!this.belowSince) this.belowSince = now;
      if (this.speaking && now - this.belowSince >= (this.opts.endMs ?? 1100)) {
        this.speaking = false;
        if (this.vadEnabled) this.opts.onSpeechEnd?.();
      }
    }
  }
}
