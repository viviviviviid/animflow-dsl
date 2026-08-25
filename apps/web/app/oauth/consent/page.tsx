import { redirect } from "next/navigation";

import { ConsentLogin } from "@/components/auth/ConsentLogin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OAuthConsentPage({
  searchParams,
}: {
  readonly searchParams: { readonly authorization_id?: string };
}) {
  const authorizationId = searchParams.authorization_id;
  if (!authorizationId) return <ConsentError message="This authorization request is missing its ID." />;

  const client = createSupabaseServerClient();
  if (!client) return <ConsentError message="OAuth is not configured for this deployment." />;

  const { data: claimData } = await client.auth.getClaims();
  if (!claimData?.claims) return <ConsentLogin />;

  const { data: details, error } = await client.auth.oauth.getAuthorizationDetails(authorizationId);
  if (error || !details) return <ConsentError message={error?.message ?? "This authorization request is no longer valid."} />;
  if (!("authorization_id" in details)) redirect(details.redirect_url);

  const scopes = details.scope?.split(" ").filter(Boolean) ?? [];
  return (
    <main className="oauth-consent-shell">
      <section className="oauth-consent-card">
        <span className="oauth-consent-kicker">AnimFlow MCP connection</span>
        <h1>Allow {details.client.name} to direct your lessons?</h1>
        <p>This client will act as you. AnimFlow row-level security limits it to projects owned by your signed-in account.</p>
        <dl className="oauth-consent-details">
          <div><dt>Client</dt><dd>{details.client.name}</dd></div>
          <div><dt>Return address</dt><dd><code>{details.redirect_uri}</code></dd></div>
        </dl>
        <div className="oauth-consent-scope">
          <strong>Requested permissions</strong>
          {scopes.length ? <ul>{scopes.map((scope) => <li key={scope}>{describeScope(scope)}</li>)}</ul> : <p>Use your basic account identity.</p>}
        </div>
        <form action="/api/oauth/decision" method="POST">
          <input name="authorization_id" type="hidden" value={authorizationId} />
          <button name="decision" type="submit" value="deny">Deny</button>
          <button name="decision" type="submit" value="approve">Allow this client</button>
        </form>
        <small>You can revoke this connection later from your Supabase account sessions.</small>
      </section>
    </main>
  );
}

function ConsentError({ message }: { readonly message: string }) {
  return <main className="oauth-consent-shell"><section className="oauth-consent-card"><span className="oauth-consent-kicker">Connection stopped</span><h1>AnimFlow could not review this request</h1><p className="oauth-consent-error" role="alert">{message}</p><a href="/">Return to Studio</a></section></main>;
}

function describeScope(scope: string): string {
  if (scope === "openid") return "Confirm your AnimFlow account identity";
  if (scope === "email") return "Read the email attached to your account";
  if (scope === "profile") return "Read your basic profile";
  return scope;
}
