import type { CompiledScene, SceneSnapshot } from "./animation";
import type { CanvasSpec, CompiledElement } from "./elements";
import type { ElementGeometry, ResolvedTheme } from "./geometry";
import type {
  ActionId,
  DocumentId,
  ElementHandle,
  ElementId,
  SourceHash,
  SceneId,
  StoryId,
} from "./ids";
import type { AnimFlowSourceVersion, SourceRange } from "./source";

export interface SymbolEntry {
  readonly id: ElementId;
  readonly handle: ElementHandle;
  readonly kind: CompiledElement["kind"];
}

export type ActionKind =
  | "camera"
  | "clear-highlight"
  | "draw"
  | "hide"
  | "highlight"
  | "sequence"
  | "show"
  | "stagger";

export interface ActionProvenance {
  readonly id: ActionId;
  readonly sceneId: SceneId;
  readonly parentActionId?: ActionId;
  readonly kind: ActionKind;
  readonly range: SourceRange;
}

export interface RenderPlanAuthoring {
  readonly sourceVersion: AnimFlowSourceVersion;
  readonly actions: readonly ActionProvenance[];
}

export interface RenderPlan {
  readonly version: 2;
  readonly documentId: DocumentId;
  readonly sourceHash: SourceHash;
  readonly storyId: StoryId;
  readonly authoring?: RenderPlanAuthoring;
  readonly seed: number;
  readonly durationMs: number;
  readonly canvas: CanvasSpec;
  readonly theme: ResolvedTheme;
  readonly symbols: readonly SymbolEntry[];
  readonly elements: readonly CompiledElement[];
  readonly geometry: readonly ElementGeometry[];
  readonly initial: SceneSnapshot;
  readonly scenes: readonly CompiledScene[];
}

export function freezeRenderPlan(plan: RenderPlan): RenderPlan {
  return deepFreeze(plan);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
