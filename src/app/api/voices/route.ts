import { connection } from "next/server";

/**
 * Voices offered in Settings. Configure with ELEVENLABS_VOICES="id:Name,id:Name".
 * Empty when voice isn't configured.
 */
export async function GET() {
  await connection();
  if (!process.env.ELEVENLABS_API_KEY) return Response.json({ voices: [] });
  const voices = (process.env.ELEVENLABS_VOICES ?? "")
    .split(",")
    .map((v) => v.trim().split(":"))
    .filter(([id, name]) => id && name)
    .map(([id, name]) => ({ id, name }));
  return Response.json({ voices });
}
