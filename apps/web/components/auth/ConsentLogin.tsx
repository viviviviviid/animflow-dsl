"use client";

import { useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";

export function ConsentLogin() {
  const auth = useAuth();
  const [error, setError] = useState<string>();

  return (
    <main className="oauth-consent-shell">
      <section className="oauth-consent-card">
        <span className="oauth-consent-kicker">AnimFlow crew access</span>
        <h1>Sign in before connecting your AI client</h1>
        <p>The authorization request stays in this browser. After Google login, you will return here to review exactly what the client can access.</p>
        {error || auth.error ? <p className="oauth-consent-error" role="alert">{error ?? auth.error}</p> : null}
        <button disabled={!auth.configured || auth.loading} onClick={() => void auth.signInWithGoogle().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : String(reason)))} type="button">
          Continue with Google
        </button>
        {!auth.configured ? <small>OAuth is not configured for this deployment.</small> : null}
      </section>
    </main>
  );
}
