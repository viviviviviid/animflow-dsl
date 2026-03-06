# AnimFlow DSL

**Paste Mermaid flowcharts. Add animations. Done.**

AnimFlow DSL extends standard Mermaid flowchart syntax with `@animation`, `@narration`, `@style`, and `@config` sections. If you already write Mermaid diagrams, you already know 80% of the syntax.

## 🚀 Quick Start

### Installation

```bash
npm install @animflow-dsl/react
# or
pnpm add @animflow-dsl/react
```

### Step 1 — Paste Mermaid code

Any Mermaid flowchart works as-is. No animation sections required:

```tsx
import { AnimflowPlayer } from '@animflow-dsl/react';

export default function MyDiagram() {
  const dsl = `
flowchart LR
  A[Start] --> B[Process] --> C[End]
  `;

  return <AnimflowPlayer dsl={dsl} />;
}
```

### Step 2 — Add animations

Extend with `@animation` and `@narration` sections on top of the same Mermaid diagram:

```tsx
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
    duration: 1s

  step 2: connect A->B
    flow: particles
    speed: 1.5s

  step 3: show B
    effect: slideInRight
    duration: 1s

  step 4: connect B->C
    flow: particles
    speed: 1.5s

  step 5: show C
    effect: fadeIn
    duration: 1s
@end

@narration
  step 1:
    title: "Starting Point"
    text: "Every journey begins with a single step."

  step 3:
    title: "Processing"
    text: "Here's where the magic happens."

  step 5:
    title: "Completion"
    text: "We've successfully reached our goal!"
@end

@config
  autoplay: true
  speed: 1.0
@end
`;
```

---

## 🧩 Mermaid Compatibility

AnimFlow's diagram section is **standard Mermaid flowchart syntax**. You can paste any `flowchart` diagram directly and it will render immediately.

AnimFlow adds four optional extension sections:

| Section | Purpose |
|---------|---------|
| `@animation ... @end` | Step-by-step animations |
| `@narration ... @end` | Synchronized text overlays |
| `@style ... @end` | Per-node/edge colors and styles |
| `@config ... @end` | Playback settings (autoplay, speed, TTS) |

### Supported Mermaid Syntax

**Directions:** `LR` `RL` `TD` `TB` `BT`

**Node shapes:**
```
A[Rectangle]
B{Diamond}
C(Stadium)
D([Terminator])
E((Circle))
F[(Database)]
G[/Parallelogram/]
H>Asymmetric]
```

**Edges:**
```
A --> B          # Arrow
A --- B          # Line (no arrowhead)
A -->|label| B   # Labeled arrow
A -- label --> B # Labeled arrow (alternate)
A --> B --> C    # Chained
A --> B & C      # Multi-target
```

> **Note:** `graph` keyword is not supported — use `flowchart` instead.

---

## ✨ Key Features

### Animation System
- **Rich actions**: show, hide, highlight, unhighlight, connect, camera, annotate
- **Entrance effects**: fadeIn, slideIn*, scaleIn, bounceIn, flipIn, and more
- **Flow effects**: particles, dash, arrow, glow, wave, lightning — smooth edge animations
- **Bulk targets**: `show/hide all`, `show/hide nodes`, `show/hide edges`
- **Simultaneous connect**: multiple edges in one step animate in parallel
- **Precise timing**: Duration, delay, easing, stagger for perfect choreography

### Visual Design
- **Hand-drawn aesthetic** - Sketchy style powered by rough.js
- **Automatic layout** - Dagre-powered intelligent graph positioning
- **Custom styling** - Per-node/edge colors, strokes, and styles
- **Responsive SVG** - Scales perfectly at any resolution

### Interactivity
- **Pan & Zoom** - Scroll to pan, Cmd/Ctrl+Scroll to zoom
- **Playback control** - Play, pause, speed adjustment (0.25x to 2x)
- **Chapter navigation** - Jump to any step with progress bar + tooltips
- **Keyboard shortcuts** - Space to play/pause, Arrow keys to navigate

### Education & Narration
- **Synchronized narration** - Text appears exactly when you need it
- **Text-to-Speech** - Web Speech API narration, synced with play/pause/stop
- **Template library** - Pre-built examples from blockchain to algorithm visualizations

---

## 📚 Documentation

- **[DSL Guide](docs/dsl-guide.md)** - Complete syntax reference for all sections
- **[SDK API](packages/react/README.md)** - React component API, hooks, imperative control

## 📦 Built-in Templates

Production-ready DSL examples in `apps/web/data/templates/`:

| Template | One-line preview |
|----------|-----------------|
| **Blockchain** | `flowchart LR\n  genesis[Genesis Block] --> block1[Block #1]` |
| **JWT Auth** | `flowchart LR\n  client[Client] --> gateway[API Gateway]` |
| **HTTP Cycle** | `flowchart TD\n  browser[Browser] --> dns[DNS Resolver]` |
| **Git Branches** | `flowchart LR\n  main[main] --> feature[feature/auth]` |
| **Order Processing** | `flowchart TD\n  order[New Order] --> payment[Payment]` |
| **Network Topology** | `flowchart TD\n  internet([Internet]) --> fw[Firewall]` |
| **Microservices** | `flowchart LR\n  gateway[API Gateway] --> auth[Auth]` |
| **zk-SNARK** | `flowchart LR\n  input[Private Input] --> circuit[Circuit]` |
| **Dijkstra** | `flowchart LR\n  A((A)) --> B((B))` |

---

## 🛠️ Development

### Setup

```bash
# Install all dependencies
pnpm install

# Build the SDK (required before running demo)
pnpm --filter @animflow-dsl/react build

# Run demo application
pnpm --filter web dev
# Open http://localhost:3000
```

### Available Commands

```bash
# Development
pnpm --filter @animflow-dsl/react dev    # Watch mode for SDK
pnpm --filter web dev                    # Dev server for demo

# Building
pnpm --filter @animflow-dsl/react build  # Build SDK for production
pnpm --filter web build                  # Build demo app

# Quality
pnpm lint                                # Lint all packages
```

---

## 🏗️ Architecture

### Core Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI** | React 18 + TypeScript | Component framework |
| **Animation** | GSAP | Timeline-based animation engine |
| **Layout** | Dagre | Graph layout algorithm |
| **Rendering** | SVG + rough.js | Scalable graphics + hand-drawn style |
| **State** | Zustand | Lightweight state management |
| **Demo** | Next.js 14 + Tailwind | Full-stack demo application |

### Pipeline

```
DSL Text
    ↓
Parse → Structured Data (nodes, edges, animations)
    ↓
Layout → Dagre → 2D Coordinates
    ↓
Render → SVG Elements (Clean or Sketchy)
    ↓
Animate → GSAP Timeline → Synchronized animations
    ↓
Playback → User Controls → Timeline scrubbing
```

## 📦 Project Structure

```
animflow-dsl/
├── packages/react/
│   ├── src/
│   │   ├── components/       # AnimflowPlayer, renderers, controls
│   │   ├── core/             # Parser, layout, animation engine
│   │   ├── hooks/            # useTTS and other hooks
│   │   ├── store/            # Zustand state management
│   │   └── index.ts          # Public API
│   └── package.json
│
└── apps/web/
    ├── app/                  # Next.js 14 app
    ├── data/templates/       # Pre-built template DSL files
    └── package.json
```

## 🎓 Use Cases

1. **Engineering Documentation** - Animated system architecture and data flow diagrams
2. **Educational Content** - Make algorithms and design patterns engaging
3. **Product Demos** - Guided animated walkthroughs
4. **Technical Interviews** - Illustrate system design solutions
5. **Team Onboarding** - Help new developers understand codebases faster

## 📄 License

MIT - Free for personal and commercial use

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and contribution guidelines.

---

**Bring clarity to complexity through animated storytelling.**
