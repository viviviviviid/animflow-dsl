import { AstUtils, GrammarAST } from "langium";
import {
  DefaultCompletionProvider,
  type CompletionContext,
} from "langium/lsp";

import type { AnimFlowDocument } from "./generated/ast.js";

const RAW_SCENE_ACTION_KEYWORDS = new Set([
  "show",
  "hide",
  "draw",
  "highlight",
  "clearHighlight",
  "camera",
  "sequence",
  "stagger",
]);

/** Version-aware completion that never proposes anonymous actions in named-action source versions. */
export class AnimFlowCompletionProvider extends DefaultCompletionProvider {
  protected override filterKeyword(context: CompletionContext, keyword: GrammarAST.Keyword): boolean {
    if (!super.filterKeyword(context, keyword)) return false;
    if (!RAW_SCENE_ACTION_KEYWORDS.has(keyword.value)) return true;

    const document = context.document.parseResult.value as AnimFlowDocument;
    if (String(document.version) !== "2.1" && String(document.version) !== "2.2") return true;
    if (!this.isInsideScene(document, context.offset)) return true;

    const currentLine = context.textDocument.getText().slice(
      context.textDocument.offsetAt({ line: context.position.line, character: 0 }),
      context.offset,
    );
    return /\baction\s+[_a-zA-Z][\w_]*\s*:\s*[\w_]*$/.test(currentLine);
  }

  private isInsideScene(document: AnimFlowDocument, offset: number): boolean {
    return document.story.scenes.some((scene) => {
      const cst = scene.$cstNode;
      return cst !== undefined && cst.offset <= offset && offset <= cst.end;
    });
  }
}
