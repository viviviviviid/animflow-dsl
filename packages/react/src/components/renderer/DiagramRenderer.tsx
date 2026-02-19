"use client";

import React, { useRef, useEffect, useMemo } from "react";
import type { DiagramData } from "../../core/types";
import { RoughNodeRenderer } from "./RoughNodeRenderer";
import { RoughEdgeRenderer } from "./RoughEdgeRenderer";

interface DiagramRendererProps {
  data: DiagramData;
  onReady?: (svgElement: SVGSVGElement) => void;
  zoom?: number;
  pan?: { x: number; y: number };
}

export function DiagramRenderer({
  data,
  onReady,
  zoom = 1,
  pan = { x: 0, y: 0 },
}: DiagramRendererProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && onReady) {
      onReady(svgRef.current);
    }
  }, [data, onReady]);

  const bounds = useMemo(() => calculateDiagramBounds(data), [data]);
  const viewBox = useMemo(
    () => calculateViewBox(bounds, zoom, pan),
    [bounds, zoom, pan]
  );

  const background = data.config.background ?? null;

  const edgesLayer = useMemo(
    () => data.edges.map((edge) => <RoughEdgeRenderer key={edge.id} edge={edge} />),
    [data.edges]
  );

  const nodesLayer = useMemo(
    () => data.nodes.map((node) => <RoughNodeRenderer key={node.id} node={node} />),
    [data.nodes]
  );

  return (
    <svg
      ref={svgRef}
      className="diagram-svg w-full h-full"
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Load Comic Neue font for cross-platform consistency */}
      <defs>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Comic+Neue:wght@300;400;700&display=swap');`}</style>
      </defs>

      {/* Background fill — omit rect entirely when transparent/unset */}
      {background && background !== "transparent" && (
        <rect
          x={bounds.minX - 2000}
          y={bounds.minY - 2000}
          width={bounds.width + 4000}
          height={bounds.height + 4000}
          fill={background}
        />
      )}

      {/* Render edges first (behind nodes) */}
      <g className="edges-layer">{edgesLayer}</g>

      {/* Render nodes */}
      <g className="nodes-layer">{nodesLayer}</g>
    </svg>
  );
}

/**
 * Calculate SVG viewBox based on node positions
 */
function calculateDiagramBounds(data: DiagramData): {
  minX: number;
  minY: number;
  width: number;
  height: number;
} {
  const nodes = data.nodes;
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, width: 800, height: 600 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    if (!node.position || !node.width || !node.height) continue;

    const x1 = node.position.x - node.width / 2;
    const y1 = node.position.y - node.height / 2;
    const x2 = node.position.x + node.width / 2;
    const y2 = node.position.y + node.height / 2;

    minX = Math.min(minX, x1);
    minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x2);
    maxY = Math.max(maxY, y2);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return { minX: 0, minY: 0, width: 800, height: 600 };
  }

  // Add padding
  const padding = 50;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const width = maxX - minX;
  const height = maxY - minY;

  return { minX, minY, width, height };
}

function calculateViewBox(
  bounds: { minX: number; minY: number; width: number; height: number },
  zoom: number = 1,
  pan: { x: number; y: number } = { x: 0, y: 0 }
): string {
  const { minX, minY, width, height } = bounds;

  // Zoom by shrinking/expanding viewBox around center.
  const safeZoom = Math.max(0.5, Math.min(2, zoom));
  const centerX = minX + width / 2;
  const centerY = minY + height / 2;
  const zoomedWidth = width / safeZoom;
  const zoomedHeight = height / safeZoom;
  const zoomedMinX = centerX - zoomedWidth / 2;
  const zoomedMinY = centerY - zoomedHeight / 2;

  // Pan by moving the camera(viewBox), not by translating the SVG element.
  // This keeps a single continuous canvas/background during drag.
  const panX = Number.isFinite(pan.x) ? pan.x : 0;
  const panY = Number.isFinite(pan.y) ? pan.y : 0;
  const pannedMinX = zoomedMinX - panX;
  const pannedMinY = zoomedMinY - panY;

  return `${pannedMinX} ${pannedMinY} ${zoomedWidth} ${zoomedHeight}`;
}
