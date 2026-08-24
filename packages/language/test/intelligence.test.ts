import { describe, expect, test } from "vitest";

import {
  completeAnimFlow,
  defineAnimFlow,
  hoverAnimFlow,
} from "../src/index.js";

const SOURCE = `animflow 2.1
canvas { size 1280 by 720 theme light background surface }
graph pipeline {
  layout flow right { routing orthogonal }
  node client "Client" { shape rounded }
  node api "API" { shape rectangle }
  edge request: client.e -> api.w { arrow end }
}
story demo {
  initial { hide pipeline.* camera fit(pipeline) }
  scene intro "Intro" duration 1s {
    action traceRequest: draw request via trace
    say "Request"
  }
}
`;

describe("AnimFlow language intelligence", () => {
  test("offers only named-action entry points at a v2.1 scene boundary", async () => {
    const source = SOURCE.replace('    say "Request"', "    ");
    const position = positionAt(source, source.indexOf("    \n", source.indexOf("scene intro")) + 4);
    const labels = (await completeAnimFlow(source, position)).map((item) => item.label);

    expect(labels).toContain("action");
    expect(labels).toContain("say");
    expect(labels).not.toContain("show");
    expect(labels).not.toContain("draw");
  });

  test("offers action bodies and linked IDs after an action identity", async () => {
    const bodySource = SOURCE.replace('    say "Request"', "    action draft: ");
    const bodyPosition = positionAt(bodySource, bodySource.indexOf("action draft: ") + "action draft: ".length);
    const bodyLabels = (await completeAnimFlow(bodySource, bodyPosition)).map((item) => item.label);
    expect(bodyLabels).toEqual(expect.arrayContaining(["show", "draw", "camera", "sequence", "stagger"]));

    const edgeSource = SOURCE.replace('    say "Request"', "    action draft: draw ");
    const edgePosition = positionAt(edgeSource, edgeSource.indexOf("action draft: draw ") + "action draft: draw ".length);
    const edgeLabels = (await completeAnimFlow(edgeSource, edgePosition)).map((item) => item.label);
    expect(edgeLabels).toContain("request");
  });

  test("resolves definitions and semantic hover through linked references", async () => {
    const referenceOffset = SOURCE.lastIndexOf("request via trace") + 1;
    const position = positionAt(SOURCE, referenceOffset);
    const definitions = await defineAnimFlow(SOURCE, position);
    expect(definitions).toHaveLength(1);
    expect(SOURCE.slice(
      definitions[0]!.targetSelectionRange.start.offset,
      definitions[0]!.targetSelectionRange.end.offset,
    )).toBe("request");

    const hover = await hoverAnimFlow(SOURCE, position);
    expect(hover?.markdown).toContain("**edge request**");
    expect(hover?.markdown).toContain("client.e -> api.w");
  });
});

function positionAt(source: string, offset: number): { readonly line: number; readonly character: number } {
  const prefix = source.slice(0, offset);
  const lines = prefix.split("\n");
  return { line: lines.length - 1, character: lines.at(-1)?.length ?? 0 };
}
