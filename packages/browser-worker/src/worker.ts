import { ANIMFLOW_COMPILER_VERSION } from "@animflow-dsl/compiler";
import {
  ANIMFLOW_SOURCE_VERSIONS,
  RENDER_PLAN_VERSION,
} from "@animflow-dsl/model";

import { compileWorkerSource } from "./compile-worker.js";
import { DEFAULT_BROWSER_COMPILE_LIMITS } from "./limits.js";
import {
  BROWSER_WORKER_PROTOCOL_VERSION,
  type MainToWorkerMessage,
  type WorkerToMainMessage,
} from "./protocol.js";

interface WorkerScope {
  onmessage: ((event: { readonly data: MainToWorkerMessage }) => void) | null;
  postMessage(message: WorkerToMainMessage): void;
}

const scope = globalThis as unknown as WorkerScope;

scope.onmessage = (event) => {
  if (event.data.type !== "compile") return;
  const { jobId, source, limits } = event.data;
  void compileWorkerSource(source, limits ?? DEFAULT_BROWSER_COMPILE_LIMITS).then((result) => {
    scope.postMessage(
      result.ok
        ? {
            type: "result",
            jobId,
            ok: true,
            plan: result.value,
            diagnostics: result.diagnostics,
          }
        : {
            type: "result",
            jobId,
            ok: false,
            diagnostics: result.diagnostics,
          },
    );
  });
};

scope.postMessage({
  type: "ready",
  protocolVersion: BROWSER_WORKER_PROTOCOL_VERSION,
  sourceVersions: ANIMFLOW_SOURCE_VERSIONS,
  compilerVersion: ANIMFLOW_COMPILER_VERSION,
  renderPlanVersion: RENDER_PLAN_VERSION,
});
