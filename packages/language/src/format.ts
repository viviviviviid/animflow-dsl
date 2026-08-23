import {
  ANIMFLOW_DIAGNOSTIC_CODES,
  type Diagnostic,
  type Result,
} from "@animflow-dsl/model";
import { AstUtils } from "langium";

import { getAnimFlowServices, parseAnimFlow, releaseAnimFlowDocument } from "./parse.js";

export interface FormatAnimFlowOptions {
  readonly insertSpaces?: boolean;
  readonly tabSize?: number;
}

export interface FormatAnimFlowOutput {
  readonly changed: boolean;
  readonly source: string;
}

export async function formatAnimFlow(
  source: string,
  options: FormatAnimFlowOptions = {},
): Promise<Result<FormatAnimFlowOutput>> {
  const parsed = await parseAnimFlow(source);
  if (!parsed.ok) return parsed;

  const document = AstUtils.getDocument(parsed.value);
  const formatter = getAnimFlowServices().language.lsp.Formatter;
  if (!formatter) {
    await releaseAnimFlowDocument(parsed.value);
    return {
      ok: false,
      diagnostics: [internalFormatterDiagnostic()],
    };
  }

  let formattedSource: string;
  try {
    const edits = await formatter.formatDocument(document, {
      textDocument: { uri: document.uri.toString() },
      options: {
        insertSpaces: options.insertSpaces ?? true,
        tabSize: options.tabSize ?? 2,
      },
    });
    formattedSource = `${applyTextEdits(source, document, edits).trimEnd()}\n`;
  } finally {
    await releaseAnimFlowDocument(parsed.value);
  }

  const validation = await parseAnimFlow(formattedSource);
  if (!validation.ok) return validation;
  await releaseAnimFlowDocument(validation.value);

  return {
    ok: true,
    value: {
      changed: formattedSource !== source,
      source: formattedSource,
    },
    diagnostics: parsed.diagnostics,
  };
}

function applyTextEdits(
  source: string,
  document: ReturnType<typeof AstUtils.getDocument>,
  edits: readonly {
    readonly range: {
      readonly start: { readonly line: number; readonly character: number };
      readonly end: { readonly line: number; readonly character: number };
    };
    readonly newText: string;
  }[],
): string {
  const offsetEdits = edits
    .map((edit) => ({
      start: document.textDocument.offsetAt(edit.range.start),
      end: document.textDocument.offsetAt(edit.range.end),
      newText: edit.newText,
    }))
    .sort((left, right) => right.start - left.start || right.end - left.end);

  let formatted = source;
  for (const edit of offsetEdits) {
    formatted = `${formatted.slice(0, edit.start)}${edit.newText}${formatted.slice(edit.end)}`;
  }
  return formatted;
}

function internalFormatterDiagnostic(): Diagnostic {
  return {
    code: ANIMFLOW_DIAGNOSTIC_CODES.formatterUnavailable,
    severity: "error",
    message: "AnimFlow formatter service is unavailable.",
    range: {
      start: { offset: 0, line: 0, character: 0 },
      end: { offset: 0, line: 0, character: 0 },
    },
  };
}
