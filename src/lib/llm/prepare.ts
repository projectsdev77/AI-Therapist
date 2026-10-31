import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { PREPARE_SYSTEM, PrepareOutputSchema, type PrepareOutput, type PrepareRequest } from "@/lib/prepare/protocol";
import { FALLBACK_BETA, getAnthropic, MODEL } from "./client";
import { hasGemini, jsonGemini } from "./gemini";

function render(req: PrepareRequest): string {
  return [
    req.displayName ? `Name: ${req.displayName}` : null,
    "Summary:",
    req.clientSummary ?? "(none)",
    "",
    "Notes:",
    req.notes.map((n) => `- (${n.category}) ${n.fact}`).join("\n") || "(none)",
    "",
    "Recent conversation cards (most recent first):",
    req.cards.map((c) => `- ${c.date}: ${c.title}. ${c.insight}${c.nextStep ? ` Step: ${c.nextStep}` : ""}`).join("\n") || "(none)",
    "",
    "Mood ratings 0-10 (start → end):",
    req.moods.map((m) => `- ${m.date}: ${m.start ?? "?"} → ${m.end ?? "?"}`).join("\n") || "(none)",
  ]
    .filter((l) => l !== null)
    .join("\n");
}

const QUESTIONS = [
  "How do you usually work with people who feel like I do?",
  "How often would we meet, and for how long?",
  "Do you offer a sliding scale or lower fees?",
  "What will the first few sessions look like?",
];

/** A plain draft when no AI is configured: built from the person's own notes. */
export function demoPrepare(req: PrepareRequest): PrepareOutput {
  const facts = req.notes.slice(0, 5).map((n) => n.fact.replace(/^You('ve| have)?/i, "I've"));
  return {
    goingOn: req.clientSummary ?? (facts.join(". ") || "I'd like to talk about how things have been for me lately."),
    hopes: "I'd like to feel more like myself and have a few ways to handle hard moments.",
    helps: req.notes.filter((n) => n.category === "helps").map((n) => n.fact).join(". ") || "Talking things through has helped a little.",
    questions: QUESTIONS,
  };
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const normalize = (o: PrepareOutput): PrepareOutput => ({
  goingOn: clip(o.goingOn.trim(), 1200),
  hopes: clip(o.hopes.trim(), 800),
  helps: clip(o.helps.trim(), 600),
  questions: o.questions.map((q) => clip(q.trim(), 160)).filter(Boolean).slice(0, 6),
});

export async function draftPreparation(req: PrepareRequest, signal?: AbortSignal): Promise<PrepareOutput> {
  const client = getAnthropic();
  if (!client && hasGemini()) return normalize((await jsonGemini(PREPARE_SYSTEM, render(req), PrepareOutputSchema, signal)) ?? demoPrepare(req));
  if (!client) return demoPrepare(req);
  const res = await client.beta.messages.parse(
    {
      model: MODEL,
      max_tokens: 4000,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      output_config: { effort: "low", format: betaZodOutputFormat(PrepareOutputSchema) },
      system: PREPARE_SYSTEM,
      messages: [{ role: "user", content: render(req) }],
    },
    { signal },
  );
  return normalize(res.parsed_output ?? demoPrepare(req));
}
