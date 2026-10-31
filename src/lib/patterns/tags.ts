/**
 * Topic tags describe parts of a person's life, never diagnoses or the act of talking
 * (therapy research: describe patterns in the person's words, not labels).
 */
const CLINICAL = /\b(depress|anxiety|anxious disorder|disorder|trauma|ptsd|adhd|add|ocd|bipolar|borderline|bpd|psychosis|schizo|autis|anorexi|bulimi|insomnia|panic attacks?|suicid|self[- ]?harm|diagnos)/;
const TALKING = /^(venting|vent|reaching out|sharing|talking|opening up|checking in|talking it out|getting it off my chest|support|help seeking|seeking help|conversation)$/;

export function isUsableTheme(tag: string): boolean {
  const t = tag.trim().toLowerCase();
  return t.length > 0 && t.length <= 40 && !CLINICAL.test(t) && !TALKING.test(t);
}
