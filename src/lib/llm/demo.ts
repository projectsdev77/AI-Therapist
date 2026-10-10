import type { Analysis, ChatTurn, CompanionContext } from "@/lib/conversation/protocol";
import type { Tone } from "@/lib/conversation/types";
import { SESSION_START } from "@/lib/prompts/companion";
import { keywordRisk, riskAtLeast } from "@/lib/safety/keywords";

/**
 * Demo mode: scripted, rule-based replies used when no ANTHROPIC_API_KEY is set,
 * so the full experience can be clicked through. Never used in production.
 */

const TONE_WORDS: [Tone, RegExp][] = [
  ["frustrated", /\b(angry|furious|annoyed|irritated|pissed|unfair|hate)\b/],
  ["anxious", /\b(anxious|worried|stress(ed)?|overwhelm(ed|ing)?|panic|nervous|scared|can'?t (sleep|switch off))\b/],
  ["heavy", /\b(sad|down|lonely|alone|tired|exhausted|grief|lost|empty|cry(ing)?|depressed)\b/],
  ["hopeful", /\b(better|hope(ful)?|excited|looking forward|relieved|proud)\b/],
  ["warm", /\b(grateful|thankful|love|appreciate|lucky)\b/],
  ["calm", /\b(okay|fine|calm|peaceful|good)\b/],
];

const THEME_WORDS: [string, RegExp][] = [
  ["work", /\b(work|job|boss|manager|colleague|deadline|office|career)\b/],
  ["sleep", /\b(sleep|insomnia|tired|night|awake)\b/],
  ["family", /\b(mom|mum|dad|mother|father|sister|brother|family|parents?)\b/],
  ["relationships", /\b(partner|boyfriend|girlfriend|husband|wife|relationship|dating|breakup)\b/],
  ["friends", /\b(friends?|lonely|alone)\b/],
  ["self-worth", /\b(not good enough|failure|worthless|imposter|confidence)\b/],
  ["health", /\b(health|sick|pain|doctor)\b/],
  ["money", /\b(money|rent|bills|debt|afford)\b/],
];

export function demoAnalysis(text: string): Analysis {
  const t = text.toLowerCase();
  const tone = TONE_WORDS.find(([, r]) => r.test(t))?.[0] ?? "neutral";
  const themes = THEME_WORDS.filter(([, r]) => r.test(t)).map(([k]) => k).slice(0, 3);
  return { tone, risk: keywordRisk(text), themes };
}

const REFLECTIONS: Record<Tone, string[]> = {
  heavy: [
    "That sounds really heavy to carry.",
    "It sounds like a lot has been weighing on you.",
  ],
  anxious: [
    "It sounds like your mind hasn't had much room to rest.",
    "That sounds like a lot to hold at once.",
  ],
  frustrated: [
    "That sounds genuinely frustrating.",
    "It makes sense that you'd feel worked up about that.",
  ],
  hopeful: [
    "There's something lighter in how you're saying that.",
    "It sounds like something shifted a little.",
  ],
  warm: ["It sounds like that really mattered to you.", "That's a lovely thing to notice."],
  calm: ["It sounds like things feel fairly steady right now.", "You sound settled as you say that."],
  neutral: ["I'm with you.", "Thank you for telling me that."],
};

const QUESTIONS = [
  "What feels like the hardest part of it?",
  "What was going through your mind when that happened?",
  "How has that been showing up for you day to day?",
  "What would feel like a small step in a good direction?",
  "What do you wish someone understood about this?",
  "When you notice that feeling, where do you feel it most?",
];

export function demoOpening(ctx: CompanionContext): string {
  const name = ctx.displayName ? `, ${ctx.displayName}` : "";
  const last = ctx.memoryEnabled ? ctx.recentReflections[0] : undefined;
  if (last) return `Welcome back${name}. Last time we talked about ${last.title.toLowerCase()}. How have things been since?`;
  if (ctx.sessionCount > 0) return `Good to see you again${name}. What's on your mind today?`;
  return `Hi${name}. I'm here to listen. What's on your mind today?`;
}

export function demoReply(history: ChatTurn[], ctx: CompanionContext): string {
  const userTurns = history.filter((t) => t.role === "user" && t.content !== SESSION_START);
  if (userTurns.length === 0) return demoOpening(ctx);
  const latest = userTurns[userTurns.length - 1].content;
  const risk = keywordRisk(latest);
  if (riskAtLeast(risk, "elevated")) {
    return "Thank you for telling me. I'm really glad you said it out loud. Are you safe right now? If you might act on these thoughts, please reach out to a crisis line or emergency services now — the options are on your screen, and I'm still here with you.";
  }
  const { tone } = demoAnalysis(latest);
  const n = userTurns.length;
  const reflection = REFLECTIONS[tone][n % REFLECTIONS[tone].length];
  const question = QUESTIONS[n % QUESTIONS.length];
  return `${reflection} ${question}`;
}

/** Streams a string in small chunks with a natural cadence. */
export async function* streamText(text: string, signal?: AbortSignal): AsyncGenerator<string> {
  const words = text.split(/(\s+)/);
  for (let i = 0; i < words.length; i += 2) {
    if (signal?.aborted) return;
    yield words.slice(i, i + 2).join("");
    await new Promise((r) => setTimeout(r, 35));
  }
}
