import { describe, expect, it } from "vitest";
import { crossfadeLoop, generateSamples, LOOP_SECONDS, trimSilence } from "@/lib/ambient/generate";
import { ambientTargetGain, BASE_GAIN, DUCK_GAIN, rampSeconds, type AmbientMixState } from "@/lib/ambient/mix";
import { weatherToAmbient } from "@/lib/ambient/settings";
import { nextNoiseFloor, vadThreshold } from "@/lib/voice/mic";

const on: AmbientMixState = {
  enabled: true,
  inConversation: true,
  breathing: false,
  crisisPanelOpen: false,
  someoneSpeaking: false,
  micListening: false,
  visible: true,
};

describe("ambient mix", () => {
  it("is silent unless enabled, in a conversation, and visible", () => {
    expect(ambientTargetGain(on)).toBe(BASE_GAIN);
    expect(ambientTargetGain({ ...on, enabled: false })).toBe(0);
    expect(ambientTargetGain({ ...on, inConversation: false })).toBe(0);
    expect(ambientTargetGain({ ...on, visible: false })).toBe(0);
  });

  it("goes silent for breathing and the help panel", () => {
    expect(ambientTargetGain({ ...on, breathing: true })).toBe(0);
    expect(ambientTargetGain({ ...on, crisisPanelOpen: true })).toBe(0);
  });

  it("ducks 18 dB under speech and sits lower while the mic listens", () => {
    expect(ambientTargetGain({ ...on, someoneSpeaking: true })).toBeCloseTo(BASE_GAIN * DUCK_GAIN);
    expect(20 * Math.log10(DUCK_GAIN)).toBeCloseTo(-18);
    expect(ambientTargetGain({ ...on, micListening: true })).toBeLessThan(BASE_GAIN);
  });

  it("ducks fast, releases slowly, fades in gently", () => {
    expect(rampSeconds(0.35, 0.04, true)).toBeLessThan(0.3);
    expect(rampSeconds(0.04, 0.35, false)).toBeGreaterThan(0.5);
    expect(rampSeconds(0, 0.35, false)).toBe(4);
    expect(rampSeconds(0.35, 0, false)).toBeGreaterThan(0.5);
  });

  it("matches the sky", () => {
    expect(weatherToAmbient("drizzle")).toBe("rain");
    expect(weatherToAmbient("storm")).toBe("rain");
    expect(weatherToAmbient("breaking")).toBe("hum");
    expect(weatherToAmbient("clear")).toBe("room");
    expect(weatherToAmbient(null)).toBe("room");
  });
});

describe("ambient loops", () => {
  it.each(["rain", "room", "hum"] as const)("generates a %s loop that stays in range and joins smoothly", (kind) => {
    const rate = 8000;
    const d = generateSamples(kind, rate);
    expect(d.length).toBe(rate * LOOP_SECONDS);
    let peak = 0;
    for (const v of d) peak = Math.max(peak, Math.abs(v));
    expect(peak).toBeLessThanOrEqual(0.55);
    expect(peak).toBeGreaterThan(0.05);
    // The jump at the loop point is no bigger than an ordinary step inside the loop.
    let maxStep = 0;
    for (let i = 1; i < d.length; i++) maxStep = Math.max(maxStep, Math.abs(d[i] - d[i - 1]));
    expect(Math.abs(d[0] - d[d.length - 1])).toBeLessThanOrEqual(maxStep * 1.5);
  });

  it("crossfades the tail into the head", () => {
    const d = new Float32Array(300).map((_, i) => (i < 100 ? 0 : 1));
    const out = crossfadeLoop(d, 100);
    expect(out.length).toBe(200);
    expect(out[0]).toBeCloseTo(1); // starts on the tail
    expect(out[199]).toBe(1);
  });

  it("trims silent padding", () => {
    const d = new Float32Array([0, 0, 0.5, -0.5, 0.2, 0, 0]);
    expect(Array.from(trimSilence(d))).toEqual([0.5, -0.5, expect.closeTo(0.2)]);
  });
});

describe("voice detection noise floor", () => {
  it("settles on steady background noise so it doesn't count as speech", () => {
    let floor = 0;
    for (let i = 0; i < 20 * 20; i++) floor = nextNoiseFloor(floor, 0.15); // 20s of steady noise
    expect(floor).toBeCloseTo(0.15, 2);
    expect(vadThreshold(0.12, 1, floor)).toBeGreaterThan(0.15);
  });

  it("drops at once in quiet, so speech after noise is still heard", () => {
    expect(nextNoiseFloor(0.2, 0.01)).toBe(0.01);
    expect(vadThreshold(0.12, 1, 0.01)).toBe(0.12);
  });

  it("barely moves during a sentence", () => {
    let floor = 0.02;
    for (let i = 0; i < 40; i++) floor = nextNoiseFloor(floor, 0.5); // 2s of speech
    expect(floor).toBeLessThan(0.05);
  });
});
