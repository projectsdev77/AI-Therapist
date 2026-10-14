import { crossfadeLoop, generateSamples, trimSilence } from "./generate";
import { rampSeconds } from "./mix";
import { AMBIENT_FILES, type AmbientKind } from "./sources";

type Layer = { kind: AmbientKind; source: AudioBufferSourceNode; gain: GainNode };

/**
 * Plays one looping ambient sound at a time on its own AudioContext, so it never shares
 * a graph with the microphone or the companion's voice. Volume changes are always ramps.
 */
export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private layer: Layer | null = null;
  private buffers = new Map<AmbientKind, Promise<AudioBuffer>>();
  private current = 0;
  private wantKind: AmbientKind | null = null;
  private suspendTimer: ReturnType<typeof setTimeout> | null = null;
  private unlock = () => void this.ctx?.resume().catch(() => undefined);

  /** Sets the sound and its target volume (0 = silent). */
  set(kind: AmbientKind, target: number, ducking: boolean) {
    if (target > 0 && !this.ctx) this.init();
    const ctx = this.ctx;
    if (!ctx || !this.master) return;

    if (this.suspendTimer) clearTimeout(this.suspendTimer);
    this.suspendTimer = null;
    if (target > 0 && ctx.state === "suspended") void ctx.resume().catch(() => undefined);

    if (target > 0 && this.wantKind !== kind) {
      this.wantKind = kind;
      void this.play(kind);
    }

    if (target !== this.current) {
      const secs = rampSeconds(this.current, target, ducking);
      const now = ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(this.master.gain.value, now);
      // Exponential-feeling fade via setTargetAtTime: reaches ~95% in `secs`.
      this.master.gain.setTargetAtTime(target, now, secs / 3);
      this.current = target;
    }

    // Once silent, release the audio device so nothing runs in the background.
    if (target === 0) {
      this.suspendTimer = setTimeout(() => void this.ctx?.suspend().catch(() => undefined), 2500);
    }
  }

  dispose() {
    if (this.suspendTimer) clearTimeout(this.suspendTimer);
    window.removeEventListener("pointerdown", this.unlock);
    window.removeEventListener("keydown", this.unlock);
    try {
      this.layer?.source.stop();
    } catch {
      // Already stopped.
    }
    void this.ctx?.close().catch(() => undefined);
    this.ctx = null;
    this.master = null;
    this.layer = null;
    this.current = 0;
    this.wantKind = null;
  }

  private init() {
    if (typeof window === "undefined" || typeof AudioContext === "undefined") return;
    this.ctx = new AudioContext({ latencyHint: "playback" });
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);
    // Browsers only start audio after a gesture; the next tap or key unlocks it.
    window.addEventListener("pointerdown", this.unlock);
    window.addEventListener("keydown", this.unlock);
  }

  private async play(kind: AmbientKind) {
    let buffer: AudioBuffer;
    try {
      buffer = await this.load(kind);
    } catch {
      return;
    }
    const ctx = this.ctx;
    if (!ctx || !this.master || this.wantKind !== kind) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + 4);
    source.connect(gain).connect(this.master);
    source.start();

    const old = this.layer;
    if (old) {
      old.gain.gain.cancelScheduledValues(now);
      old.gain.gain.setValueAtTime(old.gain.gain.value, now);
      old.gain.gain.linearRampToValueAtTime(0, now + 4);
      old.source.stop(now + 4.1);
    }
    this.layer = { kind, source, gain };
  }

  private load(kind: AmbientKind): Promise<AudioBuffer> {
    let p = this.buffers.get(kind);
    if (!p) {
      p = this.loadFile(kind).catch(() => this.generate(kind));
      this.buffers.set(kind, p);
    }
    return p;
  }

  private async loadFile(kind: AmbientKind): Promise<AudioBuffer> {
    const url = AMBIENT_FILES[kind];
    const ctx = this.ctx;
    if (!url || !ctx) throw new Error("no file");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ambient ${kind}: ${res.status}`);
    const decoded = await ctx.decodeAudioData(await res.arrayBuffer());
    return makeSeamless(ctx, decoded);
  }

  private generate(kind: AmbientKind): AudioBuffer {
    const ctx = this.ctx!;
    const data = generateSamples(kind, ctx.sampleRate);
    const buffer = ctx.createBuffer(1, data.length, ctx.sampleRate);
    buffer.copyToChannel(data, 0);
    return buffer;
  }
}

/** Trims silent padding and crossfades the loop point of a recording, per channel. */
function makeSeamless(ctx: AudioContext, input: AudioBuffer): AudioBuffer {
  const fade = Math.round(ctx.sampleRate * 1.5);
  // Find a shared trim window across channels so they stay aligned.
  let start = input.length;
  let end = 0;
  for (let c = 0; c < input.numberOfChannels; c++) {
    const ch = input.getChannelData(c);
    const trimmed = trimSilence(ch);
    const s = trimmed.byteOffset / 4 - ch.byteOffset / 4;
    start = Math.min(start, s);
    end = Math.max(end, s + trimmed.length);
  }
  if (end <= start) return input;
  const channels = Array.from({ length: input.numberOfChannels }, (_, c) => crossfadeLoop(input.getChannelData(c).slice(start, end), fade));
  const out = ctx.createBuffer(channels.length, channels[0].length, input.sampleRate);
  channels.forEach((d, c) => out.copyToChannel(d, c));
  return out;
}
