import type { Diagnostic, RenderPlan, SourceRange } from "@animflow-dsl/model";

export interface DurationDraft {
  readonly value: number;
  readonly unit: "ms" | "s";
}

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
