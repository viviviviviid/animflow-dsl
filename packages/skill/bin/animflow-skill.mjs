#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import { cp, mkdir, readFile, rename, rm, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const payloadDirectory = join(packageDirectory, "dist/animflow-authoring");
const packageJson = JSON.parse(await readFile(join(packageDirectory, "package.json"), "utf8"));
const supportedAgents = new Set(["codex", "claude", "both"]);
const supportedScopes = new Set(["user", "project"]);

main().catch((error) => {
  const json = process.argv.includes("--json");
  if (json) {
    process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  } else {
    process.stderr.write(`animflow-skill: ${error.message}\n`);
  }
  process.exitCode = 1;
});

async function main() {
  const parsed = parseArguments(process.argv.slice(2));
  if (parsed.command === "help") {
    process.stdout.write(usage());
    return;
  }
  if (parsed.command === "version") {
    process.stdout.write(`${packageJson.version}\n`);
    return;
  }
  if (parsed.command === "path") {
    await assertPayload();
    emit(parsed.json, { ok: true, package: packageJson.name, version: packageJson.version, path: payloadDirectory }, payloadDirectory);
    return;
  }
  if (parsed.command !== "install") throw new Error(`Unknown command: ${parsed.command}. Run with --help for usage.`);

  await assertPayload();
  const targets = resolveTargets(parsed.agent, parsed.scope, parsed.cwd);
  const existing = [];
  for (const target of targets) {
    if (await exists(target.path)) existing.push(target);
  }

  if (existing.length && !parsed.force) {
    const paths = existing.map((target) => target.path).join(", ");
    throw new Error(`Refusing to replace an existing skill at ${paths}. Re-run with --force to create a backup and update it.`);
  }

  if (parsed.dryRun) {
    const result = {
      ok: true,
      dryRun: true,
      package: packageJson.name,
      version: packageJson.version,
      targets,
    };
    emit(parsed.json, result, formatInstallResult(result));
    return;
  }

  const staged = await stageTargets(targets);
  const installed = [];
  try {
    for (const item of staged) {
      let backup;
      if (await exists(item.target.path)) {
        backup = `${item.target.path}.backup-${timestamp()}-${randomUUID().slice(0, 8)}`;
        await rename(item.target.path, backup);
      }
      try {
        await rename(item.temporaryPath, item.target.path);
      } catch (error) {
        if (backup) await rename(backup, item.target.path);
        throw error;
      }
      installed.push({ ...item.target, backup });
    }
  } catch (error) {
    await rollback(installed);
    throw error;
  } finally {
    await Promise.all(staged.map((item) => rm(item.temporaryPath, { recursive: true, force: true })));
  }

  const result = {
    ok: true,
    dryRun: false,
    package: packageJson.name,
    version: packageJson.version,
    targets: installed,
  };
  emit(parsed.json, result, formatInstallResult(result));
}

function parseArguments(arguments_) {
  const options = {
    command: "install",
    agent: "codex",
    scope: "user",
    cwd: process.cwd(),
    dryRun: false,
    force: false,
    json: false,
  };
  const args = [...arguments_];
  if (args[0] && !args[0].startsWith("-")) options.command = args.shift();

  while (args.length) {
    const argument = args.shift();
    if (argument === "--help" || argument === "-h") options.command = "help";
    else if (argument === "--version" || argument === "-v") options.command = "version";
    else if (argument === "--dry-run") options.dryRun = true;
    else if (argument === "--force") options.force = true;
    else if (argument === "--json") options.json = true;
    else if (argument === "--agent") options.agent = requireValue(argument, args.shift());
    else if (argument === "--scope") options.scope = requireValue(argument, args.shift());
    else if (argument === "--cwd") options.cwd = resolve(requireValue(argument, args.shift()));
    else throw new Error(`Unknown option: ${argument}`);
  }

  if (!supportedAgents.has(options.agent)) throw new Error(`--agent must be codex, claude, or both; received ${options.agent}`);
  if (!supportedScopes.has(options.scope)) throw new Error(`--scope must be user or project; received ${options.scope}`);
  return options;
}

function requireValue(option, value) {
  if (!value || value.startsWith("-")) throw new Error(`${option} requires a value`);
  return value;
}

function resolveTargets(agent, scope, cwd) {
  const agents = agent === "both" ? ["codex", "claude"] : [agent];
  return agents.map((name) => ({ name, path: targetPath(name, scope, cwd) }));
}

function targetPath(agent, scope, cwd) {
  if (scope === "project") {
    return agent === "codex"
      ? join(cwd, "skills", "animflow-authoring")
      : join(cwd, ".claude", "skills", "animflow-authoring");
  }
  if (agent === "codex") {
    const codexHome = process.env.CODEX_HOME ? resolve(process.env.CODEX_HOME) : join(homedir(), ".codex");
    return join(codexHome, "skills", "animflow-authoring");
  }
  return join(homedir(), ".claude", "skills", "animflow-authoring");
}

async function stageTargets(targets) {
  const staged = [];
  try {
    for (const target of targets) {
      const parent = dirname(target.path);
      const temporaryPath = join(parent, `.${basename(target.path)}.tmp-${process.pid}-${randomUUID()}`);
      await mkdir(parent, { recursive: true });
      staged.push({ target, temporaryPath });
      await cp(payloadDirectory, temporaryPath, { recursive: true, errorOnExist: true, force: false });
    }
    return staged;
  } catch (error) {
    await Promise.all(staged.map((item) => rm(item.temporaryPath, { recursive: true, force: true })));
    throw error;
  }
}

async function rollback(installed) {
  for (const item of [...installed].reverse()) {
    await rm(item.path, { recursive: true, force: true });
    if (item.backup) await rename(item.backup, item.path);
  }
}

async function assertPayload() {
  if (!(await exists(join(payloadDirectory, "SKILL.md")))) {
    throw new Error("Packaged skill payload is missing. Reinstall the package or run its build before using the installer.");
  }
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function emit(json, result, text) {
  process.stdout.write(json ? `${JSON.stringify(result)}\n` : `${text}\n`);
}

function formatInstallResult(result) {
  const verb = result.dryRun ? "Would install" : "Installed";
  const lines = [`${verb} ${result.package}@${result.version}:`];
  for (const target of result.targets) {
    lines.push(`- ${target.name}: ${target.path}`);
    if (target.backup) lines.push(`  backup: ${target.backup}`);
  }
  if (!result.dryRun) lines.push("Restart the agent so it discovers the skill.");
  return lines.join("\n");
}

function timestamp() {
  return new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

function usage() {
  return `AnimFlow Authoring Skill ${packageJson.version}

Usage:
  animflow-skill install [options]
  animflow-skill path [--json]
  animflow-skill --version

Install options:
  --agent codex|claude|both   Agent host to install for (default: codex)
  --scope user|project       Install for the user or current project (default: user)
  --cwd <directory>          Project root used with --scope project
  --dry-run                  Print targets without writing
  --force                    Back up and replace an existing target
  --json                     Emit machine-readable output
`;
}
