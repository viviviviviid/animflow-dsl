# AnimFlow DSL v2 Reference

AnimFlow v2 is a closed, typed language. A valid document compiles completely; invalid source returns diagnostics and no partial render plan.

## Document shape

Every document contains exactly one version declaration, canvas, one or more graphs, zero or more overlays, and one story in that order.

```animflow
animflow 2

canvas {
  size 1600 by 900
  theme signalDesk
  background surface
}

graph paymentFlow {
  layout flow right {
    nodeGap 52
    rankGap 110
    routing orthogonal
  }

  node client "Client" {
    shape rounded
    tone primary
  }

  node bank "Issuing Bank" {
    shape database
    tone success
  }

  edge authorize: client.e -> bank.w {
    label "Authorize"
    line solid 2
    arrow end
    tone primary
    routing orthogonal
    flow particles
  }
}

overlay decision: callout {
  anchor bank.s
  text "The bank returns an approval decision."
  width 320
  tone success
}

story paymentStory {
  initial {
    hide paymentFlow.*
    hide decision
    camera fit(paymentFlow) padding 72
  }

  scene reveal "Reveal the actors" duration 1600ms {
    sequence {
      show client via slide(from: left, distance: 56)
      show bank via pop
    }
    say "The actors are revealed on one compiled clock."
  }

  scene authorizeScene "Authorize payment" duration 1400ms {
    show authorize via fade
    draw authorize via trace flow particles
    highlight bank tone success effect pulse
    show decision via pop
    say "Seeking this scene produces the same state as playback."
  }
}
```

Whitespace is insignificant. Strings use double quotes and JSON-style escapes. Comments use `//` or `/* ... */`; `#` comments are not valid.

## Identifiers, references, and colors

Identifiers match `[_a-zA-Z][\w_]*`, are case-sensitive, and must be unique document-wide across graphs, nodes, edges, overlays, the story, and scenes. Language keywords cannot be used as identifiers.

All animation targets are linked references. Unknown or wrong-kind references fail compilation instead of being skipped at runtime.

Tone values are identifiers:

- Built-ins: `surface`, `neutral`, `primary`, `accent`, `info`, `success`, `warning`, `danger`.
- Literal RGB: `hex_2F6FED`.
- Literal RGBA: `hex_2F6FEDCC`.
- Any other identifier is converted to a deterministic color.

`theme` names the resolved theme but does not load remote assets or arbitrary CSS.

## Canvas

All three properties are required exactly once.

```animflow
canvas {
  size 1600 by 900
  theme signalDesk
  background surface
}
```

Width and height must be greater than zero. Canvas size uses `by`, not `x` or `×`.

## Graphs and layout

Each graph requires one flow layout.

```animflow
graph checkout {
  layout flow right {
    nodeGap 48
    rankGap 96
    routing orthogonal
  }
  // nodes and edges
}
```

| Setting | Values | Constraint |
|---|---|---|
| direction | `right`, `left`, `down`, `up` | required |
| `nodeGap` | number | zero or greater |
| `rankGap` | number | zero or greater |
| `routing` | `straight`, `orthogonal`, `curve` | graph default |

Each setting may appear at most once. Geometry is compiled before playback and does not depend on DOM measurement.

## Nodes

```animflow
node api "Order API" {
  shape rounded
  tone primary
}
```

Both properties are optional and may appear at most once.

Shapes: `rectangle`, `rounded`, `pill`, `diamond`, `circle`, `database`, `document`, `parallelogram`.

Defaults: `shape rounded`, `tone neutral`.

## Edges

Edges have explicit IDs and endpoint ports. Both endpoint nodes must belong to the same graph as the edge.

```animflow
edge request: client.e -> api.w {
  label "POST /orders"
  line dashed 2
  arrow end
  tone primary
  routing curve
  flow particles
}
```

| Property | Values | Default |
|---|---|---|
| port | `auto`, `n`, `e`, `s`, `w` | required on each endpoint |
| `label` | string | none |
| `line` | `solid`, `dashed`, `dotted` plus positive width | `solid 2` |
| `arrow` | `none`, `start`, `end`, `both` | `end` |
| `tone` | tone identifier | `neutral` |
| `routing` | `straight`, `orthogonal`, `curve` | graph routing, then `orthogonal` |
| `flow` | `none`, `particles`, `dash`, `glow`, `wave`, `arrow`, `lightning` | `none` |

`draw edgeId via trace flow effect` can override the compiled flow effect for that scene. Parallel edges remain independently targetable because animation refers to edge IDs, never `A->B` endpoint strings.

## Overlays

Overlays are typed canvas elements, not arbitrary HTML.

```animflow
overlay retryNote: callout {
  anchor api.n
  text "Retry after 500 ms"
  width 260
  tone danger
}
```

Kinds: `callout`, `card`, `badge`, `text`.

`anchor` and `text` are required exactly once. `width` must be positive. `width` and `tone` are optional and may appear at most once.

## Story and initial state

One story is required. It contains one explicit `initial` block and at least one scene.

```animflow
story main {
  initial {
    hide checkout.*
    show retryNote
    camera fit(checkout) padding 64
  }

  scene intro "Introduction" duration 1.2s {
    show checkout.* via fade
  }
}
```

Initial state supports `show`, `hide`, and camera statements without transitions. A graph target requires `.*` except when a plain graph is used by `camera fit`.

Durations require `ms` or `s`, for example `800ms`, `1.2s`. Scene duration must be greater than zero.

## Targets

| Form | Meaning |
|---|---|
| `api` | one node, edge, or overlay |
| `[client, api, request]` | explicit element list |
| `checkout.*` | every node and edge in a graph |
| `checkout` | graph itself; only valid for `camera fit` |

Only graphs support `.*`. `camera focus` requires exactly one element, not a graph or multi-target list.

## Scene statements

### Visibility

```animflow
show api via fade
hide [client, request] via pop
show retryNote via slide(from: up, distance: 24)
show api via flip
```

Transitions:

- `fade`
- `pop`
- `flip`
- `slide(from: left|right|up|down)`
- `slide(from: left|right|up|down, distance: NUMBER)`

Slide distance defaults to 48 and cannot be negative.

### Edge drawing

```animflow
draw request via trace
draw request via trace flow particles
```

Only an edge ID is accepted. Draw progress and flow phase are sampled state, independent from dashed line styling.

### Highlight

```animflow
highlight api tone success
highlight api tone danger effect glow
highlight api tone warning effect pulse
clearHighlight api
```

Highlight effects are `glow` and `pulse`. Clearing a highlight is an explicit state transition.

### Camera

```animflow
camera fit(checkout) padding 64
camera fit([client, api]) padding 80
camera focus(api) padding 96
```

Padding defaults to 40 and cannot be negative. Camera is part of `FrameState`; the host and renderer do not maintain a second viewBox state.

### Narration

```animflow
say "The request reaches the API."
```

Narration is scene-scoped. `say` must be a direct scene statement and cannot be nested inside `sequence` or `stagger`. A scene should contain at most one narration write.

## Timing and conflict rules

Scenes run sequentially in declaration order. Top-level statements inside one scene run in parallel across the full scene duration.

```animflow
scene example "Timing" duration 1200ms {
  // These begin together and each receives 1200 ms.
  show api via fade
  draw request via trace

  // Children receive equal consecutive slices of 600 ms.
  sequence {
    highlight client tone primary
    highlight api tone success
  }
}
```

`stagger` starts each child after the stated interval. Every child receives `scene duration - interval × (child count - 1)`, clamped at zero, so their executions overlap.

```animflow
scene reveal "Reveal" duration 1400ms {
  stagger 200ms {
    show client via pop
    show api via pop
    show db via pop
  }
}
```

Two parallel top-level statements cannot write the same property of the same element. This is diagnostic `AF422`. Put intentional repeated writes inside one `sequence` block. A `sequence` or `stagger` block counts as one top-level writer for conflict detection.

## Diagnostics

Compilation returns either a complete immutable `RenderPlan` or diagnostics. Every diagnostic includes a stable code, severity, message, and source range.

| Namespace | Meaning |
|---|---|
| `AF1xx` | syntax and token errors |
| `AF2xx` | duplicate IDs, symbols, and references |
| `AF3xx` | version, targets, properties, and numeric constraints |
| `AF4xx` | narration and conflicting scene writes |
| `AF5xx` | compiler, layout, and geometry |
| `AF6xx` | v1 migration |
| `AF7xx` | reserved plugin contracts |

The editor uses the same Langium grammar and validation rules as compilation, so Monaco markers match compiler failures.

## Runtime contract

```ts
const compiled = await compileAnimFlow(source);
if (!compiled.ok) return compiled.diagnostics;

const plan = compiled.value;       // deeply frozen RenderPlan
const frame = sample(plan, 750);   // deeply frozen FrameState
```

`sample` clamps time to `0..plan.durationMs`. The same plan and timestamp produce the same state whether reached by direct seek, forward playback, backward seek, or restart.

## Migrating v1

Use `migrateV1ToV2(v1Source)` from `@animflow-dsl/migrate`. It parses the frozen Mermaid-extension format, creates explicit edge IDs and named scenes, attaches narration, and returns a manifest plus diagnostics. It never runs v1 syntax through the v2 runtime.

The previous syntax and player are documented in the [v1 legacy guide](dsl-guide-v1.md) and remain available in the demo at `/legacy`.
