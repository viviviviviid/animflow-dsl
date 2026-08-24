import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { arch, platform, release } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

import { chromium } from "@playwright/test";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const buildDirectory = join(root, ".benchmark");
const outputPath = process.env.ANIMFLOW_BENCHMARK_OUTPUT
  ? join(root, process.env.ANIMFLOW_BENCHMARK_OUTPUT)
  : join(root, "artifacts/browser-performance.json");
const budgets = {
  coldReadyP95Ms: 500,
  warmCompileP95Ms: 200,
  cloneFreezeP95Ms: 100,
  workerBundleGzipBytes: 1_572_864,
  workerHeapBytes: 128 * 1_024 * 1_024,
  workerHeapPlateauAbsoluteBytes: 8 * 1_024 * 1_024,
  workerHeapPlateauRelative: 0.2,
};

await rm(buildDirectory, { recursive: true, force: true });
await mkdir(buildDirectory, { recursive: true });
await Promise.all([
  bundle("benchmarks/browser/entry.ts", "entry.js"),
  bundle("packages/browser-worker/src/worker.ts", "worker.js"),
]);

const server = await startServer();
let browser;
try {
  browser = await chromium.launch({ args: ["--enable-precise-memory-info"] });
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.port}/`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(window.animflowBenchmark));

  const fixtureSource = await page.evaluate(() => window.animflowBenchmark.source);
  const coldReady = await page.evaluate(() => window.animflowBenchmark.coldReady(20));
  await page.evaluate(() => window.animflowBenchmark.start());
  const warmCompile = await page.evaluate(() => window.animflowBenchmark.warmCompile(30));
  const cloneFreeze = await page.evaluate(() => window.animflowBenchmark.cloneAndFreeze(100));
  const lifecycle = await page.evaluate(() => window.animflowBenchmark.lifecycle());

  const workerHeap = await measureWorkerHeap(browser, page);
  const workerBundles = {
    production: await productionWorkerBundleMeasurements(),
    benchmarkHarness: await bundleMeasurements(join(buildDirectory, "worker.js")),
  };
  const summaries = {
    coldReady: summarize(coldReady),
    warmCompile: summarize(warmCompile),
    cloneFreeze: summarize(cloneFreeze),
    workerHeap: summarize(workerHeap),
  };
  const earlyHeap = average(workerHeap.slice(0, 2));
  const lateHeap = average(workerHeap.slice(-2));
  const allowedHeapGrowth = Math.max(
    budgets.workerHeapPlateauAbsoluteBytes,
    earlyHeap * budgets.workerHeapPlateauRelative,
  );
  const checks = {
    coldReady: summaries.coldReady.p95 <= budgets.coldReadyP95Ms,
    warmCompile: summaries.warmCompile.p95 <= budgets.warmCompileP95Ms,
    cloneFreeze: summaries.cloneFreeze.p95 <= budgets.cloneFreezeP95Ms,
    workerBundle: workerBundles.production.gzipBytes <= budgets.workerBundleGzipBytes,
    staleSuppression: lifecycle.staleApplied === 0,
    cancellationRecovery:
      lifecycle.cancelledStatus === "superseded" && lifecycle.recoveredStatus === "success",
    workerHeapCap: summaries.workerHeap.max <= budgets.workerHeapBytes,
    workerHeapPlateau: lateHeap - earlyHeap <= allowedHeapGrowth,
  };
  const report = {
    schemaVersion: 1,
    recordedAt: new Date().toISOString(),
    environment: {
      os: `${platform()} ${release()}`,
      arch: arch(),
      node: process.version,
      chromium: browser.version(),
      chromiumExecutable: chromium.executablePath(),
      ci: Boolean(process.env.CI),
    },
    fixture: {
      sha256: createHash("sha256").update(fixtureSource).digest("hex"),
      utf8Bytes: Buffer.byteLength(fixtureSource),
      nodes: 100,
      edges: 150,
      scenes: 30,
      actions: 600,
    },
    budgets,
    checks,
    lifecycle,
    workerBundles,
    heapPlateau: {
      earlyMeanBytes: earlyHeap,
      lateMeanBytes: lateHeap,
      allowedGrowthBytes: allowedHeapGrowth,
    },
    summaries,
    samples: {
      coldReadyMs: coldReady,
      warmCompileMs: warmCompile,
      cloneFreezeMs: cloneFreeze,
      workerHeapBytes: workerHeap,
    },
  };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ outputPath, checks, summaries }, null, 2));
  const failed = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
  if (failed.length > 0) throw new Error(`Browser performance checks failed: ${failed.join(", ")}`);
} finally {
  await browser?.close();
  await server.close();
}

async function bundle(entryPoint, outfile) {
  await build({
    absWorkingDir: root,
    alias: {
      "@animflow-dsl/browser-worker": "./packages/browser-worker/src/index.ts",
      "@animflow-dsl/browser-worker/worker": "./packages/browser-worker/src/worker.ts",
      "@animflow-dsl/model": "./packages/model/src/index.ts",
    },
    entryPoints: [entryPoint],
    outfile: join(buildDirectory, outfile),
    bundle: true,
    format: "esm",
    minify: true,
    platform: "browser",
    target: "chrome151",
  });
}

async function startServer() {
  const server = createServer((request, response) => {
    const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    if (pathname === "/") {
      response.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      });
      response.end(
        '<!doctype html><meta charset="utf-8"><script type="module" src="/entry.js"></script>',
      );
      return;
    }
    const filename = pathname === "/entry.js"
      ? "entry.js"
      : pathname === "/worker.js"
        ? "worker.js"
        : undefined;
    if (!filename) {
      response.writeHead(404).end();
      return;
    }
    const path = join(buildDirectory, filename);
    response.writeHead(200, {
      "content-type": "text/javascript; charset=utf-8",
      "cache-control": "no-store",
    });
    createReadStream(path).pipe(response);
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Benchmark server has no TCP address.");
  }
  return {
    port: address.port,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    }),
  };
}

async function measureWorkerHeap(browser, page) {
  const cdp = await browser.newBrowserCDPSession();
  await cdp.send("Target.setDiscoverTargets", { discover: true });
  const targets = await cdp.send("Target.getTargets");
  const target = targets.targetInfos.find((candidate) =>
    candidate.type === "worker" && candidate.url.endsWith("/worker.js"),
  );
  if (!target) throw new Error("Could not find the persistent compile worker target.");
  const attached = await cdp.send("Target.attachToTarget", {
    targetId: target.targetId,
    flatten: false,
  });
  const worker = createTargetSession(cdp, attached.sessionId);
  const samples = [];
  try {
    for (let index = 0; index < 6; index += 1) {
      await page.evaluate(() => window.animflowBenchmark.warmCompile(10));
      await worker.send("HeapProfiler.collectGarbage");
      const usage = await worker.send("Runtime.getHeapUsage");
      samples.push(usage.usedSize);
    }
  } finally {
    worker.dispose();
    await cdp.send("Target.detachFromTarget", { sessionId: attached.sessionId });
    await cdp.detach();
  }
  return samples;
}

function createTargetSession(cdp, sessionId) {
  let nextId = 1;
  const pending = new Map();
  const receive = (event) => {
    if (event.sessionId !== sessionId) return;
    const message = JSON.parse(event.message);
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    clearTimeout(request.timer);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result ?? {});
  };
  cdp.on("Target.receivedMessageFromTarget", receive);
  return {
    send(method, params = {}) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`Worker CDP request timed out: ${method}`));
        }, 5_000);
        pending.set(id, { resolve, reject, timer });
        void cdp.send("Target.sendMessageToTarget", {
          sessionId,
          message: JSON.stringify({ id, method, params }),
        }).catch((error) => {
          pending.delete(id);
          clearTimeout(timer);
          reject(error);
        });
      });
    },
    dispose() {
      cdp.off("Target.receivedMessageFromTarget", receive);
      for (const request of pending.values()) {
        clearTimeout(request.timer);
        request.reject(new Error("Worker CDP session disposed."));
      }
      pending.clear();
    },
  };
}

async function bundleMeasurements(path) {
  const [source, details] = await Promise.all([readFile(path), stat(path)]);
  return { rawBytes: details.size, gzipBytes: gzipSync(source).byteLength };
}

async function productionWorkerBundleMeasurements() {
  const chunks = await walk(join(root, "apps/web/.next/static/chunks"));
  for (const path of chunks.filter((candidate) => candidate.endsWith(".js"))) {
    const source = await readFile(path);
    if (source.includes("browser compile limit")) {
      return {
        path: path.slice(root.length),
        rawBytes: source.byteLength,
        gzipBytes: gzipSync(source).byteLength,
      };
    }
  }
  throw new Error("Could not locate the production browser worker chunk.");
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

function summarize(samples) {
  const sorted = [...samples].sort((left, right) => left - right);
  return {
    count: sorted.length,
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    max: sorted.at(-1) ?? 0,
  };
}

function percentile(sorted, quantile) {
  if (sorted.length === 0) return 0;
  return sorted[Math.max(0, Math.ceil(sorted.length * quantile) - 1)];
}

function average(values) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}
