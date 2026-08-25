import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getPublicSupabaseConfig } from "@/lib/supabase/config";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });
  const supabaseConfig = getPublicSupabaseConfig();
  if (supabaseConfig) {
    const client = createServerClient(supabaseConfig.url, supabaseConfig.publishableKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          for (const { name, value } of values) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of values) response.cookies.set(name, value, options);
        },
      },
    });
    await client.auth.getClaims();
  }

  if (!request.nextUrl.pathname.startsWith("/p/")) return response;
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = [
    "default-src 'none'",
    `script-src 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self'",
    "connect-src 'none'",
    "worker-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join("; ");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", csp);
  requestHeaders.set("x-nonce", nonce);
  const secureResponse = NextResponse.next({ request: { headers: requestHeaders } });
  for (const cookie of response.cookies.getAll()) secureResponse.cookies.set(cookie);
  secureResponse.headers.set("Content-Security-Policy", csp);
  secureResponse.headers.set("Referrer-Policy", "no-referrer");
  secureResponse.headers.set("X-Content-Type-Options", "nosniff");
  secureResponse.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return secureResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
