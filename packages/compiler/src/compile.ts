import {
  ANIMFLOW_DIAGNOSTIC_CODES,
  actionId,
  assertValidRenderPlan,
  documentId,
  edgeId,
  elementHandle,
  freezeRenderPlan,
  graphId,
  nodeId,
  overlayId,
  sceneId,
  sourceHash,
  storyId,
  themeToken,
  ZERO_RANGE,
  type AnimationTrack,
  type ActionId,
  type ActionKind,
  type ActionProvenance,
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
  type SourceRange,
  type ThemeToken,
  type TransformState,
} from "@animflow-dsl/model";
import {
  isActionStatement,
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
  isNodePinProperty,
  isNodePositionProperty,
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
  type ParsedAnimFlowDocument as AnimFlowDocument,
  type ActionStatement,
  type CameraStatement,
  type Element as AstElement,
  type Graph,
  type SceneStatement,
  type SceneAction,
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
      code: ANIMFLOW_DIAGNOSTIC_CODES.compileInvariant,
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
  const compiledStory = compileScenes(ast, context, state);
  const scenes = compiledStory.scenes;
  const durationMs = scenes.reduce((total, scene) => total + scene.durationMs, 0);
  const seed = options.seed ?? Number.parseInt(hash.slice(0, 8), 16);

  const plan: RenderPlan = {
    version: 2,
    documentId: documentId(options.documentId ?? ast.story.name),
    sourceHash: sourceHash(hash),
    storyId: storyId(ast.story.name),
    authoring: String(ast.version) === "2.1" || String(ast.version) === "2.2"
      ? { sourceVersion: String(ast.version) as "2.1" | "2.2", actions: compiledStory.actions }
      : undefined,
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
  return freezeRenderPlan(plan);
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
    positions: new Map(
      graph.members.filter(isNode).flatMap((node) => {
        const position = node.properties.find(isNodePositionProperty);
        return position
          ? [[String(nodeId(node.name)), {
              point: { x: position.x, y: position.y },
              pinned: node.properties.some(isNodePinProperty),
            }] as const]
          : [];
      }),
    ),
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
    for (const statement of walkSceneActions(scene.statements)) {
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
      state.camera = cameraRect(statement, context, state);
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

interface CompiledStory {
  readonly scenes: RenderPlan["scenes"];
  readonly actions: readonly ActionProvenance[];
}

function compileScenes(
  ast: AnimFlowDocument,
  context: LoweringContext,
  state: MutableState,
): CompiledStory {
  const scenes: RenderPlan["scenes"][number][] = [];
  const actions: ActionProvenance[] = [];
  let startMs = 0;
  for (const scene of ast.story.scenes) {
    const compiledSceneId = sceneId(scene.name);
    const durationMs = scene.duration.unit === "s" ? scene.duration.value * 1000 : scene.duration.value;
    const narration = scene.statements.find(isSayStatement)?.text;
    const narrationState = narration ? { sceneId: compiledSceneId, text: narration } : undefined;
    const from = snapshot(state, narrationState);
    const tracks: AnimationTrack[] = [];
    if (String(ast.version) === "2.1" || String(ast.version) === "2.2") {
      collectActionProvenance(scene.statements, compiledSceneId, undefined, actions);
    }
    for (const statement of scene.statements) {
      applySceneStatement(statement, 0, durationMs, context, state, tracks);
    }
    const to = snapshot(state, narrationState);
    scenes.push({
      id: compiledSceneId,
      title: scene.title,
      startMs,
      durationMs,
      from,
      to,
      tracks,
    });
    startMs += durationMs;
  }
  return { scenes, actions };
}

function collectActionProvenance(
  statements: readonly SceneStatement[],
  owningSceneId: ReturnType<typeof sceneId>,
  parentActionId: ActionId | undefined,
  target: ActionProvenance[],
): void {
  for (const statement of statements) {
    if (!isActionStatement(statement)) continue;
    const id = actionId(statement.name);
    target.push({
      id,
      sceneId: owningSceneId,
      parentActionId,
      kind: actionKind(statement.body),
      range: actionSourceRange(statement),
    });
    if (isSequenceStatement(statement.body) || isStaggerStatement(statement.body)) {
      collectActionProvenance(statement.body.statements, owningSceneId, id, target);
    }
  }
}

function actionKind(action: SceneAction): ActionKind {
  if (isSceneVisibilityStatement(action)) return action.action;
  if (isDrawStatement(action)) return "draw";
  if (isHighlightStatement(action)) return "highlight";
  if (isClearHighlightStatement(action)) return "clear-highlight";
  if (isCameraStatement(action)) return "camera";
  if (isSequenceStatement(action)) return "sequence";
  return "stagger";
}

function actionSourceRange(statement: ActionStatement): SourceRange {
  const node = statement.$cstNode;
  if (!node) return ZERO_RANGE;
  return {
    start: {
      offset: node.offset,
      line: node.range.start.line,
      character: node.range.start.character,
    },
    end: {
      offset: node.end,
      line: node.range.end.line,
      character: node.range.end.character,
    },
  };
}

function applySceneStatement(
  statement: SceneStatement,
  startMs: number,
  durationMs: number,
  context: LoweringContext,
  state: MutableState,
  tracks: AnimationTrack[],
): void {
  if (isSayStatement(statement)) return;

  const currentActionId = isActionStatement(statement) ? actionId(statement.name) : undefined;
  const action = isActionStatement(statement) ? statement.body : statement;

  if (isSequenceStatement(action)) {
    const childDuration = action.statements.length === 0 ? 0 : durationMs / action.statements.length;
    action.statements.forEach((child, index) => {
      applySceneStatement(child, startMs + childDuration * index, childDuration, context, state, tracks);
    });
    return;
  }
  if (isStaggerStatement(action)) {
    const gapMs = action.interval.unit === "s"
      ? action.interval.value * 1000
      : action.interval.value;
    const childDuration = Math.max(
      0,
      durationMs - gapMs * Math.max(0, action.statements.length - 1),
    );
    action.statements.forEach((child, index) => {
      applySceneStatement(child, startMs + gapMs * index, childDuration, context, state, tracks);
    });
    return;
  }

  if (isSceneVisibilityStatement(action)) {
    for (const target of expandTarget(action.targets)) {
      if (isGraph(target)) continue;
      const frame = frameFor(context, state, target);
      if (!frame) continue;
      const visible = action.action === "show";
      const wasVisible = frame.opacity > 0;
      tracks.push({
        kind: "element-number",
        handle: frame.handle,
        property: "opacity",
        from: frame.opacity,
        to: visible ? 1 : 0,
        startMs,
        durationMs,
        easing: action.transition.$type === "PopTransition" ? "spring" : "easeInOut",
        actionId: currentActionId,
      });
      frame.opacity = visible ? 1 : 0;

      if (action.transition.$type === "PopTransition") {
        const from = visible && !wasVisible ? 0.82 : frame.transform.scaleX;
        const to = visible ? 1 : 0.82;
        for (const property of ["transform.scale.x", "transform.scale.y"] as const) {
          tracks.push({ kind: "element-number", handle: frame.handle, property, from, to, startMs, durationMs, easing: "spring", actionId: currentActionId });
        }
        frame.transform.scaleX = to;
        frame.transform.scaleY = to;
      } else if (isFlipTransition(action.transition)) {
        const from = visible && !wasVisible ? -90 : frame.transform.rotationDeg;
        const to = visible ? 0 : 90;
        tracks.push({ kind: "element-number", handle: frame.handle, property: "transform.rotationDeg", from, to, startMs, durationMs, easing: "easeOut", actionId: currentActionId });
        frame.transform.rotationDeg = to;
      } else if (isSlideTransition(action.transition)) {
        applySlide(frame, visible, action.transition.from, action.transition.distance ?? 48, startMs, durationMs, tracks, currentActionId);
      }
    }
    return;
  }

  if (isDrawStatement(action)) {
    const target = action.edge.ref;
    const frame = target ? frameFor(context, state, target) : undefined;
    if (frame?.kind === "edge") {
      const flowEffect = action.flow ?? frame.flowEffect ?? "none";
      tracks.push({ kind: "element-flow-effect", handle: frame.handle, property: "flowEffect", from: frame.flowEffect ?? "none", to: flowEffect, startMs, durationMs: 0, easing: "linear", actionId: currentActionId });
      tracks.push({ kind: "element-number", handle: frame.handle, property: "drawProgress", from: frame.drawProgress ?? 0, to: 1, startMs, durationMs, easing: "linear", actionId: currentActionId });
      tracks.push({ kind: "element-number", handle: frame.handle, property: "flowPhase", from: 0, to: 1, startMs, durationMs, easing: "linear", actionId: currentActionId });
      frame.drawProgress = 1;
      frame.flowPhase = 1;
      frame.flowEffect = flowEffect;
    }
    return;
  }

  if (isHighlightStatement(action)) {
    const target = action.target.ref;
    const frame = target ? frameFor(context, state, target) : undefined;
    if (!frame) return;
    const tone = themeToken(action.tone);
    tracks.push(
      { kind: "element-token", handle: frame.handle, property: "highlight.tone", from: frame.highlightTone, to: tone, startMs, durationMs: 0, easing: "linear", actionId: currentActionId },
      { kind: "element-boolean", handle: frame.handle, property: "highlight.active", from: frame.highlightActive, to: true, startMs, durationMs: 0, easing: "linear", actionId: currentActionId },
    );
    if (action.effect === "pulse") {
      const quarter = durationMs / 4;
      tracks.push(
        { kind: "element-number", handle: frame.handle, property: "highlight.intensity", from: frame.highlightIntensity, to: 1, startMs, durationMs: quarter, easing: "easeOut", actionId: currentActionId },
        { kind: "element-number", handle: frame.handle, property: "highlight.intensity", from: 1, to: 0.35, startMs: startMs + quarter, durationMs: quarter * 2, easing: "easeInOut", actionId: currentActionId },
        { kind: "element-number", handle: frame.handle, property: "highlight.intensity", from: 0.35, to: 1, startMs: startMs + quarter * 3, durationMs: quarter, easing: "easeOut", actionId: currentActionId },
      );
    } else {
      tracks.push({ kind: "element-number", handle: frame.handle, property: "highlight.intensity", from: frame.highlightIntensity, to: 1, startMs, durationMs, easing: "easeOut", actionId: currentActionId });
    }
    frame.highlightTone = tone;
    frame.highlightActive = true;
    frame.highlightIntensity = 1;
    return;
  }

  if (isClearHighlightStatement(action)) {
    const target = action.target.ref;
    const frame = target ? frameFor(context, state, target) : undefined;
    if (!frame) return;
    tracks.push(
      { kind: "element-number", handle: frame.handle, property: "highlight.intensity", from: frame.highlightIntensity, to: 0, startMs, durationMs, easing: "easeOut", actionId: currentActionId },
      { kind: "element-boolean", handle: frame.handle, property: "highlight.active", from: frame.highlightActive, to: false, startMs: startMs + durationMs, durationMs: 0, easing: "linear", actionId: currentActionId },
    );
    frame.highlightActive = false;
    frame.highlightIntensity = 0;
    return;
  }

  if (isCameraStatement(action)) {
    const target = cameraRect(action, context, state);
    tracks.push({ kind: "camera-rect", property: "viewBox", from: state.camera, to: target, startMs, durationMs, easing: "easeInOut", actionId: currentActionId });
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
  currentActionId: ActionId | undefined,
): void {
  const horizontal = direction === "left" || direction === "right";
  const sign = direction === "left" || direction === "up" ? -1 : 1;
  const property = horizontal ? "transform.translate.x" : "transform.translate.y";
  const current = horizontal ? frame.transform.x : frame.transform.y;
  const displaced = sign * distance;
  const from = visible ? displaced : current;
  const to = visible ? 0 : displaced;
  tracks.push({ kind: "element-number", handle: frame.handle, property, from, to, startMs, durationMs, easing: "easeOut", actionId: currentActionId });
  if (horizontal) frame.transform.x = to;
  else frame.transform.y = to;
}

function cameraRect(statement: CameraStatement, context: LoweringContext, state: MutableState): Rect {
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
  const aspect = context.canvas.width / context.canvas.height;
  const fitted = fitAspect(
    {
      x: bounds.x - padding,
      y: bounds.y - padding,
      width: Math.max(1, bounds.width + padding * 2),
      height: Math.max(1, bounds.height + padding * 2),
    },
    aspect,
  );
  return expandPastPartiallyVisibleElements(fitted, context, state, aspect);
}

function expandPastPartiallyVisibleElements(
  initial: Rect,
  context: LoweringContext,
  state: MutableState,
  aspect: number,
): Rect {
  let camera = initial;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const partial: Rect[] = [];
    for (const [handle, frame] of state.elements) {
      if (frame.opacity <= 0.08) continue;
      const geometry = context.geometry.get(handle);
      if (!geometry) continue;
      const candidates = geometry.kind === "edge"
        ? geometry.label ? [geometry.label.bounds] : []
        : [geometry.bounds];
      for (const bounds of candidates) {
        if (rectIntersectionArea(camera, bounds) <= 0 || rectContains(camera, bounds, 1)) continue;
        partial.push({
          x: bounds.x - 12,
          y: bounds.y - 12,
          width: bounds.width + 24,
          height: bounds.height + 24,
        });
      }
    }
    if (partial.length === 0) return camera;
    camera = fitAspect(unionRects([camera, ...partial]), aspect);
  }
  return camera;
}

function rectContains(container: Rect, item: Rect, tolerance = 0): boolean {
  return item.x >= container.x - tolerance &&
    item.y >= container.y - tolerance &&
    item.x + item.width <= container.x + container.width + tolerance &&
    item.y + item.height <= container.y + container.height + tolerance;
}

function rectIntersectionArea(left: Rect, right: Rect): number {
  return Math.max(0, Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x)) *
    Math.max(0, Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y));
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

function* walkSceneActions(statements: readonly SceneStatement[]): Iterable<SceneAction> {
  for (const statement of statements) {
    if (isSayStatement(statement)) continue;
    const action = isActionStatement(statement) ? statement.body : statement;
    yield action;
    if (isSequenceStatement(action) || isStaggerStatement(action)) {
      yield* walkSceneActions(action.statements);
    }
  }
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
