// ============================================
// Core Type Definitions for AnimDiagram DSL
// ============================================

// ----- Diagram Types -----

export type DiagramType = "flowchart";
export type FlowchartDirection = "LR" | "RL" | "TD" | "BT";

// ----- Node Types -----

export type NodeShape =
  | "terminator"    // ([text])
  | "rectangle"     // [text]
  | "diamond"       // {text}
  | "parallelogram" // [/text/]
  | "database"      // [(text)]
  | "document";     // [[text]]

export interface DiagramNode {
  id: string;
  shape: NodeShape;
  label: string;
  subtitle?: string;
  position?: { x: number; y: number };
  width?: number;
  height?: number;
  style?: NodeStyle;
}

export interface NodeStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  color?: string;
  fontSize?: number;
  fontWeight?: string;
  borderRadius?: number;
  shadow?: string;
}

// ----- Edge Types -----

export type EdgeStyle = "solid" | "dashed" | "dotted" | "thick";
export type ArrowType = "single" | "double" | "none";

export interface DiagramEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  style?: EdgeStyle;
  arrow?: ArrowType;
  points?: { x: number; y: number }[];
}

// ----- Animation Types -----

export type AnimationAction =
  | "show"
  | "hide"
  | "highlight"
  | "unhighlight"
  | "connect"
  | "move"
  | "transform"
  | "camera"
  | "annotate";

export type EntranceEffect =
  | "fadeIn"
  | "slideInLeft"
  | "slideInRight"
  | "slideInTop"
  | "slideInBottom"
  | "scaleIn"
  | "bounceIn"
  | "flipIn"
  | "rotateIn";

export type EmphasisEffect =
  | "pulse"
  | "shake"
  | "bounce"
  | "flash"
  | "glow"
  | "wave";

export type FlowEffect =
  | "particles"
  | "dash"
  | "glow"
  | "wave"
  | "arrow"
  | "lightning";

export type ExitEffect =
  | "fadeOut"
  | "slideOutLeft"
  | "slideOutRight"
  | "scaleOut"
  | "bounceOut";

export type CameraAction = "focus" | "fitAll" | "fitNodes" | "zoom" | "pan";

export interface AnimationStep {
  step: number;
  action: AnimationAction;
  targets: string[];
  properties: AnimationProperties;
}

export interface AnimationProperties {
  // Common
  duration?: string;
  delay?: string;
  easing?: string;

  // Show/Hide
  effect?: EntranceEffect | ExitEffect;
  stagger?: string;

  // Highlight
  color?: string;
  glow?: boolean;
  pulse?: boolean;
  flash?: boolean;

  // Connect
  flow?: FlowEffect;
  speed?: string;
  particleCount?: number;

  // Move
  to?: [number, number];
  by?: [number, number];

  // Transform
  scale?: number;
  rotate?: string;

  // Camera
  cameraAction?: CameraAction;
  zoom?: string;
  padding?: string;

  // Annotate
  text?: string;
  position?: "top" | "bottom" | "left" | "right";
}

// ----- Narration Types -----

export interface NarrationItem {
  step: number;
  title: string;
  text: string;
  voice?: "none" | "male" | "female";
}

// ----- Config Types -----

export interface DiagramConfig {
  autoplay?: boolean;
  loop?: boolean;
  speed?: number;
  controls?: boolean;
  timeline?: boolean;
  narration?: boolean;
  width?: number;
  height?: number;
  background?: string;
  padding?: string;
  quality?: "low" | "medium" | "high" | "ultra";
  fps?: number;
  export?: {
    format?: "mp4" | "gif" | "webm";
    resolution?: "720p" | "1080p" | "4k";
  };
}

// ----- Complete Diagram Data -----

export interface DiagramData {
  metadata: {
    id: string;
    title?: string;
    type: DiagramType;
    direction?: FlowchartDirection;
    created?: string;
    modified?: string;
  };
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  animations: AnimationStep[];
  styles?: Record<string, NodeStyle>;
  narrations: NarrationItem[];
  config: DiagramConfig;
}

// ----- Parser Types -----

export interface ParseResult {
  success: boolean;
  data?: DiagramData;
  errors?: ParseError[];
}

export interface ParseError {
  line: number;
  column: number;
  message: string;
  type: "syntax" | "semantic";
}

// ----- DSL Sections -----

export interface DslSections {
  diagram: string;
  animation?: string;
  style?: string;
  narration?: string;
  config?: string;
}
