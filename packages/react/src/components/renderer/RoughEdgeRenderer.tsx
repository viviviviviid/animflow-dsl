"use client";

import React, { useMemo } from "react";
import rough from "roughjs/bin/rough";
import type { DiagramEdge } from "../../core/types";
import { calculateEdgePath } from "../../core/layout/flowchart-layout";

interface RoughEdgeRendererProps {
  edge: DiagramEdge;
  style?: React.CSSProperties;
}

export function RoughEdgeRenderer({ edge, style }: RoughEdgeRendererProps) {
  const { id, from, to, label, points, style: edgeStyle, arrow } = edge;
  const showArrow = arrow !== "none";

  if (!points || points.length < 2) return null;

  const path = calculateEdgePath(points);
  const stroke = "#757575";
  const strokeWidth = edgeStyle === "thick" ? 3 : 2;

  // Calculate label position
  const midPoint = points[Math.floor(points.length / 2)];

  // Memoize arrow points calculation (only when arrow is needed)
  const arrowData = useMemo(() => {
    if (!showArrow) {
      return { points: [] as [number, number][], valid: false };
    }

    // Guard: need at least 2 valid points
    if (!points || points.length < 2) {
      return { points: [] as [number, number][], valid: false };
    }

    const lastPoint = points[points.length - 1];
    const secondLastPoint = points[points.length - 2];

    // Validate points
    if (!lastPoint || !secondLastPoint ||
        typeof lastPoint.x !== 'number' || typeof lastPoint.y !== 'number' ||
        typeof secondLastPoint.x !== 'number' || typeof secondLastPoint.y !== 'number' ||
        isNaN(lastPoint.x) || isNaN(lastPoint.y) ||
        isNaN(secondLastPoint.x) || isNaN(secondLastPoint.y)) {
      return { points: [] as [number, number][], valid: false };
    }

    const angle = Math.atan2(
      lastPoint.y - secondLastPoint.y,
      lastPoint.x - secondLastPoint.x
    );
    const arrowLength = 10;
    const arrowWidth = 6;

    const arrowPoints: [number, number][] = [
      [lastPoint.x, lastPoint.y],
      [
        lastPoint.x - arrowLength * Math.cos(angle) - arrowWidth * Math.sin(angle),
        lastPoint.y - arrowLength * Math.sin(angle) + arrowWidth * Math.cos(angle),
      ],
      [
        lastPoint.x - arrowLength * Math.cos(angle) + arrowWidth * Math.sin(angle),
        lastPoint.y - arrowLength * Math.sin(angle) - arrowWidth * Math.cos(angle),
      ],
    ];

    // Validate calculated points
    const allValid = arrowPoints.every(pt =>
      pt.length === 2 &&
      typeof pt[0] === 'number' && typeof pt[1] === 'number' &&
      !isNaN(pt[0]) && !isNaN(pt[1])
    );

    return {
      points: allValid ? arrowPoints : [] as [number, number][],
      valid: allValid
    };
  }, [points, showArrow]);

  // Generate rough paths at render time (NOT in useEffect!)
  const roughPaths = useMemo(() => {
    // Guard: path must be valid
    if (!path || path === "" || typeof path !== "string" || path.includes("NaN")) {
      return { pathOps: [], arrowOps: [] };
    }

    try {
      const generator = rough.generator();

      const roughOptions = {
        roughness: 0.6,
        bowing: 0.3,
        stroke,
        strokeWidth,
        disableMultiStroke: edgeStyle === "dashed",
        strokeLineDash: edgeStyle === "dashed" ? [8, 8] : undefined,
      };

      // Generate rough path drawable
      const roughPathDrawable = generator.path(path, roughOptions);

      // Generate rough arrow drawable (only when arrow is needed)
      let arrowOps: any[] = [];
      if (arrowData.valid && arrowData.points.length > 0) {
        const roughArrowDrawable = generator.polygon(arrowData.points, {
          roughness: 0.6,
          bowing: 0.3,
          stroke,
          strokeWidth: 1,
          fill: stroke,
          fillStyle: "solid",
        });
        arrowOps = roughArrowDrawable.sets || [];
      }

      return {
        pathOps: roughPathDrawable.sets || [],
        arrowOps,
      };
    } catch (error) {
      console.error("Error generating rough paths:", error, { path, arrowData });
      return { pathOps: [], arrowOps: [] };
    }
  }, [path, stroke, strokeWidth, edgeStyle, arrowData]);

  return (
    <g
      id={`edge-${id}`}
      data-edge-id={id}
      data-from={from}
      data-to={to}
      style={{ opacity: 0, ...style }}
      className="edge-group"
    >
      {/* Hidden path for GSAP getTotalLength() */}
      <path
        className="edge-path"
        d={path}
        fill="none"
        stroke="none"
        opacity={0}
        pointerEvents="none"
      />

      {/* Rough path (line only) — visibility: hidden so it's layout-present but never paints dots */}
      {roughPaths.pathOps.length > 0 && (
        <g className="rough-path-container" style={{ visibility: "hidden" }}>
          {roughPaths.pathOps.map((set, i) => {
            const d = opsToPath(set);
            if (!d) return null;
            return (
              <path
                key={`path-${i}`}
                d={d}
                stroke={stroke}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
        </g>
      )}

      {/* Rough arrow (separate for animation timing) */}
      {roughPaths.arrowOps.length > 0 && (
        <g className="rough-arrow-overlay" style={{ visibility: "hidden" }}>
          {roughPaths.arrowOps.map((set, i) => {
            const d = opsToPath(set);
            if (!d) return null;
            return (
              <path
                key={`arrow-${i}`}
                d={d}
                stroke={set.type === "fillPath" ? "none" : stroke}
                fill={set.type === "fillPath" ? stroke : "none"}
                strokeWidth={1}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
        </g>
      )}

      {/* Label — hidden initially, revealed after connect animation */}
      {label && (
        <g className="edge-label" style={{ opacity: 0 }}>
          <text
            x={midPoint.x}
            y={midPoint.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#424242"
            fontSize="13"
            fontFamily="Comic Neue, Comic Sans MS, sans-serif"
            fontWeight="400"
            stroke="white"
            strokeWidth={4}
            strokeLinejoin="round"
            paintOrder="stroke"
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

/**
 * Convert rough.js ops to SVG path data.
 * Returns empty string for sets that contain only "move" ops (no actual drawing),
 * which prevents tiny dot artifacts from strokeLinecap="round".
 */
function opsToPath(set: any): string {
  const ops = set.ops;
  const hasDrawOp = ops.some((op: any) => op.op === "bcurveTo" || op.op === "lineTo");
  if (!hasDrawOp) return "";

  let pathData = "";

  for (const op of ops) {
    const data = op.data;
    switch (op.op) {
      case "move":
        pathData += `M ${data[0]} ${data[1]} `;
        break;
      case "bcurveTo":
        pathData += `C ${data[0]} ${data[1]}, ${data[2]} ${data[3]}, ${data[4]} ${data[5]} `;
        break;
      case "lineTo":
        pathData += `L ${data[0]} ${data[1]} `;
        break;
    }
  }

  return pathData;
}
