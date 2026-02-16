# AnimFlow DSL

A DSL (Domain-Specific Language) for defining diagrams with step-by-step animations, built on React.

## Project Structure

Monorepo powered by **pnpm workspaces** + **Turborepo**:

```
animflow-dsl/
├── packages/
│   └── react/              # @animflow-dsl/react SDK
│       ├── src/
│       │   ├── components/    # AnimflowPlayer, renderers, controls
│       │   ├── core/          # DSL parser, layout engine, animation
│       │   ├── store/         # Zustand state management
│       │   └── index.ts       # Public API
│       └── package.json
└── apps/
    └── web/                # Demo web app (Next.js)
        ├── app/
        ├── components/
        ├── data/
        └── package.json
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Build the SDK
pnpm --filter @animflow-dsl/react build

# Run the demo app
pnpm --filter web dev
```

## Usage

```tsx
import { AnimflowPlayer } from '@animflow-dsl/react';

function App() {
  const dsl = `
flowchart LR
  A[Start]
  B[Process]
  C[End]

  A --> B
  B --> C

@animation
  step 1: show A
    effect: fadeIn
  step 2: connect A->B
    flow: particles
  step 3: show B
    effect: slideInRight
  step 4: connect B->C
    flow: particles
  step 5: show C
    effect: fadeIn
@end

@narration
  step 1:
    title: "Start"
    text: "The process begins here."
  step 4:
    title: "Complete"
    text: "Moving to the final stage."
@end
  `;

  return <AnimflowPlayer dsl={dsl} />;
}
```

## Documentation

- **[DSL Guide](docs/dsl-guide.md)** - Full DSL syntax reference
- **[SDK API](packages/react/README.md)** - React component props & imperative API

## Features

- **Diagram definition** - Nodes and edges with a simple, readable syntax
- **Step-by-step animation** - Show, hide, highlight, connect with various effects
- **Narration** - Descriptive text for each animation chapter
- **Styling** - Clean and sketchy (hand-drawn) render modes
- **Pan & Zoom** - Scroll to pan, Cmd/Ctrl+scroll to zoom
- **Playback controls** - Play/pause, chapter-based progress bar with tooltips

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **GSAP** - Animation engine
- **Dagre** - Graph layout
- **Rough.js** - Hand-drawn style rendering
- **Zustand** - State management
- **Next.js 14** - Demo app framework
- **Tailwind CSS** - Demo app styling
- **Turborepo** - Monorepo orchestration
- **tsup** - SDK bundling

## License

MIT
