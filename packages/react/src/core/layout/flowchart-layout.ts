import dagre from "dagre";
import type { DiagramNode, DiagramEdge, FlowchartDirection } from "../types";

// ── Geometry helpers ──────────────────────────────────────────────────────────

function normalize(dx: number, dy: number): { x: number; y: number } {
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1e-10) return { x: 1, y: 0 };
  return { x: dx / len, y: dy / len };
}

/** Returns the point where a ray from `center` in direction `dir` first hits the rectangle boundary. */
function getRectBoundaryPoint(
  center: { x: number; y: number },
  dir: { x: number; y: number },
  width: number,
  height: number
): { x: number; y: number } {
  const hw = width / 2;
  const hh = height / 2;
  const ax = Math.abs(dir.x);
  const ay = Math.abs(dir.y);
  const t =
    ax < 1e-10 ? hh / ay : ay < 1e-10 ? hw / ax : Math.min(hw / ax, hh / ay);
  return { x: center.x + t * dir.x, y: center.y + t * dir.y };
}

/** Nearest forward ray-polygon intersection (t > 0). Returns null if none found. */
function rayPolygonIntersect(
  origin: { x: number; y: number },
  dir: { x: number; y: number },
  vertices: { x: number; y: number }[]
): { x: number; y: number } | null {
  let bestT = Infinity;
  let bestPt: { x: number; y: number } | null = null;

  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    const ex = b.x - a.x;
    const ey = b.y - a.y;
    const denom = dir.x * ey - dir.y * ex;
    if (Math.abs(denom) < 1e-10) continue;
    const ox = a.x - origin.x;
    const oy = a.y - origin.y;
    const t = (ox * ey - oy * ex) / denom;
    const s = (ox * dir.y - oy * dir.x) / denom;
    if (t > 1e-10 && s >= -1e-10 && s <= 1 + 1e-10 && t < bestT) {
      bestT = t;
      bestPt = { x: origin.x + t * dir.x, y: origin.y + t * dir.y };
    }
  }
  return bestPt;
}

type NodeData = {
  x: number;
  y: number;
  width: number;
  height: number;
  shape?: string;
};

/**
 * Re-project a dagre bounding-box edge point onto the actual visual shape boundary.
 * Direction is computed from node center → dagrePoint; result is the shape surface in that direction.
 */
function getShapeBoundaryPoint(
  node: NodeData,
  dagrePoint: { x: number; y: number }
): { x: number; y: number } {
  const { x: cx, y: cy, width, height } = node;
  const hw = width / 2;
  const hh = height / 2;
  const dx = dagrePoint.x - cx;
  const dy = dagrePoint.y - cy;
  if (Math.abs(dx) < 1e-10 && Math.abs(dy) < 1e-10) return dagrePoint;
  const dir = normalize(dx, dy);

  switch (node.shape) {
    case "circle":
      return { x: cx + hw * dir.x, y: cy + hw * dir.y };

    case "diamond": {
      const vertices = [
        { x: cx, y: cy - hh },
        { x: cx + hw, y: cy },
        { x: cx, y: cy + hh },
        { x: cx - hw, y: cy },
      ];
      return rayPolygonIntersect({ x: cx, y: cy }, dir, vertices) ?? dagrePoint;
    }

    case "terminator": {
      // Horizontal ellipse: (x/a)² + (y/b)² = 1, a=hw, b=hh
      const a = hw,
        b = hh;
      const denom = Math.sqrt(
        (dir.x * dir.x) / (a * a) + (dir.y * dir.y) / (b * b)
      );
      if (denom < 1e-10) return dagrePoint;
      const t = 1 / denom;
      return { x: cx + t * dir.x, y: cy + t * dir.y };
    }

    case "parallelogram": {
      const offset = width * 0.15;
      const verts = [
        { x: cx - hw + offset, y: cy - hh },
        { x: cx + hw, y: cy - hh },
        { x: cx + hw - offset, y: cy + hh },
        { x: cx - hw, y: cy + hh },
      ];
      return rayPolygonIntersect({ x: cx, y: cy }, dir, verts) ?? dagrePoint;
    }

    case "asymmetric": {
      const offset = width * 0.18;
      const vertices = [
        { x: cx - hw + offset, y: cy - hh },
        { x: cx + hw, y: cy - hh },
        { x: cx + hw, y: cy + hh },
        { x: cx - hw + offset, y: cy + hh },
        { x: cx - hw, y: cy },
      ];
      return rayPolygonIntersect({ x: cx, y: cy }, dir, vertices) ?? dagrePoint;
    }

    case "stadium": {
      // Horizontal pill: semicircle caps of radius hh, flat top/bottom edges in between
      const r = hh;
      if (Math.abs(dir.x) >= Math.abs(dir.y)) {
        // Going left or right → intersect with the semicircle cap
        const capX = dir.x > 0 ? cx + hw - r : cx - hw + r;
        const ox = cx - capX; // offset from ray origin to cap center (y offset = 0)
        const B = ox * dir.x; // (offset · dir)
        const C = ox * ox - r * r;
        const disc = B * B - C;
        if (disc >= 0) {
          const t = Math.max(-B + Math.sqrt(disc), -B - Math.sqrt(disc));
          if (t > 0) return { x: cx + t * dir.x, y: cy + t * dir.y };
        }
      }
      // Going up or down (or cap miss) → flat edge via rectangle boundary
      return getRectBoundaryPoint({ x: cx, y: cy }, dir, width, height);
    }

    default:
      // rectangle, database, document, asymmetric: dagre bounding box ≈ visual boundary
      return dagrePoint;
  }
}

/** Adjust the first and last edge points to sit on the actual shape boundary (not the bounding box). */
function adjustEdgeEndpoints(
  points: { x: number; y: number }[],
  fromNode: DiagramNode,
  toNode: DiagramNode
): { x: number; y: number }[] {
  if (points.length < 2 || !fromNode.position || !toNode.position)
    return points;

  const makeData = (n: DiagramNode): NodeData => ({
    x: n.position!.x,
    y: n.position!.y,
    width: n.width ?? 120,
    height: n.height ?? 60,
    shape: n.shape,
  });

  const adjusted = [...points];
  adjusted[0] = getShapeBoundaryPoint(makeData(fromNode), points[0]);
  adjusted[adjusted.length - 1] = getShapeBoundaryPoint(
    makeData(toNode),
    points[points.length - 1]
  );
  return adjusted;
}

// ── Main layout ───────────────────────────────────────────────────────────────

/**
 * Calculate node positions using dagre layout algorithm
 */
export function calculateFlowchartLayout(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  direction: FlowchartDirection = "LR"
): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: direction, nodesep: 80, edgesep: 40, ranksep: 120 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    const { width, height } = estimateNodeSize(node);
    g.setNode(node.id, { label: node.label, width, height });
  }

  for (const edge of edges) {
    g.setEdge(edge.from, edge.to);
  }

  dagre.layout(g);

  const positionedNodes: DiagramNode[] = nodes.map((node) => {
    const dn = g.node(node.id);
    return {
      ...node,
      position: { x: dn.x, y: dn.y },
      width: dn.width,
      height: dn.height,
    };
  });

  const nodeMap = new Map(positionedNodes.map((n) => [n.id, n]));

  const positionedEdges: DiagramEdge[] = edges.map((edge) => {
    const dagreEdge = g.edge(edge.from, edge.to);
    let points: { x: number; y: number }[] = (dagreEdge?.points ?? []).filter(
      (p: any) =>
        p &&
        typeof p.x === "number" &&
        typeof p.y === "number" &&
        !isNaN(p.x) &&
        !isNaN(p.y) &&
        isFinite(p.x) &&
        isFinite(p.y)
    );

    // Fallback: boundary-to-boundary line instead of center-to-center
    if (points.length < 2) {
      const fn = g.node(edge.from);
      const tn = g.node(edge.to);
      if (fn && tn) {
        const fromCenter = { x: fn.x, y: fn.y };
        const toCenter = { x: tn.x, y: tn.y };
        const dir = normalize(
          toCenter.x - fromCenter.x,
          toCenter.y - fromCenter.y
        );
        points = [
          getRectBoundaryPoint(fromCenter, dir, fn.width, fn.height),
          getRectBoundaryPoint(
            toCenter,
            { x: -dir.x, y: -dir.y },
            tn.width,
            tn.height
          ),
        ];
      }
    }

    // Phase 3: adjust endpoints to actual shape boundaries
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);
    if (fromNode && toNode) {
      points = adjustEdgeEndpoints(points, fromNode, toNode);
    }

    return { ...edge, points };
  });

  return { nodes: positionedNodes, edges: positionedEdges };
}

// ── Node sizing ───────────────────────────────────────────────────────────────

/**
 * Estimate node size based on label length
 */
function estimateNodeSize(node: DiagramNode): { width: number; height: number } {
  const lines = [node.label];
  if (node.subtitle) {
    lines.push(...node.subtitle.split("\n"));
  }

  const maxLineLength = Math.max(...lines.map((l) => l.length));
  const lineCount = lines.length;

  const baseWidth = Math.max(120, maxLineLength * 8 + 40);
  const baseHeight = Math.max(60, lineCount * 24 + 30);

  switch (node.shape) {
    case "circle": {
      const circleDim = Math.max(baseWidth, baseHeight, 80);
      return { width: circleDim, height: circleDim };
    }
    case "stadium":
      return { width: baseWidth + 30, height: baseHeight };
    case "diamond":
      return { width: baseWidth + 40, height: baseHeight + 20 };
    default:
      return { width: baseWidth, height: baseHeight };
  }
}

// ── Edge path ─────────────────────────────────────────────────────────────────

/**
 * Convert dagre waypoints to an SVG path string using Catmull-Rom → cubic Bezier conversion.
 * Produces smooth curves through all waypoints; falls back to straight lines for 2-point or
 * perfectly horizontal/vertical paths.
 */
export function calculateEdgePath(
  points: { x: number; y: number }[]
): string {
  if (points.length < 2) return "";

  const valid = points.filter(
    (p) =>
      p &&
      typeof p.x === "number" &&
      typeof p.y === "number" &&
      !isNaN(p.x) &&
      !isNaN(p.y)
  );

  if (valid.length < 2) return "";

  if (valid.length === 2) {
    return `M ${valid[0].x} ${valid[0].y} L ${valid[1].x} ${valid[1].y}`;
  }

  const isHorizontal = valid.every((p) => Math.abs(p.y - valid[0].y) < 1);
  const isVertical = valid.every((p) => Math.abs(p.x - valid[0].x) < 1);
  if (isHorizontal || isVertical) {
    return `M ${valid[0].x} ${valid[0].y} L ${valid[valid.length - 1].x} ${valid[valid.length - 1].y}`;
  }

  // Catmull-Rom → cubic Bezier:
  //   cp1 = P[i]   + (P[i+1] - P[i-1]) / 6
  //   cp2 = P[i+1] - (P[i+2] - P[i])   / 6
  // Phantom clamping: P[-1] = P[0], P[n] = P[n-1] → zero curvature at endpoints
  const n = valid.length;
  let path = `M ${valid[0].x} ${valid[0].y}`;

  for (let i = 0; i < n - 1; i++) {
    const p0 = valid[Math.max(0, i - 1)];
    const p1 = valid[i];
    const p2 = valid[i + 1];
    const p3 = valid[Math.min(n - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }

  return path;
}

/**
 * Compute the end tangent direction of the Catmull-Rom curve for arrowhead orientation.
 * With the phantom clamp P[n] = P[n-1], the end tangent is normalize(P[n-1] - P[n-2]).
 */
export function calculateEdgeTangent(
  points: { x: number; y: number }[]
): { x: number; y: number } {
  const n = points.length;
  if (n < 2) return { x: 1, y: 0 };
  const last = points[n - 1];
  const prev = points[n - 2];
  return normalize(last.x - prev.x, last.y - prev.y);
}
