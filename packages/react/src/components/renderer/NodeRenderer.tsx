"use client";

import React from "react";
import type { DiagramNode, NodeShape } from "../../core/types";

interface NodeRendererProps {
  node: DiagramNode;
  style?: React.CSSProperties;
}

export function NodeRenderer({ node, style }: NodeRendererProps) {
  const { id, shape, label, subtitle, position, width, height } = node;

  if (!position || !width || !height) return null;

  const x = position.x - width / 2;
  const y = position.y - height / 2;

  // Default styles
  const fill = node.style?.fill || "#e3f2fd";
  const stroke = node.style?.stroke || "#2196F3";
  const strokeWidth = node.style?.strokeWidth || 2;
  const textColor = node.style?.color || "#000000";

  return (
    <g
      id={`node-${id}`}
      data-node-id={id}
      style={{ opacity: 1, ...style }} // Nodes always visible
      className="node-group"
    >
      {renderShape(shape, x, y, width, height, fill, stroke, strokeWidth)}
      {renderText(label, subtitle, position.x, position.y, textColor)}
    </g>
  );
}

/**
 * Render node shape based on type
 */
function renderShape(
  shape: NodeShape,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke: string,
  strokeWidth: number
) {
  const commonProps = {
    fill,
    stroke,
    strokeWidth,
  };

  switch (shape) {
    case "rectangle":
      return (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={4}
          {...commonProps}
        />
      );

    case "terminator":
      return (
        <ellipse
          cx={x + width / 2}
          cy={y + height / 2}
          rx={width / 2}
          ry={height / 2}
          {...commonProps}
        />
      );

    case "diamond":
      const cx = x + width / 2;
      const cy = y + height / 2;
      const points = `
        ${cx},${y}
        ${x + width},${cy}
        ${cx},${y + height}
        ${x},${cy}
      `;
      return <polygon points={points} {...commonProps} />;

    case "parallelogram":
      const offset = width * 0.15;
      const paraPoints = `
        ${x + offset},${y}
        ${x + width},${y}
        ${x + width - offset},${y + height}
        ${x},${y + height}
      `;
      return <polygon points={paraPoints} {...commonProps} />;

    case "database":
      const dbHeight = height * 0.15;
      return (
        <g>
          <ellipse
            cx={x + width / 2}
            cy={y + dbHeight}
            rx={width / 2}
            ry={dbHeight}
            {...commonProps}
          />
          <rect
            x={x}
            y={y + dbHeight}
            width={width}
            height={height - dbHeight * 2}
            fill={fill}
            stroke="none"
          />
          <line
            x1={x}
            y1={y + dbHeight}
            x2={x}
            y2={y + height - dbHeight}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <line
            x1={x + width}
            y1={y + dbHeight}
            x2={x + width}
            y2={y + height - dbHeight}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <ellipse
            cx={x + width / 2}
            cy={y + height - dbHeight}
            rx={width / 2}
            ry={dbHeight}
            {...commonProps}
          />
        </g>
      );

    case "document":
      const wavePath = `
        M ${x} ${y}
        L ${x + width} ${y}
        L ${x + width} ${y + height - 10}
        Q ${x + width * 0.75} ${y + height - 15}, ${x + width / 2} ${y + height - 10}
        Q ${x + width * 0.25} ${y + height - 5}, ${x} ${y + height - 10}
        Z
      `;
      return <path d={wavePath} {...commonProps} />;

    default:
      return (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={4}
          {...commonProps}
        />
      );
  }
}

/**
 * Render text label
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
      fontSize="14"
      fontFamily="system-ui, sans-serif"
    >
      {lines.map((line, i) => (
        <tspan key={i} x={cx} dy={i === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}
