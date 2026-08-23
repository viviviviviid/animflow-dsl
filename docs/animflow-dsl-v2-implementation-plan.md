# AnimFlow DSL v2: Pre-Implementation Plan

> **Read this before changing DSL, animation, layout, arrow, camera, or renderer code.**
>
> Status: implemented and cut over to the default demo; explicit v1 legacy route retained
>
> Base branch: `main`
>
> Last updated: 2026-08-23
>
> Scope: replacement of the v1 Mermaid-extension DSL and its runtime pipeline

## Implementation result

Phases 0 through 6 are complete. The default `/` editor now compiles v2 source and renders sampled state; `/legacy` preserves the original player. The six v2 packages implement the boundaries below, and all 11 v1 templates migrate and compile while preserving 268 animation steps and 92 narration entries.

Verified repository gates at cutover:

- 48 tests pass, including 43 v2 model/language/compiler/runtime/renderer/migration tests and 5 retained v1 tests.
- The Next.js production build succeeds for both `/` and `/legacy`.
- The renderer contains no source parser, semantic DOM query, GSAP timeline, or internal playback clock.

## 1. Purpose

AnimFlow v2 will be a statically validated scene language that compiles into a deterministic render plan. The renderer will never interpret source text, resolve semantic targets through DOM selectors, or reconstruct state by replaying side effects.

The primary outcome is control: the same source and timestamp must always produce the same nodes, arrows, overlays, camera, and narration state.

This plan exists to keep concurrent AI and human work aligned. It defines binding architectural decisions, protected files, workstream ownership, dependency order, and acceptance gates.

## 2. Source-of-truth order

When instructions conflict, use this order:

1. The current user's explicit instruction.
2. This document and accepted ADRs added to it.
3. v2 contract tests and fixtures.
4. Existing v1 code and tests as evidence of current behavior only.
5. Existing README and DSL guide as legacy documentation only.

Do not infer v2 behavior from v1 implementation details.

## 3. Verified v1 baseline

The current repository has one combined React package. Parsing, semantic data, layout, animation scheduling, DOM lookup, and SVG mutation are tightly coupled under `packages/react/src/`.

Verified facts:

- `parseIndentedProperties` returns `Record<string, any>` and accepts unknown property names.
- Every animation action shares one `AnimationProperties` bag, so invalid action/property combinations are representable.
- Runtime target resolution uses `querySelector` and string IDs.
- `connect A->B` resolves edges by endpoint pair instead of a unique edge ID.
- Missing runtime targets are silently skipped.
- Seeking delegates to the GSAP timeline rather than sampling a complete scene state.
- React view state and GSAP both write camera/viewBox state.
- Node sizing estimates text width from character count while the renderer loads a font separately.
- `Date.now()` and generated random SVG filter IDs make output nondeterministic.
- The demo currently contains 11 DSL templates, 268 animation steps, and 92 narration entries.
- Those 268 steps use only four actions: 101 `connect`, 86 `show`, 71 `highlight`, and 10 `camera`.
- Existing template references resolve under the current built parser.
- The five existing parser/layout tests pass against the current `dist` output.
- A fresh TypeScript lint run is not currently available without repairing the deleted workspace dependency links. Do not treat the existing `dist` test result as source-level verification.

Primary evidence:

- `packages/react/src/core/parser/lexer.ts`
- `packages/react/src/core/types.ts`
- `packages/react/src/core/animation/timeline.ts`
- `packages/react/src/core/animation/camera.ts`
- `packages/react/src/core/animation/flow-effects.ts`
- `packages/react/src/core/layout/flowchart-layout.ts`
- `packages/react/src/components/renderer/DiagramRenderer.tsx`
- `packages/react/test/parser.test.mjs`
- `apps/web/data/templates/*.ts`

## 4. Goals

1. Reject invalid DSL before rendering.
2. Make playback, restart, forward seek, and backward seek deterministic.
3. Give every animatable node, edge, and overlay a stable explicit identity.
4. Make arrow ports, routes, markers, labels, and drawing animations independently controllable.
5. Give camera state one owner.
6. Support typed UI primitives without arbitrary HTML, CSS, or JavaScript.
7. Produce precise diagnostics with source ranges, error codes, and suggested fixes.
8. Keep compiler, runtime, and renderer independently testable.
9. Convert all existing templates without silent behavior loss.
10. Support editor diagnostics and completion from the same grammar and semantic rules.

## 5. Non-goals

- Full Mermaid compatibility inside the v2 grammar.
- Running v1 and v2 syntax through one runtime parser.
- Arbitrary CSS selectors, raw HTML, inline JavaScript, or user-defined GSAP code in DSL source.
- Preserving every v1 public type or internal function signature.
- Adding a large effect catalog before the four observed core behaviors are complete.
- Letting renderer components decide semantic defaults.
- Letting individual workstreams choose new parser, layout, animation, or rendering libraries independently.

Mermaid support becomes an importer or migration input. It is not the v2 core language.

## 6. Binding architecture decisions

### D1. Source compiles before runtime

The runtime accepts only a valid, immutable `RenderPlan`. It does not accept source text or a partially validated AST.

```text
AnimFlow source
  -> grammar AST with source locations
  -> symbol resolution
  -> semantic validation
  -> layout and geometry
  -> scene snapshots and animation tracks
  -> immutable RenderPlan
  -> pure runtime sampling
  -> React/SVG rendering
```

### D2. Use a real grammar and semantic linker

The planned language layer uses Langium because it provides a TypeScript AST, cross-reference resolution, validation, Language Server Protocol support, and browser/editor integration from one language definition.

No agent may replace Langium or add a second parser without recording a superseding ADR in this document first.

References:

- <https://langium.org/docs/features/>
- <https://langium.org/docs/reference/grammar-language/>

### D3. Scene state is authoritative

Scenes are not loose lists of DOM commands. Each compiled scene has a complete `from` snapshot, `to` snapshot, and typed tracks between them.

```ts
interface CompiledScene {
  id: SceneId;
  startMs: number;
  durationMs: number;
  from: SceneSnapshot;
  to: SceneSnapshot;
  tracks: readonly AnimationTrack[];
}
```

Runtime state is computed as a pure operation:

```ts
sample(plan: RenderPlan, timeMs: number): FrameState
```

Sampling at a timestamp after linear playback must equal sampling that timestamp directly.

### D4. IDs are stable and explicit

- Node, edge, overlay, graph, story, and scene IDs are document-wide unique.
- Every edge has an explicit ID.
- Animation statements reference edge IDs, never endpoint strings such as `A->B`.
- Compiler internals may lower IDs to numeric handles, but diagnostics retain source IDs and locations.

### D5. Core syntax is closed and typed

- Unknown declarations, properties, enum values, and units are compile errors.
- Action-specific properties use discriminated types. There is no shared `any` property bag.
- Raw CSS, HTML, JavaScript, DOM selectors, and arbitrary animation expressions are forbidden.
- Extensibility is a host-registered plugin API with a schema, compiler hook, and runtime renderer. Plugins are not part of the first implementation milestone.

### D6. One owner per state domain

- Compiler owns identity, defaults, timing, and geometry.
- Runtime sampler owns time-dependent state.
- Renderer owns drawing only.
- Host application owns playback chrome such as play/pause buttons.
- DSL owns canvas content, including typed overlays and narration.
- Camera is a sampled scene property. React and GSAP must not write it independently.

### D7. Deterministic geometry

- Font assets and metrics used for layout are controlled and versioned.
- Rough/sketch rendering uses an explicit stable seed stored in the render plan.
- Arrow paths are compiled from explicit source and target ports.
- Marker orientation comes from the final path tangent.
- Parallel edges remain independently addressable.
- No `Date.now()`, `Math.random()`, DOM measurement race, or remote font load may affect compiled output.

### D8. Strict failure policy

Compilation returns either a valid `RenderPlan` or diagnostics. It never returns a partial plan after an error.

Warnings are limited to valid but visually risky output, such as a possible label collision. Warnings may not hide invalid references or unsupported properties.

## 7. Draft v2 language

This syntax is the working contract. Surface changes require an ADR before implementation changes.

```animflow
animflow 2

canvas {
  size 1600 by 900
  theme paper
  background canvas
}

graph checkout {
  layout flow right {
    nodeGap 72
    rankGap 120
    routing orthogonal
  }

  node client "Client" {
    shape pill
    tone primary
  }

  node api "Order API" {
    shape rounded
  }

  node db "Database" {
    shape database
  }

  edge request: client.e -> api.w {
    label "POST /orders"
    line solid 2
    arrow end
  }

  edge persist: api.e -> db.w {
    arrow end
  }
}

overlay retryNote: callout {
  anchor api.n
  text "Retry after 500 ms"
  width 260
  tone danger
}

story main {
  initial {
    hide checkout.*
    hide retryNote
    camera fit(checkout.*) padding 64
  }

  scene requestScene "Request" duration 1200ms {
    show [client, api] via fade
    draw request via trace
    camera fit([client, api]) padding 80
    say "Client sends an order request."
  }

  scene persistScene "Persistence" duration 900ms {
    show db via slide(from: right, distance: 24)
    draw persist via trace
    highlight api tone success
  }

  scene retryScene "Retry policy" duration 800ms {
    show retryNote via pop
    highlight api tone danger
  }
}
```

### Scene semantics

- Scenes run sequentially in declaration order.
- Statements inside one scene run in parallel by default.
- `sequence { ... }` is the only nested sequencing construct.
- A scene inherits the previous scene's final state until it changes a property.
- Two parallel statements writing the same property of the same element are a compile error.
- A story must declare `initial` explicitly.
- Narration attaches to a scene ID, not a numeric step.
- Time units are explicit. Bare timing numbers are invalid.

### Initial core behavior

Implement these before adding more effects:

- `show` / `hide`
- `draw` for edges
- `highlight` / `clearHighlight`
- `camera fit` / `camera focus`
- `say`
- typed `callout`, `card`, `badge`, and `text` overlays

## 8. Package boundaries

Build v2 beside v1. Do not refactor v1 in place during the first five phases.

| Package path | Responsibility | Must not contain |
|---|---|---|
| `packages/model/` | Stable IDs, semantic model, RenderPlan, FrameState, diagnostics contracts | Parser, DOM, React, GSAP |
| `packages/language/` | Langium grammar, AST, linking, source diagnostics | Layout, DOM, React |
| `packages/compiler/` | AST lowering, semantic validation, layout, geometry, scene compilation | DOM queries, React components |
| `packages/runtime/` | Pure `sample(plan, time)` and playback state machine | Source parsing, DOM mutation |
| `packages/react-v2/` | Render `FrameState` to SVG/HTML and expose host controls | Source parsing, semantic target lookup |
| `packages/migrate/` | v1/Mermaid input to v2 source plus migration diagnostics | Runtime compatibility branches |

Dependency direction is one-way:

```text
model <- language
model <- compiler <- language
model <- runtime
model <- react-v2 <- runtime
model <- migrate <- language
```

`model` must not depend on any other workspace package.

## 9. Multi-agent coordination contract

### Protected current work

The worktree already contains uncommitted user changes. Until the integration phase, do not edit, reset, delete, restore, format, or stage these areas:

- `README.md`
- `docs/dsl-guide.md`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `turbo.json`
- `packages/react/**`
- `apps/web/**`

Never run `git reset --hard`, `git checkout --`, `git clean`, broad formatting, or `git add -A`.

### Single-writer rule

Each workstream has one writer. An agent edits only its assigned path. Cross-package changes are proposed in its handoff and applied by the coordinator.

| Workstream | Allowed write path | Dependency | Writer |
|---|---|---|---|
| WS-0 Contracts | `packages/model/**` and this plan's ADR section | none | coordinator only |
| WS-1 Language | `packages/language/**` | frozen WS-0 contracts | unassigned |
| WS-2 Compiler | `packages/compiler/**` | frozen WS-0 and WS-1 AST contract | unassigned |
| WS-3 Runtime | `packages/runtime/**` | frozen WS-0 contracts | unassigned |
| WS-4 Renderer | `packages/react-v2/**` | frozen WS-0 FrameState contract | unassigned |
| WS-5 Migration | `packages/migrate/**` | WS-1 grammar and v1 fixtures | unassigned |
| WS-6 Integration | root config, `apps/web/**`, `packages/react/**`, public exports | WS-1 through WS-5 accepted | coordinator only |

### Claim and handoff protocol

Before editing, an agent must receive a workstream assignment from the coordinator. Do not self-assign a neighboring package because it appears blocked.

Every handoff must include:

1. Exact files changed.
2. Public types or APIs introduced.
3. Tests run and exact results.
4. Assumptions made.
5. Known failures or deferred decisions.
6. Required coordinator changes outside the owned path.

An agent that needs a shared contract change stops and requests it. It does not modify `packages/model` directly.

### Shared-file policy

Only the coordinator may modify workspace config, lockfiles, root scripts, existing v1 code, demo templates, or documentation entry points. Dependency requests must be reported as package name, purpose, and required version range. The coordinator performs installation and lockfile updates once per integration batch.

## 10. Implementation order

### Phase 0: Freeze contracts

Owner: coordinator only.

- Define branded ID types and source ranges.
- Define diagnostics and error-code namespaces.
- Define semantic element unions.
- Define `RenderPlan`, `SceneSnapshot`, `AnimationTrack`, and `FrameState`.
- Add JSON fixtures representing valid plans and frames.
- Record any syntax change as an ADR in this document.

Exit gate: WS-1, WS-3, and WS-4 can implement against fixtures without importing each other's code.

### Phase 1: Language and diagnostics

- Implement the grammar and typed AST.
- Implement cross-reference linking.
- Implement duplicate-ID, unknown-reference, unit, enum, and action-property validation.
- Return all recoverable diagnostics in one pass with exact source ranges.

Exit gate: valid draft source produces a linked AST; invalid fixtures produce stable diagnostic codes and no render plan.

### Phase 2: Compiler and geometry

- Lower the linked AST into the semantic model.
- Resolve defaults and theme tokens once.
- Produce deterministic node measurements.
- Compute ports, routes, labels, arrow markers, and scene snapshots.
- Reject conflicting scene writes.

Exit gate: repeated compilation of the same source is deep-equal and byte-stable after serialization.

### Phase 3: Runtime sampler

- Implement `sample` as a pure function.
- Implement easing and typed interpolation.
- Implement play, pause, loop, speed, restart, and seek over sampled time.
- Keep narration and scene boundaries in the same clock.

Exit gate: direct seek and linear playback produce identical `FrameState` values at the same timestamps.

### Phase 4: Renderer

- Render only `FrameState` and immutable geometry.
- Use explicit element handles or component props, never semantic DOM queries.
- Render arrows, markers, labels, overlays, and camera from sampled state.
- Keep host playback controls outside DSL canvas content.

Exit gate: renderer contains no source parser, no semantic `querySelector`, and no second camera state.

### Phase 5: Migration

- Parse v1 input with the frozen legacy parser.
- Generate v2 source and migration diagnostics.
- Convert endpoint-based connect actions to explicit edge IDs.
- Convert numeric steps and narration into named scenes.
- Insert explicit initial state.
- Never silently drop unsupported v1 behavior.

Exit gate: all 11 current templates migrate, compile, and preserve every one of the 268 animation steps and 92 narration entries or emit an explicit blocking diagnostic.

### Phase 6: Integration and cutover

Owner: coordinator only.

- Add workspace packages and dependencies in one batch.
- Integrate the Monaco language service.
- Add the v2 demo path.
- Run v1 and v2 as separate entry points during verification.
- Replace the public default only after all acceptance gates pass.
- Update README, DSL reference, contribution guide, and package exports.

## 11. Diagnostic contract

Diagnostics are stable public output.

```ts
interface Diagnostic {
  code: string;
  severity: "error" | "warning";
  message: string;
  range: SourceRange;
  related?: readonly RelatedLocation[];
  fixes?: readonly SuggestedFix[];
}
```

Initial namespaces:

- `AF1xx`: syntax and token errors
- `AF2xx`: IDs, symbols, and references
- `AF3xx`: types, units, and property constraints
- `AF4xx`: scene timing and conflicting state writes
- `AF5xx`: layout and geometry
- `AF6xx`: migration
- `AF7xx`: plugin contracts, reserved for later

Examples:

- `AF201 Duplicate ID "api"`
- `AF210 Unknown edge "reqeust". Did you mean "request"?`
- `AF311 Property "particleCount" is not valid for "camera fit"`
- `AF401 Story "main" must declare an initial state`
- `AF422 Scene "intro" writes api.opacity twice in parallel`

## 12. Test strategy and acceptance gates

### Language

- Golden AST tests for every declaration.
- Negative tests for every diagnostic code.
- Recovery tests with multiple errors in one source.
- Unicode labels, escaped strings, comments, and source-range tests.

### Compiler

- Same source produces deep-equal render plans across repeated runs.
- Serialization contains no timestamps, random IDs, DOM objects, or functions.
- Unknown references and invalid units never reach layout.
- Parallel edges have unique geometry and animation handles.
- Explicit ports and marker tangents are snapshot-tested.

### Runtime

- `sample(plan, t)` is referentially transparent.
- Direct seek equals linear playback at scene starts, middles, and ends.
- Backward seek restores hidden, highlight, overlay, camera, and narration state.
- Restart equals sampling at `0`.
- Speed changes affect wall-clock progression, not sampled scene state.

### Renderer

- SVG snapshots for every node, edge, marker, and overlay primitive.
- Visual regression at fixed viewport sizes and device pixel ratios.
- No network font dependency.
- No semantic target resolution through CSS selectors.
- Camera output has one state source.

### Migration

- All current templates are fixtures.
- Each v1 action maps to one or more explicit v2 operations.
- Unsupported behavior is a blocking `AF6xx` diagnostic.
- Migrating the same input twice produces identical v2 text.

### Repository gate

Before cutover, all of these must pass from a clean dependency install:

```bash
pnpm build
pnpm lint
pnpm test
```

No milestone is complete based only on the demo appearing correct.

## 13. Open decisions that block dependent work

These are intentionally unresolved. Only the coordinator may close them by adding an ADR before dependent implementation starts.

1. Layout engine behind the compiler interface. Measure the current engine against required port routing and parallel-edge fixtures before replacing it.
2. Exact built-in theme token names and allowed style properties.
3. Whether image overlays are in the core language or a later host plugin.
4. The final package names published after `react-v2` cutover.
5. Plugin schema and sandbox policy. This does not block the core milestones.

Agents must not make local choices for these questions and then encode them into public contracts.

## 14. Definition of done

AnimFlow v2 is ready for public cutover only when:

- Invalid documents cannot produce a render plan.
- The runtime never parses source or queries the DOM to resolve semantic targets.
- All elements and edges are independently addressable.
- Seeking in either direction is deterministic.
- Arrow geometry, label placement, overlays, narration, and camera share one compiled timeline.
- All current templates migrate without silent loss.
- Build, lint, unit, contract, migration, and visual tests pass.
- v2 reference documentation matches the final grammar and generated diagnostics.
- The coordinator has removed every temporary dual-runtime integration path not required for explicit legacy support.

## 15. Change log and ADRs

Add architecture changes here before changing code.

| ID | Date | Decision | Status |
|---|---|---|---|
| ADR-001 | 2026-08-23 | Replace the Mermaid-extension runtime DSL with a compiled scene language | accepted |
| ADR-002 | 2026-08-23 | Runtime consumes immutable RenderPlan and samples FrameState by time | accepted |
| ADR-003 | 2026-08-23 | Build v2 beside v1 until cutover gates pass | accepted |
| ADR-004 | 2026-08-23 | Use Langium for grammar, linking, diagnostics, and editor services | accepted |
| ADR-005 | 2026-08-23 | Keep root config and existing v1 code coordinator-owned during parallel work | accepted |
| ADR-006 | 2026-08-23 | Parse canvas size as `NUMBER by NUMBER` to eliminate overlapping dimension and number tokens | accepted |
| ADR-007 | 2026-08-23 | Add optional `resolvedColor` to element frame state so color tracks have a representable sampled value | accepted |
| ADR-008 | 2026-08-23 | Keep `say` at scene scope and reject it inside `sequence` blocks | accepted |
| ADR-009 | 2026-08-23 | Promote legacy `flipIn` and edge `particles/dash/arrow` behavior into typed v2 transitions and edge flow effects | accepted |
| ADR-010 | 2026-08-23 | Make highlight `glow` and `pulse` typed scene effects; pulse lowers into non-overlapping intensity tracks | accepted |
| ADR-011 | 2026-08-23 | Add explicit `stagger <duration> { ... }` scheduling so migrated overlap timing is not rewritten as sequence timing | accepted |
| ADR-012 | 2026-08-23 | Reuse the frozen v1 `@animflow-dsl/react/core` parser only inside the migration package; v2 runtime and renderer remain independent | accepted |
| ADR-013 | 2026-08-23 | Make edge flow effect scene-state written by `draw ... flow <effect>` so one edge can change effects across scenes | accepted |
