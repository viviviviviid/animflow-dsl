# AnimFlow 2.1 authoring reference

Use one `canvas`, one or more `graph` blocks, optional `overlay` blocks, and exactly one `story`. The current product supports one story and flow-layout graphs.

```animflow
animflow 2.1

canvas {
  size 1280 by 720
  theme light
  background surface
}

graph requestFlow {
  layout flow right {
    nodeGap 48
    rankGap 80
    routing orthogonal
  }
  node client "Client" {
    shape rounded
    tone neutral
  }
  node api "API" {
    shape rectangle
    tone primary
  }
  edge request: client.e -> api.w {
    label "POST /checkout"
    line solid 2
    arrow end
    tone primary
    routing orthogonal
  }
}

story lesson {
  initial {
    hide requestFlow.*
    camera fit(requestFlow) padding 40
  }
  scene introduce "Introduce" duration 2s {
    action revealFlow: show requestFlow.* via fade
    say "The client calls the API."
  }
  scene trace "Trace request" duration 2s {
    action traceRequest: draw request via trace
  }
}
```

## Closed vocabulary

- Node shapes: `rectangle`, `rounded`, `pill`, `diamond`, `circle`, `database`, `document`, `parallelogram`.
- Ports: `auto`, `n`, `e`, `s`, `w`.
- Edge routing: `straight`, `orthogonal`, `curve`.
- Visibility transitions: `fade`, `pop`, `flip`, `slide(from: left|right|up|down)`.
- Scene actions: `show`, `hide`, `draw`, `highlight`, `clearHighlight`, `camera`, `sequence`, `stagger`; narration is `say` and has no action ID.
- Durations: integer or decimal followed by `ms` or `s`.

Every v2.1 non-`say` statement is written as `action uniqueId: <action>`. Nested statements each need their own ID:

```animflow
action revealPair: sequence {
  action revealClient: show client via fade
  action revealApi: show api via fade
}
```

IDs are unique across the entire document, including graphs, nodes, edges, overlays, stories, scenes, and actions. Run `animflow format --write`, not a custom printer.
