import {
  DefaultScopeProvider,
  AstUtils,
  type AstNode,
  type LangiumCoreServices,
  type ReferenceInfo,
  type Scope,
} from "langium";

import { isAnimFlowDocument } from "./generated/ast.js";

export class AnimFlowScopeProvider extends DefaultScopeProvider {
  constructor(services: LangiumCoreServices) {
    super(services);
  }

  override getScope(context: ReferenceInfo): Scope {
    const outerScope = super.getScope(context);
    const root = AstUtils.getDocument(context.container).parseResult.value;
    if (!isAnimFlowDocument(root)) return outerScope;

    const referenceType = this.reflection.getReferenceType(context);
    const candidates: AstNode[] = [
      ...root.graphs,
      ...root.overlays,
      ...root.graphs.flatMap((graph) => graph.members),
    ];
    return this.createScopeForNodes(
      candidates.filter((candidate) =>
        this.reflection.isSubtype(candidate.$type, referenceType),
      ),
      outerScope,
    );
  }
}
