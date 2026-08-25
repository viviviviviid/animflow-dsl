# Authenticated MCP workflow

Use this path only when the host exposes the `animflow_*` tools and the user has approved OAuth access.

1. Call `animflow_capabilities` once. Do not invent tools that are not listed.
2. Call `animflow_list_projects`. Ask the user to choose only when the target cannot be inferred from the request.
3. Call `animflow_get_project` before editing. Preserve its stable IDs, comments, and concepts.
4. Work on the complete source locally and run the packaged CLI validation/format/compile loop. MCP is transport and authorization, not a substitute for deterministic compilation.
5. Call `animflow_inspect_source` with the candidate. Resolve every error and every narration/layout warning before saving. Its `narrationCues` are the canonical scene timing manifest for a TTS-capable host; bind audio by `sceneId`, never by scene order.
6. Call `animflow_get_project` again just before saving. If its `version` changed, reconcile the newer source instead of overwriting it.
7. Call `animflow_put_project` with the complete source and `expectedVersion` from that last read.
8. If the server returns a version conflict, return to step 3. Never increment or guess a version.

The MCP token is user-scoped. Never request, print, persist, or ask the user to paste access or refresh tokens. OAuth scopes identify the user; Supabase row-level security enforces project ownership.
