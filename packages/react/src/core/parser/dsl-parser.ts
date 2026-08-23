import type { DiagramData, ParseResult } from "../types";
import { splitDslSections } from "./lexer";
import { parseFlowchart } from "./diagram-parser";
import { parseAnimation } from "./animation-parser";
import { parseStyle } from "./style-parser";
import { parseNarration } from "./narration-parser";
import { parseConfig } from "./config-parser";

/**
 * Main DSL Parser
 * Parses complete DSL text and returns DiagramData
 */
export function parseDsl(dslText: string): ParseResult {
  try {
    // Split into sections
    const sections = splitDslSections(dslText);

    // Parse diagram
    const { direction, nodes, edges } = parseFlowchart(sections.diagram);

    // Parse animations
    const animations = sections.animation
      ? parseAnimation(sections.animation)
      : [];

    // Parse styles and merge into each node
    const styles = sections.style ? parseStyle(sections.style) : {};

    // Parse narrations
    const narrations = sections.narration
      ? parseNarration(sections.narration)
      : [];

    // Parse config
    const config = sections.config
      ? parseConfig(sections.config)
      : { autoplay: false, loop: false, controls: true, narration: true, speed: 1 };

    // Merge @style into each node's inline style
    const styledNodes = nodes.map((node) =>
      styles[node.id]
        ? { ...node, style: { ...styles[node.id], ...node.style } }
        : node
    );

    // Assemble complete diagram data
    const data: DiagramData = {
      metadata: {
        id: `diagram_${Date.now()}`,
        type: "flowchart",
        direction,
        created: new Date().toISOString(),
      },
      nodes: styledNodes,
      edges,
      animations,
      narrations,
      config,
    };

    return {
      success: true,
      data,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const lineMatch = message.match(/^Line (\d+):/);
    return {
      success: false,
      errors: [
        {
          line: lineMatch ? Number(lineMatch[1]) : 0,
          column: 0,
          message,
          type: "syntax",
        },
      ],
    };
  }
}
