"use client";

import React, { useRef, useEffect } from "react";
import type { DiagramData } from "@/core/types";
import { NodeRenderer } from "./NodeRenderer";
import { EdgeRenderer, ArrowMarkerDef } from "./EdgeRenderer";
import { RoughNodeRenderer } from "./RoughNodeRenderer";
import { RoughEdgeRenderer } from "./RoughEdgeRenderer";

interface DiagramRendererProps {
  data: DiagramData;
  onReady?: (svgElement: SVGSVGElement) => void;
  renderMode?: "clean" | "sketchy";
  zoom?: number;
}

export function DiagramRenderer({
  data,
  onReady,
  renderMode = "clean",
  zoom = 1,
}: DiagramRendererProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && onReady) {
      onReady(svgRef.current);
    }
  }, [data, onReady]);

  // Calculate viewBox based on node positions
  const viewBox = calculateViewBox(data, zoom);

  // Background color based on render mode
  const background = renderMode === "sketchy" 
    ? "#faf9f6" 
    : (data.config.background || "#ffffff");

  return (
    <svg
      ref={svgRef}
      className="diagram-svg w-full h-full"
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      style={{ background }}
    >
      {renderMode === "clean" && <ArrowMarkerDef />}

      {/* Render edges first (behind nodes) */}
      <g className="edges-layer">
        {data.edges.map((edge) => (
          renderMode === "clean" 
            ? <EdgeRenderer key={edge.id} edge={edge} />
            : <RoughEdgeRenderer key={edge.id} edge={edge} />
        ))}
      </g>

      {/* Render nodes */}
      <g className="nodes-layer">
        {data.nodes.map((node) => (
          renderMode === "clean"
            ? <NodeRenderer key={node.id} node={node} />
            : <RoughNodeRenderer key={node.id} node={node} />
        ))}
      </g>
    </svg>
  );
}

/**
 * Calculate SVG viewBox based on node positions
 */
function calculateViewBox(data: DiagramData, zoom: number = 1): string {
  const nodes = data.nodes;
  if (nodes.length === 0) return "0 0 800 600";

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

  // Add padding
  const padding = 50;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const width = maxX - minX;
  const height = maxY - minY;

  // Zoom by shrinking/expanding viewBox around center.
  const safeZoom = Math.max(0.5, Math.min(2, zoom));
  const centerX = minX + width / 2;
  const centerY = minY + height / 2;
  const zoomedWidth = width / safeZoom;
  const zoomedHeight = height / safeZoom;
  const zoomedMinX = centerX - zoomedWidth / 2;
  const zoomedMinY = centerY - zoomedHeight / 2;

  return `${zoomedMinX} ${zoomedMinY} ${zoomedWidth} ${zoomedHeight}`;
}
