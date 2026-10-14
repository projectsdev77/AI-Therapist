/** Pure mixing rules for ambient sound, kept separate so they can be tested. */

export interface AmbientMixState {
  enabled: boolean;
  /** A conversation is on screen and has started. */
  inConversation: boolean;
  breathing: boolean;
  /** The crisis panel is open (expanded). */
  crisisPanelOpen: boolean;
  /** Either side is speaking: the companion's voice, or the person (mic detects speech). */
  someoneSpeaking: boolean;
  /** The microphone is listening (voice mode). */
  micListening: boolean;
  /** The tab is visible. */
  visible: boolean;
}

/** −18 dB while either side speaks. */
export const DUCK_GAIN = Math.pow(10, -18 / 20);
/** While the mic is listening, stay well under speech so voice detection isn't fooled. */
export const VOICE_MODE_GAIN = 0.5;
export const BASE_GAIN = 0.35;

/** Target output gain (0..BASE_GAIN) for the current situation. */
export function ambientTargetGain(s: AmbientMixState): number {
  if (!s.enabled || !s.inConversation || s.breathing || s.crisisPanelOpen || !s.visible) return 0;
  let g = BASE_GAIN;
  if (s.micListening) g *= VOICE_MODE_GAIN;
  if (s.someoneSpeaking) g *= DUCK_GAIN;
  return g;
}

/** Seconds to reach the new target: fade in over 4s, duck quickly, release gently, stop briskly. */
export function rampSeconds(from: number, to: number, ducking: boolean): number {
  if (to === 0) return 1.2;
  if (ducking && to < from) return 0.15;
  if (from === 0) return 4;
  return 0.8;
}
