import { readFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { compileAnimFlow } from "@animflow-dsl/compiler";
import { sample } from "@animflow-dsl/runtime";
import { AnimFlowCanvas } from "../src/index.js";
import { movePathEndpoints } from "../src/drag-geometry.js";

async function fixture() {
  const result = await compileAnimFlow(await readFile(new URL("../../language/fixtures/valid/basic.animflow", import.meta.url), "utf8"));
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  return result.value;
}

describe("independent canvas interactions", () => {
  test("gives every canvas and thumbnail its own markers and masks", async () => {
    const plan = await fixture();
    const markup = renderToStaticMarkup(<><AnimFlowCanvas plan={plan} frame={sample(plan, 0)} /><AnimFlowCanvas plan={plan} frame={sample(plan, plan.durationMs)} /></>);
    const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    for (const match of markup.matchAll(/url\(#([^)]+)\)/g)) expect(ids).toContain(match[1]);
  });
  test("removes hidden elements from keyboard navigation", async () => {
    const plan = await fixture();
    const frame = sample(plan, 0);
    const hidden = { ...frame, elements: frame.elements.map((element) => ({ ...element, opacity: 0 })) };
    const markup = renderToStaticMarkup(<AnimFlowCanvas plan={plan} frame={hidden} onElementSelect={() => undefined} />);
    expect(markup).not.toContain('role="button"');
    expect(markup).not.toContain('tabindex="0"');
  });
  test("updates connected path endpoints without mutating the compiled plan", async () => {
    const plan = await fixture();
    const edge = plan.geometry.find((item) => item.kind === "edge")!;
    const before = JSON.stringify(edge.path);
    const originalStart = edge.path.commands[0]!;
    const moved = movePathEndpoints(edge.path, { x: 30, y: 70 }, { x: 0, y: 0 });
    if (originalStart.kind === "close") throw new Error("Missing path start");
    expect(moved.commands[0]).toEqual({ kind: "move", to: { x: originalStart.to.x + 30, y: originalStart.to.y + 70 } });
    expect(moved.commands[moved.commands.length - 1]).toEqual(edge.path.commands[edge.path.commands.length - 1]);
    expect(JSON.stringify(edge.path)).toBe(before);
  });
});
