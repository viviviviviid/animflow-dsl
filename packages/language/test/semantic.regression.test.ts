import { describe, expect, test } from "vitest";
import { parseAnimFlow, releaseAnimFlowDocument } from "../src/index.js";

const source = (action = "action reveal: show api via fade", duration = "1s", node = 'node api "API" {}') => `animflow 2.2
canvas { size 1200 by 800 theme light background surface }
graph pipeline { layout flow right {} ${node} }
story main { initial { hide pipeline.* }
scene introduction "Introduction" duration ${duration} { ${action} } }`;

describe("source-level semantic diagnostics", () => {
  test("rejects duplicate list targets at the repeated reference", async () => {
    const text = source("action reveal: show [api, api] via fade");
    const result = await parseAnimFlow(text);
    expect(result.ok).toBe(false);
    const diagnostic = result.diagnostics.find((item) => item.code === "AF305");
    expect(diagnostic?.range.start.offset).toBe(text.lastIndexOf("api"));
    expect(diagnostic?.message).toContain("more than once");
  });

  test.each([`${"9".repeat(307)}s`, "9007199254741s"])("rejects unsafe millisecond duration %s before lowering", async (duration) => {
    const result = await parseAnimFlow(source(undefined, duration));
    expect(result.ok).toBe(false);
    expect(result.diagnostics.some((item) => item.code === "AF304")).toBe(true);
    expect(result.diagnostics.some((item) => item.code === "AF501")).toBe(false);
  });

  test.each(["hex_FFF", "hex_1234567", "hex_ZZZZZZ"])("reports malformed literal color %s", async (tone) => {
    const result = await parseAnimFlow(source(undefined, undefined, `node api "API" { tone ${tone} }`));
    expect(result.ok).toBe(false);
    expect(result.diagnostics.some((item) => item.code === "AF306")).toBe(true);
  });

  test.each(["hex_abcDEF", "hex_abcdef88", "brandBlue"])("keeps supported color %s", async (tone) => {
    const result = await parseAnimFlow(source(undefined, undefined, `node api "API" { tone ${tone} }`));
    expect(result.ok).toBe(true);
    if (result.ok) await releaseAnimFlowDocument(result.value);
  });

  test("action identity quick fixes avoid node and graph IDs", async () => {
    const text = source("show api via fade", undefined, 'node api "API" {} node show1 "Reserved action ID" {}');
    const result = await parseAnimFlow(text);
    const fix = result.diagnostics.find((item) => item.code === "AF406")?.fixes?.[0];
    expect(fix?.edits[0]?.newText).toBe("action show1_2: ");
    let patched = text;
    for (const edit of [...fix!.edits].sort((a, b) => b.range.start.offset - a.range.start.offset)) patched = patched.slice(0, edit.range.start.offset) + edit.newText + patched.slice(edit.range.end.offset);
    const checked = await parseAnimFlow(patched);
    expect(checked.ok).toBe(true);
    if (checked.ok) await releaseAnimFlowDocument(checked.value);
  });
});
