import { connection } from "next/server";
import type { CompanionContext } from "@/lib/conversation/protocol";
import { analyzeLatest } from "@/lib/llm/analyze";
import { streamReply } from "@/lib/llm/converse";
import { checkGemini, hasGemini } from "@/lib/llm/gemini";
import { SESSION_START } from "@/lib/prompts/companion";

/** A real conversation turn (greeting, then a reply with analysis) on a fixed test message. */
async function checkChat() {
  const ctx: CompanionContext = {
    displayName: null,
    memoryEnabled: true,
    clientSummary: null,
    memories: [],
    recentReflections: [],
    sessionCount: 0,
    mode: "text",
    localTime: new Date().toString(),
    supportStyle: null,
  };
  const step = async (name: string, run: () => Promise<string>) => {
    const t = Date.now();
    try {
      const text = await run();
      return { step: name, ok: text.length > 0, ms: Date.now() - t, chars: text.length, sample: text.slice(0, 120) };
    } catch (error) {
      return { step: name, ok: false, ms: Date.now() - t, error: error instanceof Error ? error.message : String(error) };
    }
  };
  const collect = async (history: { role: "user" | "assistant"; content: string }[]) => {
    let out = "";
    for await (const t of streamReply(history, ctx)) out += t;
    return out;
  };
  const greeting = await step("greeting", () => collect([{ role: "user", content: SESSION_START }]));
  const history = [
    { role: "user" as const, content: SESSION_START },
    { role: "assistant" as const, content: greeting.sample || "Hi. What's on your mind today?" },
    { role: "user" as const, content: "Work has been stressful this week." },
  ];
  const reply = await step("reply", () => collect(history));
  const analysis = await step("analysis", async () => JSON.stringify(await analyzeLatest(history)));
  return { ok: greeting.ok && reply.ok, steps: [greeting, reply, analysis] };
}
import { clientKey, rateLimit } from "@/lib/server/rateLimit";

/**
 * Which services are configured. The UI uses this to label demo mode.
 * `/api/status?check=ai` also makes one tiny request to the AI provider and reports what it said,
 * so a failing key or model can be diagnosed from a browser.
 */
export async function GET(request: Request) {
  await connection(); // read env at request time, not build time
  const claude = Boolean(process.env.ANTHROPIC_API_KEY);
  const status = {
    claude: claude || hasGemini(),
    ai: claude ? "claude" : hasGemini() ? "gemini" : "demo",
    voice: Boolean(process.env.ELEVENLABS_API_KEY),
    accounts: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };
  const check = new URL(request.url).searchParams.get("check");
  if (check === "chat" && status.ai !== "demo") {
    if (!rateLimit(`status-check:${clientKey(request)}`, { capacity: 5, refillPerMinute: 2 })) {
      return Response.json({ ...status, check: { ok: false, error: "Checked too often. Try again in a minute." } });
    }
    return Response.json({ ...status, check: await checkChat() });
  }
  if (check === "ai" && status.ai === "gemini") {
    if (!rateLimit(`status-check:${clientKey(request)}`, { capacity: 5, refillPerMinute: 2 })) {
      return Response.json({ ...status, check: { ok: false, error: "Checked too often. Try again in a minute." } });
    }
    return Response.json({ ...status, check: await checkGemini() });
  }
  return Response.json(status);
}
