import {
  assertValidRenderPlan,
  documentId,
  edgeId,
  elementHandle,
  graphId,
  nodeId,
  overlayId,
  sceneId,
  sourceHash,
  storyId,
  themeToken,
  ZERO_RANGE,
  type AnimationTrack,
  type CompiledEdge,
  type CompiledElement,
  type CompiledNode,
  type CompiledOverlay,
  type Diagnostic,
  type EdgeFrameState,
  type ElementFrameState,
  type ElementGeometry,
  type ElementHandle,
  type EdgeFlowEffect,
  type FrameState,
  type GraphId,
  type NodeFrameState,
  type OverlayFrameState,
  type Rect,
  type RenderPlan,
  type Result,
  type SceneSnapshot,
  type ThemeToken,
  type TransformState,
} from "@animflow-dsl/model";
import {
  isCameraStatement,
  isClearHighlightStatement,
  isDrawStatement,
  isEdge,
  isEdgeArrowProperty,
  isEdgeLabelProperty,
  isEdgeLineProperty,
  isEdgeFlowProperty,
  isEdgeRoutingProperty,
  isEdgeToneProperty,
  isElementListTarget,
  isGraph,
  isHighlightStatement,
  isFlipTransition,
  isNamedTarget,
  isNode,
  isNodeGapSetting,
  isNodeShapeProperty,
  isNodeToneProperty,
  isOverlayAnchorProperty,
  isOverlayTextProperty,
  isOverlayToneProperty,
  isOverlayWidthProperty,
  isRankGapSetting,
  isRoutingSetting,
  isSayStatement,
  isSceneVisibilityStatement,
  isSequenceStatement,
  isSlideTransition,
  isStaggerStatement,
  parseAnimFlow,
  releaseAnimFlowDocument,
  type AnimFlowDocument,
  type CameraStatement,
  type Element as AstElement,
  type Graph,
  type SceneStatement,
  type Selectable,
  type TargetSet,
} from "@animflow-dsl/language";

import {
  boundsForGeometry,
  compileGeometry,
  type GraphLayoutInput,
  unionRects,
} from "./geometry.js";
import { resolveTheme } from "./theme.js";

export interface CompileOptions {
  readonly documentId?: string;
  readonly seed?: number;
}

interface LoweringContext {
  readonly ast: AnimFlowDocument;
  readonly handles: ReadonlyMap<AstElement, ElementHandle>;
  readonly geometry: ReadonlyMap<ElementHandle, ElementGeometry>;
  readonly graphBounds: ReadonlyMap<string, Rect>;
  readonly canvas: Rect;
}

type MutableTransform = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotationDeg: number;
};

interface MutableFrame {
  readonly kind: ElementFrameState["kind"];
  readonly handle: ElementHandle;
  opacity: number;
  transform: MutableTransform;
  highlightActive: boolean;
  highlightTone: ThemeToken;
  highlightIntensity: number;
  drawProgress?: number;
  flowPhase?: number;
  flowEffect?: EdgeFlowEffect;
}

interface MutableState {
  readonly elements: Map<ElementHandle, MutableFrame>;
  camera: Rect;
}

export async function compileAnimFlow(
  source: string,
  options: CompileOptions = {},
): Promise<Result<RenderPlan>> {
  const parsed = await parseAnimFlow(source);
  if (!parsed.ok) return parsed;

  try {
    const plan = await lowerDocument(parsed.value, source, options);
    return { ok: true, value: plan, diagnostics: parsed.diagnostics };
  } catch (error) {
    const diagnostic: Diagnostic = {
      code: "AF501",
      severity: "error",
      message: error instanceof Error ? error.message : String(error),
      range: ZERO_RANGE,
    };
    return { ok: false, diagnostics: [diagnostic] };
  } finally {
    await releaseAnimFlowDocument(parsed.value);
  }
}

export async function lowerDocument(
  ast: AnimFlowDocument,
  source: string,
  options: CompileOptions = {},
): Promise<RenderPlan> {
  const hash = await sha256(source);
  const canvas = canvasSpec(ast);
  const handles = assignHandles(ast);
  const tokens = collectThemeTokens(ast);
  const themeName = ast.canvas.properties.find((property) => property.$type === "CanvasThemeProperty")?.value ?? "default";
  const theme = resolveTheme(themeName, tokens);
  const elements = compileElements(ast, handles);
  const graphInputs = compileGraphInputs(ast, elements);
  const overlays = elements.filter((element): element is CompiledOverlay => element.kind === "overlay");
  const geometryResult = compileGeometry(graphInputs, overlays, theme);
  const geometry = new Map(geometryResult.geometry.map((item) => [item.handle, item]));
  const context: LoweringContext = {
    ast,
    handles,
    geometry,
    graphBounds: geometryResult.graphBounds,
    canvas: canvas.viewport,
  };

  const state = createInitialState(elements, canvas.viewport);
  applyInitial(ast, context, state);
  const initial = snapshot(state);
  const scenes = compileScenes(ast, context, state);
  const durationMs = scenes.reduce((total, scene) => total + scene.durationMs, 0);
  const seed = options.seed ?? Number.parseInt(hash.slice(0, 8), 16);

  const plan: RenderPlan = {
    version: 2,
    documentId: documentId(options.documentId ?? ast.story.name),
    sourceHash: sourceHash(hash),
    storyId: storyId(ast.story.name),
    seed,
    durationMs,
    canvas,
    theme,
    symbols: elements.map((element) => ({ id: element.id, handle: element.handle, kind: element.kind })),
    elements,
    geometry: geometryResult.geometry,
    initial,
    scenes,
  };
  assertValidRenderPlan(plan);
  return deepFreeze(plan);
}

function canvasSpec(ast: AnimFlowDocument): RenderPlan["canvas"] {
  const size = ast.canvas.properties.find((property) => property.$type === "CanvasSizeProperty");
  const background = ast.canvas.properties.find((property) => property.$type === "CanvasBackgroundProperty");
  if (!size || size.$type !== "CanvasSizeProperty" || !background || background.$type !== "CanvasBackgroundProperty") {
    throw new TypeError("Validated canvas properties are missing.");
  }
  return {
    width: size.width,
    height: size.height,
    background: themeToken(background.value),
    viewport: { x: 0, y: 0, width: size.width, height: size.height },
  };
}

function assignHandles(ast: AnimFlowDocument): Map<AstElement, ElementHandle> {
  const handles = new Map<AstElement, ElementHandle>();
  let index = 0;
  for (const graph of ast.graphs) {
    for (const member of graph.members) handles.set(member, elementHandle(index++));
  }
  for (const overlay of ast.overlays) handles.set(overlay, elementHandle(index++));
  return handles;
}

function compileElements(
  ast: AnimFlowDocument,
  handles: ReadonlyMap<AstElement, ElementHandle>,
): CompiledElement[] {
  const elements: CompiledElement[] = [];
  for (const graph of ast.graphs) {
    const id = graphId(graph.name);
    for (const member of graph.members) {
      const handle = requiredHandle(handles, member);
      if (isNode(member)) {
        const shape = member.properties.find(isNodeShapeProperty)?.value ?? "rounded";
        const tone = member.properties.find(isNodeToneProperty)?.value ?? "neutral";
        elements.push({
          kind: "node",
          id: nodeId(member.name),
          handle,
          graphId: id,
          label: member.label,
          shape,
          tone: themeToken(tone),
        });
      } else {
        const from = member.from.ref;
        const to = member.to.ref;
        if (!from || !to) throw new TypeError(`Validated edge ${member.name} has unresolved endpoints.`);
        const line = member.properties.find(isEdgeLineProperty);
        elements.push({
          kind: "edge",
          id: edgeId(member.name),
          handle,
          graphId: id,
          from: { nodeId: nodeId(from.name), port: member.fromPort },
          to: { nodeId: nodeId(to.name), port: member.toPort },
          label: member.properties.find(isEdgeLabelProperty)?.value,
          routing:
            member.properties.find(isEdgeRoutingProperty)?.value ??
            graph.layout.settings.find(isRoutingSetting)?.value ??
            "orthogonal",
          arrow: member.properties.find(isEdgeArrowProperty)?.value ?? "end",
          linePattern: line?.pattern ?? "solid",
          lineWidth: line?.width ?? 2,
          tone: themeToken(member.properties.find(isEdgeToneProperty)?.value ?? "neutral"),
          flowEffect: member.properties.find(isEdgeFlowProperty)?.value ?? "none",
        });
      }
    }
  }

  for (const overlay of ast.overlays) {
    const anchor = overlay.properties.find(isOverlayAnchorProperty);
    const text = overlay.properties.find(isOverlayTextProperty);
    if (!anchor?.node.ref || !text) throw new TypeError(`Validated overlay ${overlay.name} is incomplete.`);
    elements.push({
      kind: "overlay",
      id: overlayId(overlay.name),
      handle: requiredHandle(handles, overlay),
      overlayKind: overlay.overlayKind,
      anchor: {
        kind: "node",
        target: { nodeId: nodeId(anchor.node.ref.name), port: anchor.port },
        offset: { x: 0, y: 0 },
      },
      text: text.value,
      tone: themeToken(overlay.properties.find(isOverlayToneProperty)?.value ?? "neutral"),
      width: overlay.properties.find(isOverlayWidthProperty)?.value ?? 280,
    });
  }
  return elements;
}

function compileGraphInputs(
  ast: AnimFlowDocument,
  elements: readonly CompiledElement[],
): GraphLayoutInput[] {
  return ast.graphs.map((graph) => ({
    id: graph.name,
    direction: graph.layout.direction,
    nodeGap: graph.layout.settings.find(isNodeGapSetting)?.value ?? 40,
    rankGap: graph.layout.settings.find(isRankGapSetting)?.value ?? 80,
    nodes: elements.filter(
      (element): element is CompiledNode => element.kind === "node" && element.graphId === graph.name,
    ),
    edges: elements.filter(
      (element): element is CompiledEdge => element.kind === "edge" && element.graphId === graph.name,
    ),
  }));
}

function collectThemeTokens(ast: AnimFlowDocument): Set<string> {
  const tokens = new Set(["neutral", "accent", "surface"]);
  for (const property of ast.canvas.properties) {
    if (property.$type === "CanvasBackgroundProperty") tokens.add(property.value);
  }
  for (const graph of ast.graphs) {
    for (const member of graph.members) {
      for (const property of member.properties) {
        if (property.$type === "NodeToneProperty" || property.$type === "EdgeToneProperty") tokens.add(property.value);
      }
    }
  }
  for (const overlay of ast.overlays) {
    const tone = overlay.properties.find(isOverlayToneProperty)?.value;
    if (tone) tokens.add(tone);
  }
  for (const scene of ast.story.scenes) {
    for (const statement of walkStatements(scene.statements)) {
      if (isHighlightStatement(statement)) tokens.add(statement.tone);
    }
  }
  return tokens;
}

function createInitialState(elements: readonly CompiledElement[], camera: Rect): MutableState {
  const frames = new Map<ElementHandle, MutableFrame>();
  for (const element of elements) {
    frames.set(element.handle, {
      kind: element.kind,
      handle: element.handle,
      opacity: 0,
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotationDeg: 0 },
      highlightActive: false,
      highlightTone: themeToken("accent"),
      highlightIntensity: 0,
      drawProgress: element.kind === "edge" ? 0 : undefined,
      flowPhase: element.kind === "edge" ? 0 : undefined,
      flowEffect: element.kind === "edge" ? element.flowEffect ?? "none" : undefined,
    });
  }
  return { elements: frames, camera: { ...camera } };
}

function applyInitial(ast: AnimFlowDocument, context: LoweringContext, state: MutableState): void {
  for (const statement of ast.story.initial.statements) {
    if (isCameraStatement(statement)) {
      state.camera = cameraRect(statement, context);
    } else {
      for (const target of expandTarget(statement.targets)) {
        if (isGraph(target)) continue;
        const handle = context.handles.get(target);
        const frame = handle === undefined ? undefined : state.elements.get(handle);
        if (frame) frame.opacity = statement.action === "show" ? 1 : 0;
      }
    }
  }
}

function compileScenes(
  ast: AnimFlowDocument,
  context: LoweringContext,
  state: MutableState,
): RenderPlan["scenes"] {
  const scenes: RenderPlan["scenes"][number][] = [];
  let startMs = 0;
  for (const scene of ast.story.scenes) {
    const durationMs = scene.duration.unit === "s" ? scene.duration.value * 1000 : scene.duration.value;
    const narration = scene.statements.find(isSayStatement)?.text;
    const narrationState = narration ? { sceneId: sceneId(scene.name), text: narration } : undefined;
    const from = snapshot(state, narrationState);
    const tracks: AnimationTrack[] = [];
    for (const statement of scene.statements) {
      applySceneStatement(statement, 0, durationMs, context, state, tracks);
    }
    const to = snapshot(state, narrationState);
    scenes.push({
      id: sceneId(scene.name),
      title: scene.title,
      startMs,
      durationMs,
      from,
      to,
      tracks,
    });
    startMs += durationMs;
  }
  return scenes;
}

function applySceneStatement(
  statement: SceneStatement,
  startMs: number,
  durationMs: number,
  context: LoweringContext,
  state: MutableState,
  tracks: AnimationTrack[],
): void {
  if (isSequenceStatement(statement)) {
    const childDuration = statement.statements.length === 0 ? 0 : durationMs / statement.statements.length;
    statement.statements.forEach((child, index) => {
      applySceneStatement(child, startMs + childDuration * index, childDuration, context, state, tracks);
    });
    return;
  }
  if (isStaggerStatement(statement)) {
    const gapMs = statement.interval.unit === "s"
      ? statement.interval.value * 1000
      : statement.interval.value;
    const childDuration = Math.max(
      0,
      durationMs - gapMs * Math.max(0, statement.statements.length - 1),
    );
    statement.statements.forEach((child, index) => {
      applySceneStatement(child, startMs + gapMs * index, childDuration, context, state, tracks);
    });
    return;
  }
  if (isSayStatement(statement)) return;

  if (isSceneVisibilityStatement(statement)) {
    for (const target of expandTarget(statement.targets)) {
      if (isGraph(target)) continue;
      const frame = frameFor(context, state, target);
      if (!frame) continue;
      const visible = statement.action === "show";
      const wasVisible = frame.opacity > 0;
      tracks.push({
        kind: "element-number",
        handle: frame.handle,
        property: "opacity",
        from: frame.opacity,
        to: visible ? 1 : 0,
        startMs,
        durationMs,
        easing: statement.transition.$type === "PopTransition" ? "spring" : "easeInOut",
      });
      frame.opacity = visible ? 1 : 0;

      if (statement.transition.$type === "PopTransition") {
        const from = visible && !wasVisible ? 0.82 : frame.transform.scaleX;
        const to = visible ? 1 : 0.82;
        for (const property of ["transform.scale.x", "transform.scale.y"] as const) {
          tracks.push({ kind: "element-number", handle: frame.handle, property, from, to, startMs, durationMs, easing: "spring" });
        }
        frame.transform.scaleX = to;
        frame.transform.scaleY = to;
      } else if (isFlipTransition(statement.transition)) {
        const from = visible && !wasVisible ? -90 : frame.transform.rotationDeg;
        const to = visible ? 0 : 90;
        tracks.push({ kind: "element-number", handle: frame.handle, property: "transform.rotationDeg", from, to, startMs, durationMs, easing: "easeOut" });
        frame.transform.rotationDeg = to;
      } else if (isSlideTransition(statement.transition)) {
        applySlide(frame, visible, statement.transition.from, statement.transition.distance ?? 48, startMs, durationMs, tracks);
      }
    }
    return;
  }

  if (isDrawStatement(statement)) {
    const target = statement.edge.ref;
    const frame = target ? frameFor(context, state, target) : undefined;
    if (frame?.kind === "edge") {
      const flowEffect = statement.flow ?? frame.flowEffect ?? "none";
      tracks.push({ kind: "element-flow-effect", handle: frame.handle, property: "flowEffect", from: frame.flowEffect ?? "none", to: flowEffect, startMs, durationMs: 0, easing: "linear" });
      tracks.push({ kind: "element-number", handle: frame.handle, property: "drawProgress", from: frame.drawProgress ?? 0, to: 1, startMs, durationMs, easing: "linear" });
      tracks.push({ kind: "element-number", handle: frame.handle, property: "flowPhase", from: 0, to: 1, startMs, durationMs, easing: "linear" });
      frame.drawProgress = 1;
      frame.flowPhase = 1;
      frame.flowEffect = flowEffect;
    }
    return;
  }

  if (isHighlightStatement(statement)) {
    const target = statement.target.ref;
    const frame = target ? frameFor(context, state, target) : undefined;
    if (!frame) return;
    const tone = themeToken(statement.tone);
    tracks.push(
      { kind: "element-token", handle: frame.handle, property: "highlight.tone", from: frame.highlightTone, to: tone, startMs, durationMs: 0, easing: "linear" },
      { kind: "element-boolean", handle: frame.handle, property: "highlight.active", from: frame.highlightActive, to: true, startMs, durationMs: 0, easing: "linear" },
    );
    if (statement.effect === "pulse") {
      const quarter = durationMs / 4;
      tracks.push(
        { kind: "element-number", handle: frame.handle, property: "highlight.intensity", from: frame.highlightIntensity, to: 1, startMs, durationMs: quarter, easing: "easeOut" },
        { kind: "element-number", handle: frame.handle, property: "highlight.intensity", from: 1, to: 0.35, startMs: startMs + quarter, durationMs: quarter * 2, easing: "easeInOut" },
        { kind: "element-number", handle: frame.handle, property: "highlight.intensity", from: 0.35, to: 1, startMs: startMs + quarter * 3, durationMs: quarter, easing: "easeOut" },
      );
    } else {
      tracks.push({ kind: "element-number", handle: frame.handle, property: "highlight.intensity", from: frame.highlightIntensity, to: 1, startMs, durationMs, easing: "easeOut" });
    }
    frame.highlightTone = tone;
    frame.highlightActive = true;
    frame.highlightIntensity = 1;
    return;
  }

  if (isClearHighlightStatement(statement)) {
    const target = statement.target.ref;
    const frame = target ? frameFor(context, state, target) : undefined;
    if (!frame) return;
    tracks.push(
      { kind: "element-number", handle: frame.handle, property: "highlight.intensity", from: frame.highlightIntensity, to: 0, startMs, durationMs, easing: "easeOut" },
      { kind: "element-boolean", handle: frame.handle, property: "highlight.active", from: frame.highlightActive, to: false, startMs: startMs + durationMs, durationMs: 0, easing: "linear" },
    );
    frame.highlightActive = false;
    frame.highlightIntensity = 0;
    return;
  }

  if (isCameraStatement(statement)) {
    const target = cameraRect(statement, context);
    tracks.push({ kind: "camera-rect", property: "viewBox", from: state.camera, to: target, startMs, durationMs, easing: "easeInOut" });
    state.camera = target;
  }
}

function applySlide(
  frame: MutableFrame,
  visible: boolean,
  direction: "left" | "right" | "up" | "down",
  distance: number,
  startMs: number,
  durationMs: number,
  tracks: AnimationTrack[],
): void {
  const horizontal = direction === "left" || direction === "right";
  const sign = direction === "left" || direction === "up" ? -1 : 1;
  const property = horizontal ? "transform.translate.x" : "transform.translate.y";
  const current = horizontal ? frame.transform.x : frame.transform.y;
  const displaced = sign * distance;
  const from = visible ? displaced : current;
  const to = visible ? 0 : displaced;
  tracks.push({ kind: "element-number", handle: frame.handle, property, from, to, startMs, durationMs, easing: "easeOut" });
  if (horizontal) frame.transform.x = to;
  else frame.transform.y = to;
}

function cameraRect(statement: CameraStatement, context: LoweringContext): Rect {
  const targets = expandTarget(statement.targets);
  const rects = targets.flatMap((target) => {
    if (isGraph(target)) {
      const bounds = context.graphBounds.get(target.name);
      return bounds ? [bounds] : [];
    }
    const handle = context.handles.get(target);
    const item = handle === undefined ? undefined : context.geometry.get(handle);
    return item ? [boundsForGeometry(item)] : [];
  });
  if (rects.length === 0) return { ...context.canvas };
  const bounds = unionRects(rects);
  const padding = statement.padding ?? 40;
  return fitAspect(
    {
      x: bounds.x - padding,
      y: bounds.y - padding,
      width: Math.max(1, bounds.width + padding * 2),
      height: Math.max(1, bounds.height + padding * 2),
    },
    context.canvas.width / context.canvas.height,
  );
}

function fitAspect(rect: Rect, aspect: number): Rect {
  const current = rect.width / rect.height;
  if (Math.abs(current - aspect) < 0.0001) return rect;
  if (current > aspect) {
    const height = rect.width / aspect;
    return { x: rect.x, y: rect.y - (height - rect.height) / 2, width: rect.width, height };
  }
  const width = rect.height * aspect;
  return { x: rect.x - (width - rect.width) / 2, y: rect.y, width, height: rect.height };
}

function expandTarget(target: TargetSet): Array<AstElement | Graph> {
  if (isElementListTarget(target)) {
    return target.elements.flatMap((reference) => (reference.ref ? [reference.ref] : []));
  }
  const resolved = target.target.ref;
  if (!resolved) return [];
  if (isGraph(resolved)) {
    if (target.wildcard) {
      return resolved.members.filter((member) => isNode(member) || isEdge(member));
    }
    return [resolved];
  }
  return [resolved];
}

function frameFor(
  context: LoweringContext,
  state: MutableState,
  element: AstElement,
): MutableFrame | undefined {
  const handle = context.handles.get(element);
  return handle === undefined ? undefined : state.elements.get(handle);
}

function snapshot(
  state: MutableState,
  narration?: SceneSnapshot["narration"],
): SceneSnapshot {
  return {
    elements: [...state.elements.values()]
      .sort((left, right) => left.handle - right.handle)
      .map(toFrameState),
    camera: { viewBox: { ...state.camera } },
    narration,
  };
}

function toFrameState(frame: MutableFrame): ElementFrameState {
  const base = {
    kind: frame.kind,
    handle: frame.handle,
    opacity: frame.opacity,
    transform: {
      translate: { x: frame.transform.x, y: frame.transform.y },
      scale: { x: frame.transform.scaleX, y: frame.transform.scaleY },
      rotationDeg: frame.transform.rotationDeg,
    },
    highlight: {
      active: frame.highlightActive,
      tone: frame.highlightTone,
      intensity: frame.highlightIntensity,
    },
  };
  if (frame.kind === "edge") {
    return { ...base, kind: "edge", drawProgress: frame.drawProgress ?? 0, flowPhase: frame.flowPhase ?? 0, flowEffect: frame.flowEffect ?? "none" };
  }
  return frame.kind === "node" ? { ...base, kind: "node" } : { ...base, kind: "overlay" };
}

function requiredHandle(
  handles: ReadonlyMap<AstElement, ElementHandle>,
  element: AstElement,
): ElementHandle {
  const handle = handles.get(element);
  if (handle === undefined) throw new TypeError(`Missing handle for ${element.name}.`);
  return handle;
}

function* walkStatements(statements: readonly SceneStatement[]): Iterable<SceneStatement> {
  for (const statement of statements) {
    yield statement;
    if (isSequenceStatement(statement) || isStaggerStatement(statement)) {
      yield* walkStatements(statement.statements);
    }
  }
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
