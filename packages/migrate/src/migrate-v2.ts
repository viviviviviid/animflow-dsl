import {
  isActionStatement,
  isSayStatement,
  isSequenceStatement,
  isStaggerStatement,
  parseAnimFlow,
  releaseAnimFlowDocument,
  type SceneAction,
  type SceneStatement,
} from "@animflow-dsl/language";
import {
  ANIMFLOW_DIAGNOSTIC_CODES,
  ZERO_RANGE,
  type Diagnostic,
  type Result,
  type SourceRange,
} from "@animflow-dsl/model";
import { AstUtils, GrammarUtils, type AstNode, type CstNode } from "langium";

export interface V2ToV21MigrationOutput {
  readonly source: string;
  readonly sourceVersion: "2.1";
  readonly generatedIds: readonly string[];
}

interface OffsetEdit {
  readonly start: number;
  readonly end: number;
  readonly newText: string;
}

/** Inserts stable action IDs without reprinting the source or moving comments. */
export async function migrateV2ToV21(
  source: string,
): Promise<Result<V2ToV21MigrationOutput>> {
  const parsed = await parseAnimFlow(source);
  if (!parsed.ok) return parsed;

  if (parsed.value.version !== "2") {
    const versionNode = GrammarUtils.findNodeForProperty(parsed.value.$cstNode, "version");
    await releaseAnimFlowDocument(parsed.value);
    return {
      ok: false,
      diagnostics: [
        diagnostic(
          ANIMFLOW_DIAGNOSTIC_CODES.incompatibleMigrationSource,
          "v2 to v2.1 migration requires an animflow 2 source document.",
          rangeOf(versionNode),
        ),
      ],
    };
  }

  const versionNode = GrammarUtils.findNodeForProperty(parsed.value.$cstNode, "version");
  if (!versionNode) {
    await releaseAnimFlowDocument(parsed.value);
    return missingCstResult("source version");
  }

  const usedIds = collectSemanticIds(parsed.value);
  const generatedIds: string[] = [];
  const edits: OffsetEdit[] = [
    { start: versionNode.offset, end: versionNode.end, newText: "2.1" },
  ];

  for (const scene of parsed.value.story.scenes) {
    let sequence = 1;
    const allocate = (): string => {
      let candidate: string;
      do {
        candidate = `${scene.name}_action${String(sequence++).padStart(3, "0")}`;
      } while (usedIds.has(candidate));
      usedIds.add(candidate);
      return candidate;
    };

    const walked = collectActionInsertions(scene.statements, allocate);
    if (!walked.ok) {
      await releaseAnimFlowDocument(parsed.value);
      return walked;
    }
    edits.push(...walked.value.edits);
    generatedIds.push(...walked.value.generatedIds);
  }

  const migratedSource = applyOffsetEdits(source, edits);
  await releaseAnimFlowDocument(parsed.value);

  const validation = await parseAnimFlow(migratedSource);
  if (!validation.ok) {
    return {
      ok: false,
      diagnostics: [
        diagnostic(
          ANIMFLOW_DIAGNOSTIC_CODES.generatedMigrationInvalid,
          `Generated v2.1 source failed validation: ${validation.diagnostics
            .map((item) => `${item.code} ${item.message}`)
            .join("; ")}`,
        ),
      ],
    };
  }
  await releaseAnimFlowDocument(validation.value);

  return {
    ok: true,
    value: {
      source: migratedSource,
      sourceVersion: "2.1",
      generatedIds,
    },
    diagnostics: [],
  };
}

function collectActionInsertions(
  statements: readonly SceneStatement[],
  allocate: () => string,
): Result<{ readonly edits: readonly OffsetEdit[]; readonly generatedIds: readonly string[] }> {
  const edits: OffsetEdit[] = [];
  const generatedIds: string[] = [];

  const walk = (nested: readonly SceneStatement[]): boolean => {
    for (const statement of nested) {
      if (isSayStatement(statement)) continue;
      const cst = statement.$cstNode;
      if (!cst) return false;

      const generatedId = allocate();
      generatedIds.push(generatedId);
      edits.push({ start: cst.offset, end: cst.offset, newText: `action ${generatedId}: ` });

      const action = unwrapAction(statement);
      if ((isSequenceStatement(action) || isStaggerStatement(action)) && !walk(action.statements)) {
        return false;
      }
    }
    return true;
  };

  if (!walk(statements)) return missingCstResult("scene action");
  return { ok: true, value: { edits, generatedIds }, diagnostics: [] };
}

function unwrapAction(statement: SceneStatement): SceneAction {
  return isActionStatement(statement) ? statement.body : (statement as SceneAction);
}

function collectSemanticIds(document: AstNode): Set<string> {
  const ids = new Set<string>();
  for (const node of [document, ...AstUtils.streamAllContents(document)]) {
    const name = (node as AstNode & { readonly name?: unknown }).name;
    if (typeof name === "string") ids.add(name);
  }
  return ids;
}

function applyOffsetEdits(source: string, edits: readonly OffsetEdit[]): string {
  const sorted = [...edits].sort(
    (left, right) => right.start - left.start || right.end - left.end,
  );
  let result = source;
  for (const edit of sorted) {
    result = `${result.slice(0, edit.start)}${edit.newText}${result.slice(edit.end)}`;
  }
  return result;
}

function missingCstResult(label: string): Result<never> {
  return {
    ok: false,
    diagnostics: [
      diagnostic(
        ANIMFLOW_DIAGNOSTIC_CODES.missingMigrationCst,
        `Cannot migrate ${label} because its CST location is unavailable.`,
      ),
    ],
  };
}

function rangeOf(node: CstNode | undefined): SourceRange {
  if (!node) return ZERO_RANGE;
  return {
    start: {
      offset: node.offset,
      line: node.range.start.line,
      character: node.range.start.character,
    },
    end: {
      offset: node.end,
      line: node.range.end.line,
      character: node.range.end.character,
    },
  };
}

function diagnostic(code: Diagnostic["code"], message: string, range = ZERO_RANGE): Diagnostic {
  return { code, severity: "error", message, range };
}
