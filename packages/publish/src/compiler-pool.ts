import { Worker } from "node:worker_threads";

import { ANIMFLOW_DIAGNOSTIC_CODES, ZERO_RANGE, freezeRenderPlan, type Diagnostic } from "@animflow-dsl/model";

import { PublishError, type ServerCompiler, type ServerCompileResult } from "./types.js";
import type { CompileWorkerRequest, CompileWorkerResponse } from "./worker-protocol.js";

interface QueuedJob {
  readonly source: string;
  readonly resolve: (result: ServerCompileResult) => void;
  readonly reject: (error: unknown) => void;
}

export interface WorkerCompilerOptions {
  readonly concurrency?: number;
  readonly maxQueue?: number;
  readonly timeoutMs?: number;
  readonly workerUrl?: URL;
}

export class WorkerCompiler implements ServerCompiler {
  readonly #concurrency: number;
  readonly #maxQueue: number;
  readonly #timeoutMs: number;
  readonly #workerUrl: URL;
  readonly #queue: QueuedJob[] = [];
  #active = 0;
  #disposed = false;

  constructor(options: WorkerCompilerOptions = {}) {
    this.#concurrency = options.concurrency ?? 2;
    this.#maxQueue = options.maxQueue ?? 50;
    this.#timeoutMs = options.timeoutMs ?? 2_000;
    this.#workerUrl = options.workerUrl ?? new URL("./compile-worker.bundle.js", import.meta.url);
  }

  compile(source: string): Promise<ServerCompileResult> {
    if (this.#disposed) return Promise.reject(new PublishError("storage-unavailable", "Compiler is disposed.", 503));
    if (this.#active >= this.#concurrency && this.#queue.length >= this.#maxQueue) {
      return Promise.reject(new PublishError("compile-overloaded", "Compile queue is full.", 503));
    }
    return new Promise((resolve, reject) => {
      this.#queue.push({ source, resolve, reject });
      this.#drain();
    });
  }

  async dispose(): Promise<void> {
    this.#disposed = true;
    const error = new PublishError("storage-unavailable", "Compiler was disposed.", 503);
    for (const job of this.#queue.splice(0)) job.reject(error);
  }

  #drain(): void {
    while (!this.#disposed && this.#active < this.#concurrency) {
      const job = this.#queue.shift();
      if (!job) return;
      this.#active += 1;
      void this.#run(job).finally(() => {
        this.#active -= 1;
        this.#drain();
      });
    }
  }

  async #run(job: QueuedJob): Promise<void> {
    const worker = new Worker(this.#workerUrl);
    let settled = false;
    const finish = async (operation: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      operation();
      await worker.terminate();
    };
    const timer = setTimeout(() => {
      void finish(() => job.reject(new PublishError("compile-timeout", `Compile exceeded ${this.#timeoutMs}ms.`, 422, [workerDiagnostic("workerTimeout", "Server compile timed out.")])));
    }, this.#timeoutMs);
    worker.once("message", (response: CompileWorkerResponse) => {
      void finish(() => {
        if (response.type === "success") job.resolve({ ok: true, source: response.source, plan: freezeRenderPlan(response.plan) });
        else if (response.type === "failure") job.resolve({ ok: false, diagnostics: response.diagnostics });
        else job.reject(new PublishError("compile-failed", response.message, 422, [workerDiagnostic("workerCrash", response.message)]));
      });
    });
    worker.once("error", (error) => {
      void finish(() => job.reject(new PublishError("compile-failed", "Compile worker crashed.", 422, [workerDiagnostic("workerCrash", error.message)])));
    });
    worker.postMessage({ type: "compile", source: job.source } satisfies CompileWorkerRequest);
  }
}

function workerDiagnostic(code: "workerCrash" | "workerTimeout", message: string): Diagnostic {
  return { code: ANIMFLOW_DIAGNOSTIC_CODES[code], severity: "error", message, range: ZERO_RANGE };
}
