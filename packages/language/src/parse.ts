import {
  ANIMFLOW_DIAGNOSTIC_CODES,
  type AnimFlowSourceVersion,
  type Diagnostic,
  type DiagnosticCode,
  type Result,
  type SourcePosition,
  type SourceRange,
  type SuggestedFix,
} from "@animflow-dsl/model";
import { AstUtils, EmptyFileSystem, URI } from "langium";

import { createAnimFlowServices } from "./animflow-module.js";
import type { AnimFlowDocument as GeneratedAnimFlowDocument } from "./generated/ast.js";

const services = createAnimFlowServices(EmptyFileSystem);
let documentSequence = 0;

interface LangiumDiagnostic {
  readonly code?: number | string;
  readonly data?: unknown;
  readonly message: string | { readonly value: string };
  readonly severity?: number;
  readonly range: {
    readonly start: { readonly line: number; readonly character: number };
    readonly end: { readonly line: number; readonly character: number };
  };
}

interface LangiumPosition {
  readonly line: number;
  readonly character: number;
}

interface EmbeddedFixData {
  readonly fixes: readonly {
    readonly title: string;
    readonly edits: readonly {
      readonly range?: { readonly start: LangiumPosition; readonly end: LangiumPosition };
      readonly newText: string;
    }[];
  }[];
}

export interface ParseAnimFlowOptions {
  readonly validation?: boolean;
}

export type ParsedAnimFlowDocument = Omit<GeneratedAnimFlowDocument, "version"> & {
  readonly version: AnimFlowSourceVersion;
};

export async function parseAnimFlow(
  source: string,
  options: ParseAnimFlowOptions = {},
): Promise<Result<ParsedAnimFlowDocument>> {
  const uri = URI.parse(`memory:///animflow-${documentSequence++}.animflow`);
  const document = services.shared.workspace.LangiumDocumentFactory.fromString<GeneratedAnimFlowDocument>(
    source,
    uri,
  );
  services.shared.workspace.LangiumDocuments.addDocument(document);
  await services.shared.workspace.DocumentBuilder.build([document], {
    validation:
      options.validation === false
        ? false
        : {
            stopAfterLexingErrors: true,
            stopAfterParsingErrors: true,
            stopAfterLinkingErrors: true,
          },
  });
  const diagnostics = document.diagnostics?.map((item) =>
    toPublicDiagnostic(source, item, document.parseResult.value)
  ) ?? [];
  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === "error");

  if (errors.length > 0) {
    await releaseUri(uri);
    return {
      ok: false,
      diagnostics: diagnostics as [Diagnostic, ...Diagnostic[]],
    };
  }

  return {
    ok: true,
    // Langium's data-type rule returns the source lexeme at runtime, while its
    // generated alias follows the nested NUMBER terminal. Validation above
    // narrows successful documents to the public string version union.
    value: document.parseResult.value as unknown as ParsedAnimFlowDocument,
    diagnostics,
  };
}

export function getAnimFlowServices(): typeof services {
  return services;
}

export async function releaseAnimFlowDocument(document: ParsedAnimFlowDocument): Promise<void> {
  await releaseUri(AstUtils.getDocument(document).uri);
}

async function releaseUri(uri: URI): Promise<void> {
  await services.shared.workspace.DocumentBuilder.update([], [uri]);
}

function toPublicDiagnostic(
  source: string,
  diagnostic: LangiumDiagnostic,
  document: GeneratedAnimFlowDocument,
): Diagnostic {
  const message = diagnosticMessage(diagnostic);
  const range = sourceRange(source, diagnostic.range);
  const fixes = diagnosticFixes(source, diagnostic, document, range);
  return {
    code: diagnosticCode(diagnostic),
    severity: diagnostic.severity === 1 ? "error" : "warning",
    message,
    range,
    ...(fixes.length > 0 ? { fixes } : {}),
  };
}

function diagnosticFixes(
  source: string,
  diagnostic: LangiumDiagnostic,
  document: GeneratedAnimFlowDocument,
  diagnosticRange: SourceRange,
): SuggestedFix[] {
  const embedded = embeddedFixes(source, diagnostic.data, diagnosticRange);
  if (embedded.length > 0) return embedded;

  const data = diagnostic.data;
  if (!data || typeof data !== "object" || !("code" in data) || data.code !== "linking-error") {
    return [];
  }
  const refText = "refText" in data && typeof data.refText === "string" ? data.refText : undefined;
  const containerType = "containerType" in data && typeof data.containerType === "string"
    ? data.containerType
    : undefined;
  const property = "property" in data && typeof data.property === "string" ? data.property : undefined;
  if (!refText || !containerType || !property) return [];

  const nodes = document.graphs.flatMap((graph) =>
    graph.members.filter((member) => member.$type === "Node")
  );
  const edges = document.graphs.flatMap((graph) =>
    graph.members.filter((member) => member.$type === "Edge")
  );
  const elements = [...nodes, ...edges, ...document.overlays];
  const candidates = property === "from" || property === "to" || property === "node"
    ? nodes
    : property === "edge"
      ? edges
      : containerType === "NamedTarget"
        ? [...document.graphs, ...elements]
        : elements;
  const replacement = nearestName(refText, candidates.map((candidate) => candidate.name));
  return replacement
    ? [{ title: `Replace with ${replacement}`, edits: [{ range: diagnosticRange, newText: replacement }] }]
    : [];
}

function embeddedFixes(
  source: string,
  data: unknown,
  diagnosticRange: SourceRange,
): SuggestedFix[] {
  if (!isEmbeddedFixData(data)) return [];
  return data.fixes.map((fix) => ({
    title: fix.title,
    edits: fix.edits.map((edit) => ({
      range: edit.range ? sourceRange(source, edit.range) : diagnosticRange,
      newText: edit.newText,
    })),
  }));
}

function isEmbeddedFixData(data: unknown): data is EmbeddedFixData {
  if (!data || typeof data !== "object" || !("fixes" in data) || !Array.isArray(data.fixes)) return false;
  return data.fixes.every((fix) =>
    fix && typeof fix === "object" && "title" in fix && typeof fix.title === "string" &&
    "edits" in fix && Array.isArray(fix.edits) && fix.edits.every(isEmbeddedEdit)
  );
}

function isEmbeddedEdit(edit: unknown): edit is EmbeddedFixData["fixes"][number]["edits"][number] {
  if (!edit || typeof edit !== "object" || !("newText" in edit) || typeof edit.newText !== "string") {
    return false;
  }
  return !("range" in edit) || edit.range === undefined || isLangiumRange(edit.range);
}

function isLangiumRange(range: unknown): range is { readonly start: LangiumPosition; readonly end: LangiumPosition } {
  if (!range || typeof range !== "object" || !("start" in range) || !("end" in range)) return false;
  return isLangiumPosition(range.start) && isLangiumPosition(range.end);
}

function isLangiumPosition(position: unknown): position is LangiumPosition {
  return Boolean(
    position && typeof position === "object" &&
    "line" in position && typeof position.line === "number" &&
    "character" in position && typeof position.character === "number",
  );
}

function nearestName(input: string, names: readonly string[]): string | undefined {
  const ranked = [...new Set(names)]
    .map((name) => ({ name, distance: editDistance(input, name) }))
    .sort((left, right) => left.distance - right.distance || left.name.localeCompare(right.name));
  const best = ranked[0];
  if (!best || best.distance > Math.max(2, Math.ceil(input.length / 3))) return undefined;
  if (ranked[1]?.distance === best.distance) return undefined;
  return best.name;
}

function editDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1]! + 1,
        previous[rightIndex]! + 1,
        previous[rightIndex - 1]! + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length]!;
}

function sourceRange(
  source: string,
  range: { readonly start: LangiumPosition; readonly end: LangiumPosition },
): SourceRange {
  return {
    start: positionAt(source, range.start.line, range.start.character),
    end: positionAt(source, range.end.line, range.end.character),
  };
}

function diagnosticCode(diagnostic: LangiumDiagnostic): DiagnosticCode {
  if (typeof diagnostic.code === "string" && /^AF[1-7]\d\d$/.test(diagnostic.code)) {
    return diagnostic.code as DiagnosticCode;
  }
  if (diagnostic.data && typeof diagnostic.data === "object" && "code" in diagnostic.data) {
    const dataCode = (diagnostic.data as { code?: unknown }).code;
    if (dataCode === "linking-error") return ANIMFLOW_DIAGNOSTIC_CODES.unresolvedReference;
  }
  return diagnosticMessage(diagnostic).startsWith("Could not resolve reference")
    ? ANIMFLOW_DIAGNOSTIC_CODES.unresolvedReference
    : ANIMFLOW_DIAGNOSTIC_CODES.syntax;
}

function diagnosticMessage(diagnostic: LangiumDiagnostic): string {
  return typeof diagnostic.message === "string"
    ? diagnostic.message
    : diagnostic.message.value;
}

function positionAt(source: string, line: number, character: number): SourcePosition {
  let offset = 0;
  let currentLine = 0;
  while (currentLine < line && offset < source.length) {
    const next = source.indexOf("\n", offset);
    if (next === -1) {
      offset = source.length;
      break;
    }
    offset = next + 1;
    currentLine += 1;
  }
  offset = Math.min(offset + character, source.length);
  return { offset, line, character };
}
