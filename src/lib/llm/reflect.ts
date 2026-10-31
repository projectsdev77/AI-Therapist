import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { demoAnalysis } from "./demo";
import { FALLBACK_BETA, getAnthropic, MODEL } from "./client";
import { hasGemini, jsonGemini } from "./gemini";
import { REFLECT_SYSTEM, SESSION_START } from "@/lib/prompts/companion";
import { normalizeReflectOutput, ReflectOutputSchema, type ReflectOutput, type ReflectRequest } from "@/lib/reflection/protocol";

function renderRequest(req: ReflectRequest): string {
  const transcript = req.transcript
    .filter((t) => t.content !== SESSION_START)
    .map((t) => `${t.role === "user" ? "Person" : "Companion"}: ${t.content}`)
    .join("\n");
  const memories = req.memories.map((m) => `- [${m.id}] (${m.category}) ${m.fact}`).join("\n") || "(none yet)";
  return [
    `Memory enabled: ${req.memoryEnabled ? "yes" : "no"}`,
    req.displayName ? `They like to be called: ${req.displayName}` : null,
    `Known theme tags: ${req.knownThemes.join(", ") || "(none yet)"}`,
    "",
    "Previous client summary:",
    req.clientSummary ?? "(none yet)",
    "",
    "Current notes:",
    memories,
    "",
    "Conversation:",
    transcript,
    ...(req.correction
      ? [
          "",
          "# Correction from the person",
          `They read this card and said it wasn't quite right: "${req.correction.note}"`,
          `Current card: ${JSON.stringify(req.correction.card)}`,
          "Rewrite the card so it fits what they said. Keep their quotes word-for-word from the conversation. Return empty memory lists and a null client summary.",
        ]
      : []),
  ]
    .filter((l) => l !== null)
    .join("\n");
}

export async function reflectOnSession(req: ReflectRequest, signal?: AbortSignal): Promise<ReflectOutput> {
  const client = getAnthropic();
  if (!client && hasGemini()) {
    const out = await jsonGemini(REFLECT_SYSTEM, renderRequest(req), ReflectOutputSchema, signal);
    return normalizeReflectOutput(out ?? demoReflection(req), req);
  }
  if (!client) return normalizeReflectOutput(demoReflection(req), req);

  const response = await client.beta.messages.parse(
    {
      model: MODEL,
      max_tokens: 16000,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(ReflectOutputSchema) },
      system: REFLECT_SYSTEM,
      messages: [{ role: "user", content: renderRequest(req) }],
    },
    { signal },
  );
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    return normalizeReflectOutput(demoReflection(req), req);
  }
  return normalizeReflectOutput(response.parsed_output, req);
}

/** Heuristic reflection for demo mode (and as a last-resort fallback). */
export function demoReflection(req: ReflectRequest): ReflectOutput {
  const userTurns = req.transcript.filter((t) => t.role === "user" && t.content !== SESSION_START).map((t) => t.content);
  const themes = [...new Set(userTurns.flatMap((t) => demoAnalysis(t).themes))].slice(0, 3);
  const quotes = [...userTurns].sort((a, b) => b.length - a.length).slice(0, 2).map((q) => q.split(/(?<=[.!?])\s/)[0]);
  const title = themes.length ? `Talking through ${themes.slice(0, 2).join(" and ")}` : "Checking in with yourself";
  const known = new Set(req.memories.map((m) => m.fact));
  return {
    reflection: {
      title,
      quotes,
      insight: "You took time to put this into words, and that matters. Noticing what you're carrying is often the first step to setting some of it down.",
      nextStep: "Take five slow breaths before bed tonight",
      themes,
    },
    memory: {
      add: themes
        .map((t) => ({ fact: `You've been talking about ${t}`, category: "situation" as const }))
        .filter((m) => !known.has(m.fact)),
      update: [],
      remove: [],
    },
    clientSummary: req.memoryEnabled
      ? `You've been talking about ${themes.join(", ") || "how you're doing"}.`
      : null,
  };
}
