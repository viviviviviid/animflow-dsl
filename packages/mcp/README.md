# @animflow-dsl/mcp

Authenticated MCP tools for private AnimFlow Studio projects. The package exposes a server factory; hosts provide a repository whose authorization is enforced by their identity layer. AnimFlow Studio uses Supabase OAuth 2.1 and row-level security.

The write tool uses an optimistic cloud version independent from the editor's local document revision. Agents must read a project first and pass its `version` as `expectedVersion`; a stale update is rejected instead of overwriting a human edit.

`animflow_inspect_source` compiles a complete candidate without saving it and reports geometry collisions, hidden-edge regressions, narration pacing, and per-scene narration cues. The cue manifest gives TTS-capable clients stable `sceneId`, `startMs`, and `durationMs` values for one audio file per caption; audio storage and synthesis remain host responsibilities.
