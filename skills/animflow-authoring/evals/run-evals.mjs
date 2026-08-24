import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const skillDirectory = fileURLToPath(new URL("../", import.meta.url));
const root = fileURLToPath(new URL("../../../", import.meta.url));
const cli = join(root, "packages/cli/dist/bin.js");
const outputPath = process.env.ANIMFLOW_SKILL_EVAL_OUTPUT
  ? join(root, process.env.ANIMFLOW_SKILL_EVAL_OUTPUT)
  : join(root, "artifacts/animflow-skill-eval.json");
const repetitions = 3;
const prompts = (await readFile(join(skillDirectory, "evals/prompts.jsonl"), "utf8"))
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line));
const expected = JSON.parse(await readFile(join(skillDirectory, "evals/expected.json"), "utf8"));
const externalCommand = process.env.ANIMFLOW_EVAL_COMMAND;
const mode = externalCommand ? "model" : "fixture";
const temperature = process.env.ANIMFLOW_EVAL_TEMPERATURE;
const reasoningEffort = process.env.ANIMFLOW_EVAL_REASONING_EFFORT;
const concurrency = Number(process.env.ANIMFLOW_EVAL_CONCURRENCY ?? 1);

if (prompts.length !== 10) throw new Error(`Expected 10 eval prompts, received ${prompts.length}.`);
if (!Number.isSafeInteger(concurrency) || concurrency < 1 || concurrency > 4) throw new Error("ANIMFLOW_EVAL_CONCURRENCY must be an integer from 1 to 4.");
if (externalCommand && (!process.env.ANIMFLOW_EVAL_MODEL || !process.env.ANIMFLOW_EVAL_MODEL_VERSION || (temperature === undefined && reasoningEffort === undefined))) {
  throw new Error("Model eval requires ANIMFLOW_EVAL_MODEL, ANIMFLOW_EVAL_MODEL_VERSION, and either ANIMFLOW_EVAL_TEMPERATURE or ANIMFLOW_EVAL_REASONING_EFFORT.");
}

const temporaryDirectory = await mkdtemp(join(tmpdir(), "animflow-skill-eval-"));
const jobs = prompts.flatMap((prompt) => Array.from({ length: repetitions }, (_, index) => ({ prompt, repetition: index + 1 })));
const runs = new Array(jobs.length);
try {
  let nextJob = 0;
  let stopped = false;
  const workerResults = await Promise.allSettled(Array.from({ length: concurrency }, async () => {
    try {
      while (!stopped && nextJob < jobs.length) {
        const jobIndex = nextJob++;
        const { prompt, repetition } = jobs[jobIndex];
        const assertion = expected.cases[prompt.id];
        if (!assertion) throw new Error(`Missing semantic assertion for ${prompt.id}.`);
        const source = externalCommand
          ? await generateWithModel(externalCommand, prompt, repetition)
          : await readFile(join(skillDirectory, prompt.fixture), "utf8");
        const sourcePath = join(temporaryDirectory, `${prompt.id}-${repetition}.animflow`);
        const artifactPath = join(temporaryDirectory, `${prompt.id}-${repetition}.render-plan.json`);
        await writeFile(sourcePath, source, "utf8");

        const validation = runCli(["validate", sourcePath, "--json"]);
        const compilation = validation.ok
          ? runCli(["compile", sourcePath, "--out", artifactPath, "--json"])
          : { ok: false, report: null };
        let semantic = { ok: false, failures: ["compile failed"] };
        if (compilation.ok) {
          const artifact = JSON.parse(await readFile(artifactPath, "utf8"));
          semantic = assertSemantics(source, artifact, assertion);
        }
        runs[jobIndex] = {
          id: prompt.id,
          repetition,
          sourceSha256: createHash("sha256").update(source).digest("hex"),
          validateOk: validation.ok,
          compileOk: compilation.ok,
          semanticOk: semantic.ok,
          semanticFailures: semantic.failures,
          diagnostics: compilation.report?.diagnostics ?? validation.report?.diagnostics ?? [],
        };
        console.error(`[animflow-skill-eval] ${prompt.id} ${repetition}/${repetitions}: compile=${compilation.ok} semantic=${semantic.ok}`);
      }
    } catch (error) {
      stopped = true;
      throw error;
    }
  }));
  const failedWorker = workerResults.find((result) => result.status === "rejected");
  if (failedWorker) throw failedWorker.reason;
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

const compileSuccessRate = runs.filter((run) => run.compileOk).length / runs.length;
const semanticAssertionRate = runs.filter((run) => run.semanticOk).length / runs.length;
const report = {
  schemaVersion: 1,
  recordedAt: new Date().toISOString(),
  mode,
  settings: {
    model: process.env.ANIMFLOW_EVAL_MODEL ?? "fixture",
    modelVersion: process.env.ANIMFLOW_EVAL_MODEL_VERSION ?? "repository",
    temperature: temperature === undefined ? null : Number(temperature),
    reasoningEffort: reasoningEffort ?? null,
    repetitions,
  },
  thresholds: { compileSuccessRate: 1, semanticAssertionRate: 0.9 },
  summary: { prompts: prompts.length, runs: runs.length, compileSuccessRate, semanticAssertionRate },
  runs,
};
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ outputPath, mode, summary: report.summary }, null, 2));
if (compileSuccessRate < 1 || semanticAssertionRate < 0.9) process.exitCode = 1;

function generateWithModel(command, prompt, repetition) {
  return new Promise((resolve, reject) => {
    const generated = spawn(command, [], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let outputExceeded = false;
    generated.stdout.setEncoding("utf8");
    generated.stderr.setEncoding("utf8");
    generated.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (Buffer.byteLength(stdout) > 2 * 1_024 * 1_024) { outputExceeded = true; generated.kill(); }
    });
    generated.stderr.on("data", (chunk) => {
      stderr += chunk;
      if (Buffer.byteLength(stderr) > 2 * 1_024 * 1_024) { outputExceeded = true; generated.kill(); }
    });
    generated.once("error", reject);
    generated.once("close", (status) => {
      if (outputExceeded) {
        reject(new Error(`Model eval command exceeded the 2 MiB output limit for ${prompt.id}/${repetition}.`));
        return;
      }
      if (status !== 0) {
        reject(new Error(`Model eval command failed for ${prompt.id}/${repetition}: ${stderr}`));
        return;
      }
      resolve(stdout);
    });
    generated.stdin.end(`${JSON.stringify({
      id: prompt.id,
      prompt: prompt.prompt,
      repetition,
      model: process.env.ANIMFLOW_EVAL_MODEL,
      modelVersion: process.env.ANIMFLOW_EVAL_MODEL_VERSION,
      temperature: temperature === undefined ? null : Number(temperature),
      reasoningEffort: reasoningEffort ?? null,
    })}\n`);
  });
}

function runCli(args) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    encoding: "utf8",
    maxBuffer: 4 * 1_024 * 1_024,
  });
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    report = null;
  }
  return { ok: result.status === 0 && report?.ok === true, report };
}

function assertSemantics(source, artifact, assertion) {
  const failures = [];
  const ids = new Set([
    artifact.storyId,
    ...artifact.symbols.map((symbol) => symbol.id),
    ...artifact.scenes.map((scene) => scene.id),
    ...(artifact.authoring?.actions ?? []).map((action) => action.id),
  ]);
  for (const id of assertion.requiredIds) {
    if (!ids.has(id)) failures.push(`missing required ID ${id}`);
  }
  if (artifact.scenes.length < assertion.sceneCount[0] || artifact.scenes.length > assertion.sceneCount[1]) {
    failures.push(`scene count ${artifact.scenes.length} outside ${assertion.sceneCount.join("-")}`);
  }
  if (artifact.durationMs < assertion.durationMs[0] || artifact.durationMs > assertion.durationMs[1]) {
    failures.push(`duration ${artifact.durationMs} outside ${assertion.durationMs.join("-")}`);
  }
  if (assertion.narration && !/^\s*say\s+"/m.test(source)) failures.push("narration required");
  const disallowed = (artifact.authoring?.actions ?? [])
    .map((action) => action.kind)
    .filter((kind) => !assertion.allowedActions.includes(kind));
  if (disallowed.length > 0) failures.push(`disallowed actions: ${[...new Set(disallowed)].join(", ")}`);
  return { ok: failures.length === 0, failures };
}
