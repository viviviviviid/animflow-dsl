import { createHash, randomUUID } from "node:crypto";
import { link, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

import { ANIMFLOW_COMPILER_VERSION, compileAnimFlow } from "@animflow-dsl/compiler";
import {
  formatAnimFlow,
  isActionStatement,
  isSayStatement,
  isSequenceStatement,
  isStaggerStatement,
  parseAnimFlow,
  releaseAnimFlowDocument,
  type SceneAction,
  type SceneStatement,
} from "@animflow-dsl/language";
import {
  importMermaidFlowchart,
  MERMAID_FLOWCHART_SUPPORT,
  migrateV1ToV2,
  migrateV2ToV21,
} from "@animflow-dsl/migrate";
import {
  ANIMFLOW_SOURCE_VERSIONS,
  ZERO_RANGE,
  type AnimFlowSourceVersion,
  type Diagnostic,
  type RenderPlan,
  type SourceRange,
} from "@animflow-dsl/model";

export const ANIMFLOW_CLI_VERSION = "0.1.0" as const;
export const ANIMFLOW_CLI_SCHEMA_VERSION = 1 as const;
export const ANIMFLOW_CLI_LIMITS = Object.freeze({
  maxSourceBytes: 256 * 1_024,
  maxNodes: 100,
  maxEdges: 150,
  maxScenes: 30,
  maxActions: 600,
  maxActionNesting: 32,
  compileTimeoutMs: 2_000,
});

export const CLI_EXIT = Object.freeze({
  success: 0,
  commandFailure: 1,
  usage: 2,
  io: 3,
  incompatible: 4,
  resourceLimit: 5,
} as const);

export const CLI_DIAGNOSTIC_CODES = Object.freeze({
  usage: "AFCLI001_USAGE",
  io: "AFCLI002_IO",
  versionMismatch: "AFCLI003_VERSION_MISMATCH",
  capabilityMismatch: "AFCLI004_CAPABILITY_MISMATCH",
  resourceLimit: "AFCLI005_RESOURCE_LIMIT",
  formatRequired: "AFCLI006_FORMAT_REQUIRED",
} as const);

export interface CliDiagnostic {
  readonly code: string;
  readonly severity: "error" | "warning";
  readonly message: string;
  readonly range: SourceRange;
  readonly related?: Diagnostic["related"];
  readonly fixes?: Diagnostic["fixes"];
}

export interface CliReport<Data = unknown> {
  readonly schemaVersion: 1;
  readonly command: string;
  readonly ok: boolean;
  readonly data: Data | null;
  readonly diagnostics: readonly CliDiagnostic[];
}

export interface CliIo {
  readFile(path: string): Promise<string>;
  readStdin(): Promise<string>;
  writeFileAtomic(path: string, content: string, force: boolean): Promise<void>;
  writeStdout(content: string): void;
  writeStderr(content: string): void;
}

interface ParsedInvocation {
  readonly command: string;
  readonly input?: string;
  readonly flags: ReadonlySet<string>;
  readonly json: boolean;
  readonly out?: string;
  readonly force: boolean;
  readonly check: boolean;
  readonly write: boolean;
  readonly from?: string;
  readonly to?: string;
}

interface CommandResult {
  readonly exitCode: number;
  readonly data: unknown | null;
  readonly diagnostics: readonly CliDiagnostic[];
  readonly human: string;
}

export function createNodeCliIo(): CliIo {
  return {
    readFile: (path) => readFile(path, "utf8"),
    readStdin: readAllStdin,
    writeFileAtomic: atomicWrite,
    writeStdout: (content) => process.stdout.write(content),
    writeStderr: (content) => process.stderr.write(content),
  };
}

export async function runCli(args: readonly string[], io: CliIo): Promise<number> {
  const parsed = parseInvocation(args);
  if (!parsed.ok) {
    emit(io, parsed.command, parsed.json, failureResult(CLI_EXIT.usage, parsed.diagnostic));
    return CLI_EXIT.usage;
  }

  let result: CommandResult;
  try {
    result = await dispatch(parsed.value, io);
  } catch (error) {
    const diagnostic = cliDiagnostic(
      CLI_DIAGNOSTIC_CODES.io,
      error instanceof Error ? error.message : String(error),
    );
    result = failureResult(CLI_EXIT.io, diagnostic);
  }
  emit(io, parsed.value.command, parsed.value.json, result);
  return result.exitCode;
}

async function dispatch(invocation: ParsedInvocation, io: CliIo): Promise<CommandResult> {
  const usage = validateInvocation(invocation);
  if (usage) return failureResult(CLI_EXIT.usage, usage);

  if (invocation.command === "version") {
    const data = {
      cliVersion: ANIMFLOW_CLI_VERSION,
      languageVersion: ANIMFLOW_SOURCE_VERSIONS.at(-1),
      compilerVersion: ANIMFLOW_COMPILER_VERSION,
    };
    return successResult(data, `animflow ${data.cliVersion} (language ${data.languageVersion}, compiler ${data.compilerVersion})\n`);
  }
  if (invocation.command === "capabilities") {
    const data = {
      sourceVersions: ANIMFLOW_SOURCE_VERSIONS,
      diagramKinds: ["flowchart"],
      actions: ["show", "hide", "draw", "highlight", "clearHighlight", "camera", "sequence", "stagger", "say"],
      limits: ANIMFLOW_CLI_LIMITS,
      mermaid: MERMAID_FLOWCHART_SUPPORT,
    };
    return successResult(data, `${JSON.stringify(data, null, 2)}\n`);
  }

  const sourceResult = await readSource(invocation.input!, io);
  if (!sourceResult.ok) return sourceResult.result;
  const source = sourceResult.source;
  const byteLimit = checkSourceBytes(source);
  if (byteLimit) return failureResult(CLI_EXIT.resourceLimit, byteLimit);

  if (invocation.command === "validate") return validateCommand(source);
  if (invocation.command === "format") return formatCommand(source, invocation, io);
  if (invocation.command === "compile") return compileCommand(source, invocation, io);
  if (invocation.command === "migrate") return migrateCommand(source, invocation, io);
  if (invocation.command === "import-mermaid") return importMermaidCommand(source, invocation, io);
  return failureResult(CLI_EXIT.usage, cliDiagnostic(CLI_DIAGNOSTIC_CODES.usage, `Unknown command: ${invocation.command}.`));
}

async function validateCommand(source: string): Promise<CommandResult> {
  const parsed = await parseAnimFlow(source);
  if (!parsed.ok) return modelFailure(parsed.diagnostics);
  const sourceVersion = parsed.value.version;
  await releaseAnimFlowDocument(parsed.value);
  return successResult(
    { valid: true, sourceVersion },
    `Valid AnimFlow ${sourceVersion}.\n`,
    parsed.diagnostics,
  );
}

async function formatCommand(
  source: string,
  invocation: ParsedInvocation,
  io: CliIo,
): Promise<CommandResult> {
  const formatted = await formatAnimFlow(source);
  if (!formatted.ok) return modelFailure(formatted.diagnostics);
  if (invocation.check) {
    const data = { changed: formatted.value.changed };
    return formatted.value.changed
      ? failureResult(
          CLI_EXIT.commandFailure,
          cliDiagnostic(CLI_DIAGNOSTIC_CODES.formatRequired, "Formatting changes are required."),
        )
      : successResult(data, "Source is formatted.\n", formatted.diagnostics);
  }

  const outputPath = invocation.write ? invocation.input : invocation.out;
  if (outputPath) {
    await io.writeFileAtomic(outputPath, formatted.value.source, invocation.write || invocation.force);
    return successResult(
      { changed: formatted.value.changed, outputPath },
      `Formatted ${outputPath}.\n`,
      formatted.diagnostics,
    );
  }
  return successResult(
    { changed: formatted.value.changed, formattedSource: formatted.value.source },
    formatted.value.source,
    formatted.diagnostics,
  );
}

async function compileCommand(
  source: string,
  invocation: ParsedInvocation,
  io: CliIo,
): Promise<CommandResult> {
  const startedAt = performance.now();
  const compiled = await compileAnimFlow(source);
  const elapsedMs = performance.now() - startedAt;
  if (elapsedMs > ANIMFLOW_CLI_LIMITS.compileTimeoutMs) {
    return failureResult(
      CLI_EXIT.resourceLimit,
      cliDiagnostic(
        CLI_DIAGNOSTIC_CODES.resourceLimit,
        `Compile took ${Math.round(elapsedMs)}ms; the CLI limit is ${ANIMFLOW_CLI_LIMITS.compileTimeoutMs}ms.`,
      ),
    );
  }
  if (!compiled.ok) return modelFailure(compiled.diagnostics);
  const actionStats = await sourceActionStats(source);
  if (!actionStats.ok) return modelFailure(actionStats.diagnostics);
  const semanticLimit = checkPlanLimits(compiled.value, actionStats.actions, actionStats.actionNesting);
  if (semanticLimit) return failureResult(CLI_EXIT.resourceLimit, semanticLimit);

  const artifact = `${JSON.stringify(compiled.value, null, 2)}\n`;
  const artifactHash = createHash("sha256").update(artifact).digest("hex");
  if (invocation.out) await io.writeFileAtomic(invocation.out, artifact, invocation.force);
  const summary = {
    storyIds: [compiled.value.storyId],
    sceneCount: compiled.value.scenes.length,
    actionCount: actionStats.actions,
    durationMs: compiled.value.durationMs,
  };
  const data = {
    summary,
    ...(invocation.out ? { artifactPath: invocation.out, artifactHash } : {}),
  };
  return successResult(
    data,
    `Compiled ${summary.storyIds.join(", ")}: ${summary.sceneCount} scene(s), ${summary.actionCount} action(s), ${summary.durationMs}ms.\n`,
    compiled.diagnostics,
  );
}

async function migrateCommand(
  source: string,
  invocation: ParsedInvocation,
  io: CliIo,
): Promise<CommandResult> {
  if (invocation.to !== "2.1") {
    return capabilityFailure(`Migration target ${invocation.to ?? "(missing)"} is not supported; use --to 2.1.`);
  }
  const detected = detectSourceVersion(source);
  if (invocation.from && invocation.from !== detected) {
    return failureResult(
      CLI_EXIT.incompatible,
      cliDiagnostic(
        CLI_DIAGNOSTIC_CODES.versionMismatch,
        `--from ${invocation.from} does not match detected source version ${detected}.`,
      ),
    );
  }

  let generatedSource: string;
  let generatedIds: readonly string[] = [];
  let diagnostics: readonly CliDiagnostic[] = [];
  if (detected === "2.1") {
    generatedSource = source;
  } else if (detected === "2") {
    const migrated = await migrateV2ToV21(source);
    if (!migrated.ok) return modelFailure(migrated.diagnostics);
    generatedSource = migrated.value.source;
    generatedIds = migrated.value.generatedIds;
    diagnostics = migrated.diagnostics;
  } else {
    const v2 = await migrateV1ToV2(source);
    if (!v2.ok) return modelFailure(v2.diagnostics);
    const v21 = await migrateV2ToV21(v2.value.source);
    if (!v21.ok) return modelFailure(v21.diagnostics);
    generatedSource = v21.value.source;
    generatedIds = v21.value.generatedIds;
    diagnostics = [...v2.diagnostics, ...v21.diagnostics];
  }
  return writeGeneratedSource(
    generatedSource,
    { sourceVersion: "2.1", generatedIds, unsupportedFeatures: [] },
    diagnostics,
    invocation,
    io,
  );
}

async function importMermaidCommand(
  source: string,
  invocation: ParsedInvocation,
  io: CliIo,
): Promise<CommandResult> {
  const imported = await importMermaidFlowchart(source);
  if (!imported.ok) {
    const unsupported = imported.diagnostics.some(
      (item) => item.code === "AF630",
    );
    if (unsupported) {
      return {
        ...capabilityFailure("The Mermaid input uses features outside the supported flowchart subset."),
        diagnostics: [
          cliDiagnostic(
            CLI_DIAGNOSTIC_CODES.capabilityMismatch,
            "The Mermaid input uses features outside the supported flowchart subset.",
          ),
          ...imported.diagnostics,
        ],
      };
    }
    return modelFailure(imported.diagnostics);
  }
  return writeGeneratedSource(
    imported.value.source,
    {
      sourceVersion: imported.value.sourceVersion,
      generatedIds: imported.value.generatedIds,
      unsupportedFeatures: imported.value.unsupportedFeatures,
    },
    imported.diagnostics,
    invocation,
    io,
  );
}

async function writeGeneratedSource(
  source: string,
  data: { readonly sourceVersion: "2.1"; readonly generatedIds: readonly string[]; readonly unsupportedFeatures: readonly string[] },
  diagnostics: readonly CliDiagnostic[],
  invocation: ParsedInvocation,
  io: CliIo,
): Promise<CommandResult> {
  if (invocation.out) {
    await io.writeFileAtomic(invocation.out, source, invocation.force);
    return successResult({ ...data, outputPath: invocation.out }, `Wrote ${invocation.out}.\n`, diagnostics);
  }
  return successResult({ ...data, generatedSource: source }, source, diagnostics);
}

function validateInvocation(invocation: ParsedInvocation): CliDiagnostic | undefined {
  const commands = new Set(["validate", "format", "compile", "migrate", "import-mermaid", "version", "capabilities"]);
  if (!commands.has(invocation.command)) {
    return cliDiagnostic(CLI_DIAGNOSTIC_CODES.usage, `Unknown command: ${invocation.command || "(missing)"}.`);
  }
  const noInput = invocation.command === "version" || invocation.command === "capabilities";
  if (noInput && invocation.input) {
    return cliDiagnostic(CLI_DIAGNOSTIC_CODES.usage, `${invocation.command} does not accept an input file.`);
  }
  if (!noInput && !invocation.input) {
    return cliDiagnostic(CLI_DIAGNOSTIC_CODES.usage, `${invocation.command} requires one input file or - for stdin.`);
  }
  if (invocation.force && !invocation.out) {
    return cliDiagnostic(CLI_DIAGNOSTIC_CODES.usage, "--force is valid only with --out.");
  }
  if (invocation.command === "format") {
    const modes = [invocation.check, invocation.write, Boolean(invocation.out)].filter(Boolean).length;
    if (modes > 1) return cliDiagnostic(CLI_DIAGNOSTIC_CODES.usage, "--check, --write, and --out are mutually exclusive.");
    if (invocation.write && invocation.input === "-") {
      return cliDiagnostic(CLI_DIAGNOSTIC_CODES.usage, "format --write cannot be used with stdin.");
    }
  } else if (invocation.check || invocation.write) {
    return cliDiagnostic(CLI_DIAGNOSTIC_CODES.usage, "--check and --write are valid only for format.");
  }
  if (!["format", "compile", "migrate", "import-mermaid"].includes(invocation.command) && invocation.out) {
    return cliDiagnostic(CLI_DIAGNOSTIC_CODES.usage, `--out is not valid for ${invocation.command}.`);
  }
  if (invocation.command !== "migrate" && (invocation.from || invocation.to)) {
    return cliDiagnostic(CLI_DIAGNOSTIC_CODES.usage, "--from and --to are valid only for migrate.");
  }
  return undefined;
}

function parseInvocation(args: readonly string[]):
  | { readonly ok: true; readonly value: ParsedInvocation }
  | { readonly ok: false; readonly command: string; readonly json: boolean; readonly diagnostic: CliDiagnostic } {
  const command = args[0] ?? "";
  const flags = new Set<string>();
  const positionals: string[] = [];
  const values: Record<string, string> = {};
  let json = false;
  let force = false;
  let check = false;
  let write = false;

  for (let index = 1; index < args.length; index += 1) {
    const argument = args[index]!;
    if (!argument.startsWith("--")) {
      positionals.push(argument);
      continue;
    }
    const name = argument.slice(2);
    if (!["json", "force", "check", "write", "out", "from", "to"].includes(name)) {
      return parseFailure(command, args.includes("--json"), `Unknown option: ${argument}.`);
    }
    if (flags.has(name)) return parseFailure(command, args.includes("--json"), `Duplicate option: ${argument}.`);
    flags.add(name);
    if (["out", "from", "to"].includes(name)) {
      const value = args[++index];
      if (!value || value.startsWith("--")) return parseFailure(command, args.includes("--json"), `${argument} requires a value.`);
      values[name] = value;
    } else if (name === "json") json = true;
    else if (name === "force") force = true;
    else if (name === "check") check = true;
    else if (name === "write") write = true;
  }
  if (positionals.length > 1) return parseFailure(command, json, "Only one input file is allowed.");
  return {
    ok: true,
    value: {
      command,
      input: positionals[0],
      flags,
      json,
      out: values.out,
      force,
      check,
      write,
      from: values.from,
      to: values.to,
    },
  };
}

function parseFailure(command: string, json: boolean, message: string) {
  return {
    ok: false as const,
    command,
    json,
    diagnostic: cliDiagnostic(CLI_DIAGNOSTIC_CODES.usage, message),
  };
}

async function readSource(
  input: string,
  io: CliIo,
): Promise<{ readonly ok: true; readonly source: string } | { readonly ok: false; readonly result: CommandResult }> {
  try {
    return { ok: true, source: input === "-" ? await io.readStdin() : await io.readFile(input) };
  } catch (error) {
    return {
      ok: false,
      result: failureResult(
        CLI_EXIT.io,
        cliDiagnostic(CLI_DIAGNOSTIC_CODES.io, error instanceof Error ? error.message : String(error)),
      ),
    };
  }
}

function detectSourceVersion(source: string): "1" | AnimFlowSourceVersion {
  const match = /^\s*animflow\s+(2(?:\.1)?)\b/.exec(source);
  return match?.[1] === "2.1" ? "2.1" : match?.[1] === "2" ? "2" : "1";
}

function checkSourceBytes(source: string): CliDiagnostic | undefined {
  const bytes = Buffer.byteLength(source);
  return bytes > ANIMFLOW_CLI_LIMITS.maxSourceBytes
    ? cliDiagnostic(
        CLI_DIAGNOSTIC_CODES.resourceLimit,
        `Source is ${bytes} bytes; the CLI limit is ${ANIMFLOW_CLI_LIMITS.maxSourceBytes} bytes.`,
      )
    : undefined;
}

function checkPlanLimits(
  plan: RenderPlan,
  actionCount: number,
  actionNesting: number,
): CliDiagnostic | undefined {
  const checks = [
    ["nodes", plan.elements.filter((element) => element.kind === "node").length, ANIMFLOW_CLI_LIMITS.maxNodes],
    ["edges", plan.elements.filter((element) => element.kind === "edge").length, ANIMFLOW_CLI_LIMITS.maxEdges],
    ["scenes", plan.scenes.length, ANIMFLOW_CLI_LIMITS.maxScenes],
    ["actions", actionCount, ANIMFLOW_CLI_LIMITS.maxActions],
    ["action nesting", actionNesting, ANIMFLOW_CLI_LIMITS.maxActionNesting],
  ] as const;
  const exceeded = checks.find(([, actual, limit]) => actual > limit);
  return exceeded
    ? cliDiagnostic(
        CLI_DIAGNOSTIC_CODES.resourceLimit,
        `Document has ${exceeded[1]} ${exceeded[0]}; the CLI limit is ${exceeded[2]}.`,
      )
    : undefined;
}

async function sourceActionStats(source: string): Promise<
  | { readonly ok: true; readonly actions: number; readonly actionNesting: number }
  | { readonly ok: false; readonly diagnostics: readonly [Diagnostic, ...Diagnostic[]] }
> {
  const parsed = await parseAnimFlow(source);
  if (!parsed.ok) return parsed;
  let actions = 0;
  let actionNesting = 0;
  const pending = parsed.value.story.scenes.flatMap((scene) =>
    scene.statements.map((statement) => ({ statement, depth: 1 })),
  );
  while (pending.length > 0) {
    const current = pending.pop()!;
    if (isSayStatement(current.statement)) continue;
    actions += 1;
    actionNesting = Math.max(actionNesting, current.depth);
    const action: SceneAction = isActionStatement(current.statement)
      ? current.statement.body
      : current.statement as SceneAction;
    if (isSequenceStatement(action) || isStaggerStatement(action)) {
      for (const statement of action.statements) {
        pending.push({ statement: statement as SceneStatement, depth: current.depth + 1 });
      }
    }
  }
  await releaseAnimFlowDocument(parsed.value);
  return { ok: true, actions, actionNesting };
}

function modelFailure(diagnostics: readonly Diagnostic[]): CommandResult {
  return {
    exitCode: CLI_EXIT.commandFailure,
    data: null,
    diagnostics,
    human: humanDiagnostics(diagnostics),
  };
}

function capabilityFailure(message: string): CommandResult {
  return failureResult(
    CLI_EXIT.incompatible,
    cliDiagnostic(CLI_DIAGNOSTIC_CODES.capabilityMismatch, message),
  );
}

function successResult(
  data: unknown,
  human: string,
  diagnostics: readonly CliDiagnostic[] = [],
): CommandResult {
  return { exitCode: CLI_EXIT.success, data, diagnostics, human };
}

function failureResult(exitCode: number, diagnostic: CliDiagnostic): CommandResult {
  return { exitCode, data: null, diagnostics: [diagnostic], human: humanDiagnostics([diagnostic]) };
}

function cliDiagnostic(code: string, message: string): CliDiagnostic {
  return { code, severity: "error", message, range: ZERO_RANGE };
}

function humanDiagnostics(diagnostics: readonly CliDiagnostic[]): string {
  return diagnostics.map((item) => `${item.severity.toUpperCase()} ${item.code} ${item.range.start.line + 1}:${item.range.start.character + 1} ${item.message}\n`).join("");
}

function emit(io: CliIo, command: string, json: boolean, result: CommandResult): void {
  if (json) {
    const report: CliReport = {
      schemaVersion: ANIMFLOW_CLI_SCHEMA_VERSION,
      command,
      ok: result.exitCode === CLI_EXIT.success,
      data: result.data,
      diagnostics: result.diagnostics,
    };
    io.writeStdout(`${JSON.stringify(report)}\n`);
    return;
  }
  io.writeStdout(result.human);
}

async function readAllStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

async function atomicWrite(path: string, content: string, force: boolean): Promise<void> {
  const temporary = join(dirname(path), `.${basename(path)}.${process.pid}.${randomUUID()}.tmp`);
  await writeFile(temporary, content, { encoding: "utf8", flag: "wx" });
  try {
    if (force) {
      await rename(temporary, path);
    } else {
      await link(temporary, path);
      await unlink(temporary);
    }
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
}
