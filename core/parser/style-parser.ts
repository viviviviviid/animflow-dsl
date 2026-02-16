import type { NodeStyle } from "../types";

/**
 * Parse @style section
 */
export function parseStyle(styleText: string): Record<string, NodeStyle> {
  const styles: Record<string, NodeStyle> = {};
  const lines = styleText.split("\n");
  
  let currentNodeId: string | null = null;
  let currentStyle: Partial<NodeStyle> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Node ID line: "nodeId:" or ".className:"
    if (trimmed.endsWith(":") && !line.startsWith("  ")) {
      // Save previous style
      if (currentNodeId) {
        styles[currentNodeId] = currentStyle as NodeStyle;
      }

      currentNodeId = trimmed.slice(0, -1);
      currentStyle = {};
    }
    // Property line
    else if (line.startsWith("  ") && currentNodeId) {
      const colonIndex = trimmed.indexOf(":");
      if (colonIndex === -1) continue;

      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      // Convert kebab-case to camelCase
      const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

      // Parse value
      if (camelKey === "strokeWidth" || camelKey === "fontSize") {
        currentStyle[camelKey as keyof NodeStyle] = parseInt(value, 10) as any;
      } else {
        currentStyle[camelKey as keyof NodeStyle] = value as any;
      }
    }
  }

  // Save last style
  if (currentNodeId) {
    styles[currentNodeId] = currentStyle as NodeStyle;
  }

  return styles;
}
