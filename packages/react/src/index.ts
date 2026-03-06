// Main Component
export { AnimflowPlayer } from "./components/AnimflowPlayer";
export type { AnimflowPlayerProps, AnimflowPlayerRef, AnimflowI18n } from "./components/AnimflowPlayer";

// Renderer Components
export { DiagramRenderer } from "./components/renderer/DiagramRenderer";

// Store / Hooks
export { createDiagramStore } from "./store/diagram-store";
export type { DiagramStore, DiagramStoreApi } from "./store/diagram-store";
export { useTTS } from "./hooks/useTTS";

// Core Functions
export { parseDsl } from "./core/parser/dsl-parser";
export { calculateFlowchartLayout } from "./core/layout/flowchart-layout";

// Types
export type {
  DiagramData,
  DiagramNode,
  DiagramEdge,
  AnimationStep,
  NarrationItem,
  DiagramConfig,
  NodeShape,
  EdgeStyle,
  FlowchartDirection,
  AnimationAction,
  AnimationProperties,
  ParseResult,
} from "./core/types";
