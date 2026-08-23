import { parseAnimFlow, releaseAnimFlowDocument } from "@animflow-dsl/language";
import {
  ANIMFLOW_DIAGNOSTIC_CODES,
  ZERO_RANGE,
  type Diagnostic,
  type DiagnosticCode,
  type Result,
  type SourceRange,
} from "@animflow-dsl/model";
import {
  parseDsl,
  type AnimationProperties,
  type AnimationStep,
  type DiagramConfig,
  type DiagramData,
  type DiagramEdge,
  type DiagramNode,
  type NarrationItem,
} from "@animflow-dsl/react/core";

export interface MigrationManifest {
  readonly inputAnimationSteps: number;
  readonly outputScenes: number;
  readonly inputNarrations: number;
  readonly outputNarrations: number;
  readonly stepToScene: Readonly<Record<number, string>>;
}

export interface MigrationOutput {
  readonly source: string;
  readonly diagnostics: readonly Diagnostic[];
  readonly manifest: MigrationManifest;
  readonly hostConfig: DiagramConfig;
}

export interface MigrationOptions {
  readonly canvasWidth?: number;
  readonly canvasHeight?: number;
}

type LegacyProperties = AnimationProperties & Record<string, unknown>;

const RESERVED = new Set([
  "animflow", "canvas", "size", "by", "theme", "background", "graph", "layout",
  "flow", "right", "left", "down", "up", "nodeGap", "rankGap", "routing",
  "node", "edge", "overlay", "story", "initial", "scene", "duration", "show",
  "hide", "via", "draw", "highlight", "clearHighlight", "camera", "fit", "focus",
  "say", "sequence", "stagger", "fade", "pop", "flip", "slide", "from",
  "distance", "trace", "tone", "shape", "line", "label", "arrow", "text", "anchor",
  "width", "padding", "effect", "glow", "pulse", "particles", "dash", "wave", "lightning",
  "start", "end", "none", "both", "auto", "n", "e", "s", "w", "ms",
  "solid", "dashed", "dotted", "straight", "orthogonal", "curve", "rectangle", "rounded",
  "pill", "diamond", "circle", "database", "document", "parallelogram",
  "callout", "card", "badge", "from", "distance",
]);

export async function migrateV1ToV2(
  legacySource: string,
  options: MigrationOptions = {},
): Promise<Result<MigrationOutput>> {
  const parsed = parseDsl(legacySource);
  if (!parsed.success || !parsed.data) {
    const diagnostics = (parsed.errors ?? []).map((error) =>
      diagnostic(
        ANIMFLOW_DIAGNOSTIC_CODES.legacyParse,
        "error",
        error.message,
        rangeAtLine(legacySource, error.line, error.column),
      ),
    );
    return {
      ok: false,
      diagnostics:
        diagnostics.length > 0
          ? (diagnostics as [Diagnostic, ...Diagnostic[]])
          : [diagnostic(ANIMFLOW_DIAGNOSTIC_CODES.legacyParse, "error", "Legacy parser returned no diagram.")],
    };
  }

  const lowered = lowerLegacyData(parsed.data, legacySource, options);
  if (lowered.errors.length > 0) {
    return { ok: false, diagnostics: lowered.errors as [Diagnostic, ...Diagnostic[]] };
  }

  const validation = await parseAnimFlow(lowered.output.source);
  if (!validation.ok) {
    return {
      ok: false,
      diagnostics: [
        diagnostic(
          ANIMFLOW_DIAGNOSTIC_CODES.generatedMigrationInvalid,
          "error",
          `Generated v2 source failed validation: ${validation.diagnostics
            .map((item) => `${item.code} ${item.message}`)
            .join("; ")}`,
        ),
      ],
    };
  }
  await releaseAnimFlowDocument(validation.value);

  return { ok: true, value: lowered.output, diagnostics: lowered.output.diagnostics };
}

function lowerLegacyData(
  data: DiagramData,
  legacySource: string,
  options: MigrationOptions,
): { readonly output: MigrationOutput; readonly errors: Diagnostic[] } {
  const warnings: Diagnostic[] = [];
  const errors: Diagnostic[] = [];
  const identifiers = new IdentifierRegistry();
  const nodeIds = new Map<string, string>();
  for (const node of data.nodes) {
    const migrated = identifiers.allocate(node.id);
    nodeIds.set(node.id, migrated);
    if (migrated !== node.id) {
      warnings.push(
        diagnostic(
          ANIMFLOW_DIAGNOSTIC_CODES.legacyRenamedId,
          "warning",
          `Legacy node ID \"${node.id}\" was renamed to \"${migrated}\".`,
          rangeForNeedle(legacySource, node.id),
        ),
      );
    }
  }
  const edgeIds = new Map<string, string>();
  for (const edge of data.edges) edgeIds.set(edge.id, identifiers.allocate(edge.id));
  const graphName = identifiers.allocate("legacyGraph");
  const storyName = identifiers.allocate("mainStory");
  const stepToScene: Record<number, string> = {};
  for (const step of data.animations) {
    stepToScene[step.step] = identifiers.allocate(`step_${step.step}`);
  }

  const narrationByStep = new Map(data.narrations.map((item) => [item.step, item]));
  const outputNarrations = data.narrations.filter((item) =>
    data.animations.some((step) => step.step === item.step),
  ).length;
  for (const narration of data.narrations) {
    if (!stepToScene[narration.step]) {
      errors.push(
        diagnostic(
          ANIMFLOW_DIAGNOSTIC_CODES.orphanNarration,
          "error",
          `Narration step ${narration.step} has no animation step and cannot be attached to a scene.`,
          rangeForNeedle(legacySource, `step ${narration.step}:`),
        ),
      );
    }
  }

  if (data.nodes.some((node) => node.style && Object.keys(node.style).length > 0)) {
    warnings.push(
      diagnostic(
        ANIMFLOW_DIAGNOSTIC_CODES.legacyNormalizedStyle,
        "warning",
        "Legacy fill, stroke, and typography overrides were normalized into typed node tones.",
      ),
    );
  }

  const width = positive(options.canvasWidth, 1600);
  const height = positive(options.canvasHeight, 900);
  const background = toneForColor(data.config.background ?? "surface");
  const lines: string[] = [
    "animflow 2",
    "",
    "canvas {",
    `  size ${width} by ${height}`,
    "  theme legacy",
    `  background ${background}`,
    "}",
    "",
    `graph ${graphName} {`,
    `  layout flow ${direction(data.metadata.direction)} {`,
    "    nodeGap 48",
    "    rankGap 88",
    "    routing orthogonal",
    "  }",
    "",
  ];

  for (const node of data.nodes) {
    lines.push(...nodeSource(node, nodeIds.get(node.id)!, "  "), "");
  }
  for (const edge of data.edges) {
    lines.push(...edgeSource(edge, edgeIds, nodeIds, "  "), "");
  }
  lines.push("}", "", `story ${storyName} {`, "  initial {", `    hide ${graphName}.*`, `    camera fit(${graphName}) padding 48`, "  }", "");

  for (const step of data.animations) {
    const narration = narrationByStep.get(step.step);
    const properties = step.properties as LegacyProperties;
    const actionDuration = timeMs(properties.duration ?? (step.action === "connect" ? properties.speed : undefined), 1000);
    const stagger = timeMs(properties.stagger, 0);
    const targetCount = Math.max(1, step.targets.length);
    const totalDuration = actionDuration + stagger * Math.max(0, targetCount - 1);
    const title = narration?.title || stringProperty(properties.name) || `Step ${step.step}`;
    const statements = migrateStep(step, data, nodeIds, edgeIds, graphName, errors, legacySource);
    if (stagger > 0 && statements.length > 1 && step.action === "show") {
      statements.splice(0, statements.length, `stagger ${formatTime(stagger)} {`, ...statements.map((line) => `  ${line}`), "}");
    }
    lines.push(
      `  scene ${stepToScene[step.step]} ${quote(title)} duration ${formatTime(totalDuration)} {`,
      ...statements.map((statement) => `    ${statement}`),
    );
    if (narration) lines.push(`    say ${quote(narration.text)}`);
    lines.push("  }", "");
  }
  lines.push("}", "");

  const source = lines.join("\n");
  return {
    errors,
    output: {
      source,
      diagnostics: warnings,
      hostConfig: { ...data.config },
      manifest: {
        inputAnimationSteps: data.animations.length,
        outputScenes: data.animations.length,
        inputNarrations: data.narrations.length,
        outputNarrations,
        stepToScene,
      },
    },
  };
}

function migrateStep(
  step: AnimationStep,
  data: DiagramData,
  nodeIds: ReadonlyMap<string, string>,
  edgeIds: ReadonlyMap<string, string>,
  graphName: string,
  errors: Diagnostic[],
  source: string,
): string[] {
  const properties = step.properties as LegacyProperties;
  if (step.action === "show" || step.action === "hide") {
    const effects = String(properties.effect ?? (step.action === "show" ? "fadeIn" : "fadeOut"))
      .split(",")
      .map((value) => value.trim());
    return step.targets.flatMap((target, index) => {
      const id = nodeIds.get(target) ?? edgeIds.get(target);
      if (!id) {
        errors.push(unknownTarget(step, target, source));
        return [];
      }
      return [`${step.action} ${id} via ${visibilityTransition(effects[index] ?? effects[0]!)}`];
    });
  }

  if (step.action === "highlight") {
    const tone = toneForColor(String(properties.color ?? "accent"));
    const effect = properties.pulse === true ? " effect pulse" : properties.glow === true ? " effect glow" : "";
    return step.targets.flatMap((target) => {
      const id = nodeIds.get(target) ?? edgeIds.get(target);
      if (!id) {
        errors.push(unknownTarget(step, target, source));
        return [];
      }
      return [`highlight ${id} tone ${tone}${effect}`];
    });
  }

  if (step.action === "unhighlight") {
    return step.targets.flatMap((target) => {
      const id = nodeIds.get(target) ?? edgeIds.get(target);
      if (!id) {
        errors.push(unknownTarget(step, target, source));
        return [];
      }
      return [`clearHighlight ${id}`];
    });
  }

  if (step.action === "connect") {
    return step.targets.flatMap((target) => {
      const edges = edgesForConnection(target, data.edges);
      if (edges.length === 0) {
        errors.push(unknownTarget(step, target, source));
        return [];
      }
      return edges.flatMap((edge) => {
        const id = edgeIds.get(edge.id)!;
        const effect = flowEffect(String(properties.flow ?? "arrow"));
        return [`show ${id} via fade`, `draw ${id} via trace flow ${effect}`];
      });
    });
  }

  if (step.action === "camera") {
    const action = properties.cameraAction;
    const padding = numeric(properties.padding, 48);
    if (action === "fitAll") return [`camera fit(${graphName}) padding ${padding}`];
    if (action === "fitNodes") {
      const targets = step.targets.flatMap((target) => (nodeIds.get(target) ? [nodeIds.get(target)!] : []));
      return [`camera fit([${targets.join(", ")}]) padding ${padding}`];
    }
    if (action === "focus" && step.targets.length === 1 && nodeIds.get(step.targets[0]!)) {
      return [`camera focus(${nodeIds.get(step.targets[0]!)}) padding ${padding}`];
    }
    errors.push(
      diagnostic(
        ANIMFLOW_DIAGNOSTIC_CODES.unsupportedLegacyBehavior,
        "error",
        `Camera action ${String(action)} in step ${step.step} has no lossless v2 mapping.`,
        rangeForNeedle(source, `step ${step.step}:`),
      ),
    );
    return [];
  }

  errors.push(
    diagnostic(
      ANIMFLOW_DIAGNOSTIC_CODES.unsupportedLegacyBehavior,
      "error",
      `Animation action ${step.action} in step ${step.step} has no v2 mapping.`,
      rangeForNeedle(source, `step ${step.step}:`),
    ),
  );
  return [];
}

function nodeSource(node: DiagramNode, id: string, indent: string): string[] {
  const label = node.subtitle ? `${node.label}\n${node.subtitle}` : node.label;
  const color = node.style?.stroke ?? node.style?.fill ?? "neutral";
  return [
    `${indent}node ${id} ${quote(label)} {`,
    `${indent}  shape ${nodeShape(node.shape)}`,
    `${indent}  tone ${toneForColor(color)}`,
    `${indent}}`,
  ];
}

function edgeSource(
  edge: DiagramEdge,
  edgeIds: ReadonlyMap<string, string>,
  nodeIds: ReadonlyMap<string, string>,
  indent: string,
): string[] {
  const width = edge.style === "thick" ? 4 : 2;
  const pattern = edge.style === "dashed" ? "dashed" : edge.style === "dotted" ? "dotted" : "solid";
  const arrow = edge.arrow === "double" ? "both" : edge.arrow === "none" ? "none" : "end";
  return [
    `${indent}edge ${edgeIds.get(edge.id)}: ${nodeIds.get(edge.from)}.auto -> ${nodeIds.get(edge.to)}.auto {`,
    ...(edge.label ? [`${indent}  label ${quote(edge.label)}`] : []),
    `${indent}  line ${pattern} ${width}`,
    `${indent}  arrow ${arrow}`,
    `${indent}  tone neutral`,
    `${indent}  routing orthogonal`,
    `${indent}  flow none`,
    `${indent}}`,
  ];
}

function edgesForConnection(target: string, edges: readonly DiagramEdge[]): DiagramEdge[] {
  const [from, to, extra] = target.split("->").map((value) => value.trim());
  if (!from || !to || extra) return edges.filter((edge) => edge.id === target);
  return edges.filter((edge) => edge.from === from && edge.to === to);
}

function visibilityTransition(effect: string): string {
  if (effect === "flipIn") return "flip";
  if (effect === "scaleIn" || effect === "scaleOut" || effect === "bounceIn" || effect === "bounceOut") return "pop";
  const slide = effect.match(/^slide(?:In|Out)(Left|Right|Top|Bottom|Down|Up)$/);
  if (slide) {
    const direction = slide[1] === "Top" || slide[1] === "Up"
      ? "up"
      : slide[1] === "Bottom" || slide[1] === "Down"
        ? "down"
        : slide[1]!.toLowerCase();
    return `slide(from: ${direction}, distance: 48)`;
  }
  return "fade";
}

function flowEffect(effect: string): string {
  return new Set(["particles", "dash", "glow", "wave", "arrow", "lightning"]).has(effect)
    ? effect
    : "arrow";
}

function nodeShape(shape: DiagramNode["shape"]): string {
  if (shape === "terminator" || shape === "stadium") return "pill";
  if (shape === "asymmetric") return "parallelogram";
  return shape;
}

function direction(value: DiagramData["metadata"]["direction"]): string {
  if (value === "RL") return "left";
  if (value === "TD" || value === "TB") return "down";
  if (value === "BT") return "up";
  return "right";
}

function toneForColor(value: string): string {
  const color = value.trim();
  const short = color.match(/^#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])$/);
  if (short) return `hex_${short.slice(1).map((part) => `${part}${part}`).join("")}`;
  const full = color.match(/^#([a-fA-F0-9]{6})([a-fA-F0-9]{2})?$/);
  if (full) return `hex_${full[1]}${full[2] ?? ""}`;
  const identifier = color.replace(/[^A-Za-z0-9_.-]/g, "_");
  return /^[A-Za-z_]/.test(identifier) ? identifier : `tone_${identifier}`;
}

function timeMs(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, value * 1000);
  if (typeof value !== "string") return fallback;
  const match = value.trim().match(/^([0-9]+(?:\.[0-9]+)?)\s*(ms|s)$/);
  if (!match) return fallback;
  const amount = Number(match[1]);
  return match[2] === "s" ? amount * 1000 : amount;
}

function formatTime(value: number): string {
  return `${Math.round(value * 1000) / 1000}ms`;
}

function numeric(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function positive(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback;
}

function stringProperty(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function quote(value: string): string {
  return JSON.stringify(value);
}

function unknownTarget(step: AnimationStep, target: string, source: string): Diagnostic {
  return diagnostic(
    ANIMFLOW_DIAGNOSTIC_CODES.invalidLegacyNumber,
    "error",
    `Unknown target \"${target}\" in legacy step ${step.step}.`,
    rangeForNeedle(source, target),
  );
}

function diagnostic(
  code: DiagnosticCode,
  severity: Diagnostic["severity"],
  message: string,
  range: SourceRange = ZERO_RANGE,
): Diagnostic {
  return { code, severity, message, range };
}

function rangeForNeedle(source: string, needle: string): SourceRange {
  const offset = source.indexOf(needle);
  if (offset < 0) return ZERO_RANGE;
  return rangeForOffsets(source, offset, offset + needle.length);
}

function rangeAtLine(source: string, oneBasedLine: number, column: number): SourceRange {
  const lines = source.split("\n");
  const line = Math.max(0, oneBasedLine - 1);
  const offset = lines.slice(0, line).reduce((total, value) => total + value.length + 1, 0) + column;
  return rangeForOffsets(source, offset, offset);
}

function rangeForOffsets(source: string, start: number, end: number): SourceRange {
  const position = (offset: number) => {
    const before = source.slice(0, offset);
    const line = (before.match(/\n/g) ?? []).length;
    const lastLine = before.lastIndexOf("\n");
    return { offset, line, character: offset - lastLine - 1 };
  };
  return { start: position(start), end: position(end) };
}

class IdentifierRegistry {
  readonly #used = new Set<string>();

  allocate(value: string): string {
    let base = value.replace(/[^A-Za-z0-9_]/g, "_");
    if (!/^[A-Za-z_]/.test(base)) base = `_${base}`;
    if (RESERVED.has(base)) base = `legacy_${base}`;
    if (!base) base = "legacy_id";
    let candidate = base;
    let suffix = 2;
    while (this.#used.has(candidate)) candidate = `${base}_${suffix++}`;
    this.#used.add(candidate);
    return candidate;
  }
}
