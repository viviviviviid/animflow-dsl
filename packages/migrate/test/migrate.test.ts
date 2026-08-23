import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import { TEMPLATES } from "../../../apps/web/data/templates/index.js";
import { compileAnimFlow } from "@animflow-dsl/compiler";
import { formatAnimFlow } from "@animflow-dsl/language";
import { sample } from "@animflow-dsl/runtime";
import { migrateV1ToV2, migrateV2ToV21 } from "../src/index.js";

const v2FixturePath = fileURLToPath(
  new URL("../../language/fixtures/valid/basic.animflow", import.meta.url),
);

describe("v1 to v2 migration", () => {
  test("migrates and compiles all 11 templates without losing steps or narration", async () => {
    let animationSteps = 0;
    let narrations = 0;

    for (const template of TEMPLATES) {
      const migration = await migrateV1ToV2(template.dsl);
      expect(migration.ok, template.name).toBe(true);
      if (!migration.ok) continue;

      const compilation = await compileAnimFlow(migration.value.source);
      expect(compilation.ok, template.name).toBe(true);
      if (!compilation.ok) continue;

      expect(compilation.value.scenes.length).toBe(
        migration.value.manifest.inputAnimationSteps,
      );
      expect(migration.value.manifest.outputNarrations).toBe(
        migration.value.manifest.inputNarrations,
      );
      animationSteps += migration.value.manifest.inputAnimationSteps;
      narrations += migration.value.manifest.inputNarrations;
    }

    expect(TEMPLATES).toHaveLength(11);
    expect(animationSteps).toBe(268);
    expect(narrations).toBe(92);
  });

  test("is byte-stable and preserves per-scene flow effect changes", async () => {
    const oauth = TEMPLATES.find((template) => template.name.includes("OAuth"))!;
    const first = await migrateV1ToV2(oauth.dsl);
    const second = await migrateV1ToV2(oauth.dsl);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    expect(second.value.source).toBe(first.value.source);
    expect(first.value.source).toContain("via trace flow arrow");
    expect(first.value.source).toContain("via trace flow particles");
  });

  test("preserves stagger timing as an explicit scheduling block", async () => {
    const template = TEMPLATES.find((item) => item.dsl.includes("stagger: 0.3s"))!;
    const migration = await migrateV1ToV2(template.dsl);

    expect(migration.ok).toBe(true);
    if (!migration.ok) return;
    expect(migration.value.source).toContain("stagger 300ms {");

    const compilation = await compileAnimFlow(migration.value.source);
    expect(compilation.ok).toBe(true);
    if (!compilation.ok) return;
    const staggeredScene = compilation.value.scenes.find((scene) =>
      scene.tracks.some((track) => track.startMs === 300),
    );
    expect(staggeredScene).toBeDefined();
  });

  test("renames reserved legacy IDs and reports the mapping", async () => {
    const migration = await migrateV1ToV2(`flowchart LR
  start[Start]
  end[End]
  start --> end

@animation
  step 1: show start
    duration: 1s
  step 2: connect start->end
    flow: arrow
    speed: 1s
@end`);

    expect(migration.ok).toBe(true);
    if (!migration.ok) return;
    expect(migration.value.source).toContain("node legacy_start");
    expect(migration.value.source).toContain("node legacy_end");
    expect(migration.diagnostics.some((item) => item.code === "AF602")).toBe(true);
  });

  test("renames every declaration keyword added by the final v2 grammar", async () => {
    const migration = await migrateV1ToV2(`flowchart LR
  label[Label]
  padding[Padding]
  rectangle[Rectangle]
  wave[Wave]

@animation
  step 1: show label, padding, rectangle, wave
    duration: 1s
@end`);

    expect(migration.ok).toBe(true);
    if (!migration.ok) return;
    for (const name of ["label", "padding", "rectangle", "wave"]) {
      expect(migration.value.source).toContain(`node legacy_${name}`);
    }
    const compilation = await compileAnimFlow(migration.value.source);
    expect(compilation.ok).toBe(true);
    expect(migration.diagnostics.filter((item) => item.code === "AF602")).toHaveLength(4);
  });

  test("emits a blocking diagnostic for behavior with no v2 mapping", async () => {
    const migration = await migrateV1ToV2(`flowchart LR
  A[Start]

@animation
  step 1: move A
    to: [10, 20]
    duration: 1s
@end`);

    expect(migration.ok).toBe(false);
    if (migration.ok) return;
    expect(migration.diagnostics.some((item) => item.code === "AF620")).toBe(true);
  });
});

describe("v2 to v2.1 migration", () => {
  test("generates collision-free action IDs in scene pre-order", async () => {
    const source = (await readFile(v2FixturePath, "utf8")).replace(
      '  node client "Client" {',
      '  node requestScene_action001 "Reserved" {\n    shape rectangle\n    tone neutral\n  }\n\n  node client "Client" {',
    );
    const result = await migrateV2ToV21(source);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.generatedIds).toEqual([
      "requestScene_action002",
      "requestScene_action003",
      "requestScene_action004",
      "requestScene_action005",
    ]);
    expect(result.value.source).toContain(
      "action requestScene_action003: sequence {",
    );
    expect(result.value.source).toContain(
      "action requestScene_action004: highlight api tone accent",
    );
  });

  test("preserves comments and is byte-stable across repeated runs", async () => {
    const source = (await readFile(v2FixturePath, "utf8"))
      .replace("    draw request", "    // trace request\n    draw request")
      .replace("      highlight api", "      /* emphasize API */\n      highlight api");

    const first = await migrateV2ToV21(source);
    const second = await migrateV2ToV21(source);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    expect(second.value).toEqual(first.value);
    expect(first.value.source).toContain(
      "// trace request\n    action requestScene_action001: draw request",
    );
    expect(first.value.source).toContain(
      "/* emphasize API */\n      action requestScene_action003: highlight api",
    );
  });

  test("preserves sampled runtime behavior", async () => {
    const source = await readFile(v2FixturePath, "utf8");
    const migration = await migrateV2ToV21(source);
    expect(migration.ok).toBe(true);
    if (!migration.ok) return;

    const before = await compileAnimFlow(source);
    const after = await compileAnimFlow(migration.value.source);
    expect(before.ok).toBe(true);
    expect(after.ok).toBe(true);
    if (!before.ok || !after.ok) return;

    for (const timeMs of [0, 500, 1000, 1500, 2000]) {
      expect(sample(after.value, timeMs)).toEqual(sample(before.value, timeMs));
    }
  });

  test("rejects a source that is not version 2", async () => {
    const source = (await readFile(v2FixturePath, "utf8"))
      .replace("animflow 2", "animflow 2.1")
      .replace("    draw request via trace", "    action drawRequest: draw request via trace")
      .replace("    sequence {", "    action emphasize: sequence {")
      .replace("      highlight api tone accent", "      action highlightApi: highlight api tone accent")
      .replace("      clearHighlight api", "      action clearApi: clearHighlight api");
    const result = await migrateV2ToV21(source);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics[0]?.code).toBe("AF624");
  });
});

describe("source-tool semantic preservation", () => {
  test("formatting preserves sampled runtime frames", async () => {
    const source = (await readFile(v2FixturePath, "utf8"))
      .replace(/\n\s*/g, " ")
      .replace("client.e -> api.w", "client . e->api . w")
      .trim();
    const formatted = await formatAnimFlow(source);
    expect(formatted.ok).toBe(true);
    if (!formatted.ok) return;

    const before = await compileAnimFlow(source);
    const after = await compileAnimFlow(formatted.value.source);
    expect(before.ok).toBe(true);
    expect(after.ok).toBe(true);
    if (!before.ok || !after.ok) return;

    for (const timeMs of [0, 500, 1000, 1500, 2000]) {
      expect(sample(after.value, timeMs)).toEqual(sample(before.value, timeMs));
    }
  });
});
