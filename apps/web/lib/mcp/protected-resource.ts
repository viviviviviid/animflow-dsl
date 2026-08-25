import { getPublicSupabaseConfig } from "@/lib/supabase/config";

export function protectedResourceMetadata(request: Request) {
  const config = getPublicSupabaseConfig();
  if (!config) return Response.json({ error: "OAuth is not configured." }, { status: 503 });
  const origin = new URL(request.url).origin;
  return Response.json({
    resource: `${origin}/api/mcp`,
    authorization_servers: [`${config.url.replace(/\/$/, "")}/auth/v1`],
    bearer_methods_supported: ["header"],
    scopes_supported: ["openid", "email", "profile"],
    resource_documentation: `${origin}/mcp`,
  }, { headers: { "Cache-Control": "public, max-age=300" } });
}
