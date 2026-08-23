import { parentPort } from "node:worker_threads";

import { compileAnimFlow } from "@animflow-dsl/compiler";
import { formatAnimFlow } from "@animflow-dsl/language";

import type { CompileWorkerRequest, CompileWorkerResponse } from "./worker-protocol.js";

if (!parentPort) throw new Error("AnimFlow compile worker requires a parent port.");

parentPort.once("message", async (request: CompileWorkerRequest) => {
  try {
    if (request.type !== "compile") throw new Error("Unsupported compile worker message.");
    const formatted = await formatAnimFlow(request.source);
    if (!formatted.ok) return send({ type: "failure", diagnostics: formatted.diagnostics });
    const compiled = await compileAnimFlow(formatted.value.source);
    if (!compiled.ok) return send({ type: "failure", diagnostics: compiled.diagnostics });
    send({ type: "success", source: formatted.value.source, plan: compiled.value });
  } catch (error) {
    send({ type: "crash", message: error instanceof Error ? error.message : String(error) });
  }
});

function send(response: CompileWorkerResponse): void {
  parentPort!.postMessage(response);
}
