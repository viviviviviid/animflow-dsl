# AnimFlow DSL Comprehensive Guide

This guide covers the complete syntax for AnimFlow DSL. Master this, and you can create any animated diagram you can imagine.

## Overview

AnimFlow DSL is composed of **five sections**. Only the diagram section is **required**; all others are optional.

```
# 1. Diagram definition (REQUIRED)
flowchart LR
  nodeId[Label]
  nodeId --> otherId

# 2. Animation (optional)
@animation
  step 1: show nodeId
@end

# 3. Style (optional)
@style
  nodeId:
    fill: #e8f5e9
@end

# 4. Narration (optional)
@narration
  step 1:
    title: "Title"
    text: "Description"
@end

# 5. Config (optional)
@config
  autoplay: true
@end
```

**Pro Tip**: Start with just the diagram section, then add animation, narration, and styling as needed.

---

## 1. Diagram Definition

### Flowchart

```
flowchart [direction]
  nodeId[label]
  nodeId2{decision label}
  nodeId3([stadium shape])
  nodeId4[(database)]

  nodeId --> nodeId2
  nodeId2 -->|Yes| nodeId3
  nodeId2 -->|No| nodeId4
```

**Direction**: `LR` (left-right), `RL`, `TD` (top-down), `BT` (bottom-top)

### Node Shapes

| Syntax | Shape |
|--------|-------|
| `[label]` | Rectangle |
| `{label}` | Diamond (decision) |
| `([label])` | Stadium (rounded) |
| `[(label)]` | Cylinder (database) |
| `((label))` | Circle |

### Edges

| Syntax | Description |
|--------|-------------|
| `A --> B` | Arrow (with arrowhead) |
| `A --- B` | Line (no arrowhead) |
| `A -->|text| B` | Arrow with label |
| `A ---|text| B` | Line with label |

### Multi-line Labels

Use `<br/>` for line breaks inside labels:

```
node1[Block #1<br/>Hash: a1b2<br/>Prev: 0000]
```

---

## 2. Animation (`@animation`)

Animations are defined as numbered steps. Each step has an **action**, a **target**, and optional **properties**.

```
@animation
  step 1: show nodeA
    duration: 1s
    effect: fadeIn

  step 2: connect nodeA->nodeB
    flow: particles
    speed: 2s
@end
```

### Actions

#### show / hide

Display or hide nodes.

```
step 1: show nodeA
  duration: 1.5s
  effect: fadeIn
  delay: 0s

step 2: show nodeA, nodeB, nodeC
  effect: slideInLeft
  stagger: 0.3s

step 3: hide nodeA
  effect: fadeOut
```

**Bulk targets** — special keywords that match groups of elements:

| Target | Description |
|--------|-------------|
| `all` | All nodes and edges |
| `nodes` | All nodes only |
| `edges` | All edges only |

```
step 1: hide all          # hides every node and edge
step 2: hide edges        # hides all edges only
step 3: show nodes        # reveals all nodes
```

#### highlight / unhighlight

Emphasize nodes visually.

```
step 1: highlight nodeA
  color: #FF5722
  glow: true
  pulse: true
  duration: 2s

step 2: unhighlight nodeA
```

#### connect

Animate edges between nodes.

```
step 1: connect nodeA->nodeB
  flow: particles
  speed: 2s
  color: #4CAF50

step 2: connect nodeB->nodeC, nodeC->nodeD
  flow: dash
  speed: 1.5s
```

**Multiple connections in one step animate simultaneously** — all arrows draw at the same time:

```
step 1: connect A->B, C->D, E->F
  flow: particles
  speed: 1.5s
  # A→B, C→D, E→F all start drawing together
```

#### camera

Control the viewport.

```
step 1: camera focus nodeA
  zoom: 2x
  duration: 1s

step 2: camera fitAll
  padding: 50px
  duration: 1s

step 3: camera fitNodes nodeA, nodeB, nodeC
  padding: 50px
```

#### annotate

Show a temporary tooltip on a node.

```
step 1: annotate nodeA
  text: "This is the genesis block"
  position: top
  duration: 3s
```

### Entrance Effects

| Effect | Description |
|--------|-------------|
| `fadeIn` | Fade in |
| `slideInLeft` | Slide from left |
| `slideInRight` | Slide from right |
| `slideInTop` | Slide from top |
| `slideInBottom` | Slide from bottom |
| `scaleIn` | Scale up |
| `bounceIn` | Bounce in |
| `flipIn` | Flip in |
| `rotateIn` | Rotate in |

### Exit Effects

| Effect | Description |
|--------|-------------|
| `fadeOut` | Fade out |
| `slideOutLeft` | Slide out to the left |
| `slideOutRight` | Slide out to the right |
| `scaleOut` | Scale down |
| `bounceOut` | Bounce scale down |

### Emphasis Effects

Apply on `highlight` via the `pulse`, `shake`, `bounce`, `flash` properties:

```
step 1: highlight nodeA
  pulse: true      # Scale up and back (attention-grabbing)
  duration: 1s

step 2: highlight nodeB
  flash: true      # Rapid opacity flicker
  duration: 1s
```

| Property | Description |
|----------|-------------|
| `glow: true` | Drop-shadow glow (uses `color`) |
| `pulse: true` | Scale 1→1.1→1 once |
| `flash: true` | Rapid opacity flicker (3 cycles) |
| `color: #hex` | Override fill/stroke color |

### Flow Effects (for `connect`)

| Flow | Description |
|------|-------------|
| `particles` | Progressive path draw (default) |
| `dash` | Dashed line animation |
| `arrow` | Path draw with eased arrow reveal |
| `glow` | Path draw + pulsing SVG blur filter for a glowing look |
| `wave` | Path draw + sinusoidal opacity ripple |
| `lightning` | Instant reveal + rapid strobe flicker |

### Timing

**Sequential** - Different step numbers run one after another:

```
step 1: show nodeA
step 2: show nodeB    # runs after step 1 completes
```

**Parallel** - Same step number runs simultaneously:

```
step 1: show nodeA
step 1: show nodeB    # runs at the same time as the first step 1
```

**Delay** - Wait before executing:

```
step 1: show nodeA
  delay: 0.5s
```

**Stagger** - Sequential delay across multiple targets:

```
step 1: show nodeA, nodeB, nodeC
  stagger: 0.3s    # nodeA at 0s, nodeB at 0.3s, nodeC at 0.6s
```

**Name** - Optional label for the step (used in UI tooltips):

```
step 1: show nodeA
  name: "Genesis block appears"
  duration: 1s
```

---

## 3. Style (`@style`)

Customize the appearance of nodes and edges.

```
@style
  nodeA:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 3px
    shadow: 0 4px 6px rgba(0,0,0,0.1)

  nodeB, nodeC:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 2px

  connection:
    stroke: #2196F3
    stroke-width: 2px
@end
```

### Available Properties

| Property | Example |
|----------|---------|
| `fill` | `#e8f5e9` |
| `stroke` | `#4CAF50` |
| `stroke-width` | `3px` |
| `color` | `#000000` (text) |
| `font-size` | `16px` |
| `font-weight` | `bold` |
| `shadow` | `0 4px 6px rgba(0,0,0,0.1)` |

---

## 4. Narration (`@narration`)

Add descriptive text that appears during animation playback. Narration steps also define chapter divisions on the progress bar.

```
@narration
  step 1:
    title: "Genesis Block"
    text: "The first block in the blockchain is created."

  step 3:
    title: "Chain Link"
    text: "Each block references the previous block's hash."

  step 6:
    title: "Chain Complete"
    text: "The blockchain is now fully formed."
@end
```

The progress bar is divided into chapters based on narration steps. Hovering over a chapter segment shows the title and text as a tooltip.

---

## 5. Config (`@config`)

Global settings for playback and rendering.

```
@config
  autoplay: true
  loop: false
  speed: 1.0
  controls: true
  narration: true
  background: #f5f5f5
  tts: true
  tts-voice: Kyunghoon, InJoon, ko-KR
  tts-rate: 1.0
  tts-pitch: 1.0
@end
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `autoplay` | boolean | `false` | Auto-play on load |
| `loop` | boolean | `false` | Loop animation |
| `speed` | number | `1.0` | Playback speed |
| `controls` | boolean | `true` | Show playback controls |
| `narration` | boolean | `true` | Show narration overlay |
| `background` | string | `#ffffff` | Canvas background color |
| `tts` | boolean | `false` | Sets initial state of the 🔊/🔇 toggle button |
| `tts-voice` | string | `""` | Comma-separated voice name substrings or BCP-47 tags, tried in order |
| `tts-rate` | number | `1.0` | Speech rate (0.1–10) |
| `tts-pitch` | number | `1.0` | Speech pitch (0–2) |

### TTS Behavior

When the 🔊 toggle is **ON**, the narration `text` of each step is spoken aloud in sync with animation. The toggle button lives in the playback controls bar and can only be changed while the animation is **stopped**.

- **play** → resumes paused speech
- **pause** → pauses speech mid-sentence
- **stop / toggle** → cancels speech and resets to the beginning
- **seek** → cancels speech (resumes naturally on next step change)
- **Volume slider** appears next to the toggle when voice is ON; adjusts loudness (0–100%)

Voice pacing mode (when 🔊 is ON):
- Each step's animation plays normally
- At the end of each step, if speech is still in progress the timeline **waits** for it to finish before advancing
- Toggling the button mid-way always resets to the beginning to avoid desync

Voice selection — `tts-voice` is tried left-to-right:
1. Voice name substring match (e.g. `Kyunghoon` → macOS Korean male)
2. BCP-47 language prefix match (e.g. `ko-KR` → any Korean voice)
3. Browser default voice

**Multi-voice fallback example:**
```
tts-voice: Kyunghoon, InJoon, ko-KR
# 1st: macOS Korean male  2nd: Windows Korean male  3rd: any Korean
```

---

## Full Example

```
flowchart LR
  genesis[Genesis Block<br/>Hash: 0000]
  block1[Block #1<br/>Hash: a1b2<br/>Prev: 0000]
  block2[Block #2<br/>Hash: c3d4<br/>Prev: a1b2]

  genesis --> block1
  block1 --> block2

@animation
  step 1: show genesis
    duration: 1.5s
    effect: fadeIn

  step 2: highlight genesis
    color: #4CAF50
    glow: true
    duration: 1s

  step 3: connect genesis->block1
    flow: particles
    speed: 2s
    color: #2196F3

  step 4: show block1
    effect: slideInRight
    duration: 1s

  step 5: connect block1->block2
    flow: particles
    speed: 2s

  step 6: show block2
    effect: slideInRight
    duration: 1s

  step 7: camera fitAll
    padding: 50px
    duration: 1.5s
@end

@style
  genesis:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 3px

  block1, block2:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 2px
@end

@narration
  step 1:
    title: "Genesis Block"
    text: "The first block with no previous hash."

  step 3:
    title: "First Link"
    text: "Block #1 references the genesis block's hash."

  step 7:
    title: "Blockchain Formed"
    text: "Blocks are chained together, making tampering detectable."
@end

@config
  autoplay: true
  controls: true
  speed: 1.0
@end
```
