# `@animflow-dsl/authoring`

Typed source-authoring transactions for AnimFlow 2.1. The package keeps `.animflow` source canonical, applies CST-local patches, recompiles every candidate, and retains the last valid immutable `RenderPlan` for stale-preview use.

```ts
import { AuthoringSession } from "@animflow-dsl/authoring";

const session = await AuthoringSession.create(source);
await session.select("requestScene");

const result = await session.execute({
  type: "action.add",
  baseRevision: session.state.documentRevision,
  sceneId: "requestScene",
  actionId: "focusApi",
  action: {
    kind: "highlight",
    target: "api",
    tone: "accent",
    effect: "pulse",
  },
});

if (result.status === "rejected") {
  console.error(result.reason, result.diagnostics);
}
```

Supported commands are `source.replace`, scene add/move/remove, action add/update/remove, and scene narration set/remove. Actions cover show, hide, draw, highlight, clear-highlight, camera, sequence, and stagger. Nested action insertion uses `parentActionId`.

Every command carries `baseRevision`. A stale revision returns `AF710` without mutation. Semantic commands return `applied-valid` or reject atomically; `source.replace` may return `applied-invalid-draft`. `undo()` and `redo()` create new monotonically increasing revisions and transaction IDs rather than rewinding counters.

Selection is stored by scene or action ID and remapped to a fresh source range after each valid source transition. Invalid drafts clear an unresolved selection but preserve the last valid plan and its revision.
