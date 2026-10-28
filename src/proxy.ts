import { NextResponse, type NextRequest } from "next/server";
import { RETURNING_COOKIE } from "@/lib/returning";

/** Returning visitors skip the landing page and go straight to their Home. */
export function proxy(request: NextRequest) {
  // The matcher already limits this to "/" with the cookie; checked again so it can never loop.
  if (request.nextUrl.pathname !== "/" || !request.cookies.has(RETURNING_COOKIE)) return NextResponse.next();
  return NextResponse.redirect(new URL("/home", request.url));
}

export const config = {
  // Literal values: Next.js reads this at build time. Keep the key in sync with RETURNING_COOKIE.
  matcher: [{ source: "/", has: [{ type: "cookie", key: "haven_returning" }] }],
};
