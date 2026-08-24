import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import {
  ANIMFLOW_CLI_LIMITS,
  CLI_EXIT,
  createNodeCliIo,
  runCli,
  type CliIo,
  type CliReport,
} from "../src/index.js";

const validSource = `animflow 2.1

canvas {
  size 1280 by 720
  theme light
  background surface
}

graph checkout {
  layout flow right {
    nodeGap 48
    rankGap 80
    routing orthogonal
  }
  node client "Client" {
    shape rounded
    tone neutral
  }
  node api "API" {
    shape rectangle
    tone primary
  }
  edge request: client.e -> api.w {
    label "request"
    line solid 2
    arrow end
    tone primary
    routing orthogonal
  }
}

story main {
  initial {
    show checkout.*
    camera fit(checkout) padding 40
  }
  scene requestScene "Request" duration 1s {
    action traceRequest: draw request via trace
    action focusApi: highlight api tone accent
    say "Send the request."
  }
}
`;

let directory: string;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "animflow-cli-"));
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe("AnimFlow CLI contract", () => {
  test("returns version and capabilities in a stable JSON envelope", async () => {
    const version = await invoke(["version", "--json"]);
    expect(version.exitCode).toBe(CLI_EXIT.success);
    expect(version.stderr).toBe("");
    const report = jsonReport(version.stdout);
    expect(report).toMatchObject({
      schemaVersion: 1,
      command: "version",
      ok: true,
      diagnostics: [],
      data: { cliVersion: "0.1.0", languageVersion: "2.2", compilerVersion: "0.1.0" },
    });

    const capabilities = jsonReport((await invoke(["capabilities", "--json"])).stdout);
    expect(capabilities.data).toMatchObject({
      sourceVersions: ["2", "2.1", "2.2"],
      diagramKinds: ["flowchart"],
      limits: ANIMFLOW_CLI_LIMITS,
    });
  });

  test("validates files and stdin without contaminating JSON stdout", async () => {
    const path = await fixture("lesson.animflow", validSource);
    const file = await invoke(["validate", path, "--json"]);
    expect(file.exitCode).toBe(0);
    expect(jsonReport(file.stdout).data).toEqual({ valid: true, sourceVersion: "2.1" });
    expect(file.stdout.trim().split("\n")).toHaveLength(1);

    const stdin = await invoke(["validate", "-", "--json"], validSource);
    expect(stdin.exitCode).toBe(0);
    expect(jsonReport(stdin.stdout).ok).toBe(true);

    const invalidPath = await fixture("invalid.animflow", "animflow 2 canvas {");
    const invalid = await invoke(["validate", invalidPath, "--json"]);
    expect(invalid.exitCode).toBe(CLI_EXIT.commandFailure);
    const invalidReport = jsonReport(invalid.stdout);
    expect(invalidReport).toMatchObject({ ok: false, data: null });
    expect(invalidReport.diagnostics[0]?.code).toBe("AF101");
  });

  test("formats in check, stdout, out, and in-place modes", async () => {
    const path = await fixture("lesson.animflow", validSource.replace("  size", "    size"));
    const check = await invoke(["format", path, "--check", "--json"]);
    expect(check.exitCode).toBe(CLI_EXIT.commandFailure);
    expect(jsonReport(check.stdout)).toMatchObject({
      ok: false,
      data: null,
      diagnostics: [{ code: "AFCLI006_FORMAT_REQUIRED" }],
    });

    const printed = await invoke(["format", path]);
    expect(printed.exitCode).toBe(0);
    expect(printed.stdout).toContain("  size 1280 by 720");

    const output = join(directory, "formatted.animflow");
    const written = await invoke(["format", path, "--out", output, "--json"]);
    expect(written.exitCode).toBe(0);
    expect(await readFile(output, "utf8")).toBe(printed.stdout);

    const conflict = await invoke(["format", path, "--out", output, "--json"]);
    expect(conflict.exitCode).toBe(CLI_EXIT.io);
    expect(jsonReport(conflict.stdout).diagnostics[0]?.code).toBe("AFCLI002_IO");

    const forced = await invoke(["format", path, "--out", output, "--force", "--json"]);
    expect(forced.exitCode).toBe(0);
    const inPlace = await invoke(["format", path, "--write", "--json"]);
    expect(inPlace.exitCode).toBe(0);
    expect(await readFile(path, "utf8")).toBe(printed.stdout);
    expect((await readdir(directory)).some((name) => name.endsWith(".tmp"))).toBe(false);
  });

  test("compiles a byte-stable artifact and reports its SHA-256", async () => {
    const path = await fixture("lesson.animflow", validSource);
    const output = join(directory, "lesson.render-plan.json");
    const result = await invoke(["compile", path, "--out", output, "--json"]);
    expect(result.exitCode).toBe(0);
    const artifact = await readFile(output, "utf8");
    const report = jsonReport(result.stdout);
    expect(report.data).toMatchObject({
      summary: { storyIds: ["main"], sceneCount: 1, actionCount: 2, durationMs: 1000 },
      artifactPath: output,
      artifactHash: createHash("sha256").update(artifact).digest("hex"),
    });
    expect(JSON.parse(artifact)).toMatchObject({ version: 2, storyId: "main" });

    const summaryOnly = jsonReport((await invoke(["compile", path, "--json"])).stdout);
    expect(summaryOnly.data).not.toHaveProperty("artifactPath");
  });

  test("migrates v2 to v2.1 and imports the supported Mermaid subset", async () => {
    const v2 = validSource
      .replace("animflow 2.1", "animflow 2")
      .replace("action traceRequest: ", "")
      .replace("action focusApi: ", "");
    const v2Path = await fixture("v2.animflow", v2);
    const migrated = await invoke(["migrate", v2Path, "--to", "2.1", "--json"]);
    expect(migrated.exitCode).toBe(0);
    const migratedReport = jsonReport(migrated.stdout);
    expect(migratedReport.data).toMatchObject({ sourceVersion: "2.1" });
    expect((migratedReport.data as { generatedSource: string }).generatedSource).toContain("action requestScene_action001:");

    const mermaidPath = await fixture("diagram.mmd", "flowchart LR\nA[Client] -->|request| B(API)\n");
    const importedPath = join(directory, "imported.animflow");
    const imported = await invoke([
      "import-mermaid",
      mermaidPath,
      "--out",
      importedPath,
      "--json",
    ]);
    expect(imported.exitCode).toBe(0);
    expect(jsonReport(imported.stdout).data).toMatchObject({
      sourceVersion: "2.1",
      outputPath: importedPath,
      unsupportedFeatures: [],
    });
    expect(await readFile(importedPath, "utf8")).toContain('label "request"');
  });

  test("uses fixed exit codes for capability, usage, I/O, and resource failures", async () => {
    const unsupported = await fixture("unsupported.mmd", "sequenceDiagram\nA->>B: hi\n");
    const capability = await invoke(["import-mermaid", unsupported, "--json"]);
    expect(capability.exitCode).toBe(CLI_EXIT.incompatible);
    expect(jsonReport(capability.stdout).diagnostics[0]?.code).toBe("AFCLI004_CAPABILITY_MISMATCH");

    const mismatch = await fixture("lesson.animflow", validSource);
    const version = await invoke(["migrate", mismatch, "--from", "2", "--to", "2.1", "--json"]);
    expect(version.exitCode).toBe(CLI_EXIT.incompatible);
    expect(jsonReport(version.stdout).diagnostics[0]?.code).toBe("AFCLI003_VERSION_MISMATCH");

    const usageCases = [
      ["format", "-", "--write", "--json"],
      ["format", mismatch, "--check", "--out", "x", "--json"],
      ["validate", mismatch, "--force", "--json"],
      ["compile", mismatch, "--write", "--json"],
      ["version", mismatch, "--json"],
      ["unknown", "--json"],
      ["validate", mismatch, "extra", "--json"],
      ["validate", mismatch, "--wat", "--json"],
    ];
    for (const args of usageCases) {
      const usage = await invoke(args);
      expect(usage.exitCode).toBe(CLI_EXIT.usage);
      expect(jsonReport(usage.stdout).diagnostics[0]?.code).toBe("AFCLI001_USAGE");
    }

    const missing = await invoke(["validate", join(directory, "missing.animflow"), "--json"]);
    expect(missing.exitCode).toBe(CLI_EXIT.io);
    const oversized = await invoke(["validate", "-", "--json"], "x".repeat(ANIMFLOW_CLI_LIMITS.maxSourceBytes + 1));
    expect(oversized.exitCode).toBe(CLI_EXIT.resourceLimit);
    expect(jsonReport(oversized.stdout).diagnostics[0]?.code).toBe("AFCLI005_RESOURCE_LIMIT");
  });

  test("keeps human diagnostics on stdout and stderr reserved for logs", async () => {
    const missing = await invoke(["validate", join(directory, "missing.animflow")]);
    expect(missing.stdout).toContain("ERROR AFCLI002_IO");
    expect(missing.stderr).toBe("");
  });

  test("runs as a real Node bin and ships a parseable report schema", async () => {
    const bin = fileURLToPath(new URL("../dist/bin.js", import.meta.url));
    const version = spawnSync(process.execPath, [bin, "version", "--json"], {
      encoding: "utf8",
    });
    expect(version.status).toBe(0);
    expect(version.stderr).toBe("");
    expect(jsonReport(version.stdout)).toMatchObject({ command: "version", ok: true });

    const usage = spawnSync(process.execPath, [bin, "version", "--wat", "--json"], {
      encoding: "utf8",
    });
    expect(usage.status).toBe(CLI_EXIT.usage);
    expect(usage.stderr).toBe("");
    expect(jsonReport(usage.stdout)).toMatchObject({ ok: false, data: null });

    const schemaPath = fileURLToPath(new URL("../schema/report.schema.json", import.meta.url));
    const schema = JSON.parse(await readFile(schemaPath, "utf8")) as Record<string, unknown>;
    expect(schema).toMatchObject({
      $id: "https://animflow.dev/schemas/cli-report-v1.json",
      additionalProperties: false,
    });
  });
});

async function fixture(name: string, source: string): Promise<string> {
  const path = join(directory, name);
  await writeFile(path, source, "utf8");
  return path;
}

async function invoke(args: readonly string[], stdin = ""): Promise<{
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}> {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const node = createNodeCliIo();
  const io: CliIo = {
    ...node,
    readStdin: async () => stdin,
    writeStdout: (content) => stdout.push(content),
    writeStderr: (content) => stderr.push(content),
  };
  const exitCode = await runCli(args, io);
  return { exitCode, stdout: stdout.join(""), stderr: stderr.join("") };
}

function jsonReport(source: string): CliReport<Record<string, unknown>> {
  return JSON.parse(source) as CliReport<Record<string, unknown>>;
}
