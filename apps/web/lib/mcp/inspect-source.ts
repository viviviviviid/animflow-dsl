import { compileAnimFlow } from "@animflow-dsl/compiler";
import type { AnimFlowSourceInspection } from "@animflow-dsl/mcp";

const MAX_SOURCE_BYTES = 2_097_152;
const NARRATION_TIMING_TOLERANCE_MS = 250;

export async function inspectAnimFlowSource(source: string): Promise<AnimFlowSourceInspection> {
  if (new TextEncoder().encode(source).byteLength > MAX_SOURCE_BYTES) {
    return {
      findings: [{ code: "AFQ000", message: "AnimFlow source exceeds the 2 MiB project limit.", severity: "error" }],
      narrationCues: [],
      ok: false,
    };
  }

  const compiled = await compileAnimFlow(source);
  if (!compiled.ok) {
    return {
      findings: compiled.diagnostics.map((diagnostic) => ({
        code: diagnostic.code,
        line: diagnostic.range.start.line + 1,
        message: diagnostic.message,
        severity: diagnostic.severity === "error" ? "error" as const : "warning" as const,
      })),
      narrationCues: [],
      ok: false,
    };
  }

  const plan = compiled.value;
  const idByHandle = new Map(plan.symbols.map((symbol) => [symbol.handle, symbol.id]));
  const findings: Array<{ code: string; message: string; severity: "error" | "warning" }> = [];
  const nodes = plan.geometry.filter((geometry) => geometry.kind === "node");

  for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < nodes.length; rightIndex += 1) {
      const left = nodes[leftIndex]!;
      const right = nodes[rightIndex]!;
      if (overlapArea(left.bounds, right.bounds) > 1) {
        findings.push({
          code: "AFQ101",
          message: `Nodes ${idByHandle.get(left.handle) ?? left.handle} and ${idByHandle.get(right.handle) ?? right.handle} overlap.`,
          severity: "error",
        });
      }
    }
  }

  for (const edge of plan.geometry) {
    if (edge.kind !== "edge" || !edge.label) continue;
    for (const node of nodes) {
      if (overlapArea(edge.label.bounds, node.bounds) > 1) {
        findings.push({
          code: "AFQ102",
          message: `Edge label ${idByHandle.get(edge.handle) ?? edge.handle} overlaps node ${idByHandle.get(node.handle) ?? node.handle}.`,
          severity: "error",
        });
      }
    }
  }

  const narrationCues = plan.scenes.flatMap((scene) => {
    const narration = scene.from.narration?.text;
    if (!narration) return [];
    const estimatedSpeechMs = estimateSpeechDuration(narration);
    if (scene.durationMs + NARRATION_TIMING_TOLERANCE_MS < estimatedSpeechMs) {
      findings.push({
        code: "AFQ201",
        message: `Scene ${scene.id} allows ${scene.durationMs}ms but its narration needs about ${estimatedSpeechMs}ms.`,
        severity: "warning",
      });
    }
    return [{
      durationMs: scene.durationMs,
      estimatedSpeechMs,
      sceneId: String(scene.id),
      startMs: scene.startMs,
      text: narration,
    }];
  });

  for (const scene of plan.scenes) {
    for (const draw of scene.tracks) {
      if (draw.kind !== "element-number" || draw.property !== "drawProgress" || draw.to !== 1) continue;
      const from = scene.from.elements.find((frame) => frame.handle === draw.handle);
      const reveal = scene.tracks.some((track) => track.kind === "element-number" && track.handle === draw.handle && track.property === "opacity" && track.to > 0);
      if ((from?.opacity ?? 0) <= 0 && !reveal) {
        findings.push({
          code: "AFQ301",
          message: `Scene ${scene.id} draws hidden edge ${idByHandle.get(draw.handle) ?? draw.handle} without revealing it.`,
          severity: "error",
        });
      }
    }
  }

  return {
    durationMs: plan.durationMs,
    elementCount: plan.elements.length,
    findings,
    narrationCues,
    ok: !findings.some((finding) => finding.severity === "error"),
    sceneCount: plan.scenes.length,
  };
}

function overlapArea(left: { x: number; y: number; width: number; height: number }, right: { x: number; y: number; width: number; height: number }) {
  const width = Math.max(0, Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x));
  const height = Math.max(0, Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y));
  return width * height;
}

function estimateSpeechDuration(text: string) {
  if (/\p{Script=Hangul}/u.test(text)) return 800 + text.replace(/\s/g, "").length * 180;
  return 800 + text.trim().split(/\s+/).filter(Boolean).length * 400;
}
