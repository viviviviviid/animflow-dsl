import type {
  AnimationTrack,
  ElementFrameState,
  ElementHandle,
  FrameState,
  Rect,
  RenderPlan,
  RgbaColor,
  SceneSnapshot,
  ThemeToken,
  EdgeFlowEffect,
} from "@animflow-dsl/model";

import { clamp, ease } from "./easing.js";

interface MutableFrameBase {
  handle: ElementHandle;
  opacity: number;
  transform: {
    translate: { x: number; y: number };
    scale: { x: number; y: number };
    rotationDeg: number;
  };
  highlight: { active: boolean; tone: ThemeToken; intensity: number };
  resolvedColor?: RgbaColor;
}

type MutableFrame =
  | (MutableFrameBase & { kind: "node" })
  | (MutableFrameBase & { kind: "overlay" })
  | (MutableFrameBase & {
      kind: "edge";
      drawProgress: number;
      flowPhase: number;
      flowEffect?: EdgeFlowEffect;
    });

export function sample(plan: RenderPlan, timeMs: number): FrameState {
  const safeTime = Number.isFinite(timeMs) ? clamp(timeMs, 0, plan.durationMs) : 0;
  if (plan.scenes.length === 0) {
    return frameFromSnapshot(plan.initial, safeTime, null, 0);
  }

  const scene = findScene(plan, safeTime);
  const localTime = clamp(safeTime - scene.startMs, 0, scene.durationMs);
  const progress = scene.durationMs === 0 ? 1 : localTime / scene.durationMs;
  const frames = new Map(
    scene.from.elements.map((frame) => [frame.handle, cloneElementFrame(frame)]),
  );
  let camera = { ...scene.from.camera.viewBox };

  for (const track of scene.tracks) {
    const trackProgress = progressForTrack(track, localTime);
    if (trackProgress === undefined) continue;
    if (track.kind === "camera-rect") {
      camera = interpolateRect(track.from, track.to, ease(track.easing, trackProgress));
      continue;
    }
    const frame = frames.get(track.handle);
    if (!frame) continue;
    applyElementTrack(frame, track, trackProgress);
  }

  return deepFreeze({
    timeMs: safeTime,
    sceneId: scene.id,
    progress,
    elements: [...frames.values()].sort((left, right) => left.handle - right.handle),
    camera: { viewBox: camera },
    narration: scene.from.narration ?? scene.to.narration,
  });
}

function findScene(plan: RenderPlan, timeMs: number): RenderPlan["scenes"][number] {
  if (timeMs >= plan.durationMs) return plan.scenes[plan.scenes.length - 1]!;
  return (
    plan.scenes.find(
      (scene) => timeMs >= scene.startMs && timeMs < scene.startMs + scene.durationMs,
    ) ?? plan.scenes[0]!
  );
}

function progressForTrack(
  track: AnimationTrack,
  localTime: number,
): number | undefined {
  if (localTime < track.startMs) return undefined;
  if (track.durationMs === 0) return 1;
  return clamp((localTime - track.startMs) / track.durationMs, 0, 1);
}

function applyElementTrack(
  frame: MutableFrame,
  track: Exclude<AnimationTrack, { kind: "camera-rect" }>,
  progress: number,
): void {
  if (track.kind === "element-boolean") {
    setBoolean(frame, track.property, progress < 1 ? track.from : track.to);
    return;
  }
  if (track.kind === "element-token") {
    setToken(frame, track.property, progress < 1 ? track.from : track.to);
    return;
  }
  if (track.kind === "element-flow-effect") {
    if (frame.kind === "edge") frame.flowEffect = progress < 1 ? track.from : track.to;
    return;
  }
  const eased = ease(track.easing, progress);
  if (track.kind === "element-color") {
    frame.resolvedColor = interpolateColor(track.from, track.to, eased);
    return;
  }
  const value = track.from + (track.to - track.from) * eased;
  setNumber(frame, track.property, value);
}

function setNumber(
  frame: MutableFrame,
  property: Extract<AnimationTrack, { kind: "element-number" }>["property"],
  rawValue: number,
): void {
  const value =
    property === "opacity" ||
    property === "drawProgress" ||
    property === "flowPhase" ||
    property === "highlight.intensity"
      ? clamp(rawValue, 0, 1)
      : rawValue;
  switch (property) {
    case "opacity":
      frame.opacity = value;
      return;
    case "transform.translate.x":
      frame.transform.translate.x = value;
      return;
    case "transform.translate.y":
      frame.transform.translate.y = value;
      return;
    case "transform.scale.x":
      frame.transform.scale.x = value;
      return;
    case "transform.scale.y":
      frame.transform.scale.y = value;
      return;
    case "transform.rotationDeg":
      frame.transform.rotationDeg = value;
      return;
    case "highlight.intensity":
      frame.highlight.intensity = value;
      return;
    case "drawProgress":
      if (frame.kind === "edge") frame.drawProgress = value;
      return;
    case "flowPhase":
      if (frame.kind === "edge") frame.flowPhase = value;
      return;
  }
}

function setBoolean(
  frame: MutableFrame,
  property: "highlight.active",
  value: boolean,
): void {
  if (property === "highlight.active") frame.highlight.active = value;
}

function setToken(
  frame: MutableFrame,
  property: "highlight.tone",
  value: ElementFrameState["highlight"]["tone"],
): void {
  if (property === "highlight.tone") frame.highlight.tone = value;
}

function interpolateRect(from: Rect, to: Rect, progress: number): Rect {
  return {
    x: interpolate(from.x, to.x, progress),
    y: interpolate(from.y, to.y, progress),
    width: interpolate(from.width, to.width, progress),
    height: interpolate(from.height, to.height, progress),
  };
}

function interpolateColor(
  from: RgbaColor,
  to: RgbaColor,
  progress: number,
): RgbaColor {
  return {
    r: interpolate(from.r, to.r, progress),
    g: interpolate(from.g, to.g, progress),
    b: interpolate(from.b, to.b, progress),
    a: interpolate(from.a, to.a, progress),
  };
}

function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function frameFromSnapshot(
  snapshot: SceneSnapshot,
  timeMs: number,
  sceneId: null,
  progress: number,
): FrameState {
  return deepFreeze({
    ...cloneSnapshot(snapshot),
    timeMs,
    sceneId,
    progress,
  });
}

function cloneSnapshot(snapshot: SceneSnapshot): SceneSnapshot {
  return {
    elements: snapshot.elements.map(cloneElementFrame),
    camera: { viewBox: { ...snapshot.camera.viewBox } },
    narration: snapshot.narration ? { ...snapshot.narration } : undefined,
  };
}

function cloneElementFrame(frame: ElementFrameState): MutableFrame {
  const common = {
    ...frame,
    transform: {
      translate: { ...frame.transform.translate },
      scale: { ...frame.transform.scale },
      rotationDeg: frame.transform.rotationDeg,
    },
    highlight: { ...frame.highlight },
    resolvedColor: frame.resolvedColor ? { ...frame.resolvedColor } : undefined,
  };
  if (frame.kind === "edge") {
    return {
      ...common,
      kind: "edge",
      drawProgress: frame.drawProgress,
      flowPhase: frame.flowPhase,
      flowEffect: frame.flowEffect,
    };
  }
  return frame.kind === "node"
    ? { ...common, kind: "node" }
    : { ...common, kind: "overlay" };
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
