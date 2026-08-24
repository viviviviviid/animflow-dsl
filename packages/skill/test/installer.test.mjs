import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const packageDirectory = resolve(import.meta.dirname, "..");
const installer = join(packageDirectory, "bin/animflow-skill.mjs");

test("installs a self-contained Codex skill in the configured user home", async () => {
  const directory = await mkdtemp(join(tmpdir(), "animflow-skill-codex-"));
  const codexHome = join(directory, "codex-home");
  const result = run(["install", "--agent", "codex", "--json"], directory, { CODEX_HOME: codexHome });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  const target = join(codexHome, "skills", "animflow-authoring");
  assert.equal(report.targets[0].path, target);
  await stat(join(target, "SKILL.md"));
  await stat(join(target, "references/language-reference.md"));
  await stat(join(target, "vendor/animflow-cli.js"));
  const marker = JSON.parse(await readFile(join(target, ".animflow-skill-package.json"), "utf8"));
  assert.equal(marker.packageName, "animflow-authoring-skill");
});

test("installs both project agent layouts without depending on the npm cache", async () => {
  const directory = await mkdtemp(join(tmpdir(), "animflow-skill-project-"));
  const result = run(["install", "--agent", "both", "--scope", "project", "--cwd", directory, "--json"], directory);
  assert.equal(result.status, 0, result.stderr);
  await stat(join(directory, "skills/animflow-authoring/SKILL.md"));
  await stat(join(directory, ".claude/skills/animflow-authoring/SKILL.md"));
});

test("refuses accidental replacement and keeps a backup on forced update", async () => {
  const directory = await mkdtemp(join(tmpdir(), "animflow-skill-update-"));
  const codexHome = join(directory, "codex-home");
  const target = join(codexHome, "skills", "animflow-authoring");
  assert.equal(run(["install"], directory, { CODEX_HOME: codexHome }).status, 0);
  await writeFile(join(target, "personal-note.txt"), "keep me\n");

  const refused = run(["install", "--json"], directory, { CODEX_HOME: codexHome });
  assert.equal(refused.status, 1);
  assert.match(JSON.parse(refused.stderr).error, /Refusing to replace/);

  const updated = run(["install", "--force", "--json"], directory, { CODEX_HOME: codexHome });
  assert.equal(updated.status, 0, updated.stderr);
  const backup = JSON.parse(updated.stdout).targets[0].backup;
  assert.ok(backup);
  assert.equal(await readFile(join(backup, "personal-note.txt"), "utf8"), "keep me\n");
  await stat(join(target, "SKILL.md"));
});

test("bundled CLI remains runnable from the installed skill", async () => {
  const directory = await mkdtemp(join(tmpdir(), "animflow-skill-cli-"));
  const codexHome = join(directory, "codex-home");
  assert.equal(run(["install"], directory, { CODEX_HOME: codexHome }).status, 0);
  const runner = join(codexHome, "skills", "animflow-authoring", "scripts", "run-cli.sh");
  const result = spawnSync(runner, ["version", "--json"], { cwd: directory, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.ok, true);
  assert.equal(report.command, "version");
  assert.match(report.data.cliVersion, /^0\.1\./);
});

function run(args, cwd, environment = {}) {
  return spawnSync(process.execPath, [installer, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, HOME: cwd, ...environment },
  });
}
