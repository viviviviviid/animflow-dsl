import { ANIMFLOW_COMPILER_VERSION } from "@animflow-dsl/compiler";
import {
  ANIMFLOW_DIAGNOSTIC_CODES,
  ANIMFLOW_SOURCE_VERSIONS,
  RENDER_PLAN_VERSION,
  ZERO_RANGE,
  freezeRenderPlan,
  type Diagnostic,
  type RenderPlan,
} from "@animflow-dsl/model";

import { validateSourceBytes } from "./compile-worker.js";
import {
  DEFAULT_BROWSER_COMPILE_LIMITS,
  type BrowserCompileLimits,
} from "./limits.js";
import {
  BROWSER_WORKER_PROTOCOL_VERSION,
  type MainToWorkerMessage,
  type WorkerReadyMessage,
  type WorkerToMainMessage,
} from "./protocol.js";

export type BrowserCompileOutcome =
  | {
      readonly status: "success";
      readonly jobId: number;
      readonly plan: RenderPlan;
      readonly diagnostics: readonly Diagnostic[];
    }
  | {
      readonly status: "failure";
      readonly jobId: number;
      readonly diagnostics: readonly Diagnostic[];
    }
  | {
      readonly status: "superseded";
      readonly jobId: number;
    };

export interface BrowserCompileJob {
  readonly jobId: number;
  readonly result: Promise<BrowserCompileOutcome>;
  cancel(): void;
}

export interface WorkerLike {
  onmessage: ((event: { readonly data: WorkerToMainMessage }) => void) | null;
  onerror: ((event: { readonly message?: string }) => void) | null;
  postMessage(message: MainToWorkerMessage): void;
  terminate(): void;
}

export type BrowserWorkerFactory = () => WorkerLike;

export interface BrowserCompileClientOptions {
  readonly workerFactory?: BrowserWorkerFactory;
  readonly limits?: Partial<BrowserCompileLimits>;
  readonly readyTimeoutMs?: number;
  readonly compileTimeoutMs?: number;
}

interface InternalJob {
  readonly jobId: number;
  readonly source: string;
  readonly resolve: (outcome: BrowserCompileOutcome) => void;
}

export type BrowserCompileClientStatus =
  | "booting"
  | "idle"
  | "compiling"
  | "blocked"
  | "disposed";

export class BrowserCompileClient {
  private readonly workerFactory: BrowserWorkerFactory;
  private readonly limits: BrowserCompileLimits;
  private readonly readyTimeoutMs: number;
  private readonly compileTimeoutMs: number;
  private worker: WorkerLike | undefined;
  private active: InternalJob | undefined;
  private pending: InternalJob | undefined;
  private nextJobId = 1;
  private readyTimer: ReturnType<typeof setTimeout> | undefined;
  private compileTimer: ReturnType<typeof setTimeout> | undefined;
  private currentStatus: BrowserCompileClientStatus = "booting";
  private blockedDiagnostic: Diagnostic | undefined;

  constructor(options: BrowserCompileClientOptions = {}) {
    this.workerFactory = options.workerFactory ?? defaultWorkerFactory;
    this.limits = clampLimits(options.limits);
    this.readyTimeoutMs = options.readyTimeoutMs ?? 2_000;
    this.compileTimeoutMs = options.compileTimeoutMs ?? 2_000;
    this.boot();
  }

  get status(): BrowserCompileClientStatus {
    return this.currentStatus;
  }

  compile(source: string): BrowserCompileJob {
    const jobId = this.nextJobId++;
    let resolve!: (outcome: BrowserCompileOutcome) => void;
    const result = new Promise<BrowserCompileOutcome>((complete) => {
      resolve = complete;
    });
    const internal = { jobId, source, resolve };

    const byteDiagnostic = validateSourceBytes(source, this.limits.maxSourceBytes);
    if (byteDiagnostic) {
      resolve({ status: "failure", jobId, diagnostics: [byteDiagnostic] });
    } else if (this.currentStatus === "disposed") {
      resolve({ status: "failure", jobId, diagnostics: [workerDiagnostic("AF705", "Browser compile client is disposed.")] });
    } else if (this.blockedDiagnostic) {
      resolve({ status: "failure", jobId, diagnostics: [this.blockedDiagnostic] });
    } else if (this.currentStatus === "idle" && !this.active) {
      this.start(internal);
    } else {
      this.replacePending(internal);
    }

    return {
      jobId,
      result,
      cancel: () => this.cancel(jobId),
    };
  }

  dispose(): void {
    if (this.currentStatus === "disposed") return;
    this.clearTimers();
    this.resolveSuperseded(this.active);
    this.resolveSuperseded(this.pending);
    this.active = undefined;
    this.pending = undefined;
    this.detachAndTerminate();
    this.currentStatus = "disposed";
  }

  private boot(): void {
    if (this.currentStatus === "disposed" || this.blockedDiagnostic) return;
    this.currentStatus = "booting";
    let worker: WorkerLike;
    try {
      worker = this.workerFactory();
    } catch (error) {
      const diagnostic = workerDiagnostic(
        "AF705",
        error instanceof Error ? error.message : String(error),
      );
      this.blockedDiagnostic = diagnostic;
      this.currentStatus = "blocked";
      this.failJob(this.pending, diagnostic);
      this.pending = undefined;
      return;
    }
    this.worker = worker;
    worker.onmessage = (event) => {
      if (this.worker !== worker) return;
      this.handleMessage(event.data);
    };
    worker.onerror = (event) => {
      if (this.worker !== worker) return;
      this.handleCrash(event.message ?? "Browser compile worker crashed.");
    };
    this.readyTimer = setTimeout(() => {
      if (this.worker !== worker || this.currentStatus !== "booting") return;
      const diagnostic = workerDiagnostic("AF704", "Browser compile worker did not become ready in time.");
      this.blockedDiagnostic = diagnostic;
      this.currentStatus = "blocked";
      this.failJob(this.pending, diagnostic);
      this.pending = undefined;
      this.detachAndTerminate();
    }, this.readyTimeoutMs);
  }

  private handleMessage(message: WorkerToMainMessage): void {
    if (message.type === "ready") {
      this.handleReady(message);
      return;
    }
    if (!this.active || message.jobId !== this.active.jobId) return;

    if (this.compileTimer) clearTimeout(this.compileTimer);
    this.compileTimer = undefined;
    const completed = this.active;
    this.active = undefined;

    if (this.pending) {
      this.resolveSuperseded(completed);
      this.currentStatus = "idle";
      const latest = this.pending;
      this.pending = undefined;
      this.start(latest);
      return;
    }

    this.currentStatus = "idle";
    if (message.ok) {
      try {
        completed.resolve({
          status: "success",
          jobId: completed.jobId,
          plan: freezeRenderPlan(message.plan),
          diagnostics: message.diagnostics,
        });
      } catch (error) {
        completed.resolve({
          status: "failure",
          jobId: completed.jobId,
          diagnostics: [workerDiagnostic("AF705", error instanceof Error ? error.message : String(error))],
        });
        this.restart();
      }
    } else {
      completed.resolve({
        status: "failure",
        jobId: completed.jobId,
        diagnostics: message.diagnostics,
      });
    }
  }

  private handleReady(message: WorkerReadyMessage): void {
    if (this.readyTimer) clearTimeout(this.readyTimer);
    this.readyTimer = undefined;
    const mismatch = protocolMismatch(message);
    if (mismatch) {
      this.blockedDiagnostic = mismatch;
      this.currentStatus = "blocked";
      this.failJob(this.pending, mismatch);
      this.pending = undefined;
      this.detachAndTerminate();
      return;
    }

    this.currentStatus = "idle";
    if (this.pending) {
      const latest = this.pending;
      this.pending = undefined;
      this.start(latest);
    }
  }

  private start(job: InternalJob): void {
    if (!this.worker || this.currentStatus !== "idle") {
      this.replacePending(job);
      return;
    }
    this.active = job;
    this.currentStatus = "compiling";
    this.worker.postMessage({
      type: "compile",
      jobId: job.jobId,
      source: job.source,
      limits: this.limits,
    });
    this.compileTimer = setTimeout(() => {
      if (this.active?.jobId !== job.jobId) return;
      this.failJob(
        this.active,
        workerDiagnostic("AF704", `Browser compile job ${job.jobId} exceeded ${this.compileTimeoutMs}ms.`),
      );
      this.active = undefined;
      this.restart();
    }, this.compileTimeoutMs);
  }

  private replacePending(job: InternalJob): void {
    this.resolveSuperseded(this.pending);
    this.pending = job;
  }

  private cancel(jobId: number): void {
    if (this.pending?.jobId === jobId) {
      this.resolveSuperseded(this.pending);
      this.pending = undefined;
      return;
    }
    if (this.active?.jobId !== jobId) return;
    this.resolveSuperseded(this.active);
    this.active = undefined;
    this.restart();
  }

  private handleCrash(message: string): void {
    this.failJob(this.active, workerDiagnostic("AF705", message));
    this.active = undefined;
    this.restart();
  }

  private restart(): void {
    if (this.currentStatus === "disposed" || this.blockedDiagnostic) return;
    this.clearTimers();
    this.detachAndTerminate();
    this.boot();
  }

  private detachAndTerminate(): void {
    if (!this.worker) return;
    this.worker.onmessage = null;
    this.worker.onerror = null;
    this.worker.terminate();
    this.worker = undefined;
  }

  private clearTimers(): void {
    if (this.readyTimer) clearTimeout(this.readyTimer);
    if (this.compileTimer) clearTimeout(this.compileTimer);
    this.readyTimer = undefined;
    this.compileTimer = undefined;
  }

  private resolveSuperseded(job: InternalJob | undefined): void {
    if (job) job.resolve({ status: "superseded", jobId: job.jobId });
  }

  private failJob(job: InternalJob | undefined, diagnostic: Diagnostic): void {
    if (job) job.resolve({ status: "failure", jobId: job.jobId, diagnostics: [diagnostic] });
  }
}

export function createBrowserCompileClient(
  options: BrowserCompileClientOptions = {},
): BrowserCompileClient {
  return new BrowserCompileClient(options);
}

function defaultWorkerFactory(): WorkerLike {
  return new Worker(new URL("./worker.js", import.meta.url), {
    type: "module",
  }) as unknown as WorkerLike;
}

function clampLimits(overrides: Partial<BrowserCompileLimits> | undefined): BrowserCompileLimits {
  return Object.fromEntries(
    Object.entries(DEFAULT_BROWSER_COMPILE_LIMITS).map(([key, maximum]) => [
      key,
      Math.max(
        1,
        Math.min(
          maximum,
          overrides?.[key as keyof BrowserCompileLimits] ?? maximum,
        ),
      ),
    ]),
  ) as unknown as BrowserCompileLimits;
}

function protocolMismatch(message: WorkerReadyMessage): Diagnostic | undefined {
  const versionsMatch =
    message.sourceVersions.length === ANIMFLOW_SOURCE_VERSIONS.length &&
    message.sourceVersions.every((version, index) => version === ANIMFLOW_SOURCE_VERSIONS[index]);
  if (
    message.protocolVersion === BROWSER_WORKER_PROTOCOL_VERSION &&
    versionsMatch &&
    message.compilerVersion === ANIMFLOW_COMPILER_VERSION &&
    message.renderPlanVersion === RENDER_PLAN_VERSION
  ) {
    return undefined;
  }
  return workerDiagnostic(
    "AF703",
    `Browser worker protocol mismatch: received protocol ${message.protocolVersion}, compiler ${message.compilerVersion}, plan ${message.renderPlanVersion}. Reload the application.`,
  );
}

function workerDiagnostic(
  code: "AF703" | "AF704" | "AF705",
  message: string,
): Diagnostic {
  const registered = {
    AF703: ANIMFLOW_DIAGNOSTIC_CODES.workerProtocol,
    AF704: ANIMFLOW_DIAGNOSTIC_CODES.workerTimeout,
    AF705: ANIMFLOW_DIAGNOSTIC_CODES.workerCrash,
  } as const;
  return { code: registered[code], severity: "error", message, range: ZERO_RANGE };
}
