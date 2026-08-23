import {
  BrowserCompileClient,
  type BrowserCompileOutcome,
} from "@animflow-dsl/browser-worker";
import { freezeRenderPlan, type RenderPlan } from "@animflow-dsl/model";

const workerUrl = "/worker.js";
const source = createBudgetFixture();
let client: BrowserCompileClient | undefined;
let plan: RenderPlan | undefined;

const api = {
  source,
  async coldReady(iterations: number): Promise<number[]> {
    const samples: number[] = [];
    for (let index = 0; index < iterations; index += 1) {
      const startedAt = performance.now();
      const worker = new Worker(workerUrl, { type: "module" });
      try {
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error("Benchmark worker ready timeout.")),
            2_000,
          );
          worker.onerror = () => {
            clearTimeout(timer);
            reject(new Error("Benchmark worker failed before ready."));
          };
          worker.onmessage = (event) => {
            if (event.data?.type !== "ready") return;
            clearTimeout(timer);
            resolve();
          };
        });
        samples.push(performance.now() - startedAt);
      } finally {
        worker.terminate();
      }
    }
    return samples;
  },
  async start(): Promise<void> {
    client?.dispose();
    client = createClient();
    plan = await expectSuccess(client.compile(source).result);
  },
  async warmCompile(iterations: number): Promise<number[]> {
    const current = requireClient();
    const samples: number[] = [];
    for (let index = 0; index < iterations; index += 1) {
      const startedAt = performance.now();
      plan = await expectSuccess(current.compile(source).result);
      samples.push(performance.now() - startedAt);
    }
    return samples;
  },
  cloneAndFreeze(iterations: number): number[] {
    if (!plan) throw new Error("Benchmark plan is not initialized.");
    const samples: number[] = [];
    for (let index = 0; index < iterations; index += 1) {
      const startedAt = performance.now();
      freezeRenderPlan(structuredClone(plan));
      samples.push(performance.now() - startedAt);
    }
    return samples;
  },
  async lifecycle(): Promise<{
    staleApplied: number;
    cancelledStatus: BrowserCompileOutcome["status"];
    recoveredStatus: BrowserCompileOutcome["status"];
  }> {
    const current = requireClient();
    const jobs = Array.from({ length: 8 }, (_, index) =>
      current.compile(`${source}\n// latest-wins ${index}`),
    );
    const outcomes = await Promise.all(jobs.map((job) => job.result));
    const latestJobId = jobs.at(-1)!.jobId;
    const staleApplied = outcomes.filter(
      (outcome) => outcome.status === "success" && outcome.jobId !== latestJobId,
    ).length;

    const cancelled = current.compile(source);
    cancelled.cancel();
    const cancelledOutcome = await cancelled.result;
    await waitUntilReady(current);
    const recoveredOutcome = await current.compile(source).result;
    if (recoveredOutcome.status === "success") plan = recoveredOutcome.plan;
    return {
      staleApplied,
      cancelledStatus: cancelledOutcome.status,
      recoveredStatus: recoveredOutcome.status,
    };
  },
  dispose(): void {
    client?.dispose();
    client = undefined;
    plan = undefined;
  },
};

Object.assign(window, { animflowBenchmark: api });

function createClient(): BrowserCompileClient {
  return new BrowserCompileClient({
    workerFactory: () => new Worker(workerUrl, { type: "module" }),
  });
}

function requireClient(): BrowserCompileClient {
  if (!client) throw new Error("Benchmark client is not initialized.");
  return client;
}

async function expectSuccess(outcomePromise: Promise<BrowserCompileOutcome>): Promise<RenderPlan> {
  const outcome = await outcomePromise;
  if (outcome.status !== "success") {
    throw new Error(`Expected compile success, received ${outcome.status}.`);
  }
  return outcome.plan;
}

async function waitUntilReady(current: BrowserCompileClient): Promise<void> {
  const deadline = performance.now() + 2_000;
  while (current.status === "booting" && performance.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  if (current.status !== "idle") {
    throw new Error(`Worker recovery ended in ${current.status}.`);
  }
}

function createBudgetFixture(): string {
  const nodes = Array.from({ length: 100 }, (_, index) => `
  node n${index} "Node ${index}" {
    shape rounded
    tone neutral
  }`).join("\n");
  const edges = Array.from({ length: 150 }, (_, index) => {
    const from = index % 100;
    const to = (index + 1) % 100;
    return `
  edge e${index}: n${from}.e -> n${to}.w {
    line solid 2
    arrow end
    tone primary
    routing orthogonal
  }`;
  }).join("\n");
  const scenes = Array.from({ length: 30 }, (_, sceneIndex) => {
    const actions = Array.from({ length: 20 }, (_, actionIndex) => {
      const node = (sceneIndex * 20 + actionIndex) % 100;
      return actionIndex % 2 === 0
        ? `    highlight n${node} tone accent`
        : `    clearHighlight n${node}`;
    }).join("\n");
    return `
  scene scene${sceneIndex} "Scene ${sceneIndex}" duration 1s {
${actions}
  }`;
  }).join("\n");

  return `animflow 2

canvas {
  size 1280 by 720
  theme light
  background surface
}

graph benchmark {
  layout flow right {
    nodeGap 48
    rankGap 80
    routing orthogonal
  }
${nodes}
${edges}
}

story benchmarkStory {
  initial {
    show benchmark.*
    camera fit(benchmark) padding 40
  }
${scenes}
}
`;
}

declare global {
  interface Window {
    animflowBenchmark: typeof api;
  }
}
