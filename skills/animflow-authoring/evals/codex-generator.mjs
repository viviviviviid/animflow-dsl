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
const languageReference = readFileSync(join(skillDirectory, "references/language-reference.md"), "utf8");
const lecturePatterns = readFileSync(join(skillDirectory, "references/lecture-patterns.md"), "utf8");
const canonicalExample = readFileSync(join(skillDirectory, "examples/request-lifecycle.animflow"), "utf8");
const narrationTimingToleranceMs = 250;

const temporaryDirectory = mkdtempSync(join(tmpdir(), "animflow-codex-eval-"));
const outputPath = join(temporaryDirectory, "source.animflow");
try {
  let prompt = `Generate one native AnimFlow 2.2 lecture document for this request:

${request.prompt}

Evaluation persona: ${request.persona}. Make the result feel reliable and clear to that persona while preserving the technical request.

Follow the repository skill at ${join(skillDirectory, "SKILL.md")} and its language-reference.md and lecture-patterns.md references. Do not read eval fixtures or expected.json. The evaluation contract requires:
- document-unique semantic IDs including: ${expected.requiredIds.join(", ")}
- ${expected.sceneCount[0]}-${expected.sceneCount[1]} scenes
- total duration ${expected.durationMs[0]}-${expected.durationMs[1]}ms
- narration with say statements
- only these action kinds: ${expected.allowedActions.join(", ")}
- sibling scene actions run in parallel; wrap same-target clear/highlight or other repeated property writes in an ID-bearing sequence
- every ID is document-unique; never reuse required node/edge IDs for scenes or actions, and avoid language keywords such as database, scene, story, graph, node, and edge as IDs
- scene actions target element IDs directly (show client), never graph-qualified IDs (show requestFlow.client); graph.* is valid only when targeting the entire graph
- stagger syntax is exactly: action uniqueId: stagger 200ms { ...ID-bearing child actions... }
- every scene duration must contain all of its sequence/stagger delays and transitions; prefer at least 2500ms per scene and keep the total inside the required range
- every narration must fit its scene at a conservative pace: budget 400ms per English word or 180ms per Korean non-space character, plus 800ms breathing room
- no node bounds or edge-label bounds may overlap; use automatic flow layout unless a verified correction needs a position hint
- drawing a previously hidden edge must reveal it, and the final important path must remain visible

Authoritative language reference (use only this syntax):
${languageReference}

Lecture choreography reference:
${lecturePatterns}

Canonical valid source example (adapt its grammar, do not copy its teaching content):
${canonicalExample}

Return only the complete AnimFlow source beginning with "animflow 2.2". Do not use Markdown fences or add an explanation. Do not modify files.`;
  let source = "";
  let valid = false;
  let lastFailure = {};
  let lastValidSource = "";
  const basePrompt = prompt;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    source = repairCommonSyntax(generate(prompt));
    const compilation = compile(source);
    const contractFailures = inspectSourceContract(source);
    lastFailure = { contractFailures, diagnostics: compilation.diagnostics };
    if (compilation.ok) lastValidSource = source;
    if (compilation.ok && contractFailures.length === 0) {
      valid = true;
      break;
    }
    if (lastValidSource) {
      prompt = `${basePrompt}

The source below already compiles. Correct only these contract failures. Preserve every declaration, ID, target, action, and teaching concept. Prefer shortening each say sentence to its essential idea; change scene duration literals only when the shortened narration or existing action schedule still needs more time. Do not introduce any syntax not already present in this source.

Contract failures:
${JSON.stringify(inspectSourceContract(lastValidSource))}

Valid source to revise:
${lastValidSource}`;
      continue;
    }
    prompt = `Repair this AnimFlow 2.2 source so the CLI compilation diagnostics are fully resolved while preserving the teaching request and evaluation contract. Re-read ${join(skillDirectory, "references/language-reference.md")} and use only documented syntax. Every ID must remain semantic and document-unique. For AF501 MODEL_TRACK_OUTSIDE_SCENE, simplify its sequence/stagger choreography before lengthening the scene. Return only the complete corrected source without Markdown fences or explanation.

Diagnostics:
${JSON.stringify(compilation.diagnostics)}

Source:
${source}`;
  }
  if (!valid) throw new Error(`Codex source remained invalid after four generation attempts: ${JSON.stringify(lastFailure)}`);
  process.stdout.write(`${source}\n`);
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

function generate(prompt) {
  const result = spawnSync(process.env.ANIMFLOW_CODEX_COMMAND ?? "codex", [
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
  const source = fenced ?? raw.slice(raw.indexOf("animflow 2.2")).trim();
  if (!source.startsWith("animflow 2.2")) throw new Error("Codex response did not contain AnimFlow 2.2 source.");
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

function inspectSourceContract(source) {
  const failures = [];
  for (const id of expected.requiredIds) {
    if (!new RegExp(`\\b${escapeRegExp(id)}\\b`).test(source)) failures.push(`missing required ID ${id}`);
  }
  const scenes = [];
  let current;
  for (const line of source.split("\n")) {
    const scene = line.match(/^\s*scene\s+([A-Za-z_][\w-]*)\s+"[^"]*"\s+duration\s+([\d.]+)(ms|s)\s*\{/);
    if (scene) {
      current = { id: scene[1], durationMs: Number(scene[2]) * (scene[3] === "s" ? 1000 : 1) };
      scenes.push(current);
      continue;
    }
    const narration = line.match(/^\s*say\s+"(.*)"\s*$/)?.[1];
    if (current && narration) {
      const estimatedMs = estimateSpeechDuration(narration);
      if (current.durationMs + narrationTimingToleranceMs < estimatedMs) {
        failures.push(`scene ${current.id} narration needs about ${estimatedMs}ms but has ${current.durationMs}ms`);
      }
    }
  }
  const total = scenes.reduce((sum, scene) => sum + scene.durationMs, 0);
  if (scenes.length < expected.sceneCount[0] || scenes.length > expected.sceneCount[1]) {
    failures.push(`scene count ${scenes.length} outside ${expected.sceneCount.join("-")}`);
  }
  if (total < expected.durationMs[0] || total > expected.durationMs[1]) {
    failures.push(`duration ${total} outside ${expected.durationMs.join("-")}`);
  }
  return failures;
}

function estimateSpeechDuration(text) {
  if (/\p{Script=Hangul}/u.test(text)) return 800 + text.replace(/\s/g, "").length * 180;
  return 800 + text.trim().split(/\s+/).filter(Boolean).length * 400;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function repairCommonSyntax(source) {
  return source.split("\n").map((line) => {
    let repaired = line;
    if (/^\s*(?:action\s+[A-Za-z_][\w-]*:\s*)?(?:show|hide|draw|highlight|clearHighlight|camera)\b/.test(repaired)) {
      repaired = repaired.replace(/\b[A-Za-z_][\w-]*\.([A-Za-z_][\w-]*)\b/g, "$1");
    }
    if (/^\s*action\s+[A-Za-z_][\w-]*:\s+(show|hide)\s+[^\s]+\s*$/.test(repaired)) {
      return `${repaired} via fade`;
    }
    return repaired;
  }).join("\n");
}
