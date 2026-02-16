import dagre from "dagre";
import type { DiagramNode, DiagramEdge, FlowchartDirection } from "../types";

/**
 * Calculate node positions using dagre layout algorithm
 */
export function calculateFlowchartLayout(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  direction: FlowchartDirection = "LR"
): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
  // Create a new directed graph
  const g = new dagre.graphlib.Graph();

  // Set graph options
  g.setGraph({
    rankdir: direction,
    nodesep: 80,
    edgesep: 40,
    ranksep: 120,
  });

  // Default node settings
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to graph
  for (const node of nodes) {
    const { width, height } = estimateNodeSize(node);
    g.setNode(node.id, {
      label: node.label,
      width,
      height,
    });
  }

  // Add edges to graph
  for (const edge of edges) {
    g.setEdge(edge.from, edge.to);
  }

  // Run dagre layout algorithm
  dagre.layout(g);

  // Extract positioned nodes
  const positionedNodes: DiagramNode[] = nodes.map((node) => {
    const dagreNode = g.node(node.id);
    return {
      ...node,
      position: {
        x: dagreNode.x,
        y: dagreNode.y,
      },
      width: dagreNode.width,
      height: dagreNode.height,
    };
  });

  // Calculate edge paths
  const positionedEdges: DiagramEdge[] = edges.map((edge) => {
    const dagreEdge = g.edge(edge.from, edge.to);
    let points = dagreEdge?.points || [];
    
    // Filter out invalid points with NaN coordinates
    points = points.filter((p: any) => 
      p && 
      typeof p.x === 'number' && 
      typeof p.y === 'number' && 
      !isNaN(p.x) && 
      !isNaN(p.y) &&
      isFinite(p.x) && 
      isFinite(p.y)
    );

    // If no valid points, create simple fallback points
    if (points.length < 2) {
      const fromNode = g.node(edge.from);
      const toNode = g.node(edge.to);
      
      if (fromNode && toNode) {
        points = [
          { x: fromNode.x, y: fromNode.y },
          { x: toNode.x, y: toNode.y },
        ];
      }
    }
    
    return {
      ...edge,
      points,
    };
  });

  return {
    nodes: positionedNodes,
    edges: positionedEdges,
  };
}

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

  // Estimate width (roughly 8px per character + padding)
  const width = Math.max(120, maxLineLength * 8 + 40);

  // Estimate height (roughly 20px per line + padding)
  const height = Math.max(60, lineCount * 24 + 30);

  return { width, height };
}

/**
 * Calculate bezier curve path for edge
 */
export function calculateEdgePath(
  points: { x: number; y: number }[]
): string {
  if (points.length < 2) return "";

  // Filter out invalid points (NaN or undefined)
  const validPoints = points.filter(p => 
    p && 
    typeof p.x === 'number' && 
    typeof p.y === 'number' && 
    !isNaN(p.x) && 
    !isNaN(p.y)
  );

  if (validPoints.length < 2) return "";

  // If only 2 points or nearly straight line, use direct line
  if (validPoints.length === 2) {
    return `M ${validPoints[0].x} ${validPoints[0].y} L ${validPoints[1].x} ${validPoints[1].y}`;
  }

  // Check if all points are on a straight line (horizontal or vertical)
  const isHorizontal = validPoints.every(p => Math.abs(p.y - validPoints[0].y) < 1);
  const isVertical = validPoints.every(p => Math.abs(p.x - validPoints[0].x) < 1);
  
  if (isHorizontal || isVertical) {
    // Draw straight line from start to end
    return `M ${validPoints[0].x} ${validPoints[0].y} L ${validPoints[validPoints.length - 1].x} ${validPoints[validPoints.length - 1].y}`;
  }

  // For bent lines, use first, middle bend point, and last
  let path = `M ${validPoints[0].x} ${validPoints[0].y}`;
  
  // Just use key points to avoid too many bends
  if (validPoints.length > 2) {
    const midIndex = Math.floor(validPoints.length / 2);
    path += ` L ${validPoints[midIndex].x} ${validPoints[midIndex].y}`;
  }
  
  path += ` L ${validPoints[validPoints.length - 1].x} ${validPoints[validPoints.length - 1].y}`;

  return path;
}
