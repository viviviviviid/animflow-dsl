import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import { formatAnimFlow, parseAnimFlow, releaseAnimFlowDocument } from "../src/index.js";

const fixturePath = fileURLToPath(
  new URL("../fixtures/valid/basic.animflow", import.meta.url),
);

describe("AnimFlow CST formatter", () => {
  test("is idempotent and normalizes punctuation, blocks, and indentation", async () => {
    const source = (await readFile(fixturePath, "utf8"))
      .replace(/\n\s*/g, " ")
      .replace("canvas {", "canvas{")
      .replace("client.e -> api.w", "client . e->api . w")
      .trim();

    const first = await formatAnimFlow(source);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = await formatAnimFlow(first.value.source);
    expect(second.ok).toBe(true);
    if (!second.ok) return;

    expect(first.value.changed).toBe(true);
    expect(second.value.changed).toBe(false);
    expect(second.value.source).toBe(first.value.source);
    expect(first.value.source).toContain("edge request: client.e -> api.w {");
    expect(first.value.source).toContain("    sequence {\n      highlight api tone accent");
    expect(first.value.source.endsWith("\n")).toBe(true);
  });

  test("preserves comments and declaration order", async () => {
    const source = (await readFile(fixturePath, "utf8"))
      .replace("  node client", "  // client declaration\n  node client")
      .replace("    draw request", "    /* draw request */\n    draw request");

    const result = await formatAnimFlow(source);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.source.match(/\/\/ client declaration/g)).toHaveLength(1);
    expect(result.value.source.match(/\/\* draw request \*\//g)).toHaveLength(1);
    expect(result.value.source.indexOf("// client declaration")).toBeLessThan(
      result.value.source.indexOf('node client "Client"'),
    );
    expect(result.value.source.indexOf("/* draw request */")).toBeLessThan(
      result.value.source.indexOf("draw request via trace"),
    );

    const parsed = await parseAnimFlow(result.value.source);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) await releaseAnimFlowDocument(parsed.value);
  });

  test("returns source diagnostics instead of formatting invalid input", async () => {
    const result = await formatAnimFlow("animflow 2 canvas {");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics[0]?.code).toBe("AF101");
  });
});
