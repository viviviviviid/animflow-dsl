# Contributing to AnimFlow DSL

Thank you for your interest in contributing!

## Development Setup

```bash
# 1. Fork and clone the repo
git clone https://github.com/YOUR_USERNAME/animflow-dsl.git
cd animflow-dsl

# 2. Install dependencies
pnpm install

# 3. Build the SDK and start the demo
pnpm --filter @animflow-dsl/react build
pnpm --filter web dev
# Open http://localhost:3000
```

For live SDK development with hot reload:

```bash
# Terminal 1 — watch mode for the SDK
pnpm --filter @animflow-dsl/react dev

# Terminal 2 — demo app
pnpm --filter web dev
```

## Reporting Issues

When reporting a bug, please include:

1. The **DSL string** that causes the problem (or a minimal reproduction)
2. Expected behavior vs. actual behavior
3. Browser and OS

Open an issue at: https://github.com/animflow-dsl/animflow-dsl/issues

## Submitting a Pull Request

**Before opening a PR:**

- [ ] `pnpm --filter @animflow-dsl/react build` passes without errors
- [ ] `pnpm lint` passes
- [ ] New templates are added to `apps/web/data/templates/` and exported from `apps/web/data/templates/index.ts`
- [ ] DSL parser changes are validated (see below)

## Validating DSL Parser Changes

If you modify `packages/react/src/core/parser/diagram-parser.ts`, verify these cases parse correctly:

```
# Node shapes
A[rect]
B{diamond}
C(stadium)
D([terminator])
E((circle))
F[(database)]
G[[document]]
H[/parallelogram/]
I>asymmetric]

# Edges
A --> B
A --- B
A -->|label| B
A -- label --> B
A --> B --> C
A --> B & C

# Directions
flowchart LR
flowchart TD
flowchart TB
flowchart RL
flowchart BT
```

You can test quickly by pasting into the demo app at http://localhost:3000 and verifying the diagram renders the expected shapes and connections.

## Project Structure

```
packages/react/src/
├── core/parser/   # DSL text → DiagramData
├── core/layout/   # Dagre layout calculation
├── components/    # React components
├── hooks/         # useTTS, other hooks
└── store/         # Zustand state
```

## Questions

Feel free to open a GitHub Discussion for any questions about the codebase or contribution ideas.
