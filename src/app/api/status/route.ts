import { connection } from "next/server";
import { checkGemini, hasGemini } from "@/lib/llm/gemini";
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
  if (new URL(request.url).searchParams.get("check") === "ai" && status.ai === "gemini") {
    if (!rateLimit(`status-check:${clientKey(request)}`, { capacity: 5, refillPerMinute: 2 })) {
      return Response.json({ ...status, check: { ok: false, error: "Checked too often. Try again in a minute." } });
    }
    return Response.json({ ...status, check: await checkGemini() });
  }
  return Response.json(status);
}
