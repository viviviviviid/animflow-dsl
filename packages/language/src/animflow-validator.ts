import { ANIMFLOW_DIAGNOSTIC_CODES } from "@animflow-dsl/model";
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

export class AnimFlowValidator {
  checkDocument(document: AnimFlowDocument, accept: ValidationAcceptor): void {
    this.checkVersion(document, accept);
    this.checkUniqueIds(document, accept);
    this.checkCanvas(document.canvas, accept);

    for (const graph of document.graphs) {
      if (graph.layout) this.checkLayout(graph.layout, accept);
      for (const member of graph.members) {
        if (isNode(member)) {
          this.checkDuplicateProperties(member, member.properties, accept);
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
  }

  private checkVersion(document: AnimFlowDocument, accept: ValidationAcceptor): void {
    const sourceVersion = String(document.version);
    if (sourceVersion !== "2" && sourceVersion !== "2.1") {
      accept("error", "AnimFlow document version must be 2 or 2.1.", {
        node: document,
        property: "version",
        code: code.invalidVersion,
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
      if (!(size.width > 0 && size.height > 0)) {
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
      if ((isNodeGapSetting(setting) || isRankGapSetting(setting)) && setting.value < 0) {
        accept("error", `${setting.$type === "NodeGapSetting" ? "nodeGap" : "rankGap"} must not be negative.`, {
          node: setting,
          property: "value",
          code: code.invalidNumber,
        });
      }
    }
  }

  private checkEdge(edge: Edge, accept: ValidationAcceptor): void {
    this.checkDuplicateProperties(edge, edge.properties, accept);

    for (const property of edge.properties) {
      if (isEdgeLineProperty(property) && property.width <= 0) {
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
      if (isOverlayWidthProperty(property) && property.value <= 0) {
        accept("error", "Overlay width must be greater than zero.", {
          node: property,
          property: "value",
          code: code.invalidNumber,
        });
      }
    }
  }

  private checkScene(scene: Scene, accept: ValidationAcceptor): void {
    if (scene.duration.value <= 0) {
      accept("error", "Scene duration must be greater than zero.", {
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
        if (isSlideTransition(action.transition) && (action.transition.distance ?? 0) < 0) {
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
      } else if (isStaggerStatement(action) && action.interval.value < 0) {
        accept("error", "Stagger interval must not be negative.", {
          node: action.interval,
          property: "value",
          code: code.invalidNumber,
        });
      }
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
    if ((statement.padding ?? 0) < 0) {
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
        });
      }
    } else if (target.wildcard) {
      accept("error", "Only a graph target can use .*.", {
        node: target,
        property: "wildcard",
        code: code.invalidTarget,
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

  private checkActionIdentity(
    version: AnimFlowDocument["version"],
    statement: SceneStatement,
    accept: ValidationAcceptor,
  ): void {
    const sourceVersion = String(version);
    if (sourceVersion === "2.1" && !isSayStatement(statement) && !isActionStatement(statement)) {
      accept("error", "AnimFlow 2.1 requires action <id>: before every scene action.", {
        node: statement,
        code: code.invalidActionIdentity,
      });
    } else if (sourceVersion === "2" && isActionStatement(statement)) {
      accept("error", "Named actions require animflow 2.1.", {
        node: statement,
        property: "name",
        code: code.invalidActionIdentity,
      });
    }
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
