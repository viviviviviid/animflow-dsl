import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import { parseAnimFlow } from "../src/index.js";

const validFixture = fileURLToPath(
  new URL("../fixtures/valid/basic.animflow", import.meta.url),
);

describe("AnimFlow language", () => {
  test("parses and links a complete v2 document", async () => {
    const source = await readFile(validFixture, "utf8");
    const result = await parseAnimFlow(source);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.diagnostics).toEqual([]);
    expect(result.value.graphs[0]?.members).toHaveLength(3);
    expect(result.value.overlays[0]?.properties[0]?.$type).toBe(
      "OverlayAnchorProperty",
    );
  });

  test("reports stable syntax and reference diagnostic codes with offsets", async () => {
    const source = baseDocument({ edgeTo: "missing" });
    const result = await parseAnimFlow(source);

    expect(result.ok).toBe(false);
    if (result.ok) return;

    const diagnostic = result.diagnostics.find((item) => item.code === "AF210");
    expect(diagnostic).toBeDefined();
    expect(diagnostic?.range.start.offset).toBe(source.indexOf("missing"));
    expect(diagnostic?.range.end.offset).toBe(source.indexOf("missing") + 7);
  });

  test("returns syntax diagnostics without running validators on a recovered AST", async () => {
    const source = "animflow 2 canvas { size 1280 by }";
    const result = await parseAnimFlow(source);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics.every((diagnostic) => diagnostic.code === "AF101")).toBe(
      true,
    );
  });

  test("rejects duplicate IDs, invalid properties, and invalid numeric values", async () => {
    const source = baseDocument({
      extraNode: 'node api "Duplicate" { shape rounded }',
      canvas: "size 0 by 720 theme light background surface theme dark",
      duration: "0s",
    });
    const result = await parseAnimFlow(source);

    expect(result.ok).toBe(false);
    if (result.ok) return;

    const codes = result.diagnostics.map((item) => item.code);
    expect(codes).toContain("AF201");
    expect(codes).toContain("AF303");
    expect(codes).toContain("AF304");
  });

  test("rejects graph wildcard misuse and camera focus cardinality", async () => {
    const source = baseDocument({
      sceneStatements: `
        show pipeline via fade
        camera focus(pipeline) padding 10
        show api.* via pop
      `,
    });
    const result = await parseAnimFlow(source);

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.diagnostics.filter((item) => item.code === "AF305").length).toBe(4);
  });

  test("detects parallel writes but permits repeated writes inside a sequence", async () => {
    const conflict = await parseAnimFlow(
      baseDocument({
        sceneStatements: `
          show api via fade
          hide api via pop
        `,
      }),
    );
    expect(conflict.ok).toBe(false);
    if (!conflict.ok) {
      expect(conflict.diagnostics.some((item) => item.code === "AF422")).toBe(true);
    }

    const sequence = await parseAnimFlow(
      baseDocument({
        sceneStatements: `
          sequence {
            show api via fade
            hide api via pop
          }
        `,
      }),
    );
    expect(sequence.ok).toBe(true);
  });

  test("keeps narration scene-scoped", async () => {
    const result = await parseAnimFlow(
      baseDocument({ sceneStatements: 'sequence { say "Not scene-scoped" }' }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics.some((item) => item.code === "AF405")).toBe(true);
  });
});

interface DocumentOverrides {
  readonly canvas?: string;
  readonly edgeTo?: string;
  readonly extraNode?: string;
  readonly duration?: string;
  readonly sceneStatements?: string;
}

function baseDocument(overrides: DocumentOverrides = {}): string {
  return `animflow 2
canvas { ${overrides.canvas ?? "size 1280 by 720 theme light background surface"} }
graph pipeline {
  layout flow right { nodeGap 40 rankGap 60 routing orthogonal }
  node client "Client" { shape rounded tone neutral }
  node api "API" { shape rectangle tone primary }
  ${overrides.extraNode ?? ""}
  edge request: client.e -> ${overrides.edgeTo ?? "api"}.w {
    line solid 2
    arrow end
  }
}
story demo {
  initial { show pipeline.* camera fit(pipeline) }
  scene intro "Intro" duration ${overrides.duration ?? "1s"} {
    ${overrides.sceneStatements ?? "draw request via trace"}
  }
}
`;
}
