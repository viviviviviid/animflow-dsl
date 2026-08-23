import type { SourceRange } from "./source";

export type DiagnosticSeverity = "error" | "warning";
export type DiagnosticCode = `AF${1 | 2 | 3 | 4 | 5 | 6 | 7}${number}${number}`;

export interface TextEdit {
  readonly range: SourceRange;
  readonly newText: string;
}

export interface SuggestedFix {
  readonly title: string;
  readonly edits: readonly TextEdit[];
}

export interface RelatedLocation {
  readonly message: string;
  readonly range: SourceRange;
}

export interface Diagnostic {
  readonly code: DiagnosticCode;
  readonly severity: DiagnosticSeverity;
  readonly message: string;
  readonly range: SourceRange;
  readonly related?: readonly RelatedLocation[];
  readonly fixes?: readonly SuggestedFix[];
}

export type NonEmptyReadonlyArray<T> = readonly [T, ...T[]];

export type Result<Value> =
  | {
      readonly ok: true;
      readonly value: Value;
      readonly diagnostics: readonly Diagnostic[];
    }
  | {
      readonly ok: false;
      readonly diagnostics: NonEmptyReadonlyArray<Diagnostic>;
    };

export function hasErrors(diagnostics: readonly Diagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}
