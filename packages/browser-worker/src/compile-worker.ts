import { lowerDocument } from "@animflow-dsl/compiler";
import {
  isActionStatement,
  isEdge,
  isSayStatement,
  isSequenceStatement,
  isStaggerStatement,
  parseAnimFlow,
  releaseAnimFlowDocument,
  type SceneStatement,
} from "@animflow-dsl/language";
import {
  ANIMFLOW_DIAGNOSTIC_CODES,
  ZERO_RANGE,
  type Diagnostic,
  type RenderPlan,
  type Result,
} from "@animflow-dsl/model";

import type { BrowserCompileLimits } from "./limits.js";

export async function compileWorkerSource(
  source: string,
  limits: BrowserCompileLimits,
): Promise<Result<RenderPlan>> {
  const byteDiagnostic = validateSourceBytes(source, limits.maxSourceBytes);
  if (byteDiagnostic) return { ok: false, diagnostics: [byteDiagnostic] };

  const parsed = await parseAnimFlow(source);
  if (!parsed.ok) return parsed;

  let result: Result<RenderPlan>;
  try {
    const counts = {
      nodes: parsed.value.graphs.reduce(
        (total, graph) => total + graph.members.filter((member) => !isEdge(member)).length,
        0,
      ),
      edges: parsed.value.graphs.reduce(
        (total, graph) => total + graph.members.filter(isEdge).length,
        0,
      ),
      scenes: parsed.value.story.scenes.length,
      ...countActions(parsed.value.story.scenes.flatMap((scene) => scene.statements)),
    };
    const limitDiagnostic = validateSemanticCounts(counts, limits);
    if (limitDiagnostic) {
      result = { ok: false, diagnostics: [limitDiagnostic] };
    } else {
      const plan = await lowerDocument(parsed.value, source);
      result = { ok: true, value: plan, diagnostics: parsed.diagnostics };
    }
  } catch (error) {
    result = {
      ok: false,
      diagnostics: [
        diagnostic(
          ANIMFLOW_DIAGNOSTIC_CODES.compileInvariant,
          error instanceof Error ? error.message : String(error),
        ),
      ],
    };
  }
  await releaseAnimFlowDocument(parsed.value);
  return result;
}

export function validateSourceBytes(
  source: string,
  maxSourceBytes: number,
): Diagnostic | undefined {
  const actual = new TextEncoder().encode(source).byteLength;
  return actual > maxSourceBytes
    ? diagnostic(
        ANIMFLOW_DIAGNOSTIC_CODES.resourceLimit,
        `Source is ${actual} bytes; the browser compile limit is ${maxSourceBytes} bytes.`,
      )
    : undefined;
}

interface SemanticCounts {
  readonly nodes: number;
  readonly edges: number;
  readonly scenes: number;
  readonly actions: number;
  readonly actionNesting: number;
}

function countActions(statements: readonly SceneStatement[]): Pick<SemanticCounts, "actions" | "actionNesting"> {
  let actions = 0;
  let actionNesting = 0;
  const pending = statements.map((statement) => ({ statement, depth: 1 }));

  while (pending.length > 0) {
    const current = pending.pop()!;
    if (isSayStatement(current.statement)) continue;
    actions += 1;
    actionNesting = Math.max(actionNesting, current.depth);
    const action = isActionStatement(current.statement)
      ? current.statement.body
      : current.statement;
    if (isSequenceStatement(action) || isStaggerStatement(action)) {
      for (let index = action.statements.length - 1; index >= 0; index -= 1) {
        pending.push({ statement: action.statements[index]!, depth: current.depth + 1 });
      }
    }
  }
  return { actions, actionNesting };
}

function validateSemanticCounts(
  counts: SemanticCounts,
  limits: BrowserCompileLimits,
): Diagnostic | undefined {
  const checks = [
    ["nodes", counts.nodes, limits.maxNodes],
    ["edges", counts.edges, limits.maxEdges],
    ["scenes", counts.scenes, limits.maxScenes],
    ["actions", counts.actions, limits.maxActions],
    ["action nesting", counts.actionNesting, limits.maxActionNesting],
  ] as const;
  const exceeded = checks.find(([, actual, limit]) => actual > limit);
  return exceeded
    ? diagnostic(
        ANIMFLOW_DIAGNOSTIC_CODES.resourceLimit,
        `Document has ${exceeded[1]} ${exceeded[0]}; the browser compile limit is ${exceeded[2]}.`,
      )
    : undefined;
}

function diagnostic(code: Diagnostic["code"], message: string): Diagnostic {
  return { code, severity: "error", message, range: ZERO_RANGE };
}
