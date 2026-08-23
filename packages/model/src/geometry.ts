import type { ElementHandle, ThemeToken } from "./ids";

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface Rect extends Vec2, Size {}

export interface RgbaColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

export type PortName = "auto" | "n" | "e" | "s" | "w";
export type EdgeRouting = "straight" | "orthogonal" | "curve";
export type ArrowPlacement = "none" | "start" | "end" | "both";
export type LinePattern = "solid" | "dashed" | "dotted";

export type PathCommand =
  | { readonly kind: "move"; readonly to: Vec2 }
  | { readonly kind: "line"; readonly to: Vec2 }
  | {
      readonly kind: "cubic";
      readonly control1: Vec2;
      readonly control2: Vec2;
      readonly to: Vec2;
    }
  | { readonly kind: "close" };

export interface CompiledPath {
  readonly commands: readonly PathCommand[];
  readonly startTangent: Vec2;
  readonly endTangent: Vec2;
  readonly length: number;
}

export interface TextGeometry {
  readonly bounds: Rect;
  readonly baseline: number;
  readonly lines: readonly string[];
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly fontWeight: number;
}

export interface NodeGeometry {
  readonly kind: "node";
  readonly handle: ElementHandle;
  readonly bounds: Rect;
  readonly outline: CompiledPath;
  readonly label: TextGeometry;
}

export interface EdgeGeometry {
  readonly kind: "edge";
  readonly handle: ElementHandle;
  readonly path: CompiledPath;
  readonly label?: TextGeometry;
  readonly markerSize: number;
}

export interface OverlayGeometry {
  readonly kind: "overlay";
  readonly handle: ElementHandle;
  readonly bounds: Rect;
  readonly connector?: CompiledPath;
  readonly text: TextGeometry;
}

export type ElementGeometry = NodeGeometry | EdgeGeometry | OverlayGeometry;

export interface ResolvedTheme {
  readonly name: string;
  readonly colors: Readonly<Record<ThemeToken, RgbaColor>>;
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly fontWeight: number;
}
