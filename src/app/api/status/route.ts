import { connection } from "next/server";

/** Which services are configured. The UI uses this to label demo mode. */
export async function GET() {
  await connection(); // read env at request time, not build time
  return Response.json({
    claude: Boolean(process.env.ANTHROPIC_API_KEY),
    voice: Boolean(process.env.ELEVENLABS_API_KEY),
    accounts: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  });
}
