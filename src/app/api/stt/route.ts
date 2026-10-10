import { clientKey, rateLimit } from "@/lib/server/rateLimit";

const MAX_BYTES = 10 * 1024 * 1024;

/** Transcribes one utterance with ElevenLabs Scribe. */
export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return Response.json({ error: "Voice is not configured" }, { status: 503 });
  if (!rateLimit(`stt:${clientKey(request)}`, { capacity: 60, refillPerMinute: 40 })) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob) || file.size === 0 || file.size > MAX_BYTES) {
    return Response.json({ error: "Invalid audio" }, { status: 400 });
  }

  const upstreamForm = new FormData();
  upstreamForm.append("file", file, "utterance.webm");
  upstreamForm.append("model_id", process.env.ELEVENLABS_STT_MODEL ?? "scribe_v2");
  upstreamForm.append("tag_audio_events", "false");
  const upstream = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: upstreamForm,
    signal: request.signal,
  });
  if (!upstream.ok) {
    console.error("elevenlabs stt failed", upstream.status, await upstream.text().catch(() => ""));
    return Response.json({ error: "Transcription failed" }, { status: 502 });
  }
  const data = (await upstream.json()) as { text?: string };
  return Response.json({ text: data.text ?? "" });
}
