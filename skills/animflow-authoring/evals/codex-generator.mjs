#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const evalDirectory = fileURLToPath(new URL("./", import.meta.url));
const skillDirectory = fileURLToPath(new URL("../", import.meta.url));
const root = fileURLToPath(new URL("../../../", import.meta.url));
const cli = join(root, "packages/cli/dist/bin.js");
const request = JSON.parse(readFileSync(0, "utf8"));
if (typeof request.model !== "string" || !request.model || typeof request.reasoningEffort !== "string" || !request.reasoningEffort) {
  throw new Error("Codex eval requires non-empty model and reasoningEffort values.");
}
const expected = JSON.parse(readFileSync(join(evalDirectory, "expected.json"), "utf8")).cases[request.id];
if (!expected) throw new Error(`Unknown AnimFlow eval case: ${request.id}`);

const temporaryDirectory = mkdtempSync(join(tmpdir(), "animflow-codex-eval-"));
const outputPath = join(temporaryDirectory, "source.animflow");
try {
  let prompt = `Generate one native AnimFlow 2.1 lecture document for this request:

${request.prompt}

Follow the repository skill at ${join(skillDirectory, "SKILL.md")} and its language-reference.md and lecture-patterns.md references. Do not read eval fixtures or expected.json. The evaluation contract requires:
- document-unique semantic IDs including: ${expected.requiredIds.join(", ")}
- ${expected.sceneCount[0]}-${expected.sceneCount[1]} scenes
- total duration ${expected.durationMs[0]}-${expected.durationMs[1]}ms
- narration with say statements
- only these action kinds: ${expected.allowedActions.join(", ")}
- sibling scene actions run in parallel; wrap same-target clear/highlight or other repeated property writes in an ID-bearing sequence
- every ID is document-unique; never reuse required node/edge IDs for scenes or actions, and avoid language keywords such as database, scene, story, graph, node, and edge as IDs
- every scene duration must contain all of its sequence/stagger delays and transitions; prefer at least 2500ms per scene and keep the total inside the required range

Return only the complete AnimFlow source beginning with "animflow 2.1". Do not use Markdown fences or add an explanation. Do not modify files.`;
  let source = "";
  let valid = false;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    source = generate(prompt);
    const compilation = compile(source);
    if (compilation.ok) {
      valid = true;
      break;
    }
    prompt = `Repair this AnimFlow 2.1 source so the CLI compilation diagnostics are fully resolved while preserving the teaching request and evaluation contract. Every ID must remain semantic and document-unique. For AF501 MODEL_TRACK_OUTSIDE_SCENE, lengthen the affected scene within the 6000-15000ms total or simplify its sequence/stagger choreography so every track ends inside the scene. Return only the complete corrected source without Markdown fences or explanation.

Diagnostics:
${JSON.stringify(compilation.diagnostics)}

Source:
${source}`;
  }
  if (!valid) throw new Error("Codex source remained invalid after four generation attempts.");
  process.stdout.write(`${source}\n`);
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

function generate(prompt) {
  const result = spawnSync("codex", [
    "exec",
    "--ephemeral",
    "--ignore-user-config",
    "--ignore-rules",
    "--skip-git-repo-check",
    "--sandbox", "read-only",
    "--model", request.model,
    "--config", `model_reasoning_effort=${JSON.stringify(request.reasoningEffort)}`,
    "--color", "never",
    "--output-last-message", outputPath,
    "-",
  ], {
    cwd: root,
    encoding: "utf8",
    input: prompt,
    maxBuffer: 4 * 1_024 * 1_024,
    timeout: 180_000,
  });
  if (result.status !== 0) {
    throw new Error(`Codex generation failed (${result.status}): ${result.stderr.slice(-4_000)}`);
  }
  const raw = readFileSync(outputPath, "utf8").trim();
  const fenced = raw.match(/```(?:animflow)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  const source = fenced ?? raw.slice(raw.indexOf("animflow 2.1")).trim();
  if (!source.startsWith("animflow 2.1")) throw new Error("Codex response did not contain AnimFlow 2.1 source.");
  return source;
}

function compile(source) {
  const result = spawnSync(process.execPath, [cli, "compile", "/dev/stdin", "--json"], {
    cwd: root,
    encoding: "utf8",
    input: `${source}\n`,
    maxBuffer: 4 * 1_024 * 1_024,
  });
  try {
    const report = JSON.parse(result.stdout);
    return { ok: result.status === 0 && report.ok === true, diagnostics: report.diagnostics ?? [] };
  } catch {
    return { ok: false, diagnostics: [{ code: "EVAL_ADAPTER", message: result.stderr || "CLI compilation did not return JSON." }] };
  }
}
