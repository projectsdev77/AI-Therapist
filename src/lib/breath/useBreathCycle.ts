"use client";

import { useEffect, useRef, useState } from "react";
import { sampleBreath, type BreathPattern, type BreathSample } from "./patterns";

/** Drives a breath pattern in real time. Vibrates gently on phase change when `haptics` is on. */
export function useBreathCycle(pattern: BreathPattern, running: boolean, haptics = false): BreathSample {
  const [sample, setSample] = useState<BreathSample>(() => sampleBreath(pattern, 0));
  const startRef = useRef(0);
  const phaseRef = useRef(sample.phase);

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const next = sampleBreath(pattern, (now - startRef.current) / 1000);
      if (next.phase !== phaseRef.current) {
        phaseRef.current = next.phase;
        if (haptics && "vibrate" in navigator && navigator.userActivation?.hasBeenActive !== false) navigator.vibrate(30);
      }
      setSample(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [pattern, running, haptics]);

  return sample;
}
