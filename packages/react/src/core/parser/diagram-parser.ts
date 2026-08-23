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
  const lines = diagramText.split("\n");

  let direction: FlowchartDirection = "LR";
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];
  const nodeMap = new Map<string, DiagramNode>();
  const edgeCounters = new Map<string, number>();
  let hasHeader = false;

  const upsertNode = (node: DiagramNode, explicit: boolean): void => {
    const existing = nodeMap.get(node.id);
    if (!existing) {
      nodes.push(node);
      nodeMap.set(node.id, node);
      return;
    }

    // An explicit definition that appears after an implicit edge reference must
    // replace the placeholder without changing the node's insertion order.
    if (explicit) {
      const index = nodes.findIndex((candidate) => candidate.id === node.id);
      if (index >= 0) nodes[index] = node;
      nodeMap.set(node.id, node);
    }
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex].trim();
    if (!line) continue;

    // H-1: Skip comments
    if (line.startsWith("%%")) continue;

    // M-2: Skip classDef / class directives
    if (line.startsWith("classDef") || line.startsWith("class ")) continue;

    // Parse header: flowchart LR / TD / TB etc.
    if (line.startsWith("flowchart")) {
      // M-3: TB is now in FlowchartDirection union
      const match = line.match(/flowchart\s+(LR|RL|TD|TB|BT)/);
      if (match) {
        direction = match[1] as FlowchartDirection;
        hasHeader = true;
      } else {
        throw new Error(`Line ${lineIndex + 1}: Expected a flowchart direction (LR, RL, TD, TB, or BT)`);
      }
      continue;
    }

    if (line.startsWith("graph")) {
      throw new Error(`Line ${lineIndex + 1}: Use \"flowchart\" instead of \"graph\"`);
    }

    // Parse edge: nodeA --> nodeB or nodeA --- nodeB
    if (line.includes("-->") || line.includes("---") || line.includes("-.->") || line.includes("==>")) {
      const parsed = parseEdgeLine(line, edgeCounters);
      for (const node of parsed.explicitNodes) upsertNode(node, true);

      for (const edge of parsed.edges) {
        edges.push(edge);

        // C-2: Auto-create implicit nodes referenced in edges
        for (const nodeId of [edge.from, edge.to]) {
          if (!nodeMap.has(nodeId)) {
            const implicitNode: DiagramNode = {
              id: nodeId,
              shape: "rectangle",
              label: nodeId,
            };
            upsertNode(implicitNode, false);
          }
        }
      }
      continue;
    }

    // Parse node: nodeId[label] or nodeId{label} etc.
    const node = parseNodeLine(line);
    if (node) {
      upsertNode(node, true);
      continue;
    }


    // Mermaid permits a bare identifier as a standalone rectangle node.
    if (new RegExp(`^${NODE_ID.source}$`).test(line)) {
      upsertNode({ id: line, shape: "rectangle", label: line }, true);
      continue;
    }

    throw new Error(`Line ${lineIndex + 1}: Unsupported flowchart syntax: ${line}`);
  }

  if (!hasHeader) {
    throw new Error('Line 1: Diagram must start with "flowchart" and a direction');
  }

  if (nodes.length === 0) {
    throw new Error("Flowchart must contain at least one node");
  }

  return { direction, nodes, edges };
}

/** Node ID: word chars plus hyphens and dots (e.g. user-service, api.v2) */
const NODE_ID = /[\w][\w\-.]*/;

/**
 * Parse node definition line
 */
function parseNodeLine(line: string): DiagramNode | null {
  const id = NODE_ID.source;
  // C-3: Ordered by specificity — more specific patterns first to avoid partial matches
  const patterns = [
    // circle: A((text))  — must come before stadium
    { regex: new RegExp(`^(${id})\\(\\(([^)]+)\\)\\)$`),   shape: "circle" as NodeShape },
    // terminator: A([text])  — must come before stadium and rectangle
    { regex: new RegExp(`^(${id})\\(\\[([^\\]]+)\\]\\)$`), shape: "terminator" as NodeShape },
    // stadium: A(text)
    { regex: new RegExp(`^(${id})\\(([^)]+)\\)$`),          shape: "stadium" as NodeShape },
    // document: A[[text]]  — must come before rectangle
    { regex: new RegExp(`^(${id})\\[\\[([^\\]]+)\\]\\]$`), shape: "document" as NodeShape },
    // database: A[(text)]  — must come before rectangle
    { regex: new RegExp(`^(${id})\\[\\(([^)]+)\\)\\]$`),   shape: "database" as NodeShape },
    // parallelogram: A[/text/]
    { regex: new RegExp(`^(${id})\\[\\/([^\\/]+)\\/\\]$`), shape: "parallelogram" as NodeShape },
    // rectangle: A[text]
    { regex: new RegExp(`^(${id})\\[([^\\]]+)\\]$`),        shape: "rectangle" as NodeShape },
    // diamond: A{text}
    { regex: new RegExp(`^(${id})\\{([^}]+)\\}$`),          shape: "diamond" as NodeShape },
    // asymmetric: A>text]
    { regex: new RegExp(`^(${id})>([^\\]]+)\\]$`),          shape: "asymmetric" as NodeShape },
  ];

  for (const { regex, shape } of patterns) {
    const match = line.match(regex);
    if (match) {
      const nodeId = match[1];
      const rawLabel = match[2];

      // H-3: Handle <br> and <br/> variants
      const parts = rawLabel.split(/<br\s*\/?>/i).map(p => p.trim());

      // H-2: Strip surrounding quotes from label parts
      const label = parts[0].replace(/^["']|["']$/g, "");
      const subtitle = parts.slice(1).map(p => p.replace(/^["']|["']$/g, "")).join("\n");

      return {
        id: nodeId,
        shape,
        label,
        subtitle: subtitle || undefined,
      };
    }
  }

  return null;
}

/**
 * Create a single edge with deduplication
 */
function makeEdge(
  from: string,
  to: string,
  label: string | undefined,
  edgeStyle: EdgeStyle,
  arrowType: ArrowType,
  edgeCounters: Map<string, number>
): DiagramEdge {
  const baseId = `${from}_to_${to}`;
  const count = edgeCounters.get(baseId) ?? 0;
  edgeCounters.set(baseId, count + 1);
  const id = count === 0 ? baseId : `${baseId}_${count}`;

  return { id, from, to, label, style: edgeStyle, arrow: arrowType };
}

/**
 * Parse edge definition line — returns an array (may be multiple edges from chaining / multi-target)
 */
function parseEdgeLine(
  line: string,
  edgeCounters: Map<string, number>
): { edges: DiagramEdge[]; explicitNodes: DiagramNode[] } {
  let edgeStyle: EdgeStyle = "solid";
  let arrowType: ArrowType = "single";
  let label: string | undefined;

  // Working copy
  let s = line;

  // C-4 / labeled thick edge: A == text ==> B
  const thickLabelMatch = s.match(/^(.+?)\s+==\s+(.+?)\s+==>\s+(.+)$/);
  if (thickLabelMatch) {
    edgeStyle = "thick";
    label = thickLabelMatch[2].trim().replace(/^["']|["']$/g, "");
    s = `${thickLabelMatch[1].trim()} ==> ${thickLabelMatch[3].trim()}`;
  }

  // C-4: A -- text --> B  (labeled solid arrow)
  const labeledArrowMatch = s.match(/^(.+?)\s+--\s+(.+?)\s+-->\s+(.+)$/);
  if (labeledArrowMatch) {
    label = labeledArrowMatch[2].trim().replace(/^["']|["']$/g, "");
    s = `${labeledArrowMatch[1].trim()} --> ${labeledArrowMatch[3].trim()}`;
  }

  // H-2: Extract inline |label| and remove from string
  if (label === undefined) {
    const labelMatch = s.match(/\|([^|]+)\|/);
    if (labelMatch) {
      label = labelMatch[1].trim().replace(/^["']|["']$/g, "");
    }
  }
  s = s.replace(/\|[^|]+\|/g, "").trim();

  // H-5: Normalize ---> (triple+) to -->
  s = s.replace(/--+->/g, "-->");

  // Determine style and split into segments
  let rawSegments: string[];
  if (s.includes("-.->")) {
    edgeStyle = "dashed";
    rawSegments = s.split("-.->").map(p => p.trim());
  } else if (s.includes("==>")) {
    if (edgeStyle !== "thick") edgeStyle = "thick";
    rawSegments = s.split("==>").map(p => p.trim());
  } else if (s.includes("-->")) {
    rawSegments = s.split("-->").map(p => p.trim());
  } else if (s.includes("---")) {
    arrowType = "none";
    rawSegments = s.split("---").map(p => p.trim());
  } else {
    return { edges: [], explicitNodes: [] };
  }

  // Filter empty segments
  const segments = rawSegments.filter(Boolean);
  if (segments.length < 2) return { edges: [], explicitNodes: [] };

  const result: DiagramEdge[] = [];
  const explicitNodes = new Map<string, DiagramNode>();

  const parseReference = (value: string): string | null => {
    const trimmed = value.trim();
    const explicitNode = parseNodeLine(trimmed);
    if (explicitNode) {
      explicitNodes.set(explicitNode.id, explicitNode);
      return explicitNode.id;
    }

    return new RegExp(`^${NODE_ID.source}$`).test(trimmed) ? trimmed : null;
  };

  // C-1: 체이닝 처리 (A → B → C), H-4: 멀티 타겟 (A --> B & C)
  for (let i = 0; i < segments.length - 1; i++) {
    const sources = segments[i].split("&").map(parseReference).filter((id): id is string => id !== null);
    const targets = segments[i + 1].split("&").map(parseReference).filter((id): id is string => id !== null);
    if (sources.length === 0 || targets.length === 0) {
      throw new Error(`Invalid edge endpoint in: ${line}`);
    }
    // label은 첫 번째 엣지에만 붙이고 나머지 체이닝 엣지는 label 없이
    const edgeLabel = i === 0 ? label : undefined;
    for (const from of sources) {
      for (const to of targets) {
        result.push(makeEdge(from, to, edgeLabel, edgeStyle, arrowType, edgeCounters));
      }
    }
  }

  return { edges: result, explicitNodes: [...explicitNodes.values()] };
}
