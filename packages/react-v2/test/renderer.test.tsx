import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, test } from "vitest";
import type { FrameState, RenderPlan } from "@animflow-dsl/model";
import { compileAnimFlow } from "@animflow-dsl/compiler";
import { sample } from "@animflow-dsl/runtime";
import { renderToStaticMarkup } from "react-dom/server";

import { AnimFlowCanvas, PlaybackControls } from "../src/index.js";

const fixturePath = fileURLToPath(
  new URL("../../language/fixtures/valid/basic.animflow", import.meta.url),
);
const sourceDirectory = fileURLToPath(new URL("../src", import.meta.url));

let plan: RenderPlan;
let frame: FrameState;

beforeAll(async () => {
  const result = await compileAnimFlow(await readFile(fixturePath, "utf8"));
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  plan = result.value;
  frame = sample(plan, 1000);
});

describe("AnimFlowCanvas", () => {
  test("renders immutable geometry and sampled state to layered SVG", () => {
    const markup = renderToStaticMarkup(
      <AnimFlowCanvas ariaLabel="Checkout request flow" frame={frame} plan={plan} />,
    );

    expect(markup).toContain('role="img"');
    expect(markup).toContain("Checkout request flow");
    expect(markup).toContain('data-animflow-layer="edges"');
    expect(markup).toContain('data-animflow-layer="nodes"');
    expect(markup).toContain('data-animflow-layer="overlays"');
    expect(markup).toContain('data-animflow-handle="2"');
    expect(markup).toContain("animflow-marker-2");
    expect(markup).toContain('pathLength="1"');
    expect(markup).not.toContain("data-node-id");
    expect(markup).not.toContain("data-edge-id");
  });

  test("fails immediately when a frame violates the handle contract", () => {
    const invalidFrame: FrameState = { ...frame, elements: frame.elements.slice(1) };
    expect(() =>
      renderToStaticMarkup(<AnimFlowCanvas frame={invalidFrame} plan={plan} />),
    ).toThrow("Frame is missing");
  });

  test.each(["particles", "glow", "wave", "arrow", "lightning"] as const)(
    "renders the sampled %s edge flow effect without a side-effect timeline",
    (effect) => {
      const effectFrame: FrameState = {
        ...frame,
        elements: frame.elements.map((item) =>
          item.kind === "edge"
            ? { ...item, drawProgress: 0.75, flowPhase: 0.55, flowEffect: effect }
            : item,
        ),
      };
      const markup = renderToStaticMarkup(
        <AnimFlowCanvas frame={effectFrame} plan={plan} />,
      );

      expect(markup).toContain(`data-animflow-flow="${effect}"`);
    },
  );

  test("renders dash as sampled line styling", () => {
    const dashFrame: FrameState = {
      ...frame,
      elements: frame.elements.map((item) =>
        item.kind === "edge" ? { ...item, flowEffect: "dash" as const } : item,
      ),
    };
    const markup = renderToStaticMarkup(
      <AnimFlowCanvas frame={dashFrame} plan={plan} />,
    );

    expect(markup).toContain('stroke-dasharray="0.055 0.035"');
  });

  test("contains no source parser, DOM query, or animation timeline", async () => {
    const files = (await readdir(sourceDirectory)).filter((file) => /\.tsx?$/.test(file));
    const source = (
      await Promise.all(files.map((file) => readFile(`${sourceDirectory}/${file}`, "utf8")))
    ).join("\n");

    expect(source).not.toContain("querySelector");
    expect(source).not.toContain("parseAnimFlow");
    expect(source).not.toContain("requestAnimationFrame");
    expect(source).not.toContain("gsap");
  });
});

describe("PlaybackControls", () => {
  test("renders as a controlled host UI outside the SVG canvas", () => {
    const markup = renderToStaticMarkup(
      <PlaybackControls
        durationMs={2000}
        loop={false}
        onLoopChange={() => undefined}
        onPause={() => undefined}
        onPlay={() => undefined}
        onRestart={() => undefined}
        onSeek={() => undefined}
        onSpeedChange={() => undefined}
        speed={1}
        status="paused"
        timeMs={500}
      />,
    );

    expect(markup).toContain('role="group"');
    expect(markup).toContain("Play");
    expect(markup).toContain('aria-label="Animation time"');
    expect(markup).not.toContain("<svg");
  });
});
