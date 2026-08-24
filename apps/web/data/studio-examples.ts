import { COMPLEX_STUDIO_EXAMPLES } from "./complex-studio-examples";

export interface StudioExample {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly description: string;
  readonly source: string;
}

export const BLANK_STUDIO_SOURCE = `animflow 2.2

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
    shape diamond
    tone hex_2F6FED
  }

  node example "Worked example" {
    shape rounded
    tone hex_7457D9
  }

  node misconception "Common misconception" {
    shape rounded
    tone hex_D97732
  }

  node outcome "Learning outcome" {
    shape document
    tone hex_138A72
  }

  edge applies: idea.e -> example.w {
    label "Apply"
    line solid 2
    arrow end
    tone hex_2F6FED
    routing curve
  }

  edge contrasts: idea.e -> misconception.w {
    label "Contrast"
    line dashed 2
    arrow end
    tone hex_D97732
    routing curve
  }

  edge exampleOutcome: example.e -> outcome.w {
    label "Demonstrate"
    line solid 2
    arrow end
    tone hex_7457D9
    routing curve
  }

  edge misconceptionOutcome: misconception.e -> outcome.w {
    label "Correct"
    line dashed 2
    arrow end
    tone hex_D97732
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

  scene branches "Build two teaching paths" duration 1900ms {
    action showExample: show example via slide(from: up, distance: 48)
    action showMisconception: show misconception via slide(from: down, distance: 48)
    action showApplies: show applies via fade
    action traceApplies: draw applies via trace flow particles
    action showContrasts: show contrasts via fade
    action traceContrasts: draw contrasts via trace flow dash
    say "Use one branch for a worked example and another for the misconception it corrects."
  }

  scene outcomeScene "Merge the lesson" duration 1800ms {
    action showOutcome: show outcome via slide(from: right, distance: 56)
    action showExampleOutcome: show exampleOutcome via fade
    action traceExampleOutcome: draw exampleOutcome via trace flow particles
    action showMisconceptionOutcome: show misconceptionOutcome via fade
    action traceMisconceptionOutcome: draw misconceptionOutcome via trace flow dash
    say "Merge both paths into the one learning outcome your audience should retain."
  }
}
`;

const STUDIO_EXAMPLE_CATALOG: readonly StudioExample[] = [
  {
    id: "agent-tool-loop",
    title: "AI agent tool routing",
    category: "AI systems",
    description: "Teach how an agent routes work across tools and merges their evidence into one response.",
    source: `animflow 2.2

canvas {
  size 1600 by 900
  theme signalDesk
  background surface
}

graph agentRouting {
  layout flow right {
    nodeGap 104
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

  node search "Search tool" {
    shape database
    tone hex_138A72
  }

  node code "Code sandbox" {
    shape rounded
    tone hex_D97732
  }

  node evidence "Evidence" {
    shape document
    tone hex_2F6FED
  }

  node response "Grounded response" {
    shape document
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

  edge searchCall: agent.e -> search.w {
    label "Retrieve"
    line dashed 2
    arrow end
    tone hex_138A72
    routing curve
    flow dash
  }

  edge codeCall: agent.e -> code.w {
    label "Execute"
    line dashed 2
    arrow end
    tone hex_D97732
    routing curve
    flow dash
  }

  edge searchEvidence: search.e -> evidence.w {
    label "Sources"
    line solid 2
    arrow end
    tone hex_138A72
    routing curve
    flow particles
  }

  edge codeEvidence: code.e -> evidence.w {
    label "Results"
    line solid 2
    arrow end
    tone hex_D97732
    routing curve
    flow particles
  }

  edge answer: evidence.e -> response.w {
    label "Synthesize"
    line solid 2
    arrow end
    tone hex_2F6FED
    routing curve
    flow glow
  }
}

story agentStory {
  initial {
    hide agentRouting.*
    camera fit(agentRouting) padding 80
  }

  scene actors "Reveal the routing graph" duration 2100ms {
    action revealActors: stagger 180ms {
      action showUser: show user via slide(from: left, distance: 56)
      action showAgent: show agent via pop
      action showSearch: show search via slide(from: up, distance: 48)
      action showCode: show code via slide(from: down, distance: 48)
      action showEvidence: show evidence via pop
      action showResponse: show response via slide(from: right, distance: 56)
    }
    say "An agent can route one intent through multiple capabilities before answering."
  }

  scene understand "Understand the request" duration 1300ms {
    action showPrompt: show prompt via fade
    action tracePrompt: draw prompt via trace flow particles
    action focusAgent: highlight agent tone hex_7457D9 effect pulse
    action frameIntent: camera fit([user, agent]) padding 132
    say "The prompt becomes a decision about what to do next."
  }

  scene useTools "Route across tools" duration 1900ms {
    action showSearchCall: show searchCall via fade
    action traceSearchCall: draw searchCall via trace flow dash
    action showCodeCall: show codeCall via fade
    action traceCodeCall: draw codeCall via trace flow dash
    action focusSearch: highlight search tone hex_138A72 effect glow
    action focusCode: highlight code tone hex_D97732 effect pulse
    action frameTools: camera fit([agent, search, code, evidence]) padding 104
    say "Search and code execution form two explicit branches instead of one opaque tool step."
  }

  scene mergeEvidence "Merge grounded evidence" duration 1900ms {
    action clearSearch: clearHighlight search
    action clearCode: clearHighlight code
    action showSearchEvidence: show searchEvidence via fade
    action traceSearchEvidence: draw searchEvidence via trace flow particles
    action showCodeEvidence: show codeEvidence via fade
    action traceCodeEvidence: draw codeEvidence via trace flow particles
    action showAnswer: show answer via fade
    action traceAnswer: draw answer via trace flow glow
    action focusResponse: highlight response tone hex_138A72 effect glow
    action frameResponse: camera fit([search, code, evidence, response]) padding 104
    say "Both branches merge into inspectable evidence before the grounded response is written."
  }
}
`,
  },
  {
    id: "api-request-lifecycle",
    title: "API request lifecycle",
    category: "Backend",
    description: "Walk through a browser request, API validation, and a database lookup.",
    source: `animflow 2.2

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
    source: `animflow 2.2

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

export const STUDIO_EXAMPLES: readonly StudioExample[] = [
  {
    id: "flowchart-starter",
    title: "Flowchart starter",
    category: "Getting started",
    description: "Learn one clean split-and-merge lesson before opening the full production showcases.",
    source: BLANK_STUDIO_SOURCE,
  },
  ...STUDIO_EXAMPLE_CATALOG.filter(({ id }) =>
    id !== "api-request-lifecycle" && id !== "course-concept-map" && id !== "oauth-pkce"
  ),
];
