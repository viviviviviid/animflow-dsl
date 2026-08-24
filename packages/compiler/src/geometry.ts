import type {
  CompiledEdge,
  CompiledElement,
  CompiledNode,
  CompiledOverlay,
  CompiledPath,
  EdgeGeometry,
  ElementGeometry,
  ElementHandle,
  NodeGeometry,
  OverlayGeometry,
  PortName,
  Rect,
  ResolvedTheme,
  TextGeometry,
  Vec2,
} from "@animflow-dsl/model";
import type { FlowDirection } from "@animflow-dsl/language";

export interface GraphLayoutInput {
  readonly id: string;
  readonly direction: FlowDirection;
  readonly nodeGap: number;
  readonly rankGap: number;
  readonly positions: ReadonlyMap<string, { readonly point: Vec2; readonly pinned: boolean }>;
  readonly nodes: readonly CompiledNode[];
  readonly edges: readonly CompiledEdge[];
}

export interface GeometryResult {
  readonly geometry: readonly ElementGeometry[];
  readonly graphBounds: ReadonlyMap<string, Rect>;
}

interface NodePlacement {
  readonly node: CompiledNode;
  readonly bounds: Rect;
}

export function compileGeometry(
  graphs: readonly GraphLayoutInput[],
  overlays: readonly CompiledOverlay[],
  theme: ResolvedTheme,
): GeometryResult {
  const geometryByHandle = new Map<ElementHandle, ElementGeometry>();
  const nodeBounds = new Map<string, Rect>();
  const graphBounds = new Map<string, Rect>();
  let graphOffsetY = 80;

  for (const graph of graphs) {
    const placements = placeGraph(graph, theme, 80, graphOffsetY);
    for (const placement of placements) {
      nodeBounds.set(placement.node.id, placement.bounds);
      geometryByHandle.set(
        placement.node.handle,
        nodeGeometry(placement.node, placement.bounds, theme),
      );
    }
    const labelBounds: Rect[] = [];
    for (const edge of graph.edges) {
      const fromBounds = nodeBounds.get(edge.from.nodeId);
      const toBounds = nodeBounds.get(edge.to.nodeId);
      if (!fromBounds || !toBounds) continue;
      const geometry = edgeGeometry(edge, fromBounds, toBounds, theme);
      geometryByHandle.set(edge.handle, geometry);
      if (geometry.label) labelBounds.push(geometry.label.bounds);
    }
    const bounds = unionRects([
      ...placements.map((placement) => placement.bounds),
      ...labelBounds,
    ]);
    graphBounds.set(graph.id, bounds);
    graphOffsetY = bounds.y + bounds.height + 120;
  }

  for (const overlay of overlays) {
    const target = overlay.anchor.kind === "node" ? nodeBounds.get(overlay.anchor.target.nodeId) : undefined;
    geometryByHandle.set(overlay.handle, overlayGeometry(overlay, target, theme));
  }

  return {
    geometry: [...geometryByHandle.values()].sort((left, right) => left.handle - right.handle),
    graphBounds,
  };
}

function placeGraph(
  graph: GraphLayoutInput,
  theme: ResolvedTheme,
  originX: number,
  originY: number,
): NodePlacement[] {
  const rankByNode = computeRanks(graph);
  const maxRank = Math.max(0, ...rankByNode.values());
  const rankGroups = new Map<number, CompiledNode[]>();
  for (const node of graph.nodes) {
    const rawRank = rankByNode.get(node.id) ?? 0;
    const rank = graph.direction === "left" || graph.direction === "up" ? maxRank - rawRank : rawRank;
    const group = rankGroups.get(rank) ?? [];
    group.push(node);
    rankGroups.set(rank, group);
  }

  const dimensions = new Map<string, { width: number; height: number }>();
  for (const node of graph.nodes) dimensions.set(node.id, measureNode(node, theme));
  const rankPrimarySizes = new Map<number, number>();
  for (const [rank, nodes] of rankGroups) {
    const primary = Math.max(
      ...nodes.map((node) => {
        const size = dimensions.get(node.id)!;
        return graph.direction === "right" || graph.direction === "left" ? size.width : size.height;
      }),
    );
    rankPrimarySizes.set(rank, primary);
  }

  const rankOrigins = new Map<number, number>();
  let cursor = 0;
  for (const rank of [...rankGroups.keys()].sort((left, right) => left - right)) {
    rankOrigins.set(rank, cursor);
    cursor += (rankPrimarySizes.get(rank) ?? 0) + graph.rankGap;
  }

  const horizontal = graph.direction === "right" || graph.direction === "left";
  const rankSecondarySizes = new Map<number, number>();
  for (const [rank, nodes] of rankGroups) {
    const size = nodes.reduce((total, node, index) => {
      const dimensionsForNode = dimensions.get(node.id)!;
      const nodeSize = horizontal ? dimensionsForNode.height : dimensionsForNode.width;
      return total + nodeSize + (index === 0 ? 0 : graph.nodeGap);
    }, 0);
    rankSecondarySizes.set(rank, size);
  }
  const maxSecondarySize = Math.max(0, ...rankSecondarySizes.values());

  const placements: NodePlacement[] = [];
  for (const [rank, nodes] of [...rankGroups].sort(([left], [right]) => left - right)) {
    let secondary = (maxSecondarySize - (rankSecondarySizes.get(rank) ?? 0)) / 2;
    for (const node of nodes) {
      const size = dimensions.get(node.id)!;
      placements.push({
        node,
        bounds: {
          x: originX + (horizontal ? rankOrigins.get(rank)! : secondary),
          y: originY + (horizontal ? secondary : rankOrigins.get(rank)!),
          width: size.width,
          height: size.height,
        },
      });
      secondary += (horizontal ? size.height : size.width) + graph.nodeGap;
    }
  }
  const preferred = placements.map((placement) => {
    const override = graph.positions.get(placement.node.id);
    if (!override) return { placement, pinned: false };
    return {
      pinned: override.pinned,
      placement: {
        ...placement,
        bounds: {
          ...placement.bounds,
          x: override.point.x - placement.bounds.width / 2,
          y: override.point.y - placement.bounds.height / 2,
        },
      },
    };
  });
  const resolved: NodePlacement[] = [];
  resolved.push(...preferred.filter((candidate) => candidate.pinned).map((candidate) => candidate.placement));
  for (const candidate of preferred.filter((item) => !item.pinned)) {
    let placement = candidate.placement;
    let attempts = 0;
    while (resolved.some((blocker) => overlapsWithGap(placement.bounds, blocker.bounds, graph.nodeGap))) {
      const step = Math.max(16, graph.nodeGap);
      placement = {
        ...placement,
        bounds: horizontal
          ? { ...placement.bounds, y: placement.bounds.y + step }
          : { ...placement.bounds, x: placement.bounds.x + step },
      };
      attempts += 1;
      if (attempts > graph.nodes.length * 8 + 32) break;
    }
    resolved.push(placement);
  }
  const byId = new Map(resolved.map((placement) => [placement.node.id, placement]));
  return graph.nodes.map((node) => byId.get(node.id)!).filter(Boolean);
}

function overlapsWithGap(left: Rect, right: Rect, gap: number): boolean {
  const margin = gap / 2;
  return !(
    left.x + left.width + margin <= right.x - margin ||
    right.x + right.width + margin <= left.x - margin ||
    left.y + left.height + margin <= right.y - margin ||
    right.y + right.height + margin <= left.y - margin
  );
}

function computeRanks(graph: GraphLayoutInput): Map<string, number> {
  const rank = new Map(graph.nodes.map((node) => [node.id as string, 0]));
  const indegree = new Map(graph.nodes.map((node) => [node.id as string, 0]));
  const outgoing = new Map<string, CompiledEdge[]>();
  for (const edge of graph.edges) {
    indegree.set(edge.to.nodeId, (indegree.get(edge.to.nodeId) ?? 0) + 1);
    const edges = outgoing.get(edge.from.nodeId) ?? [];
    edges.push(edge);
    outgoing.set(edge.from.nodeId, edges);
  }
  const queue = graph.nodes.filter((node) => indegree.get(node.id) === 0);
  for (let index = 0; index < queue.length; index += 1) {
    const node = queue[index]!;
    for (const edge of outgoing.get(node.id) ?? []) {
      rank.set(edge.to.nodeId, Math.max(rank.get(edge.to.nodeId) ?? 0, (rank.get(node.id) ?? 0) + 1));
      const next = (indegree.get(edge.to.nodeId) ?? 1) - 1;
      indegree.set(edge.to.nodeId, next);
      if (next === 0) {
        const target = graph.nodes.find((candidate) => candidate.id === edge.to.nodeId);
        if (target) queue.push(target);
      }
    }
  }
  return rank;
}

function measureNode(node: CompiledNode, theme: ResolvedTheme): { width: number; height: number } {
  const width = Math.max(140, Math.min(320, node.label.length * theme.fontSize * 0.62 + 48));
  return { width: round(width), height: node.shape === "circle" ? width : 72 };
}

function nodeGeometry(node: CompiledNode, bounds: Rect, theme: ResolvedTheme): NodeGeometry {
  return {
    kind: "node",
    handle: node.handle,
    bounds,
    outline: outlineFor(node.shape, bounds),
    label: textGeometry(node.label, bounds, theme),
  };
}

function edgeGeometry(
  edge: CompiledEdge,
  fromBounds: Rect,
  toBounds: Rect,
  theme: ResolvedTheme,
): EdgeGeometry {
  const start = portPoint(fromBounds, edge.from.port, center(toBounds));
  const end = portPoint(toBounds, edge.to.port, center(fromBounds));
  const path = route(edge.routing, start, end);
  const middle = pathPoint(path, 0.5);
  return {
    kind: "edge",
    handle: edge.handle,
    path,
    label: edge.label
      ? edgeLabelGeometry(edge.label, edge, path, middle, fromBounds, toBounds, theme)
      : undefined,
    markerSize: 8 + edge.lineWidth,
  };
}

function edgeLabelGeometry(
  label: string,
  edge: CompiledEdge,
  path: CompiledPath,
  middle: Vec2,
  fromBounds: Rect,
  toBounds: Rect,
  theme: ResolvedTheme,
): TextGeometry {
  const characterWidth = theme.fontSize * 0.62;
  const maximumWidth = 220;
  const horizontalPadding = 12;
  const lines = wrapText(
    label,
    Math.max(8, Math.floor((maximumWidth - horizontalPadding) / characterWidth)),
  );
  const longestLine = Math.max(1, ...lines.map((line) => line.length));
  const width = round(Math.min(maximumWidth, longestLine * characterWidth + horizontalPadding));
  const height = round(Math.max(24, lines.length * theme.fontSize * 1.28 + 8));
  const markerCount = edge.arrow === "both" ? 2 : edge.arrow === "none" ? 0 : 1;
  const markerReserve = markerCount * (8 + edge.lineWidth) * 1.5;
  const inlineAvailable = Math.max(0, path.length - markerReserve - 24);
  const vertical = Math.abs(path.endTangent.y) > Math.abs(path.endTangent.x);
  const projectedLabelSize = vertical ? height : width;
  const fitsInline = projectedLabelSize <= inlineAvailable;
  const x = fitsInline
    ? middle.x - width / 2
    : vertical
      ? Math.max(fromBounds.x + fromBounds.width, toBounds.x + toBounds.width) + 8
      : middle.x - width / 2;
  const y = fitsInline
    ? middle.y - height / 2
    : vertical
      ? middle.y - height / 2
      : Math.max(fromBounds.y + fromBounds.height, toBounds.y + toBounds.height) + 8;
  return textGeometry(label, {
    x: round(x),
    y: round(y),
    width,
    height,
  }, theme, lines);
}

function overlayGeometry(
  overlay: CompiledOverlay,
  targetBounds: Rect | undefined,
  theme: ResolvedTheme,
): OverlayGeometry {
  const anchor = overlay.anchor.kind === "node" && targetBounds
    ? portPoint(targetBounds, overlay.anchor.target.port, center(targetBounds))
    : overlay.anchor.kind === "viewport"
      ? overlay.anchor.point
      : { x: 0, y: 0 };
  const offset = overlay.anchor.kind === "node" ? overlay.anchor.offset : { x: 0, y: 0 };
  const lines = wrapText(
    overlay.text,
    Math.max(8, Math.floor((overlay.width - 32) / (theme.fontSize * 0.55))),
  );
  const bounds = {
    x: round(anchor.x + 28 + offset.x),
    y: round(anchor.y - 20 + offset.y),
    width: overlay.width,
    height: round(lines.length * theme.fontSize * 1.45 + 32),
  };
  return {
    kind: "overlay",
    handle: overlay.handle,
    bounds,
    connector: route("straight", anchor, { x: bounds.x, y: bounds.y + bounds.height / 2 }),
    text: textGeometry(overlay.text, bounds, theme, lines),
  };
}

function outlineFor(shape: CompiledNode["shape"], bounds: Rect): CompiledPath {
  const { x, y, width, height } = bounds;
  if (shape === "diamond") {
    return pathFromPoints([
      { x: x + width / 2, y },
      { x: x + width, y: y + height / 2 },
      { x: x + width / 2, y: y + height },
      { x, y: y + height / 2 },
    ], true);
  }
  if (shape === "circle") {
    const k = 0.5522847498;
    const rx = width / 2;
    const ry = height / 2;
    const cx = x + rx;
    const cy = y + ry;
    const commands: CompiledPath["commands"] = [
      { kind: "move", to: { x: cx + rx, y: cy } },
      { kind: "cubic", control1: { x: cx + rx, y: cy + k * ry }, control2: { x: cx + k * rx, y: cy + ry }, to: { x: cx, y: cy + ry } },
      { kind: "cubic", control1: { x: cx - k * rx, y: cy + ry }, control2: { x: cx - rx, y: cy + k * ry }, to: { x: cx - rx, y: cy } },
      { kind: "cubic", control1: { x: cx - rx, y: cy - k * ry }, control2: { x: cx - k * rx, y: cy - ry }, to: { x: cx, y: cy - ry } },
      { kind: "cubic", control1: { x: cx + k * rx, y: cy - ry }, control2: { x: cx + rx, y: cy - k * ry }, to: { x: cx + rx, y: cy } },
      { kind: "close" },
    ];
    return { commands, startTangent: { x: 0, y: 1 }, endTangent: { x: 0, y: 1 }, length: round(Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)))) };
  }
  if (shape === "rounded" || shape === "pill") {
    return roundedRect(bounds, shape === "pill" ? height / 2 : 14);
  }
  if (shape === "parallelogram") {
    const slant = Math.min(24, width * 0.16);
    return pathFromPoints([
      { x: x + slant, y },
      { x: x + width, y },
      { x: x + width - slant, y: y + height },
      { x, y: y + height },
    ], true);
  }
  if (shape === "document") {
    const wave = Math.min(12, height * 0.18);
    const commands: CompiledPath["commands"] = [
      { kind: "move", to: { x, y } },
      { kind: "line", to: { x: x + width, y } },
      { kind: "line", to: { x: x + width, y: y + height - wave } },
      { kind: "cubic", control1: { x: x + width * 0.72, y: y + height - wave * 2 }, control2: { x: x + width * 0.35, y: y + height + wave }, to: { x, y: y + height - wave } },
      { kind: "close" },
    ];
    return closedPath(commands, width * 2 + height * 2);
  }
  if (shape === "database") {
    const radiusY = Math.min(14, height * 0.22);
    const commands: CompiledPath["commands"] = [
      { kind: "move", to: { x, y: y + radiusY } },
      { kind: "cubic", control1: { x, y: y - radiusY * 0.3 }, control2: { x: x + width, y: y - radiusY * 0.3 }, to: { x: x + width, y: y + radiusY } },
      { kind: "line", to: { x: x + width, y: y + height - radiusY } },
      { kind: "cubic", control1: { x: x + width, y: y + height + radiusY * 0.3 }, control2: { x, y: y + height + radiusY * 0.3 }, to: { x, y: y + height - radiusY } },
      { kind: "close" },
      { kind: "move", to: { x, y: y + radiusY } },
      { kind: "cubic", control1: { x, y: y + radiusY * 2.2 }, control2: { x: x + width, y: y + radiusY * 2.2 }, to: { x: x + width, y: y + radiusY } },
    ];
    return closedPath(commands, width * 2 + height * 2);
  }
  return pathFromPoints([
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ], true);
}

function route(routing: CompiledEdge["routing"], start: Vec2, end: Vec2): CompiledPath {
  if (routing === "orthogonal") {
    const middleX = round((start.x + end.x) / 2);
    return pathFromPoints([start, { x: middleX, y: start.y }, { x: middleX, y: end.y }, end]);
  }
  if (routing === "curve") {
    const delta = Math.max(40, Math.abs(end.x - start.x) / 2);
    const commands: CompiledPath["commands"] = [
      { kind: "move", to: start },
      { kind: "cubic", control1: { x: start.x + delta, y: start.y }, control2: { x: end.x - delta, y: end.y }, to: end },
    ];
    return { commands, startTangent: normalize({ x: delta, y: 0 }), endTangent: normalize({ x: delta, y: 0 }), length: round(sampledPathLength(commands)) };
  }
  return pathFromPoints([start, end]);
}

function pathFromPoints(points: readonly Vec2[], close = false): CompiledPath {
  const commands: Array<CompiledPath["commands"][number]> = [{ kind: "move", to: points[0] ?? { x: 0, y: 0 } }];
  for (const point of points.slice(1)) commands.push({ kind: "line", to: point });
  if (close) commands.push({ kind: "close" });
  const first = points[0] ?? { x: 0, y: 0 };
  const second = points[1] ?? first;
  const beforeLast = points[points.length - 2] ?? first;
  const last = points[points.length - 1] ?? first;
  let length = 0;
  for (let index = 1; index < points.length; index += 1) length += distance(points[index - 1]!, points[index]!);
  if (close && points.length > 1) length += distance(last, first);
  return {
    commands,
    startTangent: normalize({ x: second.x - first.x, y: second.y - first.y }),
    endTangent: normalize({ x: last.x - beforeLast.x, y: last.y - beforeLast.y }),
    length: round(length),
  };
}

function textGeometry(
  text: string,
  bounds: Rect,
  theme: ResolvedTheme,
  lines: readonly string[] = [text],
): TextGeometry {
  return {
    bounds,
    baseline: round(bounds.y + bounds.height / 2 + theme.fontSize * 0.35),
    lines,
    fontFamily: theme.fontFamily,
    fontSize: theme.fontSize,
    fontWeight: theme.fontWeight,
  };
}

function roundedRect(bounds: Rect, rawRadius: number): CompiledPath {
  const { x, y, width, height } = bounds;
  const radius = Math.max(0, Math.min(rawRadius, width / 2, height / 2));
  const control = radius * 0.5522847498;
  const commands: CompiledPath["commands"] = [
    { kind: "move", to: { x: x + radius, y } },
    { kind: "line", to: { x: x + width - radius, y } },
    { kind: "cubic", control1: { x: x + width - radius + control, y }, control2: { x: x + width, y: y + radius - control }, to: { x: x + width, y: y + radius } },
    { kind: "line", to: { x: x + width, y: y + height - radius } },
    { kind: "cubic", control1: { x: x + width, y: y + height - radius + control }, control2: { x: x + width - radius + control, y: y + height }, to: { x: x + width - radius, y: y + height } },
    { kind: "line", to: { x: x + radius, y: y + height } },
    { kind: "cubic", control1: { x: x + radius - control, y: y + height }, control2: { x, y: y + height - radius + control }, to: { x, y: y + height - radius } },
    { kind: "line", to: { x, y: y + radius } },
    { kind: "cubic", control1: { x, y: y + radius - control }, control2: { x: x + radius - control, y }, to: { x: x + radius, y } },
    { kind: "close" },
  ];
  return closedPath(commands, width * 2 + height * 2 - radius * 1.7);
}

function closedPath(
  commands: CompiledPath["commands"],
  length: number,
): CompiledPath {
  return {
    commands,
    startTangent: { x: 1, y: 0 },
    endTangent: { x: 1, y: 0 },
    length: round(length),
  };
}

function wrapText(text: string, maximumCharacters: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const segments = word.length > maximumCharacters
      ? word.match(new RegExp(`.{1,${maximumCharacters}}`, "g")) ?? [word]
      : [word];
    for (const segment of segments) {
      const candidate = current ? `${current} ${segment}` : segment;
      if (candidate.length > maximumCharacters && current) {
        lines.push(current);
        current = segment;
      } else {
        current = candidate;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function portPoint(bounds: Rect, port: PortName, toward: Vec2): Vec2 {
  const c = center(bounds);
  const resolved = port === "auto"
    ? Math.abs(toward.x - c.x) >= Math.abs(toward.y - c.y)
      ? toward.x >= c.x ? "e" : "w"
      : toward.y >= c.y ? "s" : "n"
    : port;
  if (resolved === "n") return { x: c.x, y: bounds.y };
  if (resolved === "s") return { x: c.x, y: bounds.y + bounds.height };
  if (resolved === "w") return { x: bounds.x, y: c.y };
  return { x: bounds.x + bounds.width, y: c.y };
}

export function boundsForGeometry(item: ElementGeometry): Rect {
  if (item.kind !== "edge") return item.bounds;
  const points = item.path.commands.flatMap((command) => {
    if (command.kind === "close") return [];
    if (command.kind === "cubic") return [command.control1, command.control2, command.to];
    return [command.to];
  });
  return boundsOfPoints(points);
}

export function unionRects(rects: readonly Rect[]): Rect {
  if (rects.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  const minX = Math.min(...rects.map((rect) => rect.x));
  const minY = Math.min(...rects.map((rect) => rect.y));
  const maxX = Math.max(...rects.map((rect) => rect.x + rect.width));
  const maxY = Math.max(...rects.map((rect) => rect.y + rect.height));
  return { x: round(minX), y: round(minY), width: round(maxX - minX), height: round(maxY - minY) };
}

function boundsOfPoints(points: readonly Vec2[]): Rect {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  const minX = Math.min(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));
  return { x: round(minX), y: round(minY), width: round(maxX - minX), height: round(maxY - minY) };
}

function center(bounds: Rect): Vec2 {
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
}

function pathPoint(path: CompiledPath, ratio: number): Vec2 {
  const points = path.commands.flatMap((command) => command.kind === "close" ? [] : [command.to]);
  if (points.length < 2) return points[0] ?? { x: 0, y: 0 };
  const start = points[0]!;
  const end = points[points.length - 1]!;
  return { x: round(start.x + (end.x - start.x) * ratio), y: round(start.y + (end.y - start.y) * ratio) };
}

function sampledPathLength(commands: CompiledPath["commands"]): number {
  const move = commands[0];
  const curve = commands[1];
  if (move?.kind !== "move" || curve?.kind !== "cubic") return 0;
  let previous = move.to;
  let length = 0;
  for (let step = 1; step <= 20; step += 1) {
    const t = step / 20;
    const point = cubicPoint(move.to, curve.control1, curve.control2, curve.to, t);
    length += distance(previous, point);
    previous = point;
  }
  return length;
}

function cubicPoint(a: Vec2, b: Vec2, c: Vec2, d: Vec2, t: number): Vec2 {
  const inverse = 1 - t;
  return {
    x: inverse ** 3 * a.x + 3 * inverse ** 2 * t * b.x + 3 * inverse * t ** 2 * c.x + t ** 3 * d.x,
    y: inverse ** 3 * a.y + 3 * inverse ** 2 * t * b.y + 3 * inverse * t ** 2 * c.y + t ** 3 * d.y,
  };
}

function normalize(vector: Vec2): Vec2 {
  const magnitude = Math.hypot(vector.x, vector.y);
  return magnitude === 0 ? { x: 1, y: 0 } : { x: round(vector.x / magnitude), y: round(vector.y / magnitude) };
}

function distance(left: Vec2, right: Vec2): number {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
