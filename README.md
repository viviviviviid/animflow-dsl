# AnimFlow DSL

AnimFlow is a typed scene language for deterministic animated diagrams. Source is compiled once into an immutable `RenderPlan`; any timestamp is then sampled into a complete `FrameState` and rendered as SVG.

The default demo and editor use v2. The original Mermaid-extension player remains available at `/legacy` while consumers migrate.

## Why v2

- Invalid IDs, references, properties, units, targets, and conflicting scene writes fail before rendering.
- Nodes, edges, overlays, camera, and narration share one compiled timeline.
- Every edge has its own ID, ports, route, arrow placement, line style, and flow effect.
- `sample(plan, timeMs)` is pure, so direct seek and linear playback return the same frame.
- The renderer receives only immutable geometry and sampled state. It does not parse source, query semantic DOM targets, or run a second animation timeline.

## Quick start

The v2 workspace packages are currently private and intended for use inside this monorepo.

```animflow
animflow 2

canvas {
  size 1600 by 900
  theme signalDesk
  background surface
}

graph checkout {
  layout flow right {
    nodeGap 52
    rankGap 110
    routing orthogonal
  }

  node client "Client" {
    shape rounded
    tone primary
  }

  node api "Order API" {
    shape rounded
    tone hex_7457D9
  }

  edge request: client.e -> api.w {
    label "POST /orders"
    line solid 2
    arrow end
    tone primary
    flow particles
  }
}

story main {
  initial {
    hide checkout.*
    camera fit(checkout) padding 64
  }

  scene requestScene "Send request" duration 1200ms {
    show [client, api] via fade
    draw request via trace flow particles
    highlight api tone success effect pulse
    say "The client sends an order request."
  }
}
```

Compile and sample it:

```tsx
import { compileAnimFlow } from "@animflow-dsl/compiler";
import { AnimFlowCanvas } from "@animflow-dsl/react-v2";
import { sample } from "@animflow-dsl/runtime";

const result = await compileAnimFlow(source);

if (!result.ok) {
  console.error(result.diagnostics);
} else {
  const frame = sample(result.value, 750);
  const canvas = <AnimFlowCanvas plan={result.value} frame={frame} />;
}
```

For live playback, the host owns the clock and calls `PlaybackController.tick(deltaMs)`. `PlaybackControls` is a controlled component; it never owns or mutates animation state.

## Pipeline

```text
AnimFlow source
  -> Langium AST, references, diagnostics
  -> deterministic layout, geometry, snapshots, tracks
  -> immutable RenderPlan
  -> sample(plan, timeMs)
  -> complete FrameState
  -> pure React/SVG render
```

| Package | Responsibility |
|---|---|
| `@animflow-dsl/model` | IDs, diagnostics, elements, geometry, `RenderPlan`, `FrameState` |
| `@animflow-dsl/language` | Grammar, generated AST, linking, validation, Monaco tokens |
| `@animflow-dsl/compiler` | Deterministic lowering, themes, layout, routes, animation tracks |
| `@animflow-dsl/runtime` | Pure sampling and explicit playback state machine |
| `@animflow-dsl/react-v2` | SVG renderer and controlled playback controls |
| `@animflow-dsl/migrate` | Frozen v1 migration, v2→v2.1 migration, and strict Mermaid flowchart import |
| `@animflow-dsl/cli` | Stable validate, format, compile, migrate, import, version, and capabilities commands |
| `@animflow-dsl/authoring` | Revision-checked CST patches, transactions, selection mapping, and exact undo/redo |
| `@animflow-dsl/react` | Legacy Mermaid-extension runtime used by `/legacy` and migration only |

## CLI and AI authoring

Build the workspace, then use the Node CLI directly or through its installed `animflow` bin:

```bash
pnpm build
node packages/cli/dist/bin.js validate lesson.animflow --json
node packages/cli/dist/bin.js format lesson.animflow --write
node packages/cli/dist/bin.js compile lesson.animflow --out lesson.render-plan.json
node packages/cli/dist/bin.js import-mermaid graph.mmd --out lesson.animflow
```

Machine output uses the versioned schema at `packages/cli/schema/report.schema.json`. The repository Agent Skill is at `skills/animflow-authoring`; its examples and 10-prompt semantic eval use the same CLI and compiler.

## Authoring commands

Studio integrations mutate canonical AnimFlow 2.1 source through the typed authoring session instead of editing source with application-owned regular expressions:

```ts
import { AuthoringSession } from "@animflow-dsl/authoring";

const session = await AuthoringSession.create(source);
const result = await session.execute({
  type: "action.update",
  baseRevision: session.state.documentRevision,
  actionId: "focusApi",
  replacement: {
    kind: "highlight",
    target: "api",
    tone: "accent",
    effect: "pulse",
  },
});
```

Semantic commands are atomic and require a valid 2.1 document. `source.replace` alone may store an invalid draft while retaining the last valid immutable plan. Undo and redo restore exact source snapshots with monotonic revisions.

## Migration

```ts
import { compileAnimFlow } from "@animflow-dsl/compiler";
import { migrateV1ToV2 } from "@animflow-dsl/migrate";

const migrated = await migrateV1ToV2(v1Source);
if (!migrated.ok) throw new Error(migrated.diagnostics[0].message);

const compiled = await compileAnimFlow(migrated.value.source);
```

Migration returns generated source, source-ranged diagnostics, a step-to-scene manifest, and host-only v1 playback configuration. The repository contract covers all 11 legacy templates, 268 animation steps, and 92 narration entries without silent loss.

## Development

Requirements: Node.js 18+, pnpm 9+.

```bash
pnpm install
pnpm verify
pnpm eval:skill
pnpm --filter web dev
```

Open [http://localhost:3000](http://localhost:3000) for v2 and [http://localhost:3000/legacy](http://localhost:3000/legacy) for v1.

## Documentation

- [v2 DSL reference](docs/dsl-guide.md)
- [v1 legacy guide](docs/dsl-guide-v1.md)
- [architecture and implementation contract](docs/animflow-dsl-v2-implementation-plan.md)
- [authoring platform design and phase gates](docs/designs/animflow-authoring-platform.md)
- [AnimFlow Agent Skill](skills/animflow-authoring/SKILL.md)
- [contribution guide](CONTRIBUTING.md)
- [legacy React SDK API](packages/react/README.md)

## License

MIT
