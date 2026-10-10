import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { accountsEnabled, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/** Completes email-link and Google sign-in by exchanging the code for a session cookie. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (!accountsEnabled || !code) return NextResponse.redirect(new URL("/signin?error=1", url.origin));

  const cookieStore = await cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
    },
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/signin?error=1", url.origin));
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
