# AnimFlow public deployment

AnimFlow Studio is local-first. Anonymous publishing is disabled until the operator configures durable storage and an abuse contact.

## Required environment

```dotenv
ANIMFLOW_PUBLISH_STORAGE_DIR=/srv/animflow-publish
ANIMFLOW_ABUSE_CONTACT=abuse@example.com
ANIMFLOW_RATE_LIMIT_PEPPER=replace-with-a-random-secret
ANIMFLOW_TRUST_PROXY_HEADERS=false
```

- `ANIMFLOW_PUBLISH_STORAGE_DIR` must be a private persistent volume writable by one or more Node processes. Do not use Vercel's ephemeral filesystem.
- Set `ANIMFLOW_TRUST_PROXY_HEADERS=true` only when the deployment is behind a trusted proxy that removes client-supplied `X-Forwarded-For` and writes the verified address itself. Otherwise all anonymous clients deliberately share one conservative quota bucket.
- `ANIMFLOW_RATE_LIMIT_PEPPER` prevents offline comparison of stored client-address hashes. Rotating it resets the effective buckets.
- `ANIMFLOW_ABUSE_CONTACT` is required in production and appears on the report page.
- `ANIMFLOW_COMPILE_WORKER_PATH` is optional. Set it to the absolute path of `packages/publish/dist/compile-worker.bundle.js` when the deployment layout differs from the monorepo layout.

Build and start with Node 22 and pnpm 9.15.0:

```sh
corepack pnpm@9.15.0 install --frozen-lockfile
corepack pnpm@9.15.0 build
corepack pnpm@9.15.0 --filter web start
```

Run a single application instance per local volume, or mount a filesystem that gives every instance atomic hard-link and exclusive-file-create semantics. Rate buckets use short-lived lock files on that same volume.

## Retention and deletion

Revisions expire after 30 days by default. Expired records are removed when fetched and opportunistically after later publishes. Schedule a daily request or operator cleanup if a deployment can go longer than 30 days without publishing.

The publish response returns a deletion token exactly once. Only its SHA-256 digest is stored. A holder deletes the revision with:

```sh
curl -X DELETE -H "Authorization: Bearer $DELETION_TOKEN" \
  https://example.com/api/publish/$REVISION_ID
```

## Abuse and takedown

1. Confirm the report contains a revision ID; never ask the reporter to send credentials or private draft source.
2. Preserve the report and integrity hash in the operator's case system.
3. Inspect the private revision record without executing its source.
4. Remove a violating record from `revisions/<revision-id>.json` through the operator's recoverable storage workflow.
5. Record the action and notify the reporter according to the deployment's policy.

Rejected oversized, malformed, and rate-limited requests log only an event name, shortened one-way client hash, error code, and status. Full source is not logged.

## Security contract

- Source: 256 KiB; artifact: 2 MiB; compiler caps: 100 nodes, 150 edges, 30 scenes, 600 actions, nesting depth 32.
- Server compile: two active jobs, 50 queued jobs, two-second hard timeout; timed-out/crashed workers are terminated.
- Anonymous publish: 10 requests/minute and 100 documents/day per client hash, plus 100/day per document ID.
- Public pages use a nonce-based CSP with no object, frame ancestor, worker, remote connection, form action, raw HTML, or source compilation.
- The viewer verifies the canonical SHA-256 and compatible runtime/render-plan version. It never recompiles an old revision as a fallback.
