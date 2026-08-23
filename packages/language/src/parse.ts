import type {
  AnimFlowSourceVersion,
  Diagnostic,
  DiagnosticCode,
  Result,
  SourcePosition,
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
  const diagnostics = document.diagnostics?.map((item) => toPublicDiagnostic(source, item)) ?? [];
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

function toPublicDiagnostic(source: string, diagnostic: LangiumDiagnostic): Diagnostic {
  const message = diagnosticMessage(diagnostic);
  return {
    code: diagnosticCode(diagnostic),
    severity: diagnostic.severity === 1 ? "error" : "warning",
    message,
    range: {
      start: positionAt(source, diagnostic.range.start.line, diagnostic.range.start.character),
      end: positionAt(source, diagnostic.range.end.line, diagnostic.range.end.character),
    },
  };
}

function diagnosticCode(diagnostic: LangiumDiagnostic): DiagnosticCode {
  if (typeof diagnostic.code === "string" && /^AF[1-7]\d\d$/.test(diagnostic.code)) {
    return diagnostic.code as DiagnosticCode;
  }
  if (diagnostic.data && typeof diagnostic.data === "object" && "code" in diagnostic.data) {
    const dataCode = (diagnostic.data as { code?: unknown }).code;
    if (dataCode === "linking-error") return "AF210";
  }
  return diagnosticMessage(diagnostic).startsWith("Could not resolve reference")
    ? "AF210"
    : "AF101";
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
