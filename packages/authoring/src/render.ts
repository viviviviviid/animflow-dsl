import type {
  ActionDraft,
  CanvasDraft,
  DurationDraft,
  EdgeDraft,
  FlowLayoutDraft,
  NestedStatementDraft,
  NodeDraft,
  OverlayDraft,
  TargetDraft,
  VisibilityTransitionDraft,
} from "./types.js";

export function renderCanvas(canvas: CanvasDraft, indent = ""): string {
  const body = `${indent}  `;
  return `${indent}canvas {\n${body}size ${canvas.width} by ${canvas.height}\n${body}theme ${canvas.theme}\n${body}background ${canvas.background}\n${indent}}`;
}

export function renderFlowLayout(layout: FlowLayoutDraft, indent = ""): string {
  const body = `${indent}  `;
  const settings = [
    layout.nodeGap === undefined ? undefined : `${body}nodeGap ${layout.nodeGap}`,
    layout.rankGap === undefined ? undefined : `${body}rankGap ${layout.rankGap}`,
    layout.routing === undefined ? undefined : `${body}routing ${layout.routing}`,
  ].filter((line): line is string => line !== undefined);
  return settings.length === 0
    ? `${indent}layout flow ${layout.direction} {\n${indent}}`
    : `${indent}layout flow ${layout.direction} {\n${settings.join("\n")}\n${indent}}`;
}

export function renderGraph(graphId: string, layout: FlowLayoutDraft, indent = ""): string {
  const body = `${indent}  `;
  return `${indent}graph ${graphId} {\n${renderFlowLayout(layout, body)}\n${indent}}`;
}

export function renderNode(nodeId: string, node: NodeDraft, indent = ""): string {
  const body = `${indent}  `;
  const properties = [
    node.shape === undefined ? undefined : `${body}shape ${node.shape}`,
    node.tone === undefined ? undefined : `${body}tone ${node.tone}`,
  ].filter((line): line is string => line !== undefined);
  return properties.length === 0
    ? `${indent}node ${nodeId} ${JSON.stringify(node.label)} {\n${indent}}`
    : `${indent}node ${nodeId} ${JSON.stringify(node.label)} {\n${properties.join("\n")}\n${indent}}`;
}

export function renderEdge(edgeId: string, edge: EdgeDraft, indent = ""): string {
  const body = `${indent}  `;
  const properties = [
    edge.label === undefined ? undefined : `${body}label ${JSON.stringify(edge.label)}`,
    edge.line === undefined ? undefined : `${body}line ${edge.line.pattern} ${edge.line.width}`,
    edge.arrow === undefined ? undefined : `${body}arrow ${edge.arrow}`,
    edge.tone === undefined ? undefined : `${body}tone ${edge.tone}`,
    edge.routing === undefined ? undefined : `${body}routing ${edge.routing}`,
    edge.flow === undefined ? undefined : `${body}flow ${edge.flow}`,
  ].filter((line): line is string => line !== undefined);
  const header = `${indent}edge ${edgeId}: ${edge.from.node}.${edge.from.port} -> ${edge.to.node}.${edge.to.port} {`;
  return properties.length === 0
    ? `${header}\n${indent}}`
    : `${header}\n${properties.join("\n")}\n${indent}}`;
}

export function renderOverlay(overlayId: string, overlay: OverlayDraft, indent = ""): string {
  const body = `${indent}  `;
  const properties = [
    `${body}anchor ${overlay.anchor.node}.${overlay.anchor.port}`,
    `${body}text ${JSON.stringify(overlay.text)}`,
    overlay.width === undefined ? undefined : `${body}width ${overlay.width}`,
    overlay.tone === undefined ? undefined : `${body}tone ${overlay.tone}`,
  ].filter((line): line is string => line !== undefined);
  return `${indent}overlay ${overlayId}: ${overlay.kind} {\n${properties.join("\n")}\n${indent}}`;
}

export function renderDuration(duration: DurationDraft): string {
  return `${duration.value}${duration.unit}`;
}

export function renderNamedAction(actionId: string, action: ActionDraft, indent = ""): string {
  return `${indent}action ${actionId}: ${renderAction(action, indent)}`;
}

export function renderAction(action: ActionDraft, indent = ""): string {
  switch (action.kind) {
    case "show":
    case "hide":
      return `${action.kind} ${renderTarget(action.targets)} via ${renderTransition(action.transition)}`;
    case "draw":
      return `draw ${action.edge} via trace${action.flow ? ` flow ${action.flow}` : ""}`;
    case "highlight":
      return `highlight ${action.target} tone ${action.tone}${action.effect ? ` effect ${action.effect}` : ""}`;
    case "clear-highlight":
      return `clearHighlight ${action.target}`;
    case "camera":
      return `camera ${action.operation}(${renderTarget(action.targets)})${action.padding === undefined ? "" : ` padding ${action.padding}`}`;
    case "sequence":
      return renderBlock("sequence", action.statements, indent);
    case "stagger":
      return renderBlock(`stagger ${renderDuration(action.interval)}`, action.statements, indent);
  }
}

function renderTarget(target: TargetDraft): string {
  if (target.kind === "list") return `[${target.elements.join(", ")}]`;
  return `${target.target}${target.wildcard ? ".*" : ""}`;
}

function renderTransition(transition: VisibilityTransitionDraft): string {
  if (transition.kind !== "slide") return transition.kind;
  const distance = transition.distance === undefined ? "" : `, distance: ${transition.distance}`;
  return `slide(from: ${transition.from}${distance})`;
}

function renderBlock(label: string, statements: readonly NestedStatementDraft[], indent: string): string {
  const childIndent = `${indent}  `;
  const body = statements.map((statement) => renderNested(statement, childIndent)).join("\n");
  return body.length === 0
    ? `${label} {\n${indent}}`
    : `${label} {\n${body}\n${indent}}`;
}

function renderNested(statement: NestedStatementDraft, indent: string): string {
  return renderNamedAction(statement.actionId, statement.action, indent);
}
