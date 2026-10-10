import { z } from "zod";
import { clientKey, rateLimit } from "@/lib/server/rateLimit";

const Body = z.object({ text: z.string().min(1).max(1200), voiceId: z.string().regex(/^[A-Za-z0-9]{10,40}$/).optional() });

/** Proxies ElevenLabs streaming text-to-speech so the API key stays on the server. */
export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return Response.json({ error: "Voice is not configured" }, { status: 503 });
  if (!rateLimit(`tts:${clientKey(request)}`, { capacity: 120, refillPerMinute: 90 })) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  const voiceId = parsed.data.voiceId ?? process.env.ELEVENLABS_VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb";
  const model = process.env.ELEVENLABS_TTS_MODEL ?? "eleven_flash_v2_5";
  const upstream = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_64`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text: parsed.data.text,
        model_id: model,
        voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.15, speed: 0.95 },
      }),
      signal: request.signal,
    },
  );
  if (!upstream.ok || !upstream.body) {
    console.error("elevenlabs tts failed", upstream.status, await upstream.text().catch(() => ""));
    return Response.json({ error: "Speech failed" }, { status: 502 });
  }
  return new Response(upstream.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
}
