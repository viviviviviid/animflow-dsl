import type { SourcePosition, SourceRange } from "@animflow-dsl/model";
import { URI, type LangiumDocument } from "langium";

import { getAnimFlowServices } from "./parse.js";
import type { AnimFlowDocument } from "./generated/ast.js";

let intelligenceDocumentSequence = 0;

export interface AnimFlowCompletion {
  readonly label: string;
  readonly detail?: string;
  readonly documentation?: string;
  readonly kind?: number;
  readonly insertText: string;
  readonly replaceRange?: SourceRange;
}

export interface AnimFlowDefinition {
  readonly originRange?: SourceRange;
  readonly targetRange: SourceRange;
  readonly targetSelectionRange: SourceRange;
}

export interface AnimFlowHover {
  readonly markdown: string;
  readonly range?: SourceRange;
}

export async function completeAnimFlow(
  source: string,
  position: Pick<SourcePosition, "line" | "character">,
): Promise<readonly AnimFlowCompletion[]> {
  return withDocument(source, async (document) => {
    const provider = getAnimFlowServices().language.lsp.CompletionProvider;
    if (!provider) return [];
    const result = await provider.getCompletion(document, {
      textDocument: { uri: document.textDocument.uri },
      position,
    });
    return (result?.items ?? []).map((item) => {
      const textEdit = item.textEdit;
      const editRange = textEdit
        ? "range" in textEdit
          ? textEdit.range
          : textEdit.replace
        : undefined;
      const documentation = typeof item.documentation === "string"
        ? item.documentation
        : item.documentation?.value;
      return {
        label: item.label,
        insertText: textEdit?.newText ?? item.insertText ?? item.label,
        ...(item.detail ? { detail: item.detail } : {}),
        ...(documentation ? { documentation } : {}),
        ...(item.kind ? { kind: item.kind } : {}),
        ...(editRange ? { replaceRange: sourceRange(source, editRange) } : {}),
      };
    });
  });
}

export async function defineAnimFlow(
  source: string,
  position: Pick<SourcePosition, "line" | "character">,
): Promise<readonly AnimFlowDefinition[]> {
  return withDocument(source, async (document) => {
    const provider = getAnimFlowServices().language.lsp.DefinitionProvider;
    if (!provider) return [];
    const links = await provider.getDefinition(document, {
      textDocument: { uri: document.textDocument.uri },
      position,
    });
    return (links ?? []).map((link) => ({
      ...(link.originSelectionRange
        ? { originRange: sourceRange(source, link.originSelectionRange) }
        : {}),
      targetRange: sourceRange(source, link.targetRange),
      targetSelectionRange: sourceRange(source, link.targetSelectionRange),
    }));
  });
}

export async function hoverAnimFlow(
  source: string,
  position: Pick<SourcePosition, "line" | "character">,
): Promise<AnimFlowHover | undefined> {
  return withDocument(source, async (document) => {
    const provider = getAnimFlowServices().language.lsp.HoverProvider;
    if (!provider) return undefined;
    const hover = await provider.getHoverContent(document, {
      textDocument: { uri: document.textDocument.uri },
      position,
    });
    if (!hover) return undefined;
    const contents = typeof hover.contents === "string"
      ? hover.contents
      : Array.isArray(hover.contents)
        ? hover.contents.map((item) => typeof item === "string" ? item : item.value).join("\n\n")
        : hover.contents.value;
    return {
      markdown: contents,
      ...(hover.range ? { range: sourceRange(source, hover.range) } : {}),
    };
  });
}

async function withDocument<Value>(
  source: string,
  operation: (document: LangiumDocument<AnimFlowDocument>) => Promise<Value>,
): Promise<Value> {
  const services = getAnimFlowServices();
  const uri = URI.parse(`memory:///animflow-intelligence-${intelligenceDocumentSequence++}.animflow`);
  const document = services.shared.workspace.LangiumDocumentFactory.fromString<AnimFlowDocument>(source, uri);
  services.shared.workspace.LangiumDocuments.addDocument(document);
  await services.shared.workspace.DocumentBuilder.build([document], { validation: false });
  try {
    return await operation(document);
  } finally {
    await services.shared.workspace.DocumentBuilder.update([], [uri]);
  }
}

function sourceRange(
  source: string,
  range: {
    readonly start: { readonly line: number; readonly character: number };
    readonly end: { readonly line: number; readonly character: number };
  },
): SourceRange {
  return {
    start: sourcePosition(source, range.start),
    end: sourcePosition(source, range.end),
  };
}

function sourcePosition(
  source: string,
  position: { readonly line: number; readonly character: number },
): SourcePosition {
  let offset = 0;
  for (let line = 0; line < position.line; line += 1) {
    const newline = source.indexOf("\n", offset);
    if (newline === -1) return { ...position, offset: source.length };
    offset = newline + 1;
  }
  return { ...position, offset: Math.min(source.length, offset + position.character) };
}
