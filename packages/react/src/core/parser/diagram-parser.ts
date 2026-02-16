import type {
  DiagramNode,
  DiagramEdge,
  NodeShape,
  FlowchartDirection,
  EdgeStyle,
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

  for (const line of lines) {
    // Parse header: flowchart LR
    if (line.startsWith("flowchart")) {
      const match = line.match(/flowchart\s+(LR|RL|TD|BT)/);
      if (match) {
        direction = match[1] as FlowchartDirection;
      }
      continue;
    }

    // Parse edge: nodeA --> nodeB
    if (line.includes("-->") || line.includes("-.->") || line.includes("==>")) {
      const edge = parseEdgeLine(line);
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
function parseEdgeLine(line: string): DiagramEdge | null {
  // Match: nodeA -->|label| nodeB or nodeA --> nodeB
  let edgeStyle: EdgeStyle = "solid";
  let arrowSymbol = "-->";

  if (line.includes("-.->")) {
    edgeStyle = "dashed";
    arrowSymbol = ".->";
  } else if (line.includes("==>")) {
    edgeStyle = "thick";
    arrowSymbol = "==>";
  }

  // Extract label if present
  const labelMatch = line.match(/\|([^|]+)\|/);
  const label = labelMatch ? labelMatch[1].trim() : undefined;

  // Remove label for node extraction
  const cleanLine = line.replace(/\|[^|]+\|/g, "");

  // Extract from and to nodes
  const parts = cleanLine.split(arrowSymbol).map(p => p.trim());
  if (parts.length !== 2) return null;

  const from = parts[0];
  const to = parts[1];

  return {
    id: `${from}_to_${to}`,
    from,
    to,
    label,
    style: edgeStyle,
  };
}
