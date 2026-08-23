import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, test } from "vitest";
import { themeToken, type RenderPlan } from "@animflow-dsl/model";
import { compileAnimFlow } from "@animflow-dsl/compiler";

import { createPlayback, sample } from "../src/index.js";

const fixturePath = fileURLToPath(
  new URL("../../language/fixtures/valid/basic.animflow", import.meta.url),
);

let plan: RenderPlan;

beforeAll(async () => {
  const result = await compileAnimFlow(await readFile(fixturePath, "utf8"));
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  plan = result.value;
});

describe("pure runtime sampler", () => {
  test("samples typed tracks without mutating the plan", () => {
    const before = JSON.stringify(plan);
    const start = sample(plan, 0);
    const middle = sample(plan, 1000);
    const end = sample(plan, 2000);

    const startEdge = start.elements.find((frame) => frame.kind === "edge");
    const middleEdge = middle.elements.find((frame) => frame.kind === "edge");
    const endEdge = end.elements.find((frame) => frame.kind === "edge");
    expect(startEdge?.drawProgress).toBe(0);
    expect(middleEdge?.drawProgress).toBeCloseTo(0.5, 8);
    expect(endEdge?.drawProgress).toBe(1);
    expect(end.elements[1]?.highlight.active).toBe(false);
    expect(JSON.stringify(plan)).toBe(before);
    expect(Object.isFrozen(middle)).toBe(true);
  });

  test("clamps time and returns deterministic frames", () => {
    expect(sample(plan, -10)).toEqual(sample(plan, 0));
    expect(sample(plan, Number.NaN)).toEqual(sample(plan, 0));
    expect(sample(plan, plan.durationMs + 500)).toEqual(sample(plan, plan.durationMs));
    expect(sample(plan, 733.25)).toEqual(sample(plan, 733.25));
  });

  test("keeps narration and scene progress on the same clock", () => {
    const frame = sample(plan, 500);
    expect(frame.sceneId).toBe("requestScene");
    expect(frame.progress).toBe(0.25);
    expect(frame.narration?.text).toBe("The client sends a request.");
  });

  test("samples color, token, and boolean tracks into representable frame fields", () => {
    const scene = plan.scenes[0]!;
    const extended: RenderPlan = {
      ...plan,
      scenes: [
        {
          ...scene,
          tracks: [
            ...scene.tracks,
            {
              kind: "element-color",
              handle: plan.elements[0]!.handle,
              property: "resolvedColor",
              from: { r: 1, g: 0, b: 0, a: 1 },
              to: { r: 0, g: 0, b: 1, a: 0.5 },
              startMs: 0,
              durationMs: 2000,
              easing: "linear",
            },
            {
              kind: "element-token",
              handle: plan.elements[0]!.handle,
              property: "highlight.tone",
              from: themeToken("neutral"),
              to: themeToken("primary"),
              startMs: 0,
              durationMs: 1000,
              easing: "linear",
            },
          ],
        },
      ],
    };
    const frame = sample(extended, 1000).elements[0]!;

    expect(frame.resolvedColor).toEqual({ r: 0.5, g: 0, b: 0.5, a: 0.75 });
    expect(frame.highlight.tone).toBe("primary");
  });
});

describe("playback state machine", () => {
  test("direct seek and elapsed playback produce identical frames", () => {
    const playback = createPlayback(plan);
    playback.play();
    const elapsed = playback.tick(750);
    const sought = createPlayback(plan).seek(750);

    expect(elapsed.frame).toEqual(sought.frame);
    expect(elapsed.status).toBe("playing");
    expect(sought.status).toBe("idle");
  });

  test("applies speed, pause, restart, end, and loop deterministically", () => {
    const playback = createPlayback(plan, { speed: 2 });
    playback.play();
    expect(playback.tick(400).timeMs).toBe(800);
    playback.pause();
    expect(playback.tick(400).timeMs).toBe(800);
    expect(playback.restart().timeMs).toBe(0);
    expect(playback.tick(1000).status).toBe("ended");

    const looped = createPlayback(plan, { loop: true });
    looped.play();
    expect(looped.tick(2500).timeMs).toBe(500);
    expect(looped.snapshot().status).toBe("playing");
  });

  test("rejects invalid clock input", () => {
    expect(() => createPlayback(plan, { speed: 0 })).toThrow(TypeError);
    const playback = createPlayback(plan);
    expect(() => playback.setSpeed(Number.POSITIVE_INFINITY)).toThrow(TypeError);
    expect(() => playback.tick(-1)).toThrow(TypeError);
  });
});
