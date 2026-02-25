# @animflow-dsl/react

**The React SDK for AnimFlow DSL** - Create step-by-step animated diagrams with professional animations and narration.

This is the core React component library that powers AnimFlow. Whether you're embedding diagrams in documentation, building educational content, or creating interactive presentations, this SDK provides everything you need.

## Installation

```bash
npm install @animflow-dsl/react
# or
pnpm add @animflow-dsl/react
# or
yarn add @animflow-dsl/react
```

### Peer Dependencies

This package requires:
- `react ^18.0.0`
- `react-dom ^18.0.0`

## Quick Start

### Simplest Example

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
    text: "The journey begins here."
  step 5:
    title: "Complete"
    text: "We've reached the end."
@end

@config
  autoplay: true
  controls: true
@end
  `;

  return <AnimflowPlayer dsl={dsl} />;
}
```

## Component API

### `<AnimflowPlayer>` Component

The main component that renders and controls animated diagrams.

```tsx
<AnimflowPlayer
  dsl={string}       // DSL string (required)
  className={string} // CSS class for container
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `dsl` | `string` | **required** | Complete DSL diagram definition |
| `className` | `string` | `undefined` | CSS class for the container div |
| `autoplay` | `boolean` | `false` | Start playback automatically on load |
| `controls` | `boolean` | `true` | Show built-in playback controls |
| `narration` | `boolean` | `true` | Show narration overlay |
| `onError` | `(error: string) => void` | `undefined` | Called when DSL parsing fails |
| `onReady` | `(data: DiagramData) => void` | `undefined` | Called when diagram is ready |

#### Example with All Props

```tsx
<AnimflowPlayer
  dsl={myDslString}
  className="w-full h-screen"
  autoplay
/>
```

## Imperative Control

Use `useRef` and the handle to control playback programmatically.

### Setup

```tsx
import { useRef } from 'react';
import { AnimflowPlayer, AnimflowPlayerRef } from '@animflow-dsl/react';

export default function ControlledDiagram() {
  const playerRef = useRef<AnimflowPlayerRef>(null);

  const handlePlay = () => playerRef.current?.play();
  const handlePause = () => playerRef.current?.pause();
  const handleSpeedUp = () => playerRef.current?.setSpeed(1.5);
  const handleSkip = () => playerRef.current?.seek(10); // Jump to 10 seconds

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={handlePlay}>Play</button>
        <button onClick={handlePause}>Pause</button>
        <button onClick={handleSpeedUp}>Speed 1.5x</button>
        <button onClick={handleSkip}>Skip to 10s</button>
      </div>
      <AnimflowPlayer ref={playerRef} dsl={dslString} />
    </div>
  );
}
```

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `play()` | `() => void` | Start playback from current position |
| `pause()` | `() => void` | Pause playback |
| `stop()` | `() => void` | Pause and seek back to 0 |
| `restart()` | `() => void` | Restart from the beginning |
| `seek(time)` | `(time: number) => void` | Jump to specific time (in seconds) |
| `setSpeed(speed)` | `(speed: number) => void` | Set playback speed (0.25–2.0) |
| `getCurrentTime()` | `() => number` | Current playback position in seconds |
| `getDuration()` | `() => number` | Total timeline duration in seconds |
| `isPlaying()` | `() => boolean` | Whether playback is currently active |

## Hooks

Access animation state with Zustand hooks.

```tsx
import { useDiagramStore } from '@animflow-dsl/react';

export default function AnimationStatus() {
  const isPlaying = useDiagramStore(s => s.isPlaying);
  const currentTime = useDiagramStore(s => s.currentTime);
  const duration = useDiagramStore(s => s.duration);
  const currentStep = useDiagramStore(s => s.currentStep);

  return (
    <div>
      <p>Status: {isPlaying ? 'Playing' : 'Paused'}</p>
      <p>Progress: {currentTime.toFixed(1)}s / {duration.toFixed(1)}s</p>
      <p>Step: {currentStep}</p>
    </div>
  );
}
```

### Available Store Selectors

```typescript
// Playback state
isPlaying: boolean
currentTime: number        // In seconds
duration: number           // In seconds
speed: number              // Playback speed multiplier (0.25–2.0)

// Animation state
currentStep: number        // Current animation step
```

### `useTTS` Hook

Standalone Text-to-Speech hook using the Web Speech API. The `AnimflowPlayer` uses this internally for its built-in 🔊/🔇 toggle button, but you can also use it directly for custom UI.

```tsx
import { useTTS } from '@animflow-dsl/react';

export default function CustomTTS() {
  const tts = useTTS({
    enabled: true,
    voiceName: 'Kyunghoon, InJoon, ko-KR', // comma-separated, tried in order
    rate: 1.1,    // speech rate 0.1–10
    pitch: 1.0,   // pitch 0–2
    volume: 0.8,  // volume 0–1
    onEnd: () => console.log('done'),  // fires on natural end only
  });

  return (
    <div>
      <button onClick={() => tts.speak('Hello, world!')}>Speak</button>
      <button onClick={tts.pause}>Pause</button>
      <button onClick={tts.resume}>Resume</button>
      <button onClick={tts.cancel}>Stop</button>
      <p>{tts.isSpeaking ? 'Speaking...' : 'Idle'}</p>
    </div>
  );
}
```

| Option / Return | Type | Description |
|-----------------|------|-------------|
| `enabled` | `boolean` | Whether `speak()` does anything |
| `voiceName` | `string` | Comma-separated voice names/BCP-47 tags, tried in order |
| `rate` | `number` | Speech rate (0.1–10) |
| `pitch` | `number` | Pitch (0–2) |
| `volume` | `number` | Volume (0–1) |
| `onEnd` | `() => void` | Called when speech ends naturally (not on cancel/error) |
| `speak(text)` | method | Cancel current speech and speak new text |
| `pause()` | method | Pause mid-sentence |
| `resume()` | method | Resume paused speech |
| `cancel()` | method | Stop and discard current speech |
| `isSpeaking` | `boolean` | React state — `true` while speaking |
| `isSpeakingRef` | `MutableRefObject<boolean>` | Sync ref for use inside callbacks |

**Voice selection** — `voiceName` is tried left-to-right, each entry matched by:
1. Voice name substring (e.g. `"Kyunghoon"` → macOS Korean male)
2. BCP-47 language prefix (e.g. `"ko-KR"` → any Korean voice)
3. Browser default voice (if nothing matches)

**DSL usage** (handled automatically by `AnimflowPlayer`):

```
@config
  tts: true                           # initial state of the 🔊/🔇 button
  tts-voice: Kyunghoon, InJoon, ko-KR # multi-voice fallback
  tts-rate: 1.0
  tts-pitch: 1.0
@end
```

**Built-in player UI:**
- 🔊/🔇 toggle button lives in the playback controls bar (bottom)
- Volume slider appears to the right of the toggle when voice is ON
- Toggle is disabled while the animation is playing; switching always resets to the beginning

## Advanced: Low-Level API

For advanced use cases, you can access individual renderers and utilities.

### Manual Diagram Rendering

```tsx
import {
  DiagramRenderer,
  parseDsl,
  calculateFlowchartLayout
} from '@animflow-dsl/react';

export default function CustomDiagram() {
  const dsl = `
flowchart LR
  A[Node A]
  B[Node B]
  A --> B
  `;

  // Step 1: Parse DSL
  const result = parseDsl(dsl);
  if (!result.success || !result.data) return null;

  // Step 2: Calculate layout
  const layoutData = calculateFlowchartLayout(
    result.data.nodes,
    result.data.edges,
    result.data.metadata.direction
  );

  // Step 3: Render
  return (
    <DiagramRenderer
      data={{ ...result.data, ...layoutData }}
      pan={{ x: 0, y: 0 }}
      zoom={1}
    />
  );
}
```

### Type Definitions

```typescript
import type {
  DiagramData,
  DiagramNode,
  DiagramEdge,
  AnimationStep,
  NarrationItem,
  AnimationAction,
  AnimationProperties,
  ParseResult,
} from '@animflow-dsl/react';
```

## Complete Real-World Example

```tsx
import { AnimflowPlayer, AnimflowPlayerRef } from '@animflow-dsl/react';
import { useRef, useState } from 'react';

export default function ArchitectureDiagram() {
  const playerRef = useRef<AnimflowPlayerRef>(null);
  const [speed, setSpeed] = useState(1);

  const dsl = `
flowchart TD
  User([User])
  Gateway[API Gateway]
  Auth[Auth Service]
  DB[(Database)]

  User --> Gateway
  Gateway --> Auth
  Auth --> DB

@animation
  step 1: show User
    effect: fadeIn
    duration: 1s

  step 2: show Gateway
    effect: scaleIn
    duration: 1s

  step 3: connect User->Gateway
    flow: particles
    speed: 1.5s

  step 4: show Auth
    effect: slideInRight
    duration: 1s

  step 5: connect Gateway->Auth
    flow: particles
    speed: 1s

  step 6: show DB
    effect: bounceIn
    duration: 1s

  step 7: connect Auth->DB
    flow: arrow
    speed: 1.5s

  step 8: camera fitAll
    padding: 50px
    duration: 1s
@end

@narration
  step 1:
    title: "Users"
    text: "All requests come from users."

  step 3:
    title: "Gateway Entry"
    text: "The API Gateway is the single entry point."

  step 5:
    title: "Authentication"
    text: "Every request goes through authentication first."

  step 7:
    title: "Data Access"
    text: "Authenticated requests query the database."
@end

@style
  User:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 3px

  Gateway:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 2px

  Auth:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 2px

  DB:
    fill: #f3e5f5
    stroke: #9C27B0
    stroke-width: 2px
@end

@config
  autoplay: false
  controls: true
  speed: 1.0
@end
  `;

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="bg-white shadow p-4 flex gap-4">
        <button
          onClick={() => playerRef.current?.play()}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Play
        </button>
        <button
          onClick={() => playerRef.current?.pause()}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          Pause
        </button>
        <label className="flex items-center gap-2">
          Speed:
          <input
            type="range"
            min="0.25"
            max="2"
            step="0.25"
            value={speed}
            onChange={(e) => {
              const newSpeed = parseFloat(e.target.value);
              setSpeed(newSpeed);
              playerRef.current?.setSpeed(newSpeed);
            }}
            className="w-24"
          />
          <span>{speed.toFixed(2)}x</span>
        </label>
      </div>
      <div className="flex-1">
        <AnimflowPlayer
          ref={playerRef}
          dsl={dsl}
        />
      </div>
    </div>
  );
}
```

## Best Practices

### 1. **Keep DSL in Separate Files**
```tsx
// dsl/blockchain.ts
export const BLOCKCHAIN_DSL = `...`;

// Component
import { BLOCKCHAIN_DSL } from './dsl/blockchain';
<AnimflowPlayer dsl={BLOCKCHAIN_DSL} />
```

### 2. **Use Constants for Timing**
```tsx
const TIMING = {
  short: '0.8s',
  normal: '1.5s',
  long: '2.5s'
};

// In DSL:
// step 1: show node
//   duration: TIMING.normal
```

### 3. **Memoize DSL for Performance**
```tsx
import { useMemo } from 'react';

export default function App() {
  const dsl = useMemo(() => `...`, []);
  return <AnimflowPlayer dsl={dsl} />;
}
```

### 4. **Responsive Container**
```tsx
<div className="w-full h-screen md:h-96">
  <AnimflowPlayer dsl={dsl} className="w-full h-full" />
</div>
```

## Troubleshooting

### Animation doesn't play
- Check that `@animation` section syntax is correct
- Ensure step numbers are sequential (1, 2, 3, ...)
- Verify node IDs in animation match diagram definition

### Poor performance
- Reduce number of nodes/edges
- Use cleaner animation effects (fewer particles)
- Try the sketchy mode as it's more GPU-friendly

### Styling not applied
- Verify node/edge IDs in `@style` match diagram
- Use proper hex color format (`#FF9800`)
- Check stroke-width units (`2px`, not `2`)

## Contributing

Found a bug? Have a feature idea? We'd love your contribution!

- **Report issues** → GitHub Issues
- **Suggest features** → GitHub Discussions
- **Submit PRs** → Follow the contribution guide

## License

MIT - Free for personal and commercial use

---

**Need help? Check the [main DSL Guide](../../docs/dsl-guide.md) for complete syntax reference.**
