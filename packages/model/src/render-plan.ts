import type { CompiledScene, SceneSnapshot } from "./animation";
import type { CanvasSpec, CompiledElement } from "./elements";
import type { ElementGeometry, ResolvedTheme } from "./geometry";
import type {
  DocumentId,
  ElementHandle,
  ElementId,
  SourceHash,
  StoryId,
} from "./ids";

export interface SymbolEntry {
  readonly id: ElementId;
  readonly handle: ElementHandle;
  readonly kind: CompiledElement["kind"];
}

export interface RenderPlan {
  readonly version: 2;
  readonly documentId: DocumentId;
  readonly sourceHash: SourceHash;
  readonly storyId: StoryId;
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
