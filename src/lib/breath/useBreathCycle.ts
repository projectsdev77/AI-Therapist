"use client";

import { useEffect, useRef, useState } from "react";
import { sampleBreath, type BreathPattern, type BreathPhase, type BreathSample } from "./patterns";

let audio: AudioContext | null = null;

/** A soft, short tone on each step (desktop has no vibration). Higher for breathing in. */
function chime(phase: BreathPhase) {
  if (navigator.userActivation?.hasBeenActive === false) return;
  try {
    audio ??= new AudioContext();
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = phase === "in" ? 528 : phase === "out" ? 396 : 440;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + 1);
  } catch {
    /* no audio: the orb still paces the breath */
  }
}

/**
 * Drives a breath pattern in real time. On each phase change it vibrates gently when
 * `haptics` is on, and plays a soft tone when `sound` is on.
 */
export function useBreathCycle(pattern: BreathPattern, running: boolean, haptics = false, sound = false): BreathSample {
  const [sample, setSample] = useState<BreathSample>(() => sampleBreath(pattern, 0));
  const startRef = useRef(0);
  const phaseRef = useRef(sample.phase);
  const cues = useRef({ haptics, sound });
  useEffect(() => {
    cues.current = { haptics, sound };
  });

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const next = sampleBreath(pattern, (now - startRef.current) / 1000);
      if (next.phase !== phaseRef.current) {
        phaseRef.current = next.phase;
        if (cues.current.haptics && "vibrate" in navigator && navigator.userActivation?.hasBeenActive !== false) navigator.vibrate(30);
        if (cues.current.sound) chime(next.phase);
      }
      setSample(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [pattern, running]);

  return sample;
}
