import type {
  AuthoringCommand,
  AuthoringResult,
  AuthoringSelection,
  HistoryRequest,
} from "@animflow-dsl/authoring";
import type { Diagnostic } from "@animflow-dsl/model";
import type {
  AnimFlowCompletion,
  AnimFlowDefinition,
  AnimFlowHover,
} from "@animflow-dsl/language";

interface LanguagePosition {
  readonly line: number;
  readonly character: number;
}

export interface StudioAuthoringState {
  readonly source: string;
  readonly documentRevision: number;
  readonly planRevision?: number;
  readonly lastValidPlanRevision?: number;
  readonly diagnostics: readonly Diagnostic[];
  readonly selection?: AuthoringSelection;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

export type StudioAuthoringRequest =
  | { readonly type: "init"; readonly requestId: number; readonly source: string }
  | { readonly type: "execute"; readonly requestId: number; readonly command: AuthoringCommand }
  | { readonly type: "undo"; readonly requestId: number; readonly request: HistoryRequest }
  | { readonly type: "redo"; readonly requestId: number; readonly request: HistoryRequest }
  | { readonly type: "select"; readonly requestId: number; readonly id?: string }
  | { readonly type: "import-mermaid"; readonly requestId: number; readonly source: string }
  | { readonly type: "complete"; readonly requestId: number; readonly source: string; readonly position: LanguagePosition }
  | { readonly type: "define"; readonly requestId: number; readonly source: string; readonly position: LanguagePosition }
  | { readonly type: "hover"; readonly requestId: number; readonly source: string; readonly position: LanguagePosition };

export type StudioAuthoringResponse =
  | {
      readonly type: "result";
      readonly requestId: number;
      readonly state: StudioAuthoringState;
      readonly result?: AuthoringResult;
      readonly completions?: readonly AnimFlowCompletion[];
      readonly definitions?: readonly AnimFlowDefinition[];
      readonly hover?: AnimFlowHover;
    }
  | {
      readonly type: "error";
      readonly requestId: number;
      readonly message: string;
      readonly diagnostics?: readonly Diagnostic[];
    };
