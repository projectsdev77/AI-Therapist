import type { RiskLevel } from "@/lib/conversation/types";

/**
 * Keyword backstop for risk detection. The model classifier is primary; this catches
 * explicit phrasing even if the classifier is unavailable. Errs toward caution.
 */
const ACUTE = [
  /\bkill(ing)? my ?self\b/,
  /\bend(ing)? (my|it all|my own) li(fe|ves)\b/,
  /\bend it all\b/,
  /\bsuicid(e|al)\b/,
  /\btake my (own )?life\b/,
  /\b(want|going|plan(ning)?) to die\b/,
  /\bbetter off dead\b/,
  /\boverdos(e|ing)\b/,
  /\bhang(ing)? my ?self\b/,
  /\bjump(ing)? off\b.*\b(bridge|building|roof)\b/,
  /\bkill (him|her|them)\b/,
  /\b(hurt|harm)(ing)? (him|her|them|someone|people)\b/,
  /\b(he|she|they) (hits?|beats?|chok(es|ed)) me\b/,
  /\bnot safe at home\b/,
  /\bkms\b/,
  /\b(want|wanna|going) to die\b/,
  /\b(saving|saved|stockpil(e|ing)) (up )?(my |the )?(pills|meds|tablets)\b/,
  /\bhow many (pills |tablets )?(it )?would (it )?take\b/,
  /\b(wrote|writing|left) (a |my )?(goodbye|suicide) (note|letters?)\b/,
  /\b(cutting|burning) (my ?self )?(right )?now\b/,
];

const ELEVATED = [
  /\bself[- ]?harm\b/,
  /\b(cut|cutting|hurt|hurting|harm|harming) my ?self\b/,
  /\bdon'?t want to (be alive|live|exist|wake up)\b/,
  /\bno (reason|point) (to|in) (live|living|going on)\b/,
  /\bwish i (was|were) (dead|gone|never born)\b/,
  /\bdisappear forever\b/,
  /\bcan'?t go on\b/,
  /\bhopeless\b/,
  // Warning signs clinicians listen for: feeling like a burden, passive wishes, putting affairs in order.
  /\b(better off|happier) without me\b/,
  /\b(a|such a) burden (to|on) (everyone|everybody|my family|them)\b/,
  /\b(go to sleep|sleep) and (never|not) wake up\b/,
  /\b(won'?t|will not) be (a problem|around|here) (for anyone )?(much )?longer\b/,
  /\bgiv(e|ing) (away )?(away )?(all )?my (stuff|things|belongings)\b/,
  /\bscared of what i (might|could) do\b/,
  /\b(don'?t|do not) deserve to (live|be alive|be here|exist)\b/,
  /\bnot (be|being) here anymore\b/,
];

export function keywordRisk(text: string): RiskLevel {
  const t = text.toLowerCase().replace(/[’']/g, "'");
  if (ACUTE.some((r) => r.test(t))) return "acute";
  if (ELEVATED.some((r) => r.test(t))) return "elevated";
  return "none";
}

const ORDER: RiskLevel[] = ["none", "low", "elevated", "acute"];

export function maxRisk(...levels: (RiskLevel | null | undefined)[]): RiskLevel {
  return levels.reduce<RiskLevel>((acc, l) => (l && ORDER.indexOf(l) > ORDER.indexOf(acc) ? l : acc), "none");
}

export function riskAtLeast(level: RiskLevel | null | undefined, threshold: RiskLevel): boolean {
  return ORDER.indexOf(level ?? "none") >= ORDER.indexOf(threshold);
}
