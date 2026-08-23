import type { DiagnosticCode } from "./diagnostics";

/** Stable public diagnostic registry shared by language, compiler, and source tools. */
export const ANIMFLOW_DIAGNOSTIC_CODES = Object.freeze({
  syntax: "AF101",
  duplicateId: "AF201",
  unresolvedReference: "AF210",
  invalidReference: "AF211",
  invalidVersion: "AF301",
  missingProperty: "AF302",
  duplicateProperty: "AF303",
  invalidNumber: "AF304",
  invalidTarget: "AF305",
  invalidNarration: "AF405",
  invalidActionIdentity: "AF406",
  parallelWrite: "AF422",
  compileInvariant: "AF501",
  legacyParse: "AF601",
  legacyRenamedId: "AF602",
  legacyNormalizedStyle: "AF610",
  unsupportedLegacyBehavior: "AF620",
  orphanNarration: "AF621",
  invalidLegacyNumber: "AF623",
  incompatibleMigrationSource: "AF624",
  missingMigrationCst: "AF625",
  generatedMigrationInvalid: "AF699",
  formatterUnavailable: "AF701",
} as const satisfies Readonly<Record<string, DiagnosticCode>>);
