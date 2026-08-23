import { describe, expect, test } from "vitest";

import { TEMPLATES } from "../../../apps/web/data/templates/index.js";
import { compileAnimFlow } from "@animflow-dsl/compiler";
import { migrateV1ToV2 } from "../src/index.js";

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
