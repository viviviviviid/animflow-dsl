import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";
import { validateRenderPlan } from "@animflow-dsl/model";

import { compileAnimFlow } from "../src/index.js";

const fixturePath = fileURLToPath(
  new URL("../../language/fixtures/valid/basic.animflow", import.meta.url),
);

describe("AnimFlow compiler", () => {
  test("lowers a linked AST into a valid immutable RenderPlan", async () => {
    const source = await readFile(fixturePath, "utf8");
    const result = await compileAnimFlow(source);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(validateRenderPlan(result.value)).toEqual([]);
    expect(result.value.elements.map((element) => element.kind)).toEqual([
      "node",
      "node",
      "edge",
      "overlay",
    ]);
    expect(result.value.geometry.map((item) => item.handle)).toEqual([0, 1, 2, 3]);
    expect(result.value.initial.elements.map((item) => item.opacity)).toEqual([1, 1, 1, 0]);
    expect(result.value.authoring).toBeUndefined();
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.scenes[0]?.tracks)).toBe(true);
  });

  test("is deep-equal and byte-stable across repeated compilations", async () => {
    const source = await readFile(fixturePath, "utf8");
    const first = await compileAnimFlow(source);
    const second = await compileAnimFlow(source);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    expect(second.value).toEqual(first.value);
    expect(JSON.stringify(second.value)).toBe(JSON.stringify(first.value));
    expect(first.value.sourceHash).toMatch(/^[a-f0-9]{64}$/);
  });

  test("normalizes sequence timing inside the owning scene", async () => {
    const source = await readFile(fixturePath, "utf8");
    const result = await compileAnimFlow(source);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const tracks = result.value.scenes[0]?.tracks ?? [];
    const highlight = tracks.find(
      (track) => track.kind === "element-number" && track.property === "highlight.intensity" && track.to === 1,
    );
    const clear = tracks.find(
      (track) => track.kind === "element-number" && track.property === "highlight.intensity" && track.to === 0,
    );
    expect(highlight).toMatchObject({ startMs: 0, durationMs: 1000 });
    expect(clear).toMatchObject({ startMs: 1000, durationMs: 1000 });
  });

  test("compiles camera fit into an aspect-correct typed track", async () => {
    const source = (await readFile(fixturePath, "utf8")).replace(
      "draw request via trace",
      "camera focus(api) padding 24",
    );
    const result = await compileAnimFlow(source);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const track = result.value.scenes[0]?.tracks.find(
      (candidate) => candidate.kind === "camera-rect",
    );
    expect(track?.kind).toBe("camera-rect");
    if (track?.kind !== "camera-rect") return;
    expect(track.to.width / track.to.height).toBeCloseTo(1280 / 720, 8);
  });

  test("preserves nested v2.1 action provenance on the plan and leaf tracks", async () => {
    const source = toV21(await readFile(fixturePath, "utf8"));
    const result = await compileAnimFlow(source);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.authoring?.sourceVersion).toBe("2.1");
    expect(result.value.authoring?.actions.map((action) => action.id)).toEqual([
      "traceRequest",
      "emphasizeApi",
      "highlightApi",
      "clearApi",
    ]);
    expect(result.value.authoring?.actions[2]).toMatchObject({
      id: "highlightApi",
      parentActionId: "emphasizeApi",
      kind: "highlight",
      sceneId: "requestScene",
    });
    const firstRange = result.value.authoring?.actions[0]?.range;
    expect(firstRange && source.slice(firstRange.start.offset, firstRange.end.offset)).toBe(
      "action traceRequest: draw request via trace",
    );
    expect(result.value.scenes[0]?.tracks.every((track) => track.actionId !== undefined)).toBe(true);
    expect(result.value.scenes[0]?.tracks[0]?.actionId).toBe("traceRequest");
    expect(Object.isFrozen(result.value.authoring?.actions)).toBe(true);
    expect(validateRenderPlan(result.value)).toEqual([]);
  });

  test("does not produce a plan for invalid source", async () => {
    const source = (await readFile(fixturePath, "utf8")).replace(
      'scene requestScene "Send request"',
      'scene checkoutStory "Send request"',
    );
    const result = await compileAnimFlow(source);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics.some((diagnostic) => diagnostic.code === "AF201")).toBe(
      true,
    );
  });
});

function toV21(source: string): string {
  return source
    .replace("animflow 2", "animflow 2.1")
    .replace("    draw request via trace", "    action traceRequest: draw request via trace")
    .replace("    sequence {", "    action emphasizeApi: sequence {")
    .replace("      highlight api tone accent", "      action highlightApi: highlight api tone accent")
    .replace("      clearHighlight api", "      action clearApi: clearHighlight api");
}
