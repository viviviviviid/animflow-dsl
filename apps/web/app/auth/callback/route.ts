import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next") ?? "/";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/";

  if (!code) {
    return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent("Missing authorization code.")}`, requestUrl.origin));
  }

  const client = createSupabaseServerClient();
  if (!client) {
    return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent("Cloud login is not configured.")}`, requestUrl.origin));
  }

  const { error } = await client.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(error.message)}`, requestUrl.origin));
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
