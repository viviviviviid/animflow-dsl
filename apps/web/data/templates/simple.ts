import type { Template } from "./index";

export const simpleTemplate: Template = {
  name: "Simple Example",
  description: "Simple example perfect for getting started",
  dsl: `flowchart LR
  A[Start]
  B[Process]
  C[End]

  A --> B
  B --> C

@animation
  step 1: show A
    name: "Show Start Node"
    description: "Display node A on screen."
    effect: fadeIn
    duration: 1s

  step 2: highlight A
    name: "Highlight Start"
    description: "Highlight node A."
    color: #2196F3
    glow: true
    duration: 1s

  step 3: connect A->B
    name: "Connect Start to Process"
    description: "Connect flow from A to B."
    flow: particles
    speed: 1.5s

  step 4: show B
    name: "Show Process Node"
    description: "Display node B on screen."
    effect: slideInRight
    duration: 1s

  step 5: highlight B
    name: "Highlight Process"
    description: "Highlight node B."
    color: #FF9800
    pulse: true
    duration: 1s

  step 6: connect B->C
    name: "Connect Process to End"
    description: "Connect flow from B to C."
    flow: particles
    speed: 1.5s

  step 7: show C
    name: "Show End Node"
    description: "Display node C on screen."
    effect: slideInRight
    duration: 1s

  step 8: highlight C
    name: "Highlight End"
    description: "Highlight node C."
    color: #4CAF50
    glow: true
    duration: 1s
@end

@style
  A:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 3px
  B:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 3px
  C:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 3px
@end

@narration
  step 1:
    title: "Beginning of Process"
    text: "Every process has a starting point. Work begins here."

  step 2:
    title: "Start Stage"
    text: "The start node is activated. From here, data or requests flow to the next stage."

  step 3:
    title: "Flow Movement"
    text: "Arrows show how data or work moves from one stage to the next. Processes always proceed in fixed order."

  step 5:
    title: "Processing Stage"
    text: "Actual work happens in the middle 'Process' stage. For example, calculating data, processing requests, or making decisions."

  step 7:
    title: "End Stage"
    text: "When all processing is complete, you reach the end stage. Results are generated and the process finishes."

  step 8:
    title: "Process Complete"
    text: "This is the most basic process flow. Start → Process → End. All complex systems are built from combinations of this basic pattern."
@end

@config
  autoplay: true
  loop: false
  speed: 1.0
  tts: true
  tts-voice: Kyunghoon, InJoon, ko-KR
@end`,
};
