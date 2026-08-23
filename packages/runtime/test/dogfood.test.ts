import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { compileAnimFlow } from "@animflow-dsl/compiler";

import { createPlayback, sample } from "../src/index.js";

const dogfoodPath = new URL("../../../examples/dogfood/ai-agent-runtime.animflow", import.meta.url);

describe("10-minute dogfood lecture", () => {
  it("compiles to ten ordered one-minute scenes", async () => {
    const plan = await compileDogfood();
    expect(plan.storyId).toBe("agentLecture");
    expect(plan.scenes).toHaveLength(10);
    expect(plan.scenes.map((scene) => scene.durationMs)).toEqual(Array(10).fill(60_000));
    expect(plan.durationMs).toBe(600_000);
  });

  it("produces identical frames for forward seek, backward seek, and restart", async () => {
    const plan = await compileDogfood();
    const checkpoints = plan.scenes.flatMap((scene) => [scene.startMs, scene.startMs + scene.durationMs / 2, scene.startMs + scene.durationMs]);
    const forward = checkpoints.map((timeMs) => sample(plan, timeMs));
    const backward = [...checkpoints].reverse().map((timeMs) => sample(plan, timeMs)).reverse();
    expect(backward).toEqual(forward);
    const controller = createPlayback(plan);
    controller.seek(plan.durationMs);
    expect(controller.restart().frame).toEqual(sample(plan, 0));
  });
});

async function compileDogfood() {
  const result = await compileAnimFlow(await readFile(dogfoodPath, "utf8"));
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  return result.value;
}
