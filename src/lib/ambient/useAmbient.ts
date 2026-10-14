"use client";

import { useEffect, useRef, useState } from "react";
import { AmbientEngine } from "./engine";
import { ambientTargetGain, type AmbientMixState } from "./mix";
import type { AmbientKind } from "./sources";

/**
 * Drives the ambient engine from the talk screen. Mounted only there, so leaving the
 * conversation always stops the sound.
 */
export function useAmbient(kind: AmbientKind, state: Omit<AmbientMixState, "visible">) {
  const engine = useRef<AmbientEngine | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === "visible");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      engine.current?.dispose();
      engine.current = null;
    };
  }, []);

  const target = ambientTargetGain({ ...state, visible });
  useEffect(() => {
    if (!engine.current) {
      if (target === 0) return;
      engine.current = new AmbientEngine();
    }
    engine.current.set(kind, target, state.someoneSpeaking);
  }, [kind, target, state.someoneSpeaking]);
}
