# Vercel + Supabase deployment readiness

Date: 2026-08-24

Result: live Vercel + Supabase production deployment passed all release gates.

## Architecture delivered

- Vercel serves Studio, Presenter, immutable public pages, and Node publish Functions.
- `SupabasePublishStore` keeps artifacts, deletion-token hashes, rate limits, and expiry state behind server-only PostgREST calls.
- The browser has no Supabase client or key and cannot access the revision or quota tables.
- The Supabase migrations enable RLS, reduce `service_role` to select/insert/delete, prevent revision updates, serialize quota increments with row locks, and expose only service-role RPCs.
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
| Remote Supabase | Three migrations applied; RLS and least privilege verified against the live project |
| Remote retention | `animflow-expired-revisions` active daily at 03:15 UTC |
| Production canary | Three concurrent publish/delete requests passed; final public E2E passed 36/36 |
| Function locality | Publish and page Functions deployed in Seoul (`icn1`) beside Supabase Seoul |
| Secret scan | No real Supabase secret found; only documented placeholders |
| CI supply chain | All GitHub Actions remain pinned to immutable commit SHAs |

## Live deployment

- Public Studio: <https://animflow-studio.vercel.app>
- Vercel project: `viviviviviids-projects/animflow-studio`
- Supabase project: `ssidzyklloipdzbhciru`, Seoul (`ap-northeast-2`)
- Production deployment: `dpl_3gdxMoR84vGw9VS9DVvJP4jDfVhn`
- Release commit: `d3d81e3`

The first Vercel deployment was automatically assigned to Production because the project had no prior deployment. Live QA found and fixed a stale post-delete read plus a monorepo dependency-build gap. The final deployment rebuilds all workspace dependencies, disables Supabase data caching, and passed the complete cross-browser product suite. One transient 503 occurred during an earlier cold canary and did not recur in three parallel canaries, the focused 9-test publish suite, or the final 36-test suite.
