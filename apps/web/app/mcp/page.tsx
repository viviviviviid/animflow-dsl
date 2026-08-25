import Link from "next/link";

import { getPublicSupabaseConfig } from "@/lib/supabase/config";

export default function McpConnectionPage() {
  const config = getPublicSupabaseConfig();
  const authorizationServer = config ? `${config.url.replace(/\/$/, "")}/auth/v1` : "Not configured";
  return (
    <main className="mcp-guide-shell">
      <section className="mcp-guide-card">
        <span className="oauth-consent-kicker">AI crew connection</span>
        <h1>Connect an MCP client to AnimFlow</h1>
        <p>OAuth keeps passwords and long-lived API keys out of the client. The AI receives a revocable user token, and Supabase RLS limits every tool call to your own projects.</p>
        <ol>
          <li><span>01</span><div><strong>Sign in to Studio</strong><p>Use the Cloud button in the top bar and continue with Google.</p></div></li>
          <li><span>02</span><div><strong>Add the remote MCP URL</strong><code>{"${origin}/api/mcp"}</code></div></li>
          <li><span>03</span><div><strong>Complete OAuth in your browser</strong><p>Review the requesting client and approve it on AnimFlow's consent screen.</p></div></li>
          <li><span>04</span><div><strong>Let the AI inspect before editing</strong><p>It should call capabilities, list projects, read one project, then write with the returned cloud version.</p></div></li>
        </ol>
        <dl className="oauth-consent-details">
          <div><dt>Authorization server</dt><dd><code>{authorizationServer}</code></dd></div>
          <div><dt>Protected resource metadata</dt><dd><code>/.well-known/oauth-protected-resource/api/mcp</code></dd></div>
        </dl>
        <p className="mcp-guide-note">Project writes use optimistic versions. If a person or another AI edits first, stale writes fail and the client must read again.</p>
        <Link href="/">Return to Studio</Link>
      </section>
    </main>
  );
}
