# Vercel + Supabase deployment readiness

Date: 2026-08-24

Result: implementation and local deployment gates passed; live Preview provisioning remains external.

## Architecture delivered

- Vercel serves Studio, Presenter, immutable public pages, and Node publish Functions.
- `SupabasePublishStore` keeps artifacts, deletion-token hashes, rate limits, and expiry state behind server-only PostgREST calls.
- The browser has no Supabase client or key and cannot access the revision or quota tables.
- The Supabase migration enables RLS, revokes public roles, prevents revision updates, serializes quota increments with row locks, and exposes only service-role RPCs.
- Supabase Cron performs daily retention cleanup; public reads also delete expired revisions.
- Next.js emits the isolated compiler as a traced Function asset and resolves it to a local worker-thread file at runtime.

## Verification evidence

| Gate | Result |
| --- | --- |
| Root `test → build → lint` | Passed across all 13 workspace packages |
| Publish unit/integration | 13/13 passed, including Supabase REST request and failure contracts |
| PostgreSQL migration | Applied to a fresh temporary PostgreSQL instance |
| RLS and privileges | `anon`/`authenticated` denied; `service_role` denied private schema and update access |
| Immutable revision | Primary-key duplicate and update paths rejected |
| Atomic quota | Sequential boundary passed; 20 concurrent calls allowed exactly 10 |
| Retention | Expired revisions and stale quota rows removed |
| Server compiler asset | One traced 780,674-byte worker asset found in the publish Function |
| Production route smoke | Local Next.js production publish, public playback, and token deletion passed |
| Product E2E | 36/36 passed in Chromium, Firefox, and WebKit, including post-delete playback stop |
| Secret scan | No real Supabase secret found; only documented placeholders |
| CI supply chain | All GitHub Actions remain pinned to immutable commit SHAs |

## Live boundary

The Vercel CLI is authenticated, but no AnimFlow Vercel project exists. No Supabase access token, project reference, URL, or secret key is available in the workspace. Creating the external project requires a region/plan choice, and production promotion requires explicit approval. Therefore this change does not claim a live URL or production deployment.
