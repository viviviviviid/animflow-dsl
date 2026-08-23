import { compileAnimFlow } from "@animflow-dsl/compiler";
import { describe, expect, test } from "vitest";

import { importMermaidFlowchart, MERMAID_FLOWCHART_SUPPORT } from "../src/index.js";

describe("Mermaid flowchart importer", () => {
  test("imports supported directions, shapes, labeled edges, and stable IDs", async () => {
    const input = `%% request lifecycle
flowchart LR
  client["Client App"] -->|POST /checkout| api(API)
  api -.-> cache[(Cache)]
  api ==> decision{Valid?}
  decision -.- audit((Audit))
`;
    const first = await importMermaidFlowchart(input);
    const second = await importMermaidFlowchart(input);
    expect(first.ok).toBe(true);
    expect(second).toEqual(first);
    if (!first.ok) return;
    expect(first.value.sourceVersion).toBe("2.1");
    expect(first.value.unsupportedFeatures).toEqual([]);
    expect(first.value.source).toContain("layout flow right");
    expect(first.value.source).toContain('node client "Client App"');
    expect(first.value.source).toContain("shape database");
    expect(first.value.source).toContain('label "POST /checkout"');
    expect(first.value.source).toContain("line dashed 2");
    expect(first.value.source).toContain("line solid 4");
    expect(first.value.source).toContain("arrow none");
    expect(new Set(first.value.generatedIds).size).toBe(first.value.generatedIds.length);

    const compiled = await compileAnimFlow(first.value.source);
    expect(compiled.ok).toBe(true);
  });

  test.each([
    ["flowchart TD", "down"],
    ["graph TB", "down"],
    ["flowchart RL", "left"],
    ["flowchart BT", "up"],
  ])("maps %s direction", async (header, expected) => {
    const imported = await importMermaidFlowchart(`${header}\nA[One]\n`);
    expect(imported.ok).toBe(true);
    if (imported.ok) expect(imported.value.source).toContain(`layout flow ${expected}`);
  });

  test("normalizes invalid AnimFlow identifiers without collisions", async () => {
    const imported = await importMermaidFlowchart(`flowchart TD
      checkout-api[API] --> checkout_api[Worker]
      checkout_api --> 2fa[Two Factor]
    `);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.value.source).toContain("node checkout_api ");
    expect(imported.value.source).toContain("node checkout_api_2 ");
    expect(imported.value.source).toContain("node id_2fa ");
  });

  test.each([
    ["", "AF631"],
    ["sequenceDiagram\nA->>B: hello", "AF630"],
    ["flowchart TD", "AF631"],
    ["flowchart TD\nsubgraph cluster\nA-->B\nend", "AF630"],
    ["flowchart TD\nA[<b>unsafe</b>]", "AF630"],
    ["flowchart TD\nA; B", "AF630"],
    ["flowchart TD\nA -- label --> B", "AF631"],
  ])("rejects unsupported input with a stable diagnostic: %s", async (input, code) => {
    const imported = await importMermaidFlowchart(input);
    expect(imported.ok).toBe(false);
    if (!imported.ok) {
      expect(imported.diagnostics[0]?.code).toBe(code);
      expect(imported.diagnostics[0]?.range.start.line).toBeGreaterThanOrEqual(0);
    }
  });

  test("rejects conflicting node declarations", async () => {
    const imported = await importMermaidFlowchart(`flowchart TD
      A[First]
      A[Second]
    `);
    expect(imported.ok).toBe(false);
    if (!imported.ok) expect(imported.diagnostics[0]?.code).toBe("AF631");
  });

  test("publishes a closed support matrix", () => {
    expect(MERMAID_FLOWCHART_SUPPORT.directions).toEqual(["TD", "TB", "LR", "RL", "BT"]);
    expect(MERMAID_FLOWCHART_SUPPORT.unsupported).toContain("subgraph");
  });
});
