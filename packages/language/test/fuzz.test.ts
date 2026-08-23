import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { parseAnimFlow, releaseAnimFlowDocument } from "../src/index.js";

const fixture = await readFile(new URL("../fixtures/valid/basic.animflow", import.meta.url), "utf8");

describe("deterministic public-input fuzz", () => {
  it("returns a Result instead of throwing for 200 mutated UTF-16 sources", async () => {
    let state = 0x51f15e;
    const tokens = ["<script>", "javascript:", "\u0000", "🧪", "{", "}", "\"", "/*", "../", "\ud800"];
    for (let iteration = 0; iteration < 200; iteration += 1) {
      state = next(state);
      const start = state % (fixture.length + 1);
      state = next(state);
      const removed = state % 19;
      state = next(state);
      const token = tokens[state % tokens.length]!;
      const source = `${fixture.slice(0, start)}${token}${fixture.slice(Math.min(fixture.length, start + removed))}`;
      const result = await parseAnimFlow(source);
      expect(typeof result.ok).toBe("boolean");
      expect(Array.isArray(result.diagnostics)).toBe(true);
      if (result.ok) await releaseAnimFlowDocument(result.value);
    }
  });
});

function next(value: number): number {
  return (Math.imul(value, 1_664_525) + 1_013_904_223) >>> 0;
}
