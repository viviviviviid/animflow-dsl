import { ANIMFLOW_DIAGNOSTIC_CODES } from "@animflow-dsl/model";
import { AstUtils } from "langium";
import type { AstNode, ValidationAcceptor, ValidationChecks } from "langium";

import type {
  ActionStatement,
  AnimFlowAstType,
  AnimFlowDocument,
  CameraStatement,
  Canvas,
  Edge,
  Element,
  FlowLayout,
  Graph,
  NamedTarget,
  Node,
  Overlay,
  Scene,
  SceneAction,
  SceneStatement,
  SayStatement,
  TargetSet,
} from "./generated/ast.js";
import {
  isActionStatement,
  isCameraStatement,
  isClearHighlightStatement,
  isDrawStatement,
  isEdge,
  isEdgeLineProperty,
  isElement,
  isElementListTarget,
  isGraph,
  isHighlightStatement,
  isNamedTarget,
  isNode,
  isNodeGapSetting,
  isNodePinProperty,
  isNodePositionProperty,
  isOverlay,
  isOverlayWidthProperty,
  isRankGapSetting,
  isSayStatement,
  isSceneVisibilityStatement,
  isSequenceStatement,
  isSlideTransition,
  isStaggerStatement,
} from "./generated/ast.js";
import type { AnimFlowServices } from "./animflow-module.js";

const code = ANIMFLOW_DIAGNOSTIC_CODES;

export function registerValidationChecks(services: AnimFlowServices): void {
  const validator = services.validation.AnimFlowValidator;
  const checks: ValidationChecks<AnimFlowAstType> = {
    AnimFlowDocument: validator.checkDocument,
  };
  services.validation.ValidationRegistry.register(checks, validator);
}

type NamedDeclaration =
  | ActionStatement
  | Graph
  | Node
  | Edge
  | Overlay
  | Scene
  | AnimFlowDocument["story"];

interface WriteOwner {
  readonly statement: SceneStatement;
  readonly key: string;
}

interface FixData {
  readonly fixes: readonly {
    readonly title: string;
    readonly edits: readonly {
      readonly range?: {
        readonly start: { readonly line: number; readonly character: number };
        readonly end: { readonly line: number; readonly character: number };
      };
      readonly newText: string;
    }[];
  }[];
}

function replacementFix(title: string, newText: string): FixData {
  return { fixes: [{ title, edits: [{ newText }] }] };
}

function insertionFix(
  title: string,
  newText: string,
  position: { readonly line: number; readonly character: number },
): FixData {
  return {
    fixes: [{
      title,
      edits: [{ range: { start: position, end: position }, newText }],
    }],
  };
}

function isFiniteGreaterThanZero(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isFiniteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function durationMs(duration: { readonly value: number; readonly unit: string }): number {
  return duration.unit === "s" ? duration.value * 1_000 : duration.value;
}

export class AnimFlowValidator {
  checkDocument(document: AnimFlowDocument, accept: ValidationAcceptor): void {
    this.checkVersion(document, accept);
    this.checkUniqueIds(document, accept);
    this.checkCanvas(document.canvas, accept);
    for (const node of AstUtils.streamAst(document)) {
      const property = node.$type.endsWith("ToneProperty") || node.$type === "CanvasBackgroundProperty" ? "value" : isHighlightStatement(node) ? "tone" : undefined;
      if (!property) continue;
      const token = (node as unknown as Record<string, unknown>)[property];
      if (typeof token === "string" && token.startsWith("hex_") && !/^hex_(?:[a-fA-F0-9]{6}|[a-fA-F0-9]{8})$/.test(token)) {
        accept("error", "Literal colors require hex_ followed by exactly 6 (RGB) or 8 (RGBA) hexadecimal digits.", { node, property, code: code.invalidColor });
      }
    }

    for (const graph of document.graphs) {
      if (graph.layout) this.checkLayout(graph.layout, accept);
      for (const member of graph.members) {
        if (isNode(member)) {
          this.checkNode(member, accept);
        } else {
          this.checkEdge(member, accept);
        }
      }
    }

    for (const overlay of document.overlays) {
      this.checkOverlay(overlay, accept);
    }

    for (const statement of document.story.initial?.statements ?? []) {
      if (isCameraStatement(statement)) {
        this.checkCamera(statement, accept);
      } else {
        this.checkTarget(statement.targets, accept);
      }
    }

    for (const scene of document.story.scenes ?? []) {
      this.checkScene(scene, accept);
    }
    const totalMs = document.story.scenes.reduce((sum, scene) => sum + durationMs(scene.duration), 0);
    if (!Number.isFinite(totalMs) || totalMs > Number.MAX_SAFE_INTEGER) {
      accept("error", "Story duration must fit within the safe millisecond timeline range.", { node: document.story, property: "name", code: code.invalidNumber });
    }
  }

  private checkVersion(document: AnimFlowDocument, accept: ValidationAcceptor): void {
    const sourceVersion = String(document.version);
    if (sourceVersion !== "2" && sourceVersion !== "2.1" && sourceVersion !== "2.2") {
      accept("error", "AnimFlow document version must be 2, 2.1, or 2.2.", {
        node: document,
        property: "version",
        code: code.invalidVersion,
        data: replacementFix("Use AnimFlow 2.2", "2.2"),
      });
    }
  }

  private checkUniqueIds(document: AnimFlowDocument, accept: ValidationAcceptor): void {
    const declarations: NamedDeclaration[] = [document.story];
    declarations.push(...document.graphs, ...document.overlays, ...document.story.scenes);
    for (const graph of document.graphs) {
      declarations.push(...graph.members);
    }
    for (const scene of document.story.scenes) {
      for (const statement of this.walkStatements(scene.statements)) {
        if (isActionStatement(statement)) declarations.push(statement);
      }
    }

    const byName = new Map<string, NamedDeclaration[]>();
    for (const declaration of declarations) {
      const group = byName.get(declaration.name) ?? [];
      group.push(declaration);
      byName.set(declaration.name, group);
    }

    for (const [name, duplicates] of byName) {
      if (duplicates.length < 2) continue;
      for (const duplicate of duplicates) {
        accept("error", `Duplicate ID \"${name}\".`, {
          node: duplicate,
          property: "name",
          code: code.duplicateId,
        });
      }
    }
  }

  private checkCanvas(canvas: Canvas, accept: ValidationAcceptor): void {
    const expected = [
      "CanvasSizeProperty",
      "CanvasThemeProperty",
      "CanvasBackgroundProperty",
    ] as const;
    this.checkRequiredProperties(canvas, canvas.properties, expected, accept);
    this.checkDuplicateProperties(canvas, canvas.properties, accept);

    const size = canvas.properties.find((property) => property.$type === "CanvasSizeProperty");
    if (size?.$type === "CanvasSizeProperty") {
      if (!(isFiniteGreaterThanZero(size.width) && isFiniteGreaterThanZero(size.height))) {
        accept("error", "Canvas width and height must be greater than zero.", {
          node: size,
          property: "width",
          code: code.invalidNumber,
        });
      }
    }
  }

  private checkLayout(layout: FlowLayout, accept: ValidationAcceptor): void {
    this.checkDuplicateProperties(layout, layout.settings, accept);
    for (const setting of layout.settings) {
      if (
        (isNodeGapSetting(setting) || isRankGapSetting(setting)) &&
        !isFiniteNonNegative(setting.value)
      ) {
        accept("error", `${setting.$type === "NodeGapSetting" ? "nodeGap" : "rankGap"} must not be negative.`, {
          node: setting,
          property: "value",
          code: code.invalidNumber,
        });
      }
    }
  }

  private checkNode(node: Node, accept: ValidationAcceptor): void {
    this.checkDuplicateProperties(node, node.properties, accept);
    const position = node.properties.find(isNodePositionProperty);
    const pin = node.properties.find(isNodePinProperty);
    const document = AstUtils.findRootNode(node) as AnimFlowDocument;
    if ((position || pin) && String(document.version) !== "2.2") {
      accept("error", "Node position and pin require animflow 2.2.", {
        node: position ?? pin ?? node,
        code: code.invalidVersion,
      });
    }
    if (position && (!isFiniteNonNegative(position.x) || !isFiniteNonNegative(position.y))) {
      accept("error", "Node position coordinates must be finite and non-negative.", {
        node: position,
        code: code.invalidNumber,
      });
    }
    if (pin && !position) {
      accept("error", "A pinned node requires a position.", {
        node: pin,
        code: code.layoutConflict,
      });
    }
  }

  private checkEdge(edge: Edge, accept: ValidationAcceptor): void {
    this.checkDuplicateProperties(edge, edge.properties, accept);

    for (const property of edge.properties) {
      if (isEdgeLineProperty(property) && !isFiniteGreaterThanZero(property.width)) {
        accept("error", "Edge line width must be greater than zero.", {
          node: property,
          property: "width",
          code: code.invalidNumber,
        });
      }
    }

    this.checkEdgeEndpoint(edge, "from", edge.from.ref, accept);
    this.checkEdgeEndpoint(edge, "to", edge.to.ref, accept);
  }

  private checkEdgeEndpoint(
    edge: Edge,
    property: "from" | "to",
    endpoint: Node | undefined,
    accept: ValidationAcceptor,
  ): void {
    if (endpoint && endpoint.$container !== edge.$container) {
      accept("error", `Edge ${property} endpoint must belong to graph \"${edge.$container.name}\".`, {
        node: edge,
        property,
        code: code.invalidReference,
      });
    }
  }

  private checkOverlay(overlay: Overlay, accept: ValidationAcceptor): void {
    this.checkRequiredProperties(
      overlay,
      overlay.properties,
      ["OverlayAnchorProperty", "OverlayTextProperty"],
      accept,
    );
    this.checkDuplicateProperties(overlay, overlay.properties, accept);

    for (const property of overlay.properties) {
      if (isOverlayWidthProperty(property) && !isFiniteGreaterThanZero(property.value)) {
        accept("error", "Overlay width must be greater than zero.", {
          node: property,
          property: "value",
          code: code.invalidNumber,
        });
      }
    }
  }

  private checkScene(scene: Scene, accept: ValidationAcceptor): void {
    if (!isFiniteGreaterThanZero(scene.duration.value) || !isFiniteGreaterThanZero(durationMs(scene.duration)) || durationMs(scene.duration) > Number.MAX_SAFE_INTEGER) {
      accept("error", "Scene duration must be positive and fit within the safe millisecond timeline range.", {
        node: scene.duration,
        property: "value",
        code: code.invalidNumber,
      });
    }

    for (const statement of this.walkStatements(scene.statements)) {
      this.checkActionIdentity(scene.$container.$container.version, statement, accept);
      const action = this.unwrapStatement(statement);
      if (isSceneVisibilityStatement(action)) {
        this.checkTarget(action.targets, accept);
        if (
          isSlideTransition(action.transition) &&
          action.transition.distance !== undefined &&
          !isFiniteNonNegative(action.transition.distance)
        ) {
          accept("error", "Slide distance must not be negative.", {
            node: action.transition,
            property: "distance",
            code: code.invalidNumber,
          });
        }
      } else if (isCameraStatement(action)) {
        this.checkCamera(action, accept);
      } else if (
        isSayStatement(action) &&
        (isSequenceStatement(action.$container) || isStaggerStatement(action.$container))
      ) {
        accept("error", "say must be a direct scene statement because narration is scene-scoped.", {
          node: action,
          code: code.invalidNarration,
        });
      } else if (
        isStaggerStatement(action) &&
        (!isFiniteNonNegative(action.interval.value) || !isFiniteNonNegative(durationMs(action.interval)) || durationMs(action.interval) > Number.MAX_SAFE_INTEGER)
      ) {
          accept("error", "Stagger interval must be non-negative and fit within the safe millisecond timeline range.", {
          node: action.interval,
          property: "value",
          code: code.invalidNumber,
        });
      }
    }

    if (isFiniteGreaterThanZero(scene.duration.value)) {
      this.checkNestedSchedule(scene.statements, durationMs(scene.duration), accept);
    }

    const owners = new Map<string, WriteOwner>();
    for (const statement of scene.statements) {
      for (const key of this.statementWrites(statement)) {
        const previous = owners.get(key);
        if (previous) {
          accept("error", `Scene \"${scene.name}\" writes ${key} twice in parallel.`, {
            node: statement,
            code: code.parallelWrite,
          });
        } else {
          owners.set(key, { statement, key });
        }
      }
    }
  }

  private checkCamera(statement: CameraStatement, accept: ValidationAcceptor): void {
    this.checkTarget(statement.targets, accept);
    if (
      statement.padding !== undefined &&
      !isFiniteNonNegative(statement.padding)
    ) {
      accept("error", "Camera padding must not be negative.", {
        node: statement,
        property: "padding",
        code: code.invalidNumber,
      });
    }

    if (statement.action === "focus") {
      const targets = this.expandTarget(statement.targets);
      if (targets.length !== 1 || !isElement(targets[0])) {
        accept("error", "camera focus requires exactly one element target.", {
          node: statement,
          property: "targets",
          code: code.invalidTarget,
        });
      }
    }
  }

  private checkTarget(target: TargetSet, accept: ValidationAcceptor): void {
    if (isElementListTarget(target)) {
      const seen = new Set<Element>();
      for (let index = 0; index < target.elements.length; index += 1) {
        const element = target.elements[index]!.ref;
        if (!element) continue;
        if (seen.has(element)) accept("error", `Target \"${element.name}\" is listed more than once. Each element may appear only once in a target list.`, { node: target, property: "elements", index, code: code.invalidTarget });
        seen.add(element);
      }
      return;
    }
    if (!isNamedTarget(target)) return;
    const resolved = target.target.ref;
    if (!resolved) return;

    if (isGraph(resolved)) {
      const camera = isCameraStatement(target.$container) ? target.$container : undefined;
      const graphWithoutWildcardIsFit = camera?.action === "fit" && !target.wildcard;
      if (!target.wildcard && !graphWithoutWildcardIsFit) {
        accept("error", "A graph target requires .* unless used by camera fit.", {
          node: target,
          property: "target",
          code: code.invalidTarget,
          data: replacementFix(`Target all elements in ${resolved.name}`, `${resolved.name}.*`),
        });
      }
    } else if (target.wildcard) {
      accept("error", "Only a graph target can use .*.", {
        node: target,
        property: "wildcard",
        code: code.invalidTarget,
        data: replacementFix("Remove the graph wildcard", ""),
      });
    }
  }

  private checkRequiredProperties<T extends AstNode>(
    owner: T,
    properties: readonly AstNode[],
    expectedTypes: readonly string[],
    accept: ValidationAcceptor,
  ): void {
    for (const expectedType of expectedTypes) {
      if (!properties.some((property) => property.$type === expectedType)) {
        accept("error", `Missing required property ${this.propertyLabel(expectedType)}.`, {
          node: owner,
          code: code.missingProperty,
        });
      }
    }
  }

  private checkDuplicateProperties<T extends AstNode>(
    _owner: T,
    properties: readonly AstNode[],
    accept: ValidationAcceptor,
  ): void {
    const seen = new Set<string>();
    for (const property of properties) {
      if (seen.has(property.$type)) {
        accept("error", `Property ${this.propertyLabel(property.$type)} may appear only once.`, {
          node: property,
          code: code.duplicateProperty,
        });
      }
      seen.add(property.$type);
    }
  }

  private propertyLabel(type: string): string {
    return type
      .replace(/(?:Canvas|Edge|Node|Overlay)/, "")
      .replace(/(?:Property|Setting)$/, "")
      .replace(/^./, (character) => character.toLowerCase());
  }

  private *walkStatements(statements: readonly SceneStatement[]): Iterable<SceneStatement> {
    for (const statement of statements) {
      yield statement;
      const action = this.unwrapStatement(statement);
      if (isSequenceStatement(action) || isStaggerStatement(action)) {
        yield* this.walkStatements(action.statements);
      }
    }
  }

  private statementWrites(statement: SceneStatement): Set<string> {
    const action = this.unwrapStatement(statement);
    if (isSequenceStatement(action)) {
      const writes = new Set<string>();
      for (const child of action.statements) {
        for (const key of this.statementWrites(child)) writes.add(key);
      }
      return writes;
    }
    if (isStaggerStatement(action)) {
      const writes = new Set<string>();
      for (const child of action.statements) {
        for (const key of this.statementWrites(child)) writes.add(key);
      }
      return writes;
    }
    if (isSceneVisibilityStatement(action)) {
      return new Set(this.expandTarget(action.targets).map((target) => `${target.name}.opacity`));
    }
    if (isDrawStatement(action)) {
      return new Set(action.edge.ref ? [`${action.edge.ref.name}.drawProgress`] : []);
    }
    if (isHighlightStatement(action) || isClearHighlightStatement(action)) {
      return new Set(action.target.ref ? [`${action.target.ref.name}.highlight`] : []);
    }
    if (isCameraStatement(action)) return new Set(["camera.viewBox"]);
    if (isSayStatement(action)) return new Set(["narration"]);
    return new Set();
  }

  private checkNestedSchedule(
    statements: readonly SceneStatement[],
    availableMs: number,
    accept: ValidationAcceptor,
  ): void {
    for (const statement of statements) {
      const action = this.unwrapStatement(statement);
      if (isSequenceStatement(action)) {
        const childDuration = action.statements.length === 0
          ? 0
          : availableMs / action.statements.length;
        for (const child of action.statements) {
          this.checkNestedSchedule([child], childDuration, accept);
        }
        continue;
      }
      if (!isStaggerStatement(action) || !isFiniteNonNegative(action.interval.value)) {
        continue;
      }

      const gapMs = durationMs(action.interval);
      const lastStartMs = gapMs * Math.max(0, action.statements.length - 1);
      if (!Number.isFinite(lastStartMs) || lastStartMs > availableMs) {
        accept("error", "Stagger schedule exceeds its containing duration.", {
          node: action.interval,
          code: code.invalidSchedule,
        });
        continue;
      }

      const childDuration = Math.max(0, availableMs - lastStartMs);
      for (let index = 0; index < action.statements.length; index += 1) {
        this.checkNestedSchedule([action.statements[index]!], childDuration, accept);
        if (childDuration <= 0) continue;
        const leftWrites = this.statementWrites(action.statements[index]!);
        for (let other = index + 1; other < action.statements.length; other += 1) {
          if ((other - index) * gapMs >= childDuration) break;
          const rightWrites = this.statementWrites(action.statements[other]!);
          const conflict = [...leftWrites].find((key) => rightWrites.has(key));
          if (!conflict) continue;
          accept("error", `Stagger writes ${conflict} in overlapping actions.`, {
            node: action.statements[other]!,
            code: code.parallelWrite,
          });
        }
      }
    }
  }

  private checkActionIdentity(
    version: AnimFlowDocument["version"],
    statement: SceneStatement,
    accept: ValidationAcceptor,
  ): void {
    const sourceVersion = String(version);
    if ((sourceVersion === "2.1" || sourceVersion === "2.2") && !isSayStatement(statement) && !isActionStatement(statement)) {
      const actionId = this.generatedActionId(statement);
      const position = statement.$cstNode?.range.start;
      accept("error", `AnimFlow ${sourceVersion} requires action <id>: before every scene action.`, {
        node: statement,
        code: code.invalidActionIdentity,
        data: position
          ? insertionFix(`Add action identity ${actionId}`, `action ${actionId}: `, position)
          : undefined,
      });
    } else if (sourceVersion === "2" && isActionStatement(statement)) {
      const document = AstUtils.findRootNode(statement) as AnimFlowDocument;
      const position = document.$cstNode?.range.start;
      const versionStart = position
        ? { line: position.line, character: position.character + "animflow ".length }
        : undefined;
      accept("error", "Named actions require animflow 2.1.", {
        node: statement,
        property: "name",
        code: code.invalidActionIdentity,
        data: versionStart
          ? {
              fixes: [{
                title: "Upgrade the document to AnimFlow 2.1",
                edits: [{
                  range: {
                    start: versionStart,
                    end: { line: versionStart.line, character: versionStart.character + 1 },
                  },
                  newText: "2.1",
                }],
              }],
            } satisfies FixData
          : undefined,
      });
    }
  }

  private generatedActionId(statement: SceneStatement): string {
    const document = AstUtils.findRootNode(statement) as AnimFlowDocument;
    const statements = document.story.scenes.flatMap((scene) => [...this.walkStatements(scene.statements)]);
    const statementIndex = statements.indexOf(statement);
    const ordinal = statements
      .slice(0, statementIndex + 1)
      .filter((candidate) => !isSayStatement(candidate)).length;
    const action = this.unwrapStatement(statement);
    const verb = action.$type
      .replace(/Statement$/, "")
      .replace(/^SceneVisibility$/, action.$type === "SceneVisibilityStatement" ? action.action : "visibility")
      .replace(/^ClearHighlight$/, "clearHighlight")
      .replace(/^./, (character) => character.toLowerCase());
    const used = new Set(
      [document.story.name, ...document.graphs.map((graph) => graph.name), ...document.graphs.flatMap((graph) => graph.members.map((member) => member.name)), ...document.overlays.map((overlay) => overlay.name), ...document.story.scenes.map((scene) => scene.name), ...statements.filter(isActionStatement).map((candidate) => candidate.name)],
    );
    const base = `${verb}${ordinal}`;
    let candidate = base;
    let suffix = 2;
    while (used.has(candidate)) candidate = `${base}_${suffix++}`;
    return candidate;
  }

  private unwrapStatement(statement: SceneStatement): SceneAction | SayStatement {
    return isActionStatement(statement) ? statement.body : statement;
  }

  private expandTarget(target: TargetSet): Array<Element | Graph> {
    if (isElementListTarget(target)) {
      return target.elements.flatMap((reference) => (reference.ref ? [reference.ref] : []));
    }

    const resolved = target.target.ref;
    if (!resolved) return [];
    if (isGraph(resolved) && target.wildcard) {
      return resolved.members.filter(
        (member): member is Node | Edge => isNode(member) || isEdge(member),
      );
    }
    return [resolved];
  }
}
