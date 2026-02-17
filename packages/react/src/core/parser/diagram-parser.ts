import type {
  DiagramNode,
  DiagramEdge,
  NodeShape,
  FlowchartDirection,
  EdgeStyle,
  ArrowType,
} from "../types";

/**
 * Parse flowchart diagram section
 */
export function parseFlowchart(diagramText: string): {
  direction: FlowchartDirection;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
} {
  const lines = diagramText.split("\n").map((l) => l.trim()).filter(Boolean);

  let direction: FlowchartDirection = "LR";
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];
  const nodeMap = new Map<string, DiagramNode>();
  const edgeCounters = new Map<string, number>();

  for (const line of lines) {
    // Parse header: flowchart LR
    if (line.startsWith("flowchart")) {
      const match = line.match(/flowchart\s+(LR|RL|TD|BT)/);
      if (match) {
        direction = match[1] as FlowchartDirection;
      }
      continue;
    }

    // Parse edge: nodeA --> nodeB or nodeA --- nodeB
    if (line.includes("-->") || line.includes("---") || line.includes("-.->") || line.includes("==>")) {
      const edge = parseEdgeLine(line, edgeCounters);
      if (edge) {
        edges.push(edge);
      }
      continue;
    }

    // Parse node: nodeId[label] or nodeId{label} etc.
    const node = parseNodeLine(line);
    if (node && !nodeMap.has(node.id)) {
      nodes.push(node);
      nodeMap.set(node.id, node);
    }
  }

  return { direction, nodes, edges };
}

/**
 * Parse node definition line
 */
function parseNodeLine(line: string): DiagramNode | null {
  // Match patterns: nodeId[label], nodeId{label}, nodeId([label]), etc.
  const patterns = [
    { regex: /(\w+)\(\[([^\]]+)\]\)/, shape: "terminator" as NodeShape },
    { regex: /(\w+)\[([^\]]+)\]/, shape: "rectangle" as NodeShape },
    { regex: /(\w+)\{([^}]+)\}/, shape: "diamond" as NodeShape },
    { regex: /(\w+)\[\/([^\/]+)\/\]/, shape: "parallelogram" as NodeShape },
    { regex: /(\w+)\[\(([^\)]+)\)\]/, shape: "database" as NodeShape },
    { regex: /(\w+)\[\[([^\]]+)\]\]/, shape: "document" as NodeShape },
  ];

  for (const { regex, shape } of patterns) {
    const match = line.match(regex);
    if (match) {
      const id = match[1];
      const labelText = match[2];
      
      // Handle multi-line labels with <br/>
      const parts = labelText.split("<br/>").map(p => p.trim());
      const label = parts[0];
      const subtitle = parts.slice(1).join("\n");

      return {
        id,
        shape,
        label,
        subtitle: subtitle || undefined,
      };
    }
  }

  return null;
}

/**
 * Parse edge definition line
 */
function parseEdgeLine(line: string, edgeCounters: Map<string, number>): DiagramEdge | null {
  // Match: nodeA -->|label| nodeB or nodeA --- nodeB
  let edgeStyle: EdgeStyle = "solid";
  let arrowType: ArrowType = "single";

  // Extract label if present
  const labelMatch = line.match(/\|([^|]+)\|/);
  const label = labelMatch ? labelMatch[1].trim() : undefined;

  // Remove label for node extraction
  const cleanLine = line.replace(/\|[^|]+\|/g, "");

  // Determine arrow type and split — order matters (-.-> before -->)
  let parts: string[];
  if (cleanLine.includes("-.->")) {
    edgeStyle = "dashed";
    parts = cleanLine.split("-.->");
  } else if (cleanLine.includes("==>")) {
    edgeStyle = "thick";
    parts = cleanLine.split("==>");
  } else if (cleanLine.includes("-->")) {
    parts = cleanLine.split("-->");
  } else if (cleanLine.includes("---")) {
    arrowType = "none";
    parts = cleanLine.split("---");
  } else {
    return null;
  }

  if (parts.length !== 2) return null;

  const from = parts[0].trim();
  const to = parts[1].trim();
  if (!from || !to) return null;

  // Deduplicate edge IDs with a counter suffix
  const baseId = `${from}_to_${to}`;
  const count = edgeCounters.get(baseId) ?? 0;
  edgeCounters.set(baseId, count + 1);
  const id = count === 0 ? baseId : `${baseId}_${count}`;

  return {
    id,
    from,
    to,
    label,
    style: edgeStyle,
    arrow: arrowType,
  };
}
