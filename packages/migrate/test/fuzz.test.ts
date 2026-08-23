import { describe, expect, it } from "vitest";

import { importMermaidFlowchart } from "../src/index.js";

describe("deterministic Mermaid importer fuzz", () => {
  it("rejects or imports 120 hostile subsets without throwing", async () => {
    let state = 0xc0ffee;
    const atoms = ["A", "B", "-->", "---", "[label]", "{diamond}", "<script>", "click A", "javascript:", "\u0000", "🧪", "subgraph", "%%"];
    for (let iteration = 0; iteration < 120; iteration += 1) {
      let source = iteration % 2 === 0 ? "flowchart LR\n" : "graph TD\n";
      for (let token = 0; token < 12; token += 1) {
        state = next(state);
        source += `${atoms[state % atoms.length]}${token % 4 === 3 ? "\n" : " "}`;
      }
      const result = await importMermaidFlowchart(source);
      expect(typeof result.ok).toBe("boolean");
      expect(Array.isArray(result.diagnostics)).toBe(true);
    }
  });
});

function next(value: number): number {
  return (Math.imul(value, 1_103_515_245) + 12_345) >>> 0;
}
