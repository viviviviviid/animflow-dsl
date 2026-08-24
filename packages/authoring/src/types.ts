import type { Diagnostic, RenderPlan, SourceRange } from "@animflow-dsl/model";

export interface DurationDraft {
  readonly value: number;
  readonly unit: "ms" | "s";
}

export interface CanvasDraft {
  readonly width: number;
  readonly height: number;
  readonly theme: string;
  readonly background: string;
}

export interface FlowLayoutDraft {
  readonly direction: "right" | "left" | "down" | "up";
  readonly nodeGap?: number;
  readonly rankGap?: number;
  readonly routing?: "straight" | "orthogonal" | "curve";
}

export interface NodeDraft {
  readonly label: string;
  readonly shape?: "rectangle" | "rounded" | "pill" | "diamond" | "circle" | "database" | "document" | "parallelogram";
  readonly tone?: string;
}

export interface NodePositionDraft {
  readonly x: number;
  readonly y: number;
  readonly pinned?: boolean;
}

export interface EdgeEndpointDraft {
  readonly node: string;
  readonly port: "auto" | "n" | "e" | "s" | "w";
}

export interface EdgeDraft {
  readonly from: EdgeEndpointDraft;
  readonly to: EdgeEndpointDraft;
  readonly label?: string;
  readonly line?: {
    readonly pattern: "solid" | "dashed" | "dotted";
    readonly width: number;
  };
  readonly arrow?: "none" | "start" | "end" | "both";
  readonly tone?: string;
  readonly routing?: "straight" | "orthogonal" | "curve";
  readonly flow?: "none" | "particles" | "dash" | "glow" | "wave" | "arrow" | "lightning";
}

export interface OverlayDraft {
  readonly kind: "callout" | "card" | "badge" | "text";
  readonly anchor: EdgeEndpointDraft;
  readonly text: string;
  readonly width?: number;
  readonly tone?: string;
}

export type RenamableDeclarationKind =
  | "graph"
  | "node"
  | "edge"
  | "overlay"
  | "story"
  | "scene"
  | "action";

export type TargetDraft =
  | { readonly kind: "named"; readonly target: string; readonly wildcard?: boolean }
  | { readonly kind: "list"; readonly elements: readonly [string, ...string[]] };

export type VisibilityTransitionDraft =
  | { readonly kind: "fade" | "pop" | "flip" }
  | {
      readonly kind: "slide";
      readonly from: "left" | "right" | "up" | "down";
      readonly distance?: number;
    };

export interface NestedStatementDraft {
  readonly kind: "action";
  readonly actionId: string;
  readonly action: ActionDraft;
}

export type ActionDraft =
  | {
      readonly kind: "show" | "hide";
      readonly targets: TargetDraft;
      readonly transition: VisibilityTransitionDraft;
    }
  | {
      readonly kind: "draw";
      readonly edge: string;
      readonly flow?: "none" | "particles" | "dash" | "glow" | "wave" | "arrow" | "lightning";
    }
  | {
      readonly kind: "highlight";
      readonly target: string;
      readonly tone: string;
      readonly effect?: "glow" | "pulse";
    }
  | { readonly kind: "clear-highlight"; readonly target: string }
  | {
      readonly kind: "camera";
      readonly operation: "fit" | "focus";
      readonly targets: TargetDraft;
      readonly padding?: number;
    }
  | { readonly kind: "sequence"; readonly statements: readonly NestedStatementDraft[] }
  | {
      readonly kind: "stagger";
      readonly interval: DurationDraft;
      readonly statements: readonly NestedStatementDraft[];
    };

export type AuthoringCommand = { readonly baseRevision: number } & (
  | { readonly type: "source.replace"; readonly source: string }
  | { readonly type: "canvas.update"; readonly replacement: CanvasDraft }
  | {
      readonly type: "graph.add";
      readonly graphId: string;
      readonly layout: FlowLayoutDraft;
      readonly index?: number;
    }
  | { readonly type: "graph.update"; readonly graphId: string; readonly layout: FlowLayoutDraft }
  | { readonly type: "graph.remove"; readonly graphId: string }
  | {
      readonly type: "node.add";
      readonly graphId: string;
      readonly nodeId: string;
      readonly node: NodeDraft;
      readonly index?: number;
    }
  | { readonly type: "node.update"; readonly nodeId: string; readonly replacement: NodeDraft }
  | { readonly type: "node.remove"; readonly nodeId: string }
  | { readonly type: "node.position.set"; readonly nodeId: string; readonly position: NodePositionDraft }
  | { readonly type: "node.position.clear"; readonly nodeId: string }
  | {
      readonly type: "layout.positions.set";
      readonly graphId: string;
      readonly positions: readonly ({ readonly nodeId: string } & NodePositionDraft)[];
      readonly replace?: boolean;
    }
  | { readonly type: "layout.optimize"; readonly graphId: string }
  | {
      readonly type: "edge.add";
      readonly graphId: string;
      readonly edgeId: string;
      readonly edge: EdgeDraft;
      readonly index?: number;
    }
  | { readonly type: "edge.update"; readonly edgeId: string; readonly replacement: EdgeDraft }
  | { readonly type: "edge.remove"; readonly edgeId: string }
  | {
      readonly type: "overlay.add";
      readonly overlayId: string;
      readonly overlay: OverlayDraft;
      readonly index?: number;
    }
  | { readonly type: "overlay.update"; readonly overlayId: string; readonly replacement: OverlayDraft }
  | { readonly type: "overlay.remove"; readonly overlayId: string }
  | {
      readonly type: "declaration.rename";
      readonly kind: RenamableDeclarationKind;
      readonly id: string;
      readonly newId: string;
    }
  | {
      readonly type: "scene.add";
      readonly sceneId: string;
      readonly title: string;
      readonly duration: DurationDraft;
      readonly index?: number;
      readonly narration?: string;
      readonly actions?: readonly { readonly actionId: string; readonly action: ActionDraft }[];
    }
  | { readonly type: "scene.move"; readonly sceneId: string; readonly index: number }
  | { readonly type: "scene.remove"; readonly sceneId: string }
  | {
      readonly type: "action.add";
      readonly sceneId: string;
      readonly parentActionId?: string;
      readonly actionId: string;
      readonly action: ActionDraft;
      readonly index?: number;
    }
  | { readonly type: "action.update"; readonly actionId: string; readonly replacement: ActionDraft }
  | { readonly type: "action.remove"; readonly actionId: string }
  | { readonly type: "narration.set"; readonly sceneId: string; readonly text: string | null }
);

export interface AuthoringSelection {
  readonly id: string;
  readonly kind: "graph" | "node" | "edge" | "overlay" | "scene" | "action";
  readonly range: SourceRange;
}

export interface AuthoringState {
  readonly source: string;
  readonly documentRevision: number;
  readonly planRevision?: number;
  readonly lastValidPlanRevision?: number;
  readonly plan?: RenderPlan;
  readonly diagnostics: readonly Diagnostic[];
  readonly selection?: AuthoringSelection;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

export type AppliedAuthoringResult = {
  readonly status: "applied-valid" | "applied-invalid-draft";
  readonly transactionId: string;
  readonly documentRevision: number;
  readonly planRevision?: number;
  readonly lastValidPlanRevision?: number;
  readonly source: string;
  readonly diagnostics: readonly Diagnostic[];
};

export interface RejectedAuthoringResult {
  readonly status: "rejected";
  readonly reason: "revision-conflict" | "invalid-semantic-command";
  readonly currentRevision: number;
  readonly diagnostics: readonly Diagnostic[];
}

export type AuthoringResult = AppliedAuthoringResult | RejectedAuthoringResult;

export interface HistoryRequest {
  readonly baseRevision: number;
}
