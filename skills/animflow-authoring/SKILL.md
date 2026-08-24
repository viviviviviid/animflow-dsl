---
name: animflow-authoring
description: Create, repair, validate, and refine native AnimFlow 2.1 lecture diagrams. Use when an AI agent must turn a technical teaching goal or supported Mermaid flowchart into an animated `.animflow` lesson; do not use for general slide decks or unsupported diagram kinds.
---

# AnimFlow Authoring

Produce valid native AnimFlow 2.1 source whose teaching sequence is understandable without hidden editor state.

## Required tool loop

1. Resolve `scripts/run-cli.sh` relative to this `SKILL.md` as `<runner>`, then run `<runner> version --json` and `<runner> capabilities --json` once. The runner selects the packaged, installed, or repository CLI. Stop with the compatibility message from [references/compatibility.md](references/compatibility.md) if source 2.1 or flowchart support is unavailable.
2. Extract the audience level, teaching objective, essential concepts, teaching order, and approximate duration. Ask only when a missing choice changes the technical meaning.
3. Create the smallest useful graph with stable, descriptive IDs. Read [references/language-reference.md](references/language-reference.md) while writing native source.
4. Divide the explanation into teaching beats, then add one primary visual change and concise narration per scene. Read [references/lecture-patterns.md](references/lecture-patterns.md) for sequencing choices.
5. Run `<runner> validate <file> --json`. Repair diagnostics by code and range using [references/diagnostics.md](references/diagnostics.md); never hide or delete a concept merely to silence an error.
6. Run `<runner> format <file> --write`, validate again, then run `<runner> compile <file> --json`. Check scene count, action count, and duration against the request.
7. Return the `.animflow` source or file plus a short scene outline. Report unsupported requests explicitly instead of approximating them.

Use `scripts/validate-example.sh <file>` relative to this `SKILL.md` when validating a single file directly.

## Non-negotiable source rules

- Emit `animflow 2.1`. Every non-`say` scene statement, including nested `sequence` and `stagger`, has a document-unique `action <id>:` prefix.
- IDs are semantic and stable: use names such as `apiGateway`, `traceRequest`, and `cacheMiss`, not coordinates or array indexes.
- IDs must not be language keywords such as `database`, `scene`, or `story`. Scene and action IDs also must not reuse graph, node, edge, overlay, or story IDs; add semantic suffixes such as `databaseStep` or `focusDatabase`.
- Reference only declared nodes, edges, overlays, graphs, scenes, and actions.
- Keep code labels short enough for projection. Put explanation in `say`, not in oversized node labels.
- Use typed properties only. Never emit HTML, CSS, JavaScript, remote URLs, or guessed Mermaid features.
- Preserve user source and comments during repairs. Prefer diagnostic fixes and local edits over rewriting the whole document.
- If `import-mermaid` returns `AFCLI004_CAPABILITY_MISMATCH`, explain the unsupported construct and request or produce a supported flowchart input; do not silently drop it.
- Sibling actions in a scene execute in parallel. When two actions write the same property, such as `clearHighlight gateway` followed by `highlight gateway`, wrap them in an action-ID-bearing `sequence` so the writes are ordered.
- A scene duration must contain its complete action schedule. Budget nested `sequence` and `stagger` delays plus transitions inside the scene; when `AF501 MODEL_TRACK_OUTSIDE_SCENE` appears, lengthen that scene within the requested total duration or simplify its choreography.

## Quality check

Before finishing, confirm that the lesson compiles, narration exists when requested, the first scene establishes context, later scenes introduce one main idea at a time, and the final scene leaves the important state visible. Avoid more than three simultaneous visual changes unless comparison is the explicit teaching goal.
