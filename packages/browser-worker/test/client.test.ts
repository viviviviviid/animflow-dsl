import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  ANIMFLOW_COMPILER_VERSION,
  compileAnimFlow,
  lowerDocument,
} from "@animflow-dsl/compiler";
import {
  ANIMFLOW_SOURCE_VERSIONS,
  RENDER_PLAN_VERSION,
  type RenderPlan,
} from "@animflow-dsl/model";
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";

import {
  BROWSER_WORKER_PROTOCOL_VERSION,
  BrowserCompileClient,
  compileWorkerSource,
  createBrowserCompileClient,
  DEFAULT_BROWSER_COMPILE_LIMITS,
  type MainToWorkerMessage,
  type WorkerLike,
  type WorkerReadyMessage,
  type WorkerToMainMessage,
} from "../src/index.js";

vi.mock("@animflow-dsl/compiler", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@animflow-dsl/compiler")>();
  return { ...actual, lowerDocument: vi.fn(actual.lowerDocument) };
});

const fixturePath = fileURLToPath(
  new URL("../../language/fixtures/valid/basic.animflow", import.meta.url),
);

let source: string;
let plan: RenderPlan;

beforeAll(async () => {
  source = await readFile(fixturePath, "utf8");
  const compiled = await compileAnimFlow(source);
  if (!compiled.ok) throw new Error(JSON.stringify(compiled.diagnostics));
  plan = compiled.value;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("browser compile client", () => {
  test("validates the handshake and re-freezes a structured-cloned plan", async () => {
    const workers: FakeWorker[] = [];
    const client = createClient(workers);
    workers[0]!.emit(readyMessage());

    const job = client.compile(source);
    expect(workers[0]!.messages).toEqual([
      {
        type: "compile",
        jobId: job.jobId,
        source,
        limits: DEFAULT_BROWSER_COMPILE_LIMITS,
      },
    ]);
    workers[0]!.emit({
      type: "result",
      jobId: job.jobId,
      ok: true,
      plan: structuredClone(plan),
      diagnostics: [],
    });

    const outcome = await job.result;
    expect(outcome.status).toBe("success");
    if (outcome.status !== "success") return;
    expect(Object.isFrozen(outcome.plan)).toBe(true);
    expect(Object.isFrozen(outcome.plan.scenes[0]?.tracks)).toBe(true);
    client.dispose();
  });

  test("queues work before ready and forwards compiler failures", async () => {
    const workers: FakeWorker[] = [];
    const client = createClient(workers);
    const job = client.compile(source);
    expect(workers[0]!.messages).toEqual([]);

    workers[0]!.emit(readyMessage());
    expect(workers[0]!.messages[0]?.jobId).toBe(job.jobId);
    workers[0]!.emit({
      type: "result",
      jobId: job.jobId,
      ok: false,
      diagnostics: [
        {
          code: "AF101",
          severity: "error",
          message: "synthetic parse failure",
          range: {
            start: { offset: 0, line: 0, character: 0 },
            end: { offset: 0, line: 0, character: 0 },
          },
        },
      ],
    });
    const outcome = await job.result;
    expect(outcome.status).toBe("failure");
    if (outcome.status === "failure") {
      expect(outcome.diagnostics[0]?.code).toBe("AF101");
    }
    client.dispose();
  });

  test("blocks compilation when worker versions do not match", async () => {
    const workers: FakeWorker[] = [];
    const client = createClient(workers);
    const job = client.compile(source);
    workers[0]!.emit({ ...readyMessage(), protocolVersion: 99 });

    const outcome = await job.result;
    expect(outcome.status).toBe("failure");
    if (outcome.status !== "failure") return;
    expect(outcome.diagnostics[0]?.code).toBe("AF703");
    expect(client.status).toBe("blocked");
    expect(workers[0]!.terminated).toBe(true);
    client.dispose();
  });

  test("keeps only the latest pending job and ignores stale results", async () => {
    const workers: FakeWorker[] = [];
    const client = createClient(workers);
    const worker = workers[0]!;
    worker.emit(readyMessage());

    const first = client.compile(`${source}\n`);
    const second = client.compile(`${source}\n\n`);
    const latest = client.compile(source);
    await expect(second.result).resolves.toEqual({
      status: "superseded",
      jobId: second.jobId,
    });

    worker.emit({
      type: "result",
      jobId: 999,
      ok: true,
      plan: structuredClone(plan),
      diagnostics: [],
    });
    worker.emit({
      type: "result",
      jobId: first.jobId,
      ok: true,
      plan: structuredClone(plan),
      diagnostics: [],
    });
    await expect(first.result).resolves.toEqual({
      status: "superseded",
      jobId: first.jobId,
    });
    expect(worker.messages.at(-1)).toEqual({
      type: "compile",
      jobId: latest.jobId,
      source,
      limits: DEFAULT_BROWSER_COMPILE_LIMITS,
    });

    worker.emit({
      type: "result",
      jobId: first.jobId,
      ok: false,
      diagnostics: [],
    });
    worker.emit({
      type: "result",
      jobId: latest.jobId,
      ok: true,
      plan: structuredClone(plan),
      diagnostics: [],
    });
    expect((await latest.result).status).toBe("success");
    client.dispose();
  });

  test("terminates a timed-out worker and compiles successfully after recovery", async () => {
    vi.useFakeTimers();
    const workers: FakeWorker[] = [];
    const client = createClient(workers, { compileTimeoutMs: 10, readyTimeoutMs: 100 });
    workers[0]!.emit(readyMessage());
    const timedOut = client.compile(source);

    await vi.advanceTimersByTimeAsync(11);
    const timeoutOutcome = await timedOut.result;
    expect(timeoutOutcome.status).toBe("failure");
    if (timeoutOutcome.status === "failure") {
      expect(timeoutOutcome.diagnostics[0]?.code).toBe("AF704");
    }
    expect(workers[0]!.terminated).toBe(true);
    expect(workers).toHaveLength(2);

    workers[1]!.emit(readyMessage());
    const recovered = client.compile(source);
    workers[1]!.emit({
      type: "result",
      jobId: recovered.jobId,
      ok: true,
      plan: structuredClone(plan),
      diagnostics: [],
    });
    expect((await recovered.result).status).toBe("success");
    client.dispose();
  });

  test("blocks after a ready timeout instead of entering a restart loop", async () => {
    vi.useFakeTimers();
    const workers: FakeWorker[] = [];
    const client = createClient(workers, { readyTimeoutMs: 10 });
    const waiting = client.compile(source);

    await vi.advanceTimersByTimeAsync(11);
    const outcome = await waiting.result;
    expect(outcome.status).toBe("failure");
    if (outcome.status === "failure") {
      expect(outcome.diagnostics[0]?.code).toBe("AF704");
    }
    expect(client.status).toBe("blocked");
    expect(workers).toHaveLength(1);
    expect(workers[0]!.terminated).toBe(true);
    client.dispose();
  });

  test("cancels an active job by replacing its worker and accepts the next job", async () => {
    const workers: FakeWorker[] = [];
    const client = createClient(workers);
    workers[0]!.emit(readyMessage());
    const cancelled = client.compile(source);
    cancelled.cancel();
    cancelled.cancel();

    await expect(cancelled.result).resolves.toEqual({
      status: "superseded",
      jobId: cancelled.jobId,
    });
    expect(workers[0]!.terminated).toBe(true);
    workers[1]!.emit(readyMessage());
    const next = client.compile(source);
    workers[1]!.emit({
      type: "result",
      jobId: next.jobId,
      ok: true,
      plan: structuredClone(plan),
      diagnostics: [],
    });
    expect((await next.result).status).toBe("success");
    client.dispose();
  });

  test("cancels a pending job without terminating the active worker", async () => {
    const workers: FakeWorker[] = [];
    const client = createClient(workers);
    workers[0]!.emit(readyMessage());
    const active = client.compile(source);
    const pending = client.compile(`${source}\n`);
    pending.cancel();

    await expect(pending.result).resolves.toEqual({
      status: "superseded",
      jobId: pending.jobId,
    });
    expect(workers[0]!.terminated).toBe(false);
    workers[0]!.emit({
      type: "result",
      jobId: active.jobId,
      ok: true,
      plan: structuredClone(plan),
      diagnostics: [],
    });
    expect((await active.result).status).toBe("success");
    client.dispose();
  });

  test("recovers after a worker crash and enforces the UTF-8 byte cap", async () => {
    const workers: FakeWorker[] = [];
    const client = createClient(workers, { limits: { maxSourceBytes: 3 } });
    workers[0]!.emit(readyMessage());
    const tooLarge = client.compile("éé");
    const limited = await tooLarge.result;
    expect(limited.status).toBe("failure");
    if (limited.status === "failure") {
      expect(limited.diagnostics[0]?.code).toBe("AF702");
    }

    const crashing = client.compile("ok");
    workers[0]!.crash("synthetic crash");
    const crashed = await crashing.result;
    expect(crashed.status).toBe("failure");
    if (crashed.status === "failure") {
      expect(crashed.diagnostics[0]?.code).toBe("AF705");
    }
    workers[1]!.emit(readyMessage());
    const recovered = client.compile("ok");
    workers[1]!.emit({
      type: "result",
      jobId: recovered.jobId,
      ok: true,
      plan: structuredClone(plan),
      diagnostics: [],
    });
    expect((await recovered.result).status).toBe("success");
    client.dispose();
  });

  test("reports worker construction failures without throwing from the client", async () => {
    const client = new BrowserCompileClient({
      workerFactory: () => {
        throw new Error("workers unavailable");
      },
    });
    const outcome = await client.compile(source).result;
    expect(outcome.status).toBe("failure");
    if (outcome.status === "failure") {
      expect(outcome.diagnostics[0]?.code).toBe("AF705");
    }
    expect(client.status).toBe("blocked");
    client.dispose();
  });

  test("normalizes non-Error worker construction failures", async () => {
    const client = new BrowserCompileClient({
      workerFactory: () => {
        throw "workers unavailable";
      },
    });
    const outcome = await client.compile(source).result;
    expect(outcome.status).toBe("failure");
    if (outcome.status === "failure") {
      expect(outcome.diagnostics[0]?.message).toBe("workers unavailable");
    }
    client.dispose();
  });

  test("fails jobs submitted after disposal and clamps limit overrides", async () => {
    const workers: FakeWorker[] = [];
    const client = createClient(workers, {
      limits: { maxNodes: 0, maxEdges: Number.MAX_SAFE_INTEGER },
    });
    workers[0]!.emit(readyMessage());
    const clamped = client.compile("ok");
    expect(workers[0]!.messages[0]).toMatchObject({
      limits: { maxNodes: 1, maxEdges: DEFAULT_BROWSER_COMPILE_LIMITS.maxEdges },
    });
    clamped.cancel();
    await clamped.result;
    client.dispose();
    client.dispose();

    const disposed = await client.compile(source).result;
    expect(disposed.status).toBe("failure");
    if (disposed.status === "failure") {
      expect(disposed.diagnostics[0]?.code).toBe("AF705");
    }
  });

  test("turns malformed cloned plans into a transport failure and restarts", async () => {
    const workers: FakeWorker[] = [];
    const client = createClient(workers);
    workers[0]!.emit(readyMessage());
    const job = client.compile(source);
    const malformed = structuredClone(plan);
    Object.defineProperty(malformed, "theme", {
      get: () => {
        throw new Error("malformed cloned plan");
      },
    });
    workers[0]!.emit({
      type: "result",
      jobId: job.jobId,
      ok: true,
      plan: malformed,
      diagnostics: [],
    });

    const outcome = await job.result;
    expect(outcome.status).toBe("failure");
    if (outcome.status === "failure") {
      expect(outcome.diagnostics[0]?.message).toBe("malformed cloned plan");
    }
    expect(workers).toHaveLength(2);
    client.dispose();
  });

  test("normalizes non-Error plan hydration failures", async () => {
    const workers: FakeWorker[] = [];
    const client = createClient(workers);
    workers[0]!.emit(readyMessage());
    const job = client.compile(source);
    const malformed = structuredClone(plan);
    Object.defineProperty(malformed, "theme", {
      get: () => {
        throw "malformed cloned plan";
      },
    });
    workers[0]!.emit({
      type: "result",
      jobId: job.jobId,
      ok: true,
      plan: malformed,
      diagnostics: [],
    });
    const outcome = await job.result;
    expect(outcome.status).toBe("failure");
    if (outcome.status === "failure") {
      expect(outcome.diagnostics[0]?.message).toBe("malformed cloned plan");
    }
    client.dispose();
  });

  test("ignores detached worker callbacks and uses the crash fallback message", async () => {
    const workers: FakeWorker[] = [];
    const client = createClient(workers);
    const staleMessage = workers[0]!.onmessage!;
    const staleError = workers[0]!.onerror!;
    workers[0]!.emit(readyMessage());
    const cancelled = client.compile(source);
    cancelled.cancel();
    await cancelled.result;

    staleMessage({ data: readyMessage() });
    staleError({ message: "detached crash" });
    workers[1]!.emit(readyMessage());
    const crashing = client.compile(source);
    workers[1]!.crash();
    const outcome = await crashing.result;
    expect(outcome.status).toBe("failure");
    if (outcome.status === "failure") {
      expect(outcome.diagnostics[0]?.message).toBe("Browser compile worker crashed.");
    }
    client.dispose();
  });

  test("ignores obsolete ready and compile timers", async () => {
    vi.useFakeTimers();
    const bootingWorkers: FakeWorker[] = [];
    const booting = createClient(bootingWorkers, { readyTimeoutMs: 10 });
    const bootingInternals = booting as unknown as { currentStatus: string };
    bootingInternals.currentStatus = "idle";
    await vi.advanceTimersByTimeAsync(11);
    expect(bootingWorkers[0]!.terminated).toBe(false);
    booting.dispose();

    const compilingWorkers: FakeWorker[] = [];
    const compiling = createClient(compilingWorkers, { compileTimeoutMs: 10 });
    compilingWorkers[0]!.emit(readyMessage());
    const job = compiling.compile(source);
    const compilingInternals = compiling as unknown as { active: unknown };
    const active = compilingInternals.active;
    compilingInternals.active = undefined;
    await vi.advanceTimersByTimeAsync(11);
    compilingInternals.active = active;
    compiling.dispose();
    await expect(job.result).resolves.toEqual({ status: "superseded", jobId: job.jobId });
  });

  test("does not reboot after disposal", () => {
    const workers: FakeWorker[] = [];
    const client = createClient(workers);
    client.dispose();
    const internals = client as unknown as { boot(): void; restart(): void };
    internals.boot();
    internals.restart();
    expect(workers).toHaveLength(1);
  });

  test("queues defensively if the idle transport disappears", async () => {
    const workers: FakeWorker[] = [];
    const client = createClient(workers);
    workers[0]!.emit(readyMessage());
    (client as unknown as { worker: WorkerLike | undefined }).worker = undefined;
    const queued = client.compile(source);
    expect(workers[0]!.messages).toEqual([]);
    client.dispose();
    await expect(queued.result).resolves.toEqual({
      status: "superseded",
      jobId: queued.jobId,
    });
  });

  test("constructs the default module worker through the public factory", () => {
    const workers: FakeWorker[] = [];
    const constructions: Array<{ url: string; type: string | undefined }> = [];
    class GlobalWorker extends FakeWorker {
      constructor(url: URL, options?: WorkerOptions) {
        super();
        workers.push(this);
        constructions.push({ url: url.href, type: options?.type });
      }
    }
    vi.stubGlobal("Worker", GlobalWorker);
    const client = createBrowserCompileClient();
    expect(constructions).toHaveLength(1);
    expect(constructions[0]?.url).toMatch(/\/worker\.js$/);
    expect(constructions[0]?.type).toBe("module");
    client.dispose();
    expect(workers[0]?.terminated).toBe(true);
  });
});

describe("worker resource validation", () => {
  test("uses the public browser hard caps", () => {
    expect(DEFAULT_BROWSER_COMPILE_LIMITS).toEqual({
      maxSourceBytes: 256 * 1_024,
      maxNodes: 100,
      maxEdges: 150,
      maxScenes: 30,
      maxActions: 600,
      maxActionNesting: 32,
    });
  });

  test("rejects semantic limits before lowering and compiles within limits", async () => {
    const limits = [
      { key: "maxNodes", value: 1, label: "nodes" },
      { key: "maxEdges", value: 0, label: "edges" },
      { key: "maxScenes", value: 0, label: "scenes" },
      { key: "maxActions", value: 3, label: "actions" },
      { key: "maxActionNesting", value: 1, label: "action nesting" },
    ] as const;
    for (const limit of limits) {
      const rejected = await compileWorkerSource(source, {
        ...DEFAULT_BROWSER_COMPILE_LIMITS,
        [limit.key]: limit.value,
      });
      expect(rejected.ok).toBe(false);
      if (!rejected.ok) {
        expect(rejected.diagnostics[0]?.code).toBe("AF702");
        expect(rejected.diagnostics[0]?.message).toContain(limit.label);
      }
    }

    const accepted = await compileWorkerSource(source, DEFAULT_BROWSER_COMPILE_LIMITS);
    expect(accepted.ok).toBe(true);
  });

  test("rejects oversized UTF-8 input before parsing", async () => {
    const rejected = await compileWorkerSource("éé", {
      ...DEFAULT_BROWSER_COMPILE_LIMITS,
      maxSourceBytes: 3,
    });
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) expect(rejected.diagnostics[0]?.code).toBe("AF702");
  });

  test("compiles v2.1 named actions and returns parser diagnostics", async () => {
    const v21 = source
      .replace("animflow 2", "animflow 2.1")
      .replace("    draw request via trace", "    action drawRequest: draw request via trace")
      .replace("    sequence {", "    action emphasize: sequence {")
      .replace("      highlight api tone accent", "      action highlightApi: highlight api tone accent")
      .replace("      clearHighlight api", "      action clearApi: clearHighlight api");
    const accepted = await compileWorkerSource(v21, DEFAULT_BROWSER_COMPILE_LIMITS);
    expect(accepted.ok).toBe(true);

    const rejected = await compileWorkerSource(
      "animflow 2 canvas {",
      DEFAULT_BROWSER_COMPILE_LIMITS,
    );
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) expect(rejected.diagnostics[0]?.code).toBe("AF101");
  });

  test("returns invariant diagnostics when lowering rejects", async () => {
    vi.mocked(lowerDocument).mockRejectedValueOnce(new Error("synthetic invariant"));
    const rejected = await compileWorkerSource(source, DEFAULT_BROWSER_COMPILE_LIMITS);
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) {
      expect(rejected.diagnostics[0]?.code).toBe("AF501");
      expect(rejected.diagnostics[0]?.message).toBe("synthetic invariant");
    }

    vi.mocked(lowerDocument).mockRejectedValueOnce("string invariant");
    const stringRejected = await compileWorkerSource(source, DEFAULT_BROWSER_COMPILE_LIMITS);
    expect(stringRejected.ok).toBe(false);
    if (!stringRejected.ok) {
      expect(stringRejected.diagnostics[0]?.message).toBe("string invariant");
    }
  });
});

describe("worker entry", () => {
  test("announces readiness, ignores unknown messages, and compiles both outcomes", async () => {
    const posted: WorkerToMainMessage[] = [];
    vi.stubGlobal("onmessage", null);
    vi.stubGlobal("postMessage", (message: WorkerToMainMessage) => posted.push(message));
    await import("../src/worker.js");

    expect(posted[0]).toEqual(readyMessage());
    const workerScope = globalThis as unknown as {
      onmessage: ((event: { data: MainToWorkerMessage | { type: "unknown" } }) => void) | null;
    };
    workerScope.onmessage?.({ data: { type: "unknown" } });
    expect(posted).toHaveLength(1);

    workerScope.onmessage?.({
      data: { type: "compile", jobId: 1, source } as unknown as MainToWorkerMessage,
    });
    await vi.waitFor(() => expect(posted).toHaveLength(2));
    expect(posted[1]).toMatchObject({ type: "result", jobId: 1, ok: true });

    workerScope.onmessage?.({
      data: {
        type: "compile",
        jobId: 2,
        source: "animflow 2 canvas {",
        limits: DEFAULT_BROWSER_COMPILE_LIMITS,
      },
    });
    await vi.waitFor(() => expect(posted).toHaveLength(3));
    expect(posted[2]).toMatchObject({ type: "result", jobId: 2, ok: false });
  });
});

class FakeWorker implements WorkerLike {
  onmessage: ((event: { readonly data: WorkerToMainMessage }) => void) | null = null;
  onerror: ((event: { readonly message?: string }) => void) | null = null;
  readonly messages: MainToWorkerMessage[] = [];
  terminated = false;

  postMessage(message: MainToWorkerMessage): void {
    this.messages.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }

  emit(message: WorkerToMainMessage): void {
    this.onmessage?.({ data: message });
  }

  crash(message?: string): void {
    this.onerror?.({ message });
  }
}

function createClient(
  workers: FakeWorker[],
  options: ConstructorParameters<typeof BrowserCompileClient>[0] = {},
): BrowserCompileClient {
  return new BrowserCompileClient({
    ...options,
    workerFactory: () => {
      const worker = new FakeWorker();
      workers.push(worker);
      return worker;
    },
  });
}

function readyMessage(): WorkerReadyMessage {
  return {
    type: "ready",
    protocolVersion: BROWSER_WORKER_PROTOCOL_VERSION,
    sourceVersions: ANIMFLOW_SOURCE_VERSIONS,
    compilerVersion: ANIMFLOW_COMPILER_VERSION,
    renderPlanVersion: RENDER_PLAN_VERSION,
  };
}
