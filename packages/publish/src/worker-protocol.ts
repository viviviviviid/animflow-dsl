import type { Diagnostic, RenderPlan } from "@animflow-dsl/model";

export type CompileWorkerRequest = { readonly type: "compile"; readonly source: string };
export type CompileWorkerResponse =
  | { readonly type: "success"; readonly source: string; readonly plan: RenderPlan }
  | { readonly type: "failure"; readonly diagnostics: readonly Diagnostic[] }
  | { readonly type: "crash"; readonly message: string };
