# AnimFlow DSL

**Make complex systems understandable with animated, narrated diagrams.**

A powerful Domain-Specific Language (DSL) for creating step-by-step animated diagrams that tell compelling stories. AnimFlow combines the simplicity of Mermaid syntax with professional animation capabilities, perfect for engineering documentation, education, and technical storytelling.

## 🎯 Why AnimFlow DSL?

- **Visual Storytelling** - Diagrams alone don't explain; animation + narration do
- **Educational** - Make technical concepts accessible to everyone
- **Professional** - Clean animations with optional hand-drawn aesthetics
- **Developer-Friendly** - Simple, readable syntax inspired by Mermaid
- **Fully Animated** - Show, hide, highlight, connect - every element can be animated
- **Interactive** - Built-in playback controls, chapter navigation, speed control

## 🚀 Quick Start

### Installation

```bash
npm install @animflow-dsl/react
# or
pnpm add @animflow-dsl/react
```

### Basic Example

```tsx
import { AnimflowPlayer } from '@animflow-dsl/react';

export default function MyDiagram() {
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

  return <AnimflowPlayer dsl={dsl} />;
}
```

## ✨ Key Features

### Animation System
- **Rich actions**: show, hide, highlight, unhighlight, connect, camera, annotate
- **Entrance effects**: fadeIn, slideIn*, scaleIn, bounceIn, flipIn, and more
- **Flow effects**: particles, dash, arrow - smooth edge animations
- **Precise timing**: Duration, delay, easing, stagger for perfect choreography
- **Flexible sequencing**: Absolute or relative timing with GSAP timeline

### Visual Design
- **Clean mode** - Professional, polished appearance for production docs
- **Sketchy mode** - Hand-drawn aesthetic using rough.js for creative/educational content
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
- **Flexible timing** - Narration can lead or follow animation
- **Educational focus** - Design for learning, not just visualization
- **Template library** - 10 pre-built examples from blockchain to algorithm visualizations

## 📦 Project Structure

```
animflow-dsl/
├── packages/react/
│   ├── src/
│   │   ├── components/       # AnimflowPlayer, renderers, controls
│   │   ├── core/             # Parser, layout, animation engine
│   │   ├── store/            # Zustand state management
│   │   └── index.ts          # Public API
│   └── package.json
│
└── apps/web/
    ├── app/                  # Next.js 14 app
    ├── data/templates/       # 9 pre-built template examples
    └── package.json
```

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
pnpm lint                                 # Lint all packages
pnpm test                                 # Run tests
```

## 📚 Documentation

- **[DSL Guide](docs/dsl-guide.md)** - Complete syntax reference, all features and examples
- **[SDK API](packages/react/README.md)** - React component API, hooks, imperative control
- **[Built-in Templates](apps/web/data/templates)** - Production-ready examples:
  - **Blockchain** - Understand cryptographic chains and hashing
  - **JWT Auth** - See how tokens secure APIs
  - **HTTP Cycle** - Demystify web requests
  - **Git Branches** - Visualize version control
  - **Order Processing** - E-commerce workflows
  - **Network Topology** - Cloud architecture patterns
  - **Microservices** - Distributed system design
  - **zk-SNARK** - Zero-knowledge cryptography pipeline
  - **Dijkstra** - Shortest path algorithm step-by-step

## 🧩 React API

### Main Component

```tsx
<AnimflowPlayer
  dsl={string}              // DSL string (required)
  className={string}        // CSS class for container
  defaultMode={'clean'}     // 'clean' or 'sketchy' (default: 'clean')
/>
```

### Imperative Control

```tsx
const playerRef = useRef<AnimflowPlayerRef>(null);

playerRef.current?.play();        // Start playback
playerRef.current?.pause();       // Pause playback
playerRef.current?.seek(5);       // Jump to 5 second mark
playerRef.current?.setSpeed(1.5); // Set playback speed (0.25–2.0)
playerRef.current?.toggleMode();  // Switch clean ↔ sketchy
```

### Hooks

```tsx
// Get current playback state
const { isPlaying, currentTime, duration } = useDiagramStore();

// Listen to step changes
const currentStep = useDiagramStore(s => s.currentStep);
```

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

## 📖 DSL Syntax Overview

### Diagram Definition
```
flowchart LR
  A[Rectangle]
  B{Diamond}
  C([Stadium])
  D[(Cylinder)]

  A --> B
  B --- C
  C -->|Label| D
```

### Animation
```
@animation
  step 1: show A
    effect: fadeIn
    duration: 1s

  step 2: connect A->B
    flow: particles
    speed: 1.5s

  step 3: highlight B
    color: #FF9800
    glow: true
    duration: 1s
@end
```

### Narration
```
@narration
  step 1:
    title: "Main Heading"
    text: "Detailed explanation that appears with animation."

  step 3:
    title: "Next Topic"
    text: "Continue the story with narration."
@end
```

### Styling
```
@style
  A, B:
    fill: #e3f2fd
    stroke: #2196F3
  C:
    fill: #fff3e0
    stroke: #FF9800
@end
```

### Configuration
```
@config
  autoplay: true
  loop: false
  controls: true
  speed: 1.0
@end
```

## 🎓 Use Cases

### 1. Engineering Documentation
Explain system architecture, deployment pipelines, and data flows with animated diagrams instead of static PDFs.

### 2. Educational Content
Make programming concepts, algorithms, and design patterns engaging and understandable.

### 3. Product Demos
Walk users through features with guided, animated walkthroughs.

### 4. Technical Interviews
Illustrate your thought process and system design solutions clearly.

### 5. Team Onboarding
Help new developers understand codebases and system architecture faster.

## 🚀 Performance

- Optimized for diagrams with **up to 100+ nodes**
- Smooth 60fps animations on modern browsers
- Efficient SVG rendering with minimal DOM churn
- Lazy animation scheduling for large diagrams

## 🔮 Future Roadmap

- [ ] Export to image/video
- [ ] Collaborative editing
- [ ] More node shapes
- [ ] Custom plugins system
- [ ] Node/edge tooltips
- [ ] Undo/redo in editor
- [ ] Advanced layout algorithms

## 📄 License

MIT - Free for personal and commercial use

## 🤝 Contributing

Contributions welcome! Whether it's bug reports, feature suggestions, or PRs - we'd love your help.

---

**Bring clarity to complexity through animated storytelling. 🎬✨**
