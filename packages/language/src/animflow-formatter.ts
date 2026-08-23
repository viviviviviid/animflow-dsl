import type { AstNode } from "langium";
import { CstUtils } from "langium";
import { AbstractFormatter, Formatting } from "langium/lsp";

const structuralPriority = { priority: 2 } as const;
const punctuationPriority = { priority: 1 } as const;

const childProperties: Readonly<Record<string, readonly string[]>> = {
  Canvas: ["properties"],
  Edge: ["properties"],
  FlowLayout: ["settings"],
  Graph: ["layout", "members"],
  InitialBlock: ["statements"],
  Node: ["properties"],
  Overlay: ["properties"],
  Scene: ["statements"],
  SequenceStatement: ["statements"],
  StaggerStatement: ["statements"],
  Story: ["initial", "scenes"],
};

/** Deterministic CST formatter. It never reconstructs source from the AST. */
export class AnimFlowFormatter extends AbstractFormatter {
  protected override format(node: AstNode): void {
    if (node.$type === "AnimFlowDocument") {
      this.formatDocumentTokens(node);
      this.formatTopLevel(node);
    }

    const properties = childProperties[node.$type];
    if (properties) this.formatBlock(node, properties);

    if (node.$type === "Duration") {
      this.getNodeFormatter(node)
        .property("unit")
        .prepend(Formatting.noSpace(punctuationPriority));
    }
  }

  private formatDocumentTokens(node: AstNode): void {
    if (!node.$cstNode) return;
    const formatter = this.getNodeFormatter(node);
    const leaves = [...CstUtils.flattenCst(node.$cstNode)].filter((leaf) => !leaf.hidden);

    for (const [index, leaf] of leaves.entries()) {
      const region = formatter.cst([leaf]);
      region.prepend(Formatting.oneSpace());

      const previous = leaves[index - 1];
      if (previous && ["(", "[", "."].includes(previous.text)) {
        region.prepend(Formatting.noSpace(punctuationPriority));
      }

      switch (leaf.text) {
        case ".":
          region.prepend(Formatting.noSpace(punctuationPriority));
          break;
        case ",":
        case ":":
        case ")":
        case "]":
        case "*":
          region.prepend(Formatting.noSpace(punctuationPriority));
          break;
        case "(":
          region.prepend(Formatting.noSpace(punctuationPriority));
          break;
        case "[":
          break;
        case "->":
          region.prepend(Formatting.oneSpace(punctuationPriority));
          break;
      }
    }

    if (leaves[0]) {
      formatter
        .cst([leaves[0]])
        .prepend(Formatting.noSpace(structuralPriority));
    }
    formatter.node(node).append(Formatting.newLine(structuralPriority));
  }

  private formatTopLevel(node: AstNode): void {
    const formatter = this.getNodeFormatter(node);
    const declarations = this.astChildren(node, ["canvas", "graphs", "overlays", "story"]);
    for (const declaration of declarations) {
      const first = this.firstVisibleLeaf(declaration);
      if (first) {
        formatter
          .cst([first])
          .prepend(Formatting.newLines(2, structuralPriority));
      }
    }
  }

  private formatBlock(node: AstNode, properties: readonly string[]): void {
    const formatter = this.getNodeFormatter(node);
    const open = formatter.keyword("{");
    const close = formatter.keyword("}");
    const children = this.astChildren(node, properties);

    open.prepend(Formatting.oneSpace(punctuationPriority));
    close.prepend(Formatting.newLine(structuralPriority));
    formatter.interior(open, close).prepend(Formatting.indent(structuralPriority));
    for (const child of children) {
      const first = this.firstVisibleLeaf(child);
      if (first) {
        formatter
          .cst([first])
          .prepend(Formatting.newLine(structuralPriority));
      }
    }
  }

  private astChildren(node: AstNode, properties: readonly string[]): AstNode[] {
    const record = node as AstNode & Record<string, unknown>;
    const children: AstNode[] = [];
    for (const property of properties) {
      const value = record[property];
      if (Array.isArray(value)) {
        for (const item of value) {
          if (this.isAstNode(item)) children.push(item);
        }
      } else if (this.isAstNode(value)) {
        children.push(value);
      }
    }
    return children;
  }

  private isAstNode(value: unknown): value is AstNode {
    return typeof value === "object" && value !== null && "$type" in value;
  }

  private firstVisibleLeaf(node: AstNode) {
    if (!node.$cstNode) return undefined;
    return [...CstUtils.flattenCst(node.$cstNode)].find((leaf) => !leaf.hidden);
  }
}
