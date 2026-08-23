import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { ANIMFLOW_COMPILER_VERSION, compileAnimFlow } from "@animflow-dsl/compiler";
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
  DEFAULT_BROWSER_COMPILE_LIMITS,
  type MainToWorkerMessage,
  type WorkerLike,
  type WorkerReadyMessage,
  type WorkerToMainMessage,
} from "../src/index.js";

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
});

describe("worker resource validation", () => {
  test("rejects semantic limits before lowering and compiles within limits", async () => {
    const rejected = await compileWorkerSource(source, {
      ...DEFAULT_BROWSER_COMPILE_LIMITS,
      maxNodes: 1,
    });
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) expect(rejected.diagnostics[0]?.code).toBe("AF702");

    const accepted = await compileWorkerSource(source, DEFAULT_BROWSER_COMPILE_LIMITS);
    expect(accepted.ok).toBe(true);
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

  crash(message: string): void {
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
