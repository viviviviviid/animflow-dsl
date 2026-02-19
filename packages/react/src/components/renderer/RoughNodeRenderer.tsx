"use client";

import React, { useRef, useEffect } from "react";
import rough from "roughjs";
import type { DiagramNode, NodeShape } from "../../core/types";

interface RoughNodeRendererProps {
  node: DiagramNode;
  style?: React.CSSProperties;
}

export function RoughNodeRenderer({ node, style }: RoughNodeRendererProps) {
  const { id, shape, label, subtitle, position, width, height } = node;
  const groupRef = useRef<SVGGElement>(null);

  if (!position || !width || !height) return null;

  const x = position.x - width / 2;
  const y = position.y - height / 2;

  // Default styles
  const fill = node.style?.fill || "#e3f2fd";
  const stroke = node.style?.stroke || "#2196F3";
  const strokeWidth = node.style?.strokeWidth || 2;
  const textColor = node.style?.color || "#000000";

  // Render rough shapes using useEffect
  useEffect(() => {
    if (!groupRef.current) return;

    const svg = groupRef.current.closest("svg");
    if (!svg) return;

    const rc = rough.svg(svg);
    const roughOptions = {
      roughness: 0.8,
      bowing: 0.5,
      stroke,
      strokeWidth,
      fill,
      fillStyle: "hachure" as const,
      fillWeight: 0.5,
      hachureAngle: -41,
      hachureGap: 4,
    };

    // Clear previous rough elements
    const existingRough = groupRef.current.querySelector(".rough-shape");
    if (existingRough) {
      existingRough.remove();
    }

    let roughElement: SVGElement | null = null;

    switch (shape) {
      case "rectangle":
        roughElement = rc.rectangle(x, y, width, height, {
          ...roughOptions,
          bowing: 0.3,
        });
        break;

      case "terminator":
        roughElement = rc.ellipse(
          x + width / 2,
          y + height / 2,
          width,
          height,
          roughOptions
        );
        break;

      case "diamond": {
        const cx = x + width / 2;
        const cy = y + height / 2;
        const points: [number, number][] = [
          [cx, y],
          [x + width, cy],
          [cx, y + height],
          [x, cy],
        ];
        roughElement = rc.polygon(points, roughOptions);
        break;
      }

      case "parallelogram": {
        const offset = width * 0.15;
        const points: [number, number][] = [
          [x + offset, y],
          [x + width, y],
          [x + width - offset, y + height],
          [x, y + height],
        ];
        roughElement = rc.polygon(points, roughOptions);
        break;
      }

      case "database": {
        const dbHeight = height * 0.15;
        // Create a group for database shape
        const dbGroup = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g"
        );
        dbGroup.classList.add("rough-shape");

        // Top ellipse
        const topEllipse = rc.ellipse(
          x + width / 2,
          y + dbHeight,
          width,
          dbHeight * 2,
          roughOptions
        );
        dbGroup.appendChild(topEllipse);

        // Left line
        const leftLine = rc.line(
          x,
          y + dbHeight,
          x,
          y + height - dbHeight,
          roughOptions
        );
        dbGroup.appendChild(leftLine);

        // Right line
        const rightLine = rc.line(
          x + width,
          y + dbHeight,
          x + width,
          y + height - dbHeight,
          roughOptions
        );
        dbGroup.appendChild(rightLine);

        // Bottom ellipse
        const bottomEllipse = rc.ellipse(
          x + width / 2,
          y + height - dbHeight,
          width,
          dbHeight * 2,
          roughOptions
        );
        dbGroup.appendChild(bottomEllipse);

        roughElement = dbGroup;
        break;
      }

      case "document": {
        const wavePath = `
          M ${x} ${y}
          L ${x + width} ${y}
          L ${x + width} ${y + height - 10}
          Q ${x + width * 0.75} ${y + height - 15}, ${x + width / 2} ${y + height - 10}
          Q ${x + width * 0.25} ${y + height - 5}, ${x} ${y + height - 10}
          Z
        `;
        roughElement = rc.path(wavePath, roughOptions);
        break;
      }

      default:
        roughElement = rc.rectangle(x, y, width, height, roughOptions);
    }

    if (roughElement) {
      roughElement.classList.add("rough-shape");
      groupRef.current.insertBefore(roughElement, groupRef.current.firstChild);
    }

    // Cleanup function
    return () => {
      if (roughElement && roughElement.parentNode) {
        roughElement.remove();
      }
    };
  }, [shape, x, y, width, height, fill, stroke, strokeWidth]);

  return (
    <g
      ref={groupRef}
      id={`node-${id}`}
      data-node-id={id}
      style={{ opacity: 1, ...style }}
      className="node-group"
    >
      {renderText(label, subtitle, position.x, position.y, textColor)}
    </g>
  );
}

/**
 * Render text label with hand-drawn font
 */
function renderText(
  label: string,
  subtitle: string | undefined,
  cx: number,
  cy: number,
  color: string
) {
  const lines = [label];
  if (subtitle) {
    lines.push(...subtitle.split("\n"));
  }

  const lineHeight = 20;
  const startY = cy - ((lines.length - 1) * lineHeight) / 2;

  return (
    <text
      x={cx}
      y={startY}
      textAnchor="middle"
      dominantBaseline="middle"
      fill={color}
      fontSize="15"
      fontFamily="Comic Neue, Comic Sans MS, sans-serif"
      fontWeight="400"
    >
      {lines.map((line, i) => (
        <tspan key={i} x={cx} dy={i === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}
