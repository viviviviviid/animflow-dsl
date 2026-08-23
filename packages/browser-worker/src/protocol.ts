import type {
  AnimFlowSourceVersion,
  Diagnostic,
  RenderPlan,
} from "@animflow-dsl/model";

import type { BrowserCompileLimits } from "./limits.js";

export const BROWSER_WORKER_PROTOCOL_VERSION = 1 as const;

export interface WorkerReadyMessage {
  readonly type: "ready";
  readonly protocolVersion: number;
  readonly sourceVersions: readonly AnimFlowSourceVersion[];
  readonly compilerVersion: string;
  readonly renderPlanVersion: number;
}

export interface WorkerCompileRequest {
  readonly type: "compile";
  readonly jobId: number;
  readonly source: string;
  readonly limits: BrowserCompileLimits;
}

export interface WorkerCompileSuccess {
  readonly type: "result";
  readonly jobId: number;
  readonly ok: true;
  readonly plan: RenderPlan;
  readonly diagnostics: readonly Diagnostic[];
}

export interface WorkerCompileFailure {
  readonly type: "result";
  readonly jobId: number;
  readonly ok: false;
  readonly diagnostics: readonly Diagnostic[];
}

export type MainToWorkerMessage = WorkerCompileRequest;
export type WorkerToMainMessage =
  | WorkerReadyMessage
  | WorkerCompileSuccess
  | WorkerCompileFailure;
