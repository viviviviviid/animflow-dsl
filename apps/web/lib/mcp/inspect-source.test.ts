import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

import { inspectAnimFlowSource } from "./inspect-source";

describe("inspectAnimFlowSource", () => {
  test("returns a stable narration cue manifest for valid source", async () => {
    const source = await readFile(resolve(__dirname, "../../../../skills/animflow-authoring/examples/request-lifecycle.animflow"), "utf8");
    const result = await inspectAnimFlowSource(source);

    expect(result.ok).toBe(true);
    expect(result.findings).toEqual([]);
    expect(result.narrationCues.length).toBeGreaterThan(0);
    expect(result.narrationCues[0]).toMatchObject({ sceneId: expect.any(String), startMs: 0 });
  });

  test("returns compiler diagnostics without a partial timing manifest", async () => {
    const result = await inspectAnimFlowSource("animflow 2.2\nthis is invalid");

    expect(result.ok).toBe(false);
    expect(result.findings[0]).toMatchObject({ severity: "error", line: expect.any(Number) });
    expect(result.narrationCues).toEqual([]);
  });

  test("rejects compiled source whose pinned node geometry overlaps", async () => {
    const result = await inspectAnimFlowSource(`animflow 2.2

canvas {
  size 1280 by 720
  theme light
  background surface
}

graph qualityGraph {
  layout flow right {
    nodeGap 48
    rankGap 80
    routing orthogonal
  }
  node boxA "Left" {
    shape rounded
    tone primary
    position x 400 y 300
    pin
  }
  node boxB "Right" {
    shape rounded
    tone neutral
    position x 400 y 300
    pin
  }
}

story qualityStory {
  initial {
    show qualityGraph.*
    camera fit(qualityGraph) padding 40
  }
  scene explainOverlap "Explain" duration 4s {
    action focusBoxA: highlight boxA tone accent
    say "Both nodes need separate space."
  }
}`);

    expect(result.ok).toBe(false);
    expect(result.findings).toContainEqual(expect.objectContaining({ code: "AFQ101", severity: "error" }));
  });
});
