import type {
  EdgeId,
  ElementHandle,
  GraphId,
  NodeId,
  OverlayId,
  ThemeToken,
} from "./ids";
import type {
  ArrowPlacement,
  EdgeRouting,
  LinePattern,
  PortName,
  Rect,
  Vec2,
} from "./geometry";

export type NodeShape =
  | "rectangle"
  | "rounded"
  | "pill"
  | "diamond"
  | "circle"
  | "database"
  | "document"
  | "parallelogram";

export type OverlayKind = "callout" | "card" | "badge" | "text";
export type EdgeFlowEffect =
  | "none"
  | "particles"
  | "dash"
  | "glow"
  | "wave"
  | "arrow"
  | "lightning";

export interface NodeEndpoint {
  readonly nodeId: NodeId;
  readonly port: PortName;
}

export interface CompiledNode {
  readonly kind: "node";
  readonly id: NodeId;
  readonly handle: ElementHandle;
  readonly graphId: GraphId;
  readonly label: string;
  readonly shape: NodeShape;
  readonly tone: ThemeToken;
}

export interface CompiledEdge {
  readonly kind: "edge";
  readonly id: EdgeId;
  readonly handle: ElementHandle;
  readonly graphId: GraphId;
  readonly from: NodeEndpoint;
  readonly to: NodeEndpoint;
  readonly label?: string;
  readonly routing: EdgeRouting;
  readonly arrow: ArrowPlacement;
  readonly linePattern: LinePattern;
  readonly lineWidth: number;
  readonly tone: ThemeToken;
  readonly flowEffect?: EdgeFlowEffect;
}

export type OverlayAnchor =
  | {
      readonly kind: "node";
      readonly target: NodeEndpoint;
      readonly offset: Vec2;
    }
  | {
      readonly kind: "viewport";
      readonly point: Vec2;
    };

export interface CompiledOverlay {
  readonly kind: "overlay";
  readonly id: OverlayId;
  readonly handle: ElementHandle;
  readonly overlayKind: OverlayKind;
  readonly anchor: OverlayAnchor;
  readonly text: string;
  readonly tone: ThemeToken;
  readonly width: number;
}

export type CompiledElement = CompiledNode | CompiledEdge | CompiledOverlay;

export interface CanvasSpec {
  readonly width: number;
  readonly height: number;
  readonly background: ThemeToken;
  readonly viewport: Rect;
}
