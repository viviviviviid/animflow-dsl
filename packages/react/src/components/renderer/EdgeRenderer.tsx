"use client";

import React from "react";
import type { DiagramEdge } from "@/core/types";
import { calculateEdgePath } from "@/core/layout/flowchart-layout";

interface EdgeRendererProps {
  edge: DiagramEdge;
  style?: React.CSSProperties;
}

export function EdgeRenderer({ edge, style }: EdgeRendererProps) {
  const { id, from, to, label, points, style: edgeStyle } = edge;

  if (!points || points.length < 2) return null;

  const path = calculateEdgePath(points);
  const stroke = "#757575";
  const strokeWidth = edgeStyle === "thick" ? 3 : 2;
  const strokeDasharray = edgeStyle === "dashed" ? "5,5" : undefined;

  // Calculate label position (middle of path)
  const midPoint = points[Math.floor(points.length / 2)];

  return (
    <g
      id={`edge-${id}`}
      data-edge-id={id}
      data-from={from}
      data-to={to}
      style={{ opacity: 0, ...style }} // Edges hidden initially
      className="edge-group"
    >
      {/* Main path */}
      <path
        className="edge-path"
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
      />

      {/* Arrow marker - will be added during animation */}
      <path
        className="edge-arrow"
        d={path}
        fill="none"
        stroke="none"
        strokeWidth={strokeWidth}
        markerEnd="url(#arrowhead)"
        opacity="0"
      />

      {/* Label */}
      {label && (
        <g>
          <rect
            x={midPoint.x - 30}
            y={midPoint.y - 12}
            width={60}
            height={24}
            fill="white"
            stroke="#e0e0e0"
            rx={4}
          />
          <text
            x={midPoint.x}
            y={midPoint.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#424242"
            fontSize="12"
            fontFamily="system-ui, sans-serif"
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

/**
 * Arrow marker definition - smaller size
 */
export function ArrowMarkerDef() {
  return (
    <defs>
      <marker
        id="arrowhead"
        markerWidth="5"
        markerHeight="5"
        refX="4"
        refY="1.5"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M0,0 L0,3 L4,1.5 z" fill="#757575" />
      </marker>
    </defs>
  );
}
