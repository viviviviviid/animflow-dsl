import { parseAnimFlow, releaseAnimFlowDocument } from "@animflow-dsl/language";
import {
  ANIMFLOW_DIAGNOSTIC_CODES,
  ZERO_RANGE,
  type Diagnostic,
  type Result,
  type SourceRange,
} from "@animflow-dsl/model";

export const MERMAID_FLOWCHART_SUPPORT = Object.freeze({
  headers: ["flowchart", "graph"],
  directions: ["TD", "TB", "LR", "RL", "BT"],
  nodeShapes: ["rectangle", "rounded", "diamond", "circle", "database"],
  edges: ["-->", "-.-", "-.->", "==>"],
  unsupported: ["subgraph", "class", "classDef", "style", "click", "linkStyle", "HTML labels"],
} as const);

export interface MermaidImportOutput {
  readonly source: string;
  readonly sourceVersion: "2.1";
  readonly generatedIds: readonly string[];
  readonly unsupportedFeatures: readonly string[];
}

interface ParsedNode {
  readonly originalId: string;
  readonly label: string;
  readonly shape: "rectangle" | "rounded" | "diamond" | "circle" | "database";
  readonly range: SourceRange;
}

interface ParsedEdge {
  readonly from: string;
  readonly to: string;
  readonly label?: string;
  readonly line: "solid" | "dashed";
  readonly width: number;
  readonly arrow: "none" | "end";
  readonly range: SourceRange;
}

/** Strictly imports the documented Mermaid flowchart subset into native AnimFlow 2.1. */
export async function importMermaidFlowchart(
  mermaidSource: string,
): Promise<Result<MermaidImportOutput>> {
  const lines = sourceLines(mermaidSource);
  const meaningful = lines.filter((line) => line.text.trim() && !line.text.trim().startsWith("%%"));
  const header = meaningful[0];
  if (!header) return failure(ANIMFLOW_DIAGNOSTIC_CODES.mermaidSyntax, "Mermaid input is empty.");

  const headerMatch = /^(?:flowchart|graph)\s+(TD|TB|LR|RL|BT)\s*$/.exec(header.text.trim());
  if (!headerMatch) {
    return failure(
      ANIMFLOW_DIAGNOSTIC_CODES.mermaidUnsupported,
      "Only Mermaid flowchart/graph headers with TD, TB, LR, RL, or BT direction are supported.",
      header.range,
    );
  }

  const nodes = new Map<string, ParsedNode>();
  const edges: ParsedEdge[] = [];
  const diagnostics: Diagnostic[] = [];
  for (const line of meaningful.slice(1)) {
    const statement = line.text.trim();
    if (/^(subgraph|end\b|classDef\b|class\b|style\b|click\b|linkStyle\b)/.test(statement)) {
      diagnostics.push(diagnostic(
        ANIMFLOW_DIAGNOSTIC_CODES.mermaidUnsupported,
        `Unsupported Mermaid flowchart feature: ${statement.split(/\s+/, 1)[0]}.`,
        line.range,
      ));
      continue;
    }
    if (statement.includes("<")) {
      diagnostics.push(diagnostic(
        ANIMFLOW_DIAGNOSTIC_CODES.mermaidUnsupported,
        "Mermaid HTML labels are not supported.",
        line.range,
      ));
      continue;
    }
    if (statement.includes(";")) {
      diagnostics.push(diagnostic(
        ANIMFLOW_DIAGNOSTIC_CODES.mermaidUnsupported,
        "Multiple Mermaid statements on one line are not supported; put each statement on its own line.",
        line.range,
      ));
      continue;
    }

    const parsedEdge = parseEdge(statement, line.range);
    if (parsedEdge) {
      registerNode(nodes, parsedEdge.fromNode, diagnostics);
      registerNode(nodes, parsedEdge.toNode, diagnostics);
      edges.push(parsedEdge.edge);
      continue;
    }
    const parsedNode = parseNode(statement, line.range);
    if (parsedNode) {
      registerNode(nodes, parsedNode, diagnostics);
      continue;
    }
    diagnostics.push(diagnostic(
      ANIMFLOW_DIAGNOSTIC_CODES.mermaidSyntax,
      `Unsupported or invalid Mermaid statement: ${statement}`,
      line.range,
    ));
  }

  if (diagnostics.length > 0) return { ok: false, diagnostics: asNonEmpty(diagnostics) };
  if (nodes.size === 0) {
    return failure(
      ANIMFLOW_DIAGNOSTIC_CODES.mermaidSyntax,
      "Mermaid flowchart must contain at least one node.",
      header.range,
    );
  }

  const identifiers = new IdentifierRegistry();
  const graphId = identifiers.allocate("diagram");
  const storyId = identifiers.allocate("main");
  const sceneId = identifiers.allocate("overview");
  const nodeIds = new Map<string, string>();
  for (const node of nodes.values()) nodeIds.set(node.originalId, identifiers.allocate(node.originalId));
  const edgeIds = edges.map((_, index) => identifiers.allocate(`edge${String(index + 1).padStart(3, "0")}`));

  const output = renderSource(
    direction(headerMatch[1]!),
    graphId,
    storyId,
    sceneId,
    [...nodes.values()],
    edges,
    nodeIds,
    edgeIds,
  );
  const validation = await parseAnimFlow(output);
  if (!validation.ok) {
    return failure(
      ANIMFLOW_DIAGNOSTIC_CODES.mermaidGeneratedInvalid,
      `Generated AnimFlow source failed validation: ${validation.diagnostics.map((item) => `${item.code} ${item.message}`).join("; ")}`,
    );
  }
  await releaseAnimFlowDocument(validation.value);
  return {
    ok: true,
    value: {
      source: output,
      sourceVersion: "2.1",
      generatedIds: [graphId, storyId, sceneId, ...nodeIds.values(), ...edgeIds],
      unsupportedFeatures: [],
    },
    diagnostics: [],
  };
}

function parseEdge(
  statement: string,
  range: SourceRange,
): { readonly fromNode: ParsedNode; readonly toNode: ParsedNode; readonly edge: ParsedEdge } | undefined {
  const match = /^(.*?)\s*(-->|-\.->|-\.-|==>)\s*(?:\|([^|]*)\|\s*)?(.*?)$/.exec(statement);
  if (!match) return undefined;
  const fromNode = parseNode(match[1]!.trim(), range);
  const toNode = parseNode(match[4]!.trim(), range);
  if (!fromNode || !toNode) return undefined;
  const operator = match[2]!;
  return {
    fromNode,
    toNode,
    edge: {
      from: fromNode.originalId,
      to: toNode.originalId,
      label: match[3]?.trim() || undefined,
      line: operator === "-.->" || operator === "-.-" ? "dashed" : "solid",
      width: operator === "==>" ? 4 : 2,
      arrow: operator === "-.-" ? "none" : "end",
      range,
    },
  };
}

function parseNode(statement: string, range: SourceRange): ParsedNode | undefined {
  const idMatch = /^([A-Za-z0-9_][A-Za-z0-9_-]*)(.*)$/.exec(statement);
  if (!idMatch) return undefined;
  const originalId = idMatch[1]!;
  const suffix = idMatch[2]!.trim();
  if (!suffix) return { originalId, label: originalId, shape: "rectangle", range };

  const shapes = [
    { pattern: /^\[\((.*)\)\]$/, shape: "database" },
    { pattern: /^\(\((.*)\)\)$/, shape: "circle" },
    { pattern: /^\[(.*)\]$/, shape: "rectangle" },
    { pattern: /^\((.*)\)$/, shape: "rounded" },
    { pattern: /^\{(.*)\}$/, shape: "diamond" },
  ] as const;
  for (const candidate of shapes) {
    const match = candidate.pattern.exec(suffix);
    if (match) {
      return {
        originalId,
        label: stripMermaidQuotes(match[1]!.trim()),
        shape: candidate.shape,
        range,
      };
    }
  }
  return undefined;
}

function registerNode(
  nodes: Map<string, ParsedNode>,
  node: ParsedNode,
  diagnostics: Diagnostic[],
): void {
  const existing = nodes.get(node.originalId);
  if (!existing || existing.label === existing.originalId) {
    nodes.set(node.originalId, node);
    return;
  }
  if (node.label !== node.originalId && (node.label !== existing.label || node.shape !== existing.shape)) {
    diagnostics.push(diagnostic(
      ANIMFLOW_DIAGNOSTIC_CODES.mermaidSyntax,
      `Mermaid node ${node.originalId} has conflicting declarations.`,
      node.range,
    ));
  }
}

function renderSource(
  layoutDirection: "right" | "left" | "down" | "up",
  graphId: string,
  storyId: string,
  sceneId: string,
  nodes: readonly ParsedNode[],
  edges: readonly ParsedEdge[],
  nodeIds: ReadonlyMap<string, string>,
  edgeIds: readonly string[],
): string {
  const lines = [
    "animflow 2.1",
    "",
    "canvas {",
    "  size 1280 by 720",
    "  theme light",
    "  background surface",
    "}",
    "",
    `graph ${graphId} {`,
    `  layout flow ${layoutDirection} {`,
    "    nodeGap 48",
    "    rankGap 80",
    "    routing orthogonal",
    "  }",
    "",
  ];
  for (const node of nodes) {
    lines.push(
      `  node ${nodeIds.get(node.originalId)!} ${quote(node.label)} {`,
      `    shape ${node.shape}`,
      "    tone neutral",
      "  }",
      "",
    );
  }
  edges.forEach((edge, index) => {
    lines.push(
      `  edge ${edgeIds[index]}: ${nodeIds.get(edge.from)}.auto -> ${nodeIds.get(edge.to)}.auto {`,
      ...(edge.label ? [`    label ${quote(edge.label)}`] : []),
      `    line ${edge.line} ${edge.width}`,
      `    arrow ${edge.arrow}`,
      "    tone primary",
      "    routing orthogonal",
      "  }",
      "",
    );
  });
  lines.push(
    "}",
    "",
    `story ${storyId} {`,
    "  initial {",
    `    show ${graphId}.*`,
    `    camera fit(${graphId}) padding 40`,
    "  }",
    "",
    `  scene ${sceneId} "Overview" duration 1s {`,
    "  }",
    "}",
    "",
  );
  return lines.join("\n");
}

function direction(value: string): "right" | "left" | "down" | "up" {
  if (value === "LR") return "right";
  if (value === "RL") return "left";
  if (value === "BT") return "up";
  return "down";
}

function stripMermaidQuotes(value: string): string {
  return value.length >= 2 && value.startsWith('"') && value.endsWith('"')
    ? value.slice(1, -1)
    : value;
}

function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
}

function sourceLines(source: string): Array<{ readonly text: string; readonly range: SourceRange }> {
  const lines: Array<{ text: string; range: SourceRange }> = [];
  let offset = 0;
  source.split(/\r?\n/).forEach((text, line) => {
    lines.push({
      text,
      range: {
        start: { offset, line, character: 0 },
        end: { offset: offset + text.length, line, character: text.length },
      },
    });
    offset += text.length + 1;
  });
  return lines;
}

class IdentifierRegistry {
  private readonly used = new Set<string>();

  allocate(input: string): string {
    const normalized = normalizeId(input);
    let candidate = normalized;
    let suffix = 2;
    while (this.used.has(candidate)) candidate = `${normalized}_${suffix++}`;
    this.used.add(candidate);
    return candidate;
  }
}

function normalizeId(input: string): string {
  const normalized = input.replace(/[^A-Za-z0-9_]/g, "_").replace(/_+/g, "_");
  return /^[A-Za-z_]/.test(normalized) ? normalized : `id_${normalized || "item"}`;
}

function failure(code: Diagnostic["code"], message: string, range = ZERO_RANGE): Result<never> {
  return { ok: false, diagnostics: [diagnostic(code, message, range)] };
}

function diagnostic(code: Diagnostic["code"], message: string, range: SourceRange): Diagnostic {
  return { code, severity: "error", message, range };
}

function asNonEmpty(diagnostics: Diagnostic[]): [Diagnostic, ...Diagnostic[]] {
  if (diagnostics.length === 0) throw new TypeError("Expected at least one Mermaid diagnostic.");
  return diagnostics as [Diagnostic, ...Diagnostic[]];
}
