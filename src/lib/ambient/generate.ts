import type { AmbientKind } from "./sources";

/**
 * Built-in ambient loops, synthesized as raw samples (no files needed).
 * Placeholders until real recordings are added in sources.ts.
 */
export const LOOP_SECONDS = 8;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
}

function normalize(data: Float32Array, peak: number) {
  let max = 0;
  for (let i = 0; i < data.length; i++) max = Math.max(max, Math.abs(data[i]));
  if (max > 0) for (let i = 0; i < data.length; i++) data[i] = (data[i] / max) * peak;
}

/** Equal-power crossfade of the tail into the head so the loop has no seam. Returns a shorter array. */
export function crossfadeLoop(data: Float32Array<ArrayBuffer>, fadeSamples: number): Float32Array<ArrayBuffer> {
  const n = data.length;
  const fade = Math.min(fadeSamples, Math.floor(n / 3));
  if (fade < 2) return data;
  const out = new Float32Array(n - fade);
  out.set(data.subarray(0, n - fade));
  for (let i = 0; i < fade; i++) {
    const t = i / fade;
    // The loop's end flows into its start: blend the tail (fading out) over the head (fading in).
    out[i] = data[i] * Math.sin((t * Math.PI) / 2) + data[n - fade + i] * Math.cos((t * Math.PI) / 2);
  }
  return out;
}

/** Fills one channel of a generated loop. Pure, so it can be tested without Web Audio. */
export function generateSamples(kind: AmbientKind, sampleRate: number): Float32Array<ArrayBuffer> {
  const length = Math.round(sampleRate * (LOOP_SECONDS + 1));
  const data = new Float32Array(length);
  const r = rng(kind.length * 7919 + 13);

  if (kind === "hum") {
    // Low, slowly breathing tones. Frequencies chosen so whole cycles fit the loop.
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const swell = 0.75 + 0.25 * Math.sin((2 * Math.PI * t) / 8);
      data[i] = swell * (Math.sin(2 * Math.PI * 55 * t) * 0.6 + Math.sin(2 * Math.PI * 82.5 * t) * 0.25 + Math.sin(2 * Math.PI * 110 * t) * 0.15);
    }
    // Every component completes whole cycles in LOOP_SECONDS, so the loop is already seamless.
    const loop = data.slice(0, Math.round(sampleRate * LOOP_SECONDS));
    normalize(loop, 0.5);
    return loop;
  }

  if (kind === "room") {
    // Brown noise, gently low-passed: the hush of a quiet room.
    let brown = 0;
    let lp = 0;
    for (let i = 0; i < length; i++) {
      brown = (brown + 0.02 * r()) / 1.02;
      lp += (brown - lp) * 0.08;
      data[i] = lp;
    }
    const loop = crossfadeLoop(data, sampleRate);
    normalize(loop, 0.5);
    return loop;
  }

  // Rain: band-limited noise with soft, sparse droplets.
  let lp = 0;
  let hpPrev = 0;
  let hpOut = 0;
  for (let i = 0; i < length; i++) {
    const white = r();
    lp += (white - lp) * 0.35; // soften the top end
    hpOut = 0.97 * (hpOut + lp - hpPrev); // remove rumble
    hpPrev = lp;
    data[i] = hpOut * 0.6;
  }
  const drops = Math.round((LOOP_SECONDS + 1) * 30);
  for (let d = 0; d < drops; d++) {
    const start = Math.floor(((r() + 1) / 2) * (length - sampleRate * 0.02));
    const amp = 0.15 + ((r() + 1) / 2) * 0.35;
    const len = Math.floor(sampleRate * (0.004 + ((r() + 1) / 2) * 0.01));
    for (let k = 0; k < len; k++) data[start + k] += r() * amp * Math.exp((-6 * k) / len);
  }
  const loop = crossfadeLoop(data, sampleRate);
  normalize(loop, 0.5);
  return loop;
}

/** Trims near-silence at both ends (e.g. MP3 encoder padding). */
export function trimSilence(data: Float32Array<ArrayBuffer>, threshold = 0.001): Float32Array<ArrayBuffer> {
  let start = 0;
  let end = data.length;
  while (start < end && Math.abs(data[start]) < threshold) start++;
  while (end > start && Math.abs(data[end - 1]) < threshold) end--;
  return data.subarray(start, end);
}
