import { AstNodeHoverProvider } from "langium/lsp";
import type { AstNode } from "langium";

import {
  isActionStatement,
  isEdge,
  isGraph,
  isNode,
  isOverlay,
  isScene,
  isStory,
} from "./generated/ast.js";

/** Compact semantic hover text for declarations and linked references. */
export class AnimFlowHoverProvider extends AstNodeHoverProvider {
  protected override getAstNodeHoverContent(node: AstNode): string | undefined {
    if (isGraph(node)) return `**graph ${node.name}** — flow-layout diagram and wildcard target \`${node.name}.*\`.`;
    if (isNode(node)) return `**node ${node.name}** — ${node.label}`;
    if (isEdge(node)) {
      return `**edge ${node.name}** — \`${node.from.$refText}.${node.fromPort} -> ${node.to.$refText}.${node.toPort}\``;
    }
    if (isOverlay(node)) return `**overlay ${node.name}** — ${node.overlayKind} canvas element.`;
    if (isStory(node)) return `**story ${node.name}** — the document's deterministic scene timeline.`;
    if (isScene(node)) return `**scene ${node.name}** — ${node.title}, ${node.duration.value}${node.duration.unit}.`;
    if (isActionStatement(node)) return `**action ${node.name}** — stable authoring identity for ${node.body.$type}.`;
    return undefined;
  }
}
