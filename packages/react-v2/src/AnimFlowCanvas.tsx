import type {
  CompiledEdge,
  CompiledElement,
  CompiledNode,
  CompiledOverlay,
  CompiledPath,
  EdgeGeometry,
  ElementFrameState,
  ElementGeometry,
  ElementHandle,
  FrameState,
  NodeGeometry,
  OverlayGeometry,
  Rect,
  RenderPlan,
  RgbaColor,
  ThemeToken,
} from "@animflow-dsl/model";
import { pointAtPathProgress } from "@animflow-dsl/model";
import { useId, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactElement, type SVGProps } from "react";
import { movePathEndpoints } from "./drag-geometry.js";

export interface AnimFlowCanvasProps {
  readonly plan: RenderPlan;
  readonly frame: FrameState;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly ariaLabel?: string;
  readonly selectedElementIds?: readonly string[];
  readonly onElementSelect?: (selection: AnimFlowElementSelection) => void;
  readonly onSelectionClear?: () => void;
  readonly onNodePositionCommit?: (position: AnimFlowNodePositionCommit) => void;
}

export interface AnimFlowElementSelection {
  readonly id: string;
  readonly kind: CompiledElement["kind"];
  readonly additive: boolean;
}

export interface AnimFlowNodePositionCommit {
  readonly id: string;
  readonly x: number;
  readonly y: number;
}

interface NodeDragState {
  readonly id: string;
  readonly handle: ElementHandle;
  readonly pointerId: number;
  readonly clientStart: { readonly x: number; readonly y: number };
  readonly inverse: { readonly a: number; readonly b: number; readonly c: number; readonly d: number };
  readonly start: { readonly x: number; readonly y: number };
  readonly origin: { readonly x: number; readonly y: number };
  readonly current: { readonly x: number; readonly y: number };
}

interface RenderItemProps<Element extends CompiledElement, Geometry extends ElementGeometry> {
  readonly element: Element;
  readonly geometry: Geometry;
  readonly frame: ElementFrameState;
  readonly plan: RenderPlan;
  readonly selected: boolean;
  readonly onSelect?: (selection: AnimFlowElementSelection) => void;
}

export function AnimFlowCanvas({
  plan,
  frame,
  className,
  style,
  ariaLabel = "Animated system diagram",
  selectedElementIds = [],
  onElementSelect,
  onSelectionClear,
  onNodePositionCommit,
}: AnimFlowCanvasProps): ReactElement {
  const [drag, setDrag] = useState<NodeDragState>();
  const instanceId = useId().replace(/:/g, "");
  const suppressCanvasClickRef = useRef(false);
  const indexedFrame = indexFrame(frame, plan);
  const geometry = new Map(plan.geometry.map((item) => [item.handle, item]));
  const background = colorFor(plan, plan.canvas.background);
  const viewBox = frame.camera.viewBox;
  const dragOffset = drag ? { x: drag.current.x - drag.start.x, y: drag.current.y - drag.start.y } : undefined;

  return (
    <svg
      aria-label={ariaLabel}
      className={className}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      onClick={(event) => {
        if (suppressCanvasClickRef.current) {
          suppressCanvasClickRef.current = false;
          return;
        }
        if (event.target === event.currentTarget) onSelectionClear?.();
      }}
      onPointerCancel={() => {
        suppressCanvasClickRef.current = false;
        setDrag(undefined);
      }}
      onPointerMove={(event) => {
        if (!drag || event.pointerId !== drag.pointerId) return;
        const current = dragPoint(event, drag);
        setDrag({ ...drag, current });
      }}
      onPointerUp={(event) => {
        if (!drag || event.pointerId !== drag.pointerId) return;
        window.setTimeout(() => {
          suppressCanvasClickRef.current = false;
        }, 0);
        const current = dragPoint(event, drag);
        const deltaX = current.x - drag.start.x;
        const deltaY = current.y - drag.start.y;
        setDrag(undefined);
        if (Math.hypot(event.clientX - drag.clientStart.x, event.clientY - drag.clientStart.y) < 3) return;
        onNodePositionCommit?.({
          id: drag.id,
          x: drag.origin.x + deltaX,
          y: drag.origin.y + deltaY,
        });
      }}
      style={{ display: "block", width: "100%", height: "100%", background: rgba(background), ...style }}
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{ariaLabel}</title>
      <rect
        pointerEvents="none"
        fill={rgba(background)}
        height={Math.max(plan.canvas.height, viewBox.y + viewBox.height)}
        width={Math.max(plan.canvas.width, viewBox.x + viewBox.width)}
        x={Math.min(0, viewBox.x)}
        y={Math.min(0, viewBox.y)}
      />
      <g data-animflow-layer="edges">
        {plan.elements.map((element) => {
          if (element.kind !== "edge") return null;
          let item = geometry.get(element.handle);
          if (item?.kind === "edge" && drag && dragOffset && (element.from.nodeId === drag.id || element.to.nodeId === drag.id)) {
            const path = movePathEndpoints(item.path, element.from.nodeId === drag.id ? dragOffset : { x: 0, y: 0 }, element.to.nodeId === drag.id ? dragOffset : { x: 0, y: 0 });
            const before = pointAtPathProgress(item.path, 0.5);
            const after = pointAtPathProgress(path, 0.5);
            const delta = { x: after.x - before.x, y: after.y - before.y };
            item = { ...item, path, label: item.label ? { ...item.label, baseline: item.label.baseline + delta.y, bounds: { ...item.label.bounds, x: item.label.bounds.x + delta.x, y: item.label.bounds.y + delta.y } } : undefined };
          }
          return item?.kind === "edge" ? (
            <Edge key={element.handle} instanceId={instanceId} element={element} frame={indexedFrame.get(element.handle)!} geometry={item} onSelect={onElementSelect} plan={plan} selected={selectedElementIds.includes(element.id)} />
          ) : null;
        })}
      </g>
      <g data-animflow-layer="nodes">
        {plan.elements.map((element) => {
          if (element.kind !== "node") return null;
          const item = geometry.get(element.handle);
          return item?.kind === "node" ? (
            <Node
              key={element.handle}
              dragOffset={drag?.handle === element.handle ? dragOffset : undefined}
              element={element}
              frame={indexedFrame.get(element.handle)!}
              geometry={item}
              onDragStart={onNodePositionCommit ? (event) => {
                if (event.button !== 0) return;
                const svg = event.currentTarget.ownerSVGElement;
                if (!svg) return;
                const inverse = svg.getScreenCTM()?.inverse();
                if (!inverse) return;
                event.stopPropagation();
                suppressCanvasClickRef.current = true;
                onElementSelect?.({ id: element.id, kind: "node", additive: event.shiftKey });
                svg.setPointerCapture(event.pointerId);
                const start = svgPoint(event, svg);
                setDrag({
                  id: element.id,
                  handle: element.handle,
                  pointerId: event.pointerId,
                  clientStart: { x: event.clientX, y: event.clientY },
                  inverse: { a: inverse.a, b: inverse.b, c: inverse.c, d: inverse.d },
                  start,
                  current: start,
                  origin: {
                    x: item.bounds.x + item.bounds.width / 2,
                    y: item.bounds.y + item.bounds.height / 2,
                  },
                });
              } : undefined}
              onSelect={onElementSelect}
              plan={plan}
              selected={selectedElementIds.includes(element.id)}
            />
          ) : null;
        })}
      </g>
      <g data-animflow-layer="overlays">
        {plan.elements.map((element) => {
          if (element.kind !== "overlay") return null;
          let item = geometry.get(element.handle);
          if (item?.kind === "overlay" && item.connector && drag && dragOffset && element.anchor.kind === "node" && element.anchor.target.nodeId === drag.id) {
            item = { ...item, connector: movePathEndpoints(item.connector, dragOffset, { x: 0, y: 0 }) };
          }
          return item?.kind === "overlay" ? (
            <Overlay key={element.handle} element={element} frame={indexedFrame.get(element.handle)!} geometry={item} onSelect={onElementSelect} plan={plan} selected={selectedElementIds.includes(element.id)} />
          ) : null;
        })}
      </g>
    </svg>
  );
}

function Node({
  element,
  geometry,
  frame,
  onSelect,
  plan,
  selected,
  dragOffset,
  onDragStart,
}: RenderItemProps<CompiledNode, NodeGeometry> & {
  readonly dragOffset?: { readonly x: number; readonly y: number };
  readonly onDragStart?: (event: ReactPointerEvent<SVGGElement>) => void;
}): ReactElement {
  const tone = frame.resolvedColor ?? colorFor(plan, element.tone);
  const surface = colorFor(plan, plan.canvas.background);
  const highlight = colorFor(plan, frame.highlight.tone);
  const path = pathData(geometry.outline);
  return (
    <g
      data-animflow-handle={element.handle}
      data-animflow-dragging={dragOffset ? "true" : undefined}
      opacity={frame.opacity}
      transform={`${dragOffset ? `translate(${dragOffset.x} ${dragOffset.y}) ` : ""}${elementTransform(frame, geometry.bounds)}`}
      {...selectableProps(element, selected, onSelect, frame.opacity > 0.01)}
      onPointerDown={onDragStart}
      style={{ cursor: onDragStart ? (dragOffset ? "grabbing" : "grab") : onSelect ? "pointer" : undefined, pointerEvents: frame.opacity <= 0.01 ? "none" : undefined, touchAction: onDragStart ? "none" : undefined }}
    >
      {selected ? <path d={path} fill="none" opacity={0.92} stroke="#4c7dff" strokeWidth={6} vectorEffect="non-scaling-stroke" /> : null}
      {frame.highlight.active || frame.highlight.intensity > 0 ? (
        <path
          d={path}
          fill="none"
          opacity={0.16 + frame.highlight.intensity * 0.34}
          stroke={rgba(highlight)}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={10 + frame.highlight.intensity * 8}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      <path
        d={path}
        fill={mix(surface, tone, 0.08)}
        stroke={rgba(tone)}
        strokeLinejoin="round"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
      <Text geometry={geometry.label} color={ensureContrast(tone, surface, 5)} />
    </g>
  );
}

/** Keep the pointer's coordinate system stable when selection resizes the canvas. */
function dragPoint(event: ReactPointerEvent<SVGSVGElement>, drag: NodeDragState) {
  const dx = event.clientX - drag.clientStart.x;
  const dy = event.clientY - drag.clientStart.y;
  return { x: drag.start.x + drag.inverse.a * dx + drag.inverse.c * dy, y: drag.start.y + drag.inverse.b * dx + drag.inverse.d * dy };
}

function svgPoint(
  event: Pick<PointerEvent, "clientX" | "clientY"> | ReactPointerEvent<SVGElement>,
  svg: SVGSVGElement,
): { x: number; y: number } {
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const matrix = svg.getScreenCTM();
  if (!matrix) return { x: point.x, y: point.y };
  const transformed = point.matrixTransform(matrix.inverse());
  return { x: transformed.x, y: transformed.y };
}

function Edge({ element, geometry, frame, onSelect, plan, selected, instanceId }: RenderItemProps<CompiledEdge, EdgeGeometry> & { readonly instanceId: string }): ReactElement {
  if (frame.kind !== "edge") throw new TypeError(`Handle ${element.handle} must have edge frame state.`);
  const tone = frame.resolvedColor ?? colorFor(plan, element.tone);
  const surface = colorFor(plan, plan.canvas.background);
  const edgeTone = ensureContrast(tone, surface, 3.2);
  const lineWidth = Math.max(3.25, element.lineWidth + 0.75);
  const highlight = colorFor(plan, frame.highlight.tone);
  const markerOpacity = Math.max(0, Math.min(1, (frame.drawProgress - 0.9) * 10));
  const path = pathData(geometry.path);
  const markerId = `animflow-marker-${element.handle}-${instanceId}`;
  const maskId = `animflow-draw-mask-${element.handle}-${instanceId}`;
  const flowEffect = frame.flowEffect ?? element.flowEffect ?? "none";
  const dash = lineDash(flowEffect === "dash" ? "dashed" : element.linePattern);
  const edgeBounds = boundsForEdge(geometry);
  return (
    <g
      data-animflow-handle={element.handle}
      opacity={frame.opacity}
      transform={elementTransform(frame, edgeBounds)}
      {...selectableProps(element, selected, onSelect, frame.opacity > 0.01)}
    >
      {selected ? <path d={path} fill="none" opacity={0.25} stroke="#4c7dff" strokeWidth={lineWidth + 12} vectorEffect="non-scaling-stroke" /> : null}
      <defs>
        <marker id={markerId} markerHeight={4.25} markerUnits="strokeWidth" markerWidth={4.25} orient="auto-start-reverse" refX={9} refY={5} viewBox="0 0 10 10">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={rgba(edgeTone)} opacity={markerOpacity} />
        </marker>
        <mask
          height={edgeBounds.height + 48}
          id={maskId}
          maskUnits="userSpaceOnUse"
          width={edgeBounds.width + 48}
          x={edgeBounds.x - 24}
          y={edgeBounds.y - 24}
        >
          <path
            d={path}
            fill="none"
            pathLength={1}
            stroke="white"
            strokeDasharray={`${frame.drawProgress} ${Math.max(0.0001, 1 - frame.drawProgress)}`}
            strokeLinecap="round"
            strokeWidth={Math.max(18, element.lineWidth + geometry.markerSize * 2)}
          />
        </mask>
      </defs>
      {frame.highlight.active || frame.highlight.intensity > 0 ? (
        <path d={path} fill="none" opacity={frame.highlight.intensity * 0.42} stroke={rgba(highlight)} strokeLinecap="round" strokeWidth={12} vectorEffect="non-scaling-stroke" />
      ) : null}
      <path
        aria-hidden="true"
        d={path}
        fill="none"
        mask={`url(#${maskId})`}
        pathLength={1}
        stroke={rgba(surface)}
        strokeDasharray={dash ?? 1}
        strokeLinecap="round"
        strokeWidth={lineWidth + 4}
        vectorEffect="non-scaling-stroke"
      />
      <path
        data-animflow-edge-line="true"
        d={path}
        fill="none"
        markerEnd={element.arrow === "end" || element.arrow === "both" ? `url(#${markerId})` : undefined}
        markerStart={element.arrow === "start" || element.arrow === "both" ? `url(#${markerId})` : undefined}
        mask={`url(#${maskId})`}
        pathLength={1}
        stroke={rgba(edgeTone)}
        strokeDasharray={dash ?? 1}
        strokeLinecap="round"
        strokeWidth={lineWidth}
        vectorEffect="non-scaling-stroke"
      />
      <FlowDecoration
        color={edgeTone}
        effect={flowEffect}
        frame={frame}
        maskId={maskId}
        path={geometry.path}
      />
      {geometry.label ? <EdgeLabel geometry={geometry.label} plan={plan} tone={edgeTone} /> : null}
    </g>
  );
}

function FlowDecoration({
  color,
  effect,
  frame,
  maskId,
  path,
}: {
  readonly color: RgbaColor;
  readonly effect: NonNullable<CompiledEdge["flowEffect"]>;
  readonly frame: Extract<ElementFrameState, { kind: "edge" }>;
  readonly maskId: string;
  readonly path: CompiledPath;
}): ReactElement | null {
  const data = pathData(path);
  if (effect === "none" || effect === "dash") return null;
  if (effect === "particles") return <Particles color={color} frame={frame} path={path} />;
  if (effect === "glow") {
    return (
      <path
        aria-hidden="true"
        d={data}
        data-animflow-flow="glow"
        fill="none"
        mask={`url(#${maskId})`}
        opacity={0.2 + 0.12 * Math.sin(frame.flowPhase * Math.PI * 2)}
        stroke={rgba(color)}
        strokeLinecap="round"
        strokeWidth={14}
        vectorEffect="non-scaling-stroke"
      />
    );
  }
  if (effect === "wave") {
    return (
      <path
        aria-hidden="true"
        d={data}
        data-animflow-flow="wave"
        fill="none"
        mask={`url(#${maskId})`}
        pathLength={1}
        stroke={rgba(color)}
        strokeDasharray="0.025 0.035"
        strokeDashoffset={-frame.flowPhase * 0.18}
        strokeLinecap="round"
        strokeWidth={5}
        vectorEffect="non-scaling-stroke"
      />
    );
  }
  if (effect === "arrow") {
    const progress = Math.min(0.995, Math.max(0.005, frame.flowPhase));
    const point = pointOnPath(path, progress);
    const before = pointOnPath(path, Math.max(0, progress - 0.005));
    const after = pointOnPath(path, Math.min(1, progress + 0.005));
    const angle = Math.atan2(after.y - before.y, after.x - before.x) * (180 / Math.PI);
    return (
      <path
        aria-hidden="true"
        d="M -10 -7 L 8 0 L -10 7 Z"
        data-animflow-flow="arrow"
        fill={rgba(color)}
        opacity={Math.sin(Math.min(1, frame.flowPhase) * Math.PI)}
        transform={`translate(${point.x} ${point.y}) rotate(${angle})`}
      />
    );
  }
  const strobe = Math.floor(frame.flowPhase * 14) % 2 === 0 ? 0.72 : 0.18;
  return (
    <path
      aria-hidden="true"
      d={data}
      data-animflow-flow="lightning"
      fill="none"
      mask={`url(#${maskId})`}
      opacity={strobe * Math.sin(Math.min(1, frame.flowPhase) * Math.PI)}
      stroke={rgba(color)}
      strokeLinecap="square"
      strokeWidth={7}
      vectorEffect="non-scaling-stroke"
    />
  );
}

function Particles({ color, frame, path }: { readonly color: RgbaColor; readonly frame: Extract<ElementFrameState, { kind: "edge" }>; readonly path: CompiledPath }): ReactElement {
  return (
    <g aria-hidden="true" data-animflow-flow="particles">
      {[0, 0.1, 0.2].map((offset) => {
        const progress = frame.flowPhase - offset;
        if (progress <= 0 || progress >= 1) return null;
        const point = pointOnPath(path, progress);
        return <circle key={offset} cx={point.x} cy={point.y} fill={rgba(color)} opacity={Math.sin(progress * Math.PI)} r={4 - offset * 6} />;
      })}
    </g>
  );
}

function Overlay({ element, geometry, frame, onSelect, plan, selected }: RenderItemProps<CompiledOverlay, OverlayGeometry>): ReactElement {
  const tone = frame.resolvedColor ?? colorFor(plan, element.tone);
  const surface = colorFor(plan, plan.canvas.background);
  const highlight = colorFor(plan, frame.highlight.tone);
  return (
    <g data-animflow-handle={element.handle} opacity={frame.opacity} transform={elementTransform(frame, geometry.bounds)} {...selectableProps(element, selected, onSelect, frame.opacity > 0.01)}>
      {selected ? <rect fill="none" height={geometry.bounds.height + 8} opacity={0.92} rx={16} stroke="#4c7dff" strokeWidth={5} vectorEffect="non-scaling-stroke" width={geometry.bounds.width + 8} x={geometry.bounds.x - 4} y={geometry.bounds.y - 4} /> : null}
      {geometry.connector ? <path d={pathData(geometry.connector)} fill="none" opacity={0.65} stroke={rgba(tone)} strokeDasharray="3 4" strokeWidth={1.5} vectorEffect="non-scaling-stroke" /> : null}
      {frame.highlight.active || frame.highlight.intensity > 0 ? <rect fill="none" height={geometry.bounds.height} opacity={frame.highlight.intensity * 0.36} rx={14} stroke={rgba(highlight)} strokeWidth={12} vectorEffect="non-scaling-stroke" width={geometry.bounds.width} x={geometry.bounds.x} y={geometry.bounds.y} /> : null}
      <rect fill={mix(surface, tone, 0.06)} height={geometry.bounds.height} rx={element.overlayKind === "badge" ? geometry.bounds.height / 2 : 12} stroke={rgba(tone)} strokeWidth={1.5} vectorEffect="non-scaling-stroke" width={geometry.bounds.width} x={geometry.bounds.x} y={geometry.bounds.y} />
      <Text geometry={geometry.text} color={ensureContrast(tone, surface, 5)} inset={16} />
    </g>
  );
}

function EdgeLabel({ geometry, plan, tone }: { readonly geometry: EdgeGeometry["label"] & {}; readonly plan: RenderPlan; readonly tone: RgbaColor }): ReactElement {
  const surface = colorFor(plan, plan.canvas.background);
  const labelTone = ensureContrast(tone, surface, 4.5);
  return (
    <g
      data-animflow-edge-label="true"
      paintOrder="stroke"
      stroke={rgba(surface)}
      strokeLinejoin="round"
      strokeWidth={5}
    >
      <Text geometry={geometry} color={labelTone} />
    </g>
  );
}

function Text({ geometry, color, inset = 0 }: { readonly geometry: NodeGeometry["label"]; readonly color: RgbaColor; readonly inset?: number }): ReactElement {
  const lineHeight = geometry.fontSize * 1.28;
  const startY = geometry.baseline - ((geometry.lines.length - 1) * lineHeight) / 2;
  return (
    <text fill={rgba(color)} fontFamily={geometry.fontFamily} fontSize={geometry.fontSize} fontWeight={geometry.fontWeight} textAnchor={inset ? "start" : "middle"}>
      {geometry.lines.map((line, index) => (
        <tspan key={`${index}-${line}`} x={inset ? geometry.bounds.x + inset : geometry.bounds.x + geometry.bounds.width / 2} y={startY + index * lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function indexFrame(frame: FrameState, plan: RenderPlan): Map<ElementHandle, ElementFrameState> {
  const frames = new Map(frame.elements.map((item) => [item.handle, item]));
  for (const element of plan.elements) {
    const item = frames.get(element.handle);
    if (!item || item.kind !== element.kind) {
      throw new TypeError(`Frame is missing ${element.kind} state for handle ${element.handle}.`);
    }
  }
  return frames;
}

function pathData(path: CompiledPath): string {
  return path.commands
    .map((command) => {
      if (command.kind === "move") return `M ${command.to.x} ${command.to.y}`;
      if (command.kind === "line") return `L ${command.to.x} ${command.to.y}`;
      if (command.kind === "cubic") return `C ${command.control1.x} ${command.control1.y} ${command.control2.x} ${command.control2.y} ${command.to.x} ${command.to.y}`;
      return "Z";
    })
    .join(" ");
}

function elementTransform(frame: ElementFrameState, bounds: Rect): string {
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  return [
    `translate(${frame.transform.translate.x} ${frame.transform.translate.y})`,
    `translate(${centerX} ${centerY})`,
    `rotate(${frame.transform.rotationDeg})`,
    `scale(${frame.transform.scale.x} ${frame.transform.scale.y})`,
    `translate(${-centerX} ${-centerY})`,
  ].join(" ");
}

function boundsForEdge(geometry: EdgeGeometry): Rect {
  const points = geometry.path.commands.flatMap((command) => {
    if (command.kind === "close") return [];
    if (command.kind === "cubic") return [command.control1, command.control2, command.to];
    return [command.to];
  });
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  const minX = Math.min(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function pointOnPath(path: CompiledPath, progress: number): { x: number; y: number } {
  return pointAtPathProgress(path, progress);
}

function colorFor(plan: RenderPlan, token: ThemeToken): RgbaColor {
  return plan.theme.colors[token] ?? { r: 0.2, g: 0.22, b: 0.28, a: 1 };
}

function selectableProps(
  element: CompiledElement,
  selected: boolean,
  onSelect: ((selection: AnimFlowElementSelection) => void) | undefined,
  visible: boolean,
): SVGProps<SVGGElement> & {
  readonly "data-animflow-id"?: string;
  readonly "data-animflow-selected"?: string;
} {
  if (!onSelect) return {};
  if (!visible) return { "aria-hidden": true, "data-animflow-id": element.id, style: { pointerEvents: "none" } };
  const select = (additive: boolean) => onSelect({ id: element.id, kind: element.kind, additive });
  return {
    "aria-label": `Select ${element.kind} ${element.id}`,
    "data-animflow-id": element.id,
    "data-animflow-selected": selected ? "true" : "false",
    onClick: (event) => {
      event.stopPropagation();
      select(event.shiftKey);
    },
    onKeyDown: (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      select(event.shiftKey);
    },
    role: "button",
    style: { cursor: "pointer" },
    tabIndex: 0,
  };
}

function rgba(color: RgbaColor): string {
  return `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
}

function mix(background: RgbaColor, foreground: RgbaColor, ratio: number): string {
  return rgba({
    r: background.r + (foreground.r - background.r) * ratio,
    g: background.g + (foreground.g - background.g) * ratio,
    b: background.b + (foreground.b - background.b) * ratio,
    a: 1,
  });
}

function ensureContrast(foreground: RgbaColor, background: RgbaColor, minimum: number): RgbaColor {
  const opaqueForeground: RgbaColor = { ...foreground, a: 1 };
  if (contrastRatio(opaqueForeground, background) >= minimum) return opaqueForeground;
  const target: RgbaColor = relativeLuminance(background) > 0.5
    ? { r: 0.02, g: 0.03, b: 0.05, a: 1 }
    : { r: 1, g: 1, b: 1, a: 1 };

  for (let step = 1; step <= 10; step += 1) {
    const ratio = step / 10;
    const candidate: RgbaColor = {
      r: opaqueForeground.r + (target.r - opaqueForeground.r) * ratio,
      g: opaqueForeground.g + (target.g - opaqueForeground.g) * ratio,
      b: opaqueForeground.b + (target.b - opaqueForeground.b) * ratio,
      a: 1,
    };
    if (contrastRatio(candidate, background) >= minimum) return candidate;
  }
  return target;
}

function contrastRatio(left: RgbaColor, right: RgbaColor): number {
  const brighter = Math.max(relativeLuminance(left), relativeLuminance(right));
  const darker = Math.min(relativeLuminance(left), relativeLuminance(right));
  return (brighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(color: RgbaColor): number {
  const linear = (channel: number) => channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
  return linear(color.r) * 0.2126 + linear(color.g) * 0.7152 + linear(color.b) * 0.0722;
}

function lineDash(pattern: CompiledEdge["linePattern"]): SVGProps<SVGPathElement>["strokeDasharray"] {
  if (pattern === "dashed") return "0.055 0.035";
  if (pattern === "dotted") return "0.006 0.024";
  return undefined;
}
