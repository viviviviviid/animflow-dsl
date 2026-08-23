import type { Rect, RgbaColor, Vec2 } from "./geometry";
import type { ActionId, ElementHandle, SceneId, ThemeToken } from "./ids";
import type { EdgeFlowEffect } from "./elements";

export type EasingName =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "spring";

export interface TransformState {
  readonly translate: Vec2;
  readonly scale: Vec2;
  readonly rotationDeg: number;
}

export interface HighlightState {
  readonly active: boolean;
  readonly tone: ThemeToken;
  readonly intensity: number;
}

interface BaseElementFrameState {
  readonly handle: ElementHandle;
  readonly opacity: number;
  readonly transform: TransformState;
  readonly highlight: HighlightState;
  readonly resolvedColor?: RgbaColor;
}

export interface NodeFrameState extends BaseElementFrameState {
  readonly kind: "node";
}

export interface EdgeFrameState extends BaseElementFrameState {
  readonly kind: "edge";
  readonly drawProgress: number;
  readonly flowPhase: number;
  readonly flowEffect?: EdgeFlowEffect;
}

export interface OverlayFrameState extends BaseElementFrameState {
  readonly kind: "overlay";
}

export type ElementFrameState =
  | NodeFrameState
  | EdgeFrameState
  | OverlayFrameState;

export interface CameraFrameState {
  readonly viewBox: Rect;
}

export interface NarrationFrameState {
  readonly sceneId: SceneId;
  readonly text: string;
}

export interface SceneSnapshot {
  readonly elements: readonly ElementFrameState[];
  readonly camera: CameraFrameState;
  readonly narration?: NarrationFrameState;
}

export type ElementNumberProperty =
  | "opacity"
  | "transform.translate.x"
  | "transform.translate.y"
  | "transform.scale.x"
  | "transform.scale.y"
  | "transform.rotationDeg"
  | "highlight.intensity"
  | "drawProgress"
  | "flowPhase";

export type ElementBooleanProperty = "highlight.active";
export type ElementTokenProperty = "highlight.tone";

interface BaseTrack {
  readonly actionId?: ActionId;
  readonly startMs: number;
  readonly durationMs: number;
  readonly easing: EasingName;
}

export interface ElementNumberTrack extends BaseTrack {
  readonly kind: "element-number";
  readonly handle: ElementHandle;
  readonly property: ElementNumberProperty;
  readonly from: number;
  readonly to: number;
}

export interface ElementBooleanTrack extends BaseTrack {
  readonly kind: "element-boolean";
  readonly handle: ElementHandle;
  readonly property: ElementBooleanProperty;
  readonly from: boolean;
  readonly to: boolean;
}

export interface ElementTokenTrack extends BaseTrack {
  readonly kind: "element-token";
  readonly handle: ElementHandle;
  readonly property: ElementTokenProperty;
  readonly from: ThemeToken;
  readonly to: ThemeToken;
}

export interface ElementColorTrack extends BaseTrack {
  readonly kind: "element-color";
  readonly handle: ElementHandle;
  readonly property: "resolvedColor";
  readonly from: RgbaColor;
  readonly to: RgbaColor;
}

export interface ElementFlowEffectTrack extends BaseTrack {
  readonly kind: "element-flow-effect";
  readonly handle: ElementHandle;
  readonly property: "flowEffect";
  readonly from: EdgeFlowEffect;
  readonly to: EdgeFlowEffect;
}

export interface CameraRectTrack extends BaseTrack {
  readonly kind: "camera-rect";
  readonly property: "viewBox";
  readonly from: Rect;
  readonly to: Rect;
}

export type AnimationTrack =
  | ElementNumberTrack
  | ElementBooleanTrack
  | ElementTokenTrack
  | ElementColorTrack
  | ElementFlowEffectTrack
  | CameraRectTrack;

export interface CompiledScene {
  readonly id: SceneId;
  readonly title: string;
  readonly startMs: number;
  readonly durationMs: number;
  readonly from: SceneSnapshot;
  readonly to: SceneSnapshot;
  readonly tracks: readonly AnimationTrack[];
}

export interface FrameState extends SceneSnapshot {
  readonly timeMs: number;
  readonly sceneId: SceneId | null;
  readonly progress: number;
}
