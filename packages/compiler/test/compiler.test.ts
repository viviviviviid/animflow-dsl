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

  test("reveals a hidden edge when draw animates it", async () => {
    const source = (await readFile(fixturePath, "utf8"))
      .replace("show checkout.*", "show [client, api]");
    const result = await compileAnimFlow(source);

    expect(result.ok, JSON.stringify(result.diagnostics)).toBe(true);
    if (!result.ok) return;
    const edge = result.value.elements.find((element) => element.kind === "edge");
    expect(edge?.kind).toBe("edge");
    if (edge?.kind !== "edge") return;
    const initial = result.value.initial.elements.find((frame) => frame.handle === edge.handle);
    expect(initial?.opacity).toBe(0);
    const reveal = result.value.scenes[0]?.tracks.find(
      (track) => track.kind === "element-number"
        && track.handle === edge.handle
        && track.property === "opacity",
    );
    expect(reveal).toMatchObject({ from: 0, to: 1, startMs: 0, durationMs: 160 });
  });

  test("moves labels below adjacent nodes when the edge cannot fit the text and arrow", async () => {
    const result = await compileAnimFlow(await readFile(fixturePath, "utf8"));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const nodes = result.value.geometry.filter((item) => item.kind === "node");
    const edge = result.value.geometry.find((item) => item.kind === "edge");
    expect(edge?.kind).toBe("edge");
    if (edge?.kind !== "edge" || !edge.label) return;

    const nodeBottom = Math.max(...nodes.map((node) => node.bounds.y + node.bounds.height));
    expect(edge.path.length).toBe(80);
    expect(edge.label.bounds.y).toBeGreaterThanOrEqual(nodeBottom + 8);
  });

  test("keeps a compact label inline when a longer edge has safe arrow clearance", async () => {
    const source = (await readFile(fixturePath, "utf8"))
      .replace("rankGap 80", "rankGap 220")
      .replace('label "POST /checkout"', 'label "OK"');
    const result = await compileAnimFlow(source);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const nodes = result.value.geometry.filter((item) => item.kind === "node");
    const edge = result.value.geometry.find((item) => item.kind === "edge");
    expect(edge?.kind).toBe("edge");
    if (edge?.kind !== "edge" || !edge.label) return;

    const nodeBottom = Math.max(...nodes.map((node) => node.bounds.y + node.bounds.height));
    expect(edge.label.bounds.width).toBeLessThan(80);
    expect(edge.label.bounds.y).toBeLessThan(nodeBottom);
  });

  test("wraps long fallback labels instead of letting them run into nodes", async () => {
    const source = (await readFile(fixturePath, "utf8"))
      .replace(
        'label "POST /checkout"',
        'label "Validate the request and forward the verified payment decision"',
      )
      .replace("draw request via trace", "camera fit(checkout) padding 0");
    const result = await compileAnimFlow(source);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const edge = result.value.geometry.find((item) => item.kind === "edge");
    expect(edge?.kind).toBe("edge");
    if (edge?.kind !== "edge" || !edge.label) return;

    expect(edge.label.lines.length).toBeGreaterThan(1);
    expect(edge.label.bounds.width).toBeLessThanOrEqual(220);

    const camera = result.value.scenes[0]?.tracks.find((track) => track.kind === "camera-rect");
    expect(camera?.kind).toBe("camera-rect");
    if (camera?.kind !== "camera-rect") return;
    expect(camera.to.y + camera.to.height).toBeGreaterThanOrEqual(
      edge.label.bounds.y + edge.label.bounds.height,
    );
  });

  test("keeps every crowded edge label clear of every node", async () => {
    const source = branchingSource
      .replace("edge toUpper: entry.e -> upper.w {\n    line", "edge toUpper: entry.e -> upper.w {\n    label \"Take the primary branch after validation\"\n    line")
      .replace("edge toLower: entry.e -> lower.w {\n    line", "edge toLower: entry.e -> lower.w {\n    label \"Take the fallback branch after validation\"\n    line");
    const result = await compileAnimFlow(source);

    expect(result.ok, JSON.stringify(result.diagnostics)).toBe(true);
    if (!result.ok) return;
    const nodes = result.value.geometry.filter((item) => item.kind === "node");
    const labels = result.value.geometry.flatMap((item) => item.kind === "edge" && item.label ? [item.label.bounds] : []);
    expect(labels.length).toBe(2);
    for (const label of labels) {
      expect(nodes.every((node) => !intersects(label, node.bounds))).toBe(true);
    }
  });

  test("places anchored overlays outside nodes and includes them in graph camera fits", async () => {
    const result = await compileAnimFlow(await readFile(fixturePath, "utf8"));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const nodes = result.value.geometry.filter((item) => item.kind === "node");
    const overlay = result.value.geometry.find((item) => item.kind === "overlay");
    expect(overlay?.kind).toBe("overlay");
    if (overlay?.kind !== "overlay") return;
    expect(nodes.every((node) => !intersects(overlay.bounds, node.bounds))).toBe(true);

    const initialCamera = result.value.initial.camera.viewBox;
    expect(initialCamera.x).toBeLessThanOrEqual(overlay.bounds.x);
    expect(initialCamera.y).toBeLessThanOrEqual(overlay.bounds.y);
    expect(initialCamera.x + initialCamera.width).toBeGreaterThanOrEqual(overlay.bounds.x + overlay.bounds.width);
    expect(initialCamera.y + initialCamera.height).toBeGreaterThanOrEqual(overlay.bounds.y + overlay.bounds.height);
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

  test("does not leave visible nodes partially clipped by a focused camera", async () => {
    const source = branchingSource.replace(
      'say "Two paths split and merge."',
      'action focusUpper: camera fit(upper) padding 0\n    say "Two paths split and merge."',
    );
    const result = await compileAnimFlow(source);

    expect(result.ok, JSON.stringify(result.diagnostics)).toBe(true);
    if (!result.ok) return;
    const track = result.value.scenes[0]?.tracks.find((candidate) => candidate.kind === "camera-rect");
    expect(track?.kind).toBe("camera-rect");
    if (track?.kind !== "camera-rect") return;
    const visibleNodes = result.value.geometry.filter((item) => item.kind === "node");
    for (const node of visibleNodes) {
      const intersection = intersectionArea(track.to, node.bounds);
      expect(intersection === 0 || intersection === node.bounds.width * node.bounds.height).toBe(true);
    }
  });

  test("centers singleton ranks around a split-and-merge branch", async () => {
    const result = await compileAnimFlow(branchingSource);

    if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));

    const centerY = (id: string): number => {
      const element = result.value.elements.find((candidate) => candidate.kind === "node" && candidate.id === id);
      const geometry = element && result.value.geometry.find((candidate) => candidate.handle === element.handle);
      expect(geometry?.kind).toBe("node");
      return geometry?.kind === "node" ? geometry.bounds.y + geometry.bounds.height / 2 : Number.NaN;
    };
    const upper = centerY("upper");
    const lower = centerY("lower");

    expect(lower).toBeGreaterThan(upper);
    expect(centerY("entry")).toBeCloseTo((upper + lower) / 2, 8);
    expect(centerY("finish")).toBeCloseTo((upper + lower) / 2, 8);
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

  test("keeps pinned v2.2 coordinates and moves soft positions out of collisions", async () => {
    const source = toV21(await readFile(fixturePath, "utf8"))
      .replace("animflow 2.1", "animflow 2.2")
      .replace("    tone neutral", "    tone neutral\n    position x 300 y 200\n    pin")
      .replace("    tone primary", "    tone primary\n    position x 300 y 200");
    const result = await compileAnimFlow(source);

    expect(result.ok, JSON.stringify(result.diagnostics)).toBe(true);
    if (!result.ok) return;
    expect(result.value.authoring?.sourceVersion).toBe("2.2");
    const nodes = result.value.geometry.filter((geometry) => geometry.kind === "node");
    const client = nodes[0]!;
    const api = nodes[1]!;
    expect(client.bounds.x + client.bounds.width / 2).toBe(300);
    expect(client.bounds.y + client.bounds.height / 2).toBe(200);
    expect(api.bounds.y + api.bounds.height / 2).not.toBe(200);
    expect(api.bounds.y).toBeGreaterThanOrEqual(client.bounds.y + client.bounds.height + 48);
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

function intersects(
  left: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
  right: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
): boolean {
  return !(
    left.x + left.width <= right.x ||
    right.x + right.width <= left.x ||
    left.y + left.height <= right.y ||
    right.y + right.height <= left.y
  );
}

function intersectionArea(
  left: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
  right: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
): number {
  return Math.max(0, Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x)) *
    Math.max(0, Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y));
}

const branchingSource = `animflow 2.1

canvas {
  size 1280 by 720
  theme light
  background surface
}

graph branch {
  layout flow right {
    nodeGap 48
    rankGap 80
    routing orthogonal
  }

  node entry "Start" {
    shape rounded
    tone primary
  }

  node upper "Upper path" {
    shape rounded
    tone info
  }

  node lower "Lower path" {
    shape rounded
    tone accent
  }

  node finish "Finish" {
    shape rounded
    tone success
  }

  edge toUpper: entry.e -> upper.w {
    line solid 2
    arrow end
    tone info
    routing orthogonal
  }

  edge toLower: entry.e -> lower.w {
    line solid 2
    arrow end
    tone accent
    routing orthogonal
  }

  edge upperDone: upper.e -> finish.w {
    line solid 2
    arrow end
    tone info
    routing orthogonal
  }

  edge lowerDone: lower.e -> finish.w {
    line solid 2
    arrow end
    tone accent
    routing orthogonal
  }
}

story branchStory {
  initial {
    show branch.*
    camera fit(branch) padding 40
  }

  scene explain "Explain the branch" duration 1s {
    say "Two paths split and merge."
  }
}
`;
