# AnimFlow DSL v1 Legacy Guide

v1 extends a Mermaid flowchart subset with `@animation`, `@style`, `@narration`, and `@config` blocks. It is retained for migration and the `/legacy` demo; new documents should use [AnimFlow v2](dsl-guide.md).

```text
flowchart LR
  A[Start] --> B[Process]

@animation
  step 1: show A
    effect: fadeIn
    duration: 1s

  step 2: connect A->B
    flow: particles
    speed: 1.5s
@end

@narration
  step 1:
    title: "Start"
    text: "The flow begins."
@end
```

The legacy React API remains documented in [`packages/react/README.md`](../packages/react/README.md). For migration:

```ts
import { migrateV1ToV2 } from "@animflow-dsl/migrate";

const result = await migrateV1ToV2(v1Source);
if (result.ok) {
  console.log(result.value.source);
  console.log(result.value.manifest.stepToScene);
}
```

Migration preserves host-only v1 configuration separately in `hostConfig`. Unsupported or invalid source returns `AF6xx` diagnostics instead of silently omitting behavior.
