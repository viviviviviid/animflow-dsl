import type {
  ActionDraft,
  DurationDraft,
  NestedStatementDraft,
  TargetDraft,
  VisibilityTransitionDraft,
} from "./types.js";

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
