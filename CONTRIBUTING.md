# Contributing to AnimFlow DSL

## Development setup

Requirements: Node.js 18+, pnpm 9+.

```bash
git clone https://github.com/YOUR_USERNAME/animflow-dsl.git
cd animflow-dsl
pnpm install
pnpm build
pnpm test
pnpm --filter web dev
```

Open `/` for the v2 editor and `/legacy` for the frozen v1 demo.

## Before changing the language

Read the [v2 architecture and implementation contract](docs/animflow-dsl-v2-implementation-plan.md). Public grammar or state-model changes require a new ADR in that document before code changes.

Keep the dependency direction one-way:

```text
model <- language
model <- compiler <- language
model <- runtime
model <- react-v2
language + model + frozen react/core <- migrate
```

- `model` contains contracts only: no parser, DOM, React, or GSAP.
- `language` owns grammar, references, source ranges, and semantic validation.
- `compiler` owns defaults, layout, geometry, scene snapshots, and tracks.
- `runtime` samples time-dependent state without parsing or DOM access.
- `react-v2` renders `RenderPlan` plus `FrameState`; it does not resolve semantic targets.
- `migrate` is the only v2 package allowed to import the frozen v1 parser.

## Required verification

Run the repository gates before opening a pull request:

```bash
pnpm lint
pnpm test
pnpm build
git diff --check
```

When changing a package, add or update its contract tests:

- Language: valid syntax, negative diagnostics, linking, source ranges.
- Compiler: repeatable output, routes, ports, markers, scene snapshots.
- Runtime: direct seek equals stepped playback, including backward seek and restart.
- Renderer: SVG structure and the absence of parsing, semantic DOM lookup, and an internal clock.
- Migration: deterministic output and exact action/narration preservation across all legacy templates.

Do not accept a change only because the demo looks correct.

## Grammar workflow

The grammar source is `packages/language/src/animflow.langium`. After editing it:

```bash
pnpm --filter @animflow-dsl/language langium:generate
pnpm --filter @animflow-dsl/language test
pnpm --filter @animflow-dsl/compiler test
```

Commit generated AST, grammar, module, and Monaco token output with the grammar change.

## Reporting issues

Include:

1. A minimal DSL document.
2. Expected and actual behavior.
3. Full diagnostic code, message, and source range.
4. Browser, OS, Node.js, and pnpm versions when relevant.

Open issues at <https://github.com/viviviviviid/animflow-dsl/issues>.
