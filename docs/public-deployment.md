# AnimFlow public deployment

The production topology is Vercel plus Supabase:

```text
Browser
  -> Vercel: Studio, Presenter, Publish API, isolated compiler worker
  -> Supabase Postgres: immutable revisions, deletion-token hashes, quotas, retention
```

The browser never receives a Supabase key or accesses the database directly. Vercel uses a server-only secret key; all public reads and writes continue through the existing AnimFlow routes.

## 1. Provision Supabase

Create a Supabase project in the same geographic region as the Vercel Function whenever possible. Apply [`supabase/migrations/20260824000000_animflow_publish.sql`](../supabase/migrations/20260824000000_animflow_publish.sql) through the Supabase CLI or SQL editor.

The migration creates:

- `public.animflow_published_revisions`, with RLS enabled and no `anon` or `authenticated` grants;
- an immutable-update trigger and create-only primary-key contract;
- private quota state and a transactionally locked `animflow_consume_publish_limit` RPC;
- a service-role-only expiry cleanup RPC.

Create a new `sb_secret_...` key for AnimFlow. Do not use a publishable key and never create a `NEXT_PUBLIC_` variable for it. The legacy `service_role` key is not required.

Enable Supabase Cron (`pg_cron`) in Dashboard > Integrations, then run [`supabase/cron/animflow_cleanup.sql`](../supabase/cron/animflow_cleanup.sql). The job removes expired rows daily at 03:15 UTC. Publishing and reads also perform opportunistic expiry cleanup.

## 2. Configure Vercel

Import the repository and set the project Root Directory to `apps/web`. Keep access to files outside the root enabled because the Next.js app consumes workspace packages. Use Node.js 22 and the repository-pinned pnpm 9.15.0.

Set these encrypted variables for Production and Preview as appropriate:

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=sb_secret_replace_me
ANIMFLOW_ABUSE_CONTACT=abuse@example.com
ANIMFLOW_RATE_LIMIT_PEPPER=replace-with-at-least-32-random-bytes
```

- `SUPABASE_SECRET_KEY` bypasses RLS and must exist only in Vercel server environments.
- `ANIMFLOW_RATE_LIMIT_PEPPER` prevents offline comparison of stored client hashes. Rotating it resets effective quota buckets.
- Vercel supplies a non-spoofable `x-vercel-forwarded-for` address, which AnimFlow hashes before quota use. `ANIMFLOW_TRUST_PROXY_HEADERS` is not needed on Vercel.
- `ANIMFLOW_COMPILE_WORKER_PATH` is not needed. Next.js emits the compiler worker as a traced server asset and the runtime resolves that asset to a local `file:` URL.

The publish route uses the Node.js runtime with a 15-second Function ceiling. Each compile still has its independent two-second timeout, two-worker concurrency cap, and 50-job in-instance queue.

## 3. Verify before production

```sh
corepack pnpm@9.15.0 install --frozen-lockfile
corepack pnpm@9.15.0 verify
corepack pnpm@9.15.0 verify:deployment-bundle
corepack pnpm@9.15.0 test:e2e:studio
```

Use a Vercel Preview deployment first. Verify Studio load, one publish, public playback, deletion with the one-time token, post-delete playback stop, CSP headers, and a malformed/oversized publish rejection. Confirm in Supabase that the stored row contains only the artifact and deletion-token hash and that no raw client address is present.

Promote the already-tested Preview deployment rather than rebuilding a different commit. After promotion, repeat publish/play/delete as a canary and confirm the Cron job appears in Supabase Cron history.

## Retention and deletion

Revisions expire after 30 days. The publish response returns a deletion token exactly once and only its SHA-256 digest is stored. A holder deletes the revision with:

```sh
curl -X DELETE -H "Authorization: Bearer $DELETION_TOKEN" \
  https://example.com/api/publish/$REVISION_ID
```

## Abuse and takedown

1. Confirm the report contains a revision ID; never ask the reporter to send credentials or private draft source.
2. Preserve the report and integrity hash in the operator's case system.
3. Inspect the private revision record without executing its source.
4. Delete a violating row by revision ID through a recoverable operator workflow.
5. Record the action and notify the reporter according to the deployment policy.

Rejected oversized, malformed, and rate-limited requests log only an event name, shortened one-way client hash, error code, and status. Full source and API keys are not logged.

## Security contract

- Source: 256 KiB; artifact: 2 MiB; compiler caps: 100 nodes, 150 edges, 30 scenes, 600 actions, nesting depth 32.
- Server compile: two active jobs, 50 queued jobs, two-second hard timeout; timed-out/crashed workers are terminated.
- Anonymous publish: 10 requests/minute and 100 documents/day per client hash, plus 100/day per document ID.
- Public pages use a nonce-based CSP with no object, frame ancestor, worker, remote connection, form action, raw HTML, or source compilation.
- The viewer verifies canonical SHA-256 and compatible runtime/render-plan versions. It never recompiles an old revision as a fallback.

## Self-hosted fallback

For local development or a single-instance Node deployment, omit the Supabase variables and set `ANIMFLOW_PUBLISH_STORAGE_DIR` to a private persistent filesystem. Never use this fallback on Vercel: its filesystem is read-only except for ephemeral `/tmp` storage.
