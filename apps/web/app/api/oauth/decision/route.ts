import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Cross-site authorization decisions are not allowed." }, { status: 403 });
  }
  const form = await request.formData();
  const authorizationId = form.get("authorization_id");
  const decision = form.get("decision");
  if (typeof authorizationId !== "string" || !authorizationId) {
    return NextResponse.json({ error: "Missing authorization_id." }, { status: 400 });
  }
  if (decision !== "approve" && decision !== "deny") {
    return NextResponse.json({ error: "Invalid authorization decision." }, { status: 400 });
  }

  const client = createSupabaseServerClient();
  if (!client) return NextResponse.json({ error: "OAuth is not configured." }, { status: 503 });
  const result = decision === "approve"
    ? await client.auth.oauth.approveAuthorization(authorizationId)
    : await client.auth.oauth.denyAuthorization(authorizationId);
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
  return NextResponse.redirect(result.data.redirect_url, 303);
}
