import { COMPLEX_STUDIO_EXAMPLES } from "./complex-studio-examples";

export interface StudioExample {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly description: string;
  readonly source: string;
}

export const BLANK_STUDIO_SOURCE = `animflow 2.1

canvas {
  size 1600 by 900
  theme signalDesk
  background surface
}

graph lessonMap {
  layout flow right {
    nodeGap 60
    rankGap 120
    routing curve
  }

  node idea "Core idea" {
    shape rounded
    tone hex_2F6FED
  }

  node outcome "Learning outcome" {
    shape rounded
    tone hex_138A72
  }

  edge explains: idea.e -> outcome.w {
    label "Explain"
    line solid 2
    arrow end
    tone hex_2F6FED
    routing curve
  }
}

story lessonStory {
  initial {
    hide lessonMap.*
    camera fit(lessonMap) padding 96
  }

  scene opening "Introduce the idea" duration 1800ms {
    action showIdea: show idea via pop
    say "Start with the one idea your audience should remember."
  }

  scene outcomeScene "Connect the outcome" duration 1800ms {
    action showOutcome: show outcome via slide(from: right, distance: 56)
    action showExplains: show explains via fade
    action traceExplains: draw explains via trace flow particles
    say "Connect the idea to a concrete learning outcome."
  }
}
`;

export const STUDIO_EXAMPLES: readonly StudioExample[] = [
  {
    id: "agent-tool-loop",
    title: "AI agent tool loop",
    category: "AI systems",
    description: "Teach how a request moves through reasoning, a tool call, and a grounded response.",
    source: `animflow 2.1

canvas {
  size 1600 by 900
  theme signalDesk
  background surface
}

graph agentLoop {
  layout flow right {
    nodeGap 54
    rankGap 112
    routing curve
  }

  node user "User" {
    shape rounded
    tone hex_2F6FED
  }

  node agent "Agent" {
    shape diamond
    tone hex_7457D9
  }

  node tool "Tool" {
    shape database
    tone hex_138A72
  }

  edge prompt: user.e -> agent.w {
    label "Prompt"
    line solid 2
    arrow end
    tone hex_2F6FED
    routing curve
    flow particles
  }

  edge call: agent.e -> tool.w {
    label "Tool call"
    line dashed 2
    arrow end
    tone hex_138A72
    routing curve
    flow dash
  }
}

story agentStory {
  initial {
    hide agentLoop.*
    camera fit(agentLoop) padding 80
  }

  scene actors "Reveal the loop" duration 1600ms {
    action revealActors: stagger 220ms {
      action showUser: show user via slide(from: left, distance: 56)
      action showAgent: show agent via pop
      action showTool: show tool via slide(from: right, distance: 56)
    }
    say "An agent sits between intent and an external capability."
  }

  scene understand "Understand the request" duration 1300ms {
    action showPrompt: show prompt via fade
    action tracePrompt: draw prompt via trace flow particles
    action focusAgent: highlight agent tone hex_7457D9 effect pulse
    say "The prompt becomes a decision about what to do next."
  }

  scene useTool "Call the tool" duration 1500ms {
    action showCall: show call via fade
    action traceCall: draw call via trace flow dash
    action focusTool: highlight tool tone hex_138A72 effect glow
    say "The tool returns evidence the response can use."
  }
}
`,
  },
  {
    id: "api-request-lifecycle",
    title: "API request lifecycle",
    category: "Backend",
    description: "Walk through a browser request, API validation, and a database lookup.",
    source: `animflow 2.1

canvas {
  size 1600 by 900
  theme signalDesk
  background surface
}

graph requestFlow {
  layout flow right {
    nodeGap 54
    rankGap 112
    routing orthogonal
  }

  node browser "Browser" {
    shape rounded
    tone hex_2F6FED
  }

  node api "API server" {
    shape rounded
    tone hex_D97732
  }

  node store "Database" {
    shape database
    tone hex_138A72
  }

  edge request: browser.e -> api.w {
    label "POST /lessons"
    line solid 2
    arrow end
    tone hex_2F6FED
    routing orthogonal
    flow particles
  }

  edge query: api.e -> store.w {
    label "INSERT"
    line dashed 2
    arrow end
    tone hex_138A72
    routing orthogonal
    flow dash
  }
}

story requestStory {
  initial {
    hide requestFlow.*
    camera fit(requestFlow) padding 80
  }

  scene clients "Meet the services" duration 1500ms {
    action revealServices: stagger 180ms {
      action showBrowser: show browser via slide(from: left, distance: 48)
      action showApi: show api via pop
      action showDatabase: show store via slide(from: right, distance: 48)
    }
    say "Three boundaries share responsibility for one request."
  }

  scene validation "Validate the request" duration 1400ms {
    action showRequest: show request via fade
    action traceRequest: draw request via trace flow particles
    action focusApi: highlight api tone hex_D97732 effect pulse
    say "The API authenticates and validates before writing data."
  }

  scene persistence "Persist the lesson" duration 1400ms {
    action showQuery: show query via fade
    action traceQuery: draw query via trace flow dash
    action focusDatabase: highlight store tone hex_138A72 effect glow
    say "A durable write completes the request lifecycle."
  }
}
`,
  },
  {
    id: "course-concept-map",
    title: "Course concept map",
    category: "Teaching",
    description: "Introduce a concept, attach an example, and land on the final takeaway.",
    source: `animflow 2.1

canvas {
  size 1600 by 900
  theme signalDesk
  background surface
}

graph conceptMap {
  layout flow right {
    nodeGap 52
    rankGap 108
    routing curve
  }

  node concept "Concept" {
    shape rounded
    tone hex_7457D9
  }

  node example "Worked example" {
    shape rounded
    tone hex_2F6FED
  }

  node takeaway "Takeaway" {
    shape rounded
    tone hex_138A72
  }

  edge applies: concept.e -> example.w {
    label "Apply"
    line solid 2
    arrow end
    tone hex_2F6FED
    routing curve
  }

  edge generalizes: example.e -> takeaway.w {
    label "Generalize"
    line solid 2
    arrow end
    tone hex_138A72
    routing curve
  }
}

story conceptStory {
  initial {
    hide conceptMap.*
    camera fit(conceptMap) padding 80
  }

  scene principle "Name the concept" duration 1400ms {
    action showConcept: show concept via pop
    action focusConcept: highlight concept tone hex_7457D9 effect pulse
    say "Give the audience a clear name for the idea first."
  }

  scene practice "Work an example" duration 1600ms {
    action showExample: show example via slide(from: right, distance: 52)
    action showApplies: show applies via fade
    action traceApplies: draw applies via trace flow particles
    say "A concrete example turns an abstract idea into a usable model."
  }

  scene close "Land the takeaway" duration 1500ms {
    action showTakeaway: show takeaway via pop
    action showGeneralizes: show generalizes via fade
    action traceGeneralizes: draw generalizes via trace flow particles
    action focusTakeaway: highlight takeaway tone hex_138A72 effect glow
    say "End by naming what transfers beyond the example."
  }
}
`,
  },
  ...COMPLEX_STUDIO_EXAMPLES,
];
