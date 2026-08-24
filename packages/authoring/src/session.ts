import { compileAnimFlow } from "@animflow-dsl/compiler";
import {
  parseAnimFlow,
  releaseAnimFlowDocument,
  type ActionStatement,
  type Edge,
  type Graph,
  type Node,
  type Overlay,
  type ParsedAnimFlowDocument,
  type SayStatement,
  type Scene,
  type SceneStatement,
  type SequenceStatement,
  type StaggerStatement,
} from "@animflow-dsl/language";
import {
  ANIMFLOW_DIAGNOSTIC_CODES,
  type Diagnostic,
  type RenderPlan,
  type SourcePosition,
  type SourceRange,
} from "@animflow-dsl/model";
import { AstUtils, GrammarUtils, type AstNode } from "langium";

import {
  renderCanvas,
  renderDuration,
  renderEdge,
  renderFlowLayout,
  renderGraph,
  renderNamedAction,
  renderNode,
  renderOverlay,
} from "./render.js";
import type {
  ActionDraft,
  AppliedAuthoringResult,
  AuthoringCommand,
  AuthoringResult,
  AuthoringSelection,
  AuthoringState,
  HistoryRequest,
  RejectedAuthoringResult,
  RenamableDeclarationKind,
} from "./types.js";

interface HistoryEntry {
  readonly beforeSource: string;
  readonly afterSource: string;
  readonly beforeSelectionId?: string;
  readonly afterSelectionId?: string;
}

interface ActionLocation {
  readonly action: ActionStatement;
  readonly scene: Scene;
  readonly statements: readonly SceneStatement[];
  readonly parent?: SequenceStatement | StaggerStatement;
}

interface TextRange {
  readonly start: number;
  readonly end: number;
}

type PatchResult =
  | { readonly ok: true; readonly source: string }
  | { readonly ok: false; readonly diagnostic: Diagnostic };

/** Stateful, revision-checked authoring façade with canonical source text. */
export class AuthoringSession {
  private sourceText: string;
  private documentRevisionValue = 0;
  private planSequence = 0;
  private currentPlanRevision?: number;
  private lastValidPlanRevisionValue?: number;
  private lastValidPlanValue?: RenderPlan;
  private diagnosticsValue: readonly Diagnostic[];
  private selectionValue?: AuthoringSelection;
  private transactionSequence = 0;
  private readonly past: HistoryEntry[] = [];
  private readonly future: HistoryEntry[] = [];
  private operationTail: Promise<void> = Promise.resolve();

  private constructor(source: string, diagnostics: readonly Diagnostic[]) {
    this.sourceText = source;
    this.diagnosticsValue = diagnostics;
  }

  public static async create(source: string): Promise<AuthoringSession> {
    const compiled = await compileAnimFlow(source);
    const session = new AuthoringSession(source, compiled.diagnostics);
    if (compiled.ok) {
      session.lastValidPlanValue = compiled.value;
      session.currentPlanRevision = 0;
      session.lastValidPlanRevisionValue = 0;
    }
    return session;
  }

  public get state(): AuthoringState {
    return {
      source: this.sourceText,
      documentRevision: this.documentRevisionValue,
      planRevision: this.currentPlanRevision,
      lastValidPlanRevision: this.lastValidPlanRevisionValue,
      plan: this.lastValidPlanValue,
      diagnostics: this.diagnosticsValue,
      selection: this.selectionValue,
      canUndo: this.past.length > 0,
      canRedo: this.future.length > 0,
    };
  }

  public async select(id: string | undefined): Promise<AuthoringSelection | undefined> {
    return this.enqueue(() => this.selectNow(id));
  }

  public async execute(command: AuthoringCommand): Promise<AuthoringResult> {
    return this.enqueue(() => this.executeNow(command));
  }

  public async undo(request: HistoryRequest): Promise<AuthoringResult> {
    return this.enqueue(() => this.undoNow(request));
  }

  public async redo(request: HistoryRequest): Promise<AuthoringResult> {
    return this.enqueue(() => this.redoNow(request));
  }

  private async selectNow(id: string | undefined): Promise<AuthoringSelection | undefined> {
    if (id === undefined) {
      this.selectionValue = undefined;
      return undefined;
    }
    this.selectionValue = await resolveSelection(this.sourceText, id);
    return this.selectionValue;
  }

  private async executeNow(command: AuthoringCommand): Promise<AuthoringResult> {
    const conflict = this.checkRevision(command.baseRevision);
    if (conflict) return conflict;

    const beforeSource = this.sourceText;
    const beforeSelectionId = this.selectionValue?.id;
    if (command.type === "source.replace") {
      return this.applyCandidate(command.source, true, {
        beforeSource,
        afterSource: command.source,
        beforeSelectionId,
        afterSelectionId: beforeSelectionId,
      });
    }

    const parsed = await parseAnimFlow(this.sourceText);
    if (!parsed.ok) return this.reject("invalid-semantic-command", parsed.diagnostics);
    try {
      if (parsed.value.version !== "2.1") {
        return this.reject("invalid-semantic-command", [
          authoringDiagnostic(
            ANIMFLOW_DIAGNOSTIC_CODES.authoringRequiresVersion21,
            "Visual authoring commands require AnimFlow 2.1 action identities.",
          ),
        ]);
      }
      const patched = patchCommand(this.sourceText, parsed.value, command);
      if (!patched.ok) return this.reject("invalid-semantic-command", [patched.diagnostic]);
      const afterSelectionId = command.type === "declaration.rename" && beforeSelectionId === command.id
        ? command.newId
        : beforeSelectionId;
      return await this.applyCandidate(patched.source, false, {
        beforeSource,
        afterSource: patched.source,
        beforeSelectionId,
        afterSelectionId,
      });
    } finally {
      await releaseAnimFlowDocument(parsed.value);
    }
  }

  private async undoNow(request: HistoryRequest): Promise<AuthoringResult> {
    const conflict = this.checkRevision(request.baseRevision);
    if (conflict) return conflict;
    const entry = this.past.pop();
    if (!entry) {
      return this.reject("invalid-semantic-command", [
        authoringDiagnostic(
          ANIMFLOW_DIAGNOSTIC_CODES.invalidAuthoringCommand,
          "There is no authoring transaction to undo.",
        ),
      ]);
    }
    const result = await this.applyHistorySnapshot(entry.beforeSource, entry.beforeSelectionId);
    this.future.push(entry);
    return result;
  }

  private async redoNow(request: HistoryRequest): Promise<AuthoringResult> {
    const conflict = this.checkRevision(request.baseRevision);
    if (conflict) return conflict;
    const entry = this.future.pop();
    if (!entry) {
      return this.reject("invalid-semantic-command", [
        authoringDiagnostic(
          ANIMFLOW_DIAGNOSTIC_CODES.invalidAuthoringCommand,
          "There is no authoring transaction to redo.",
        ),
      ]);
    }
    const result = await this.applyHistorySnapshot(entry.afterSource, entry.afterSelectionId);
    this.past.push(entry);
    return result;
  }

  private enqueue<Value>(operation: () => Promise<Value>): Promise<Value> {
    const result = this.operationTail.then(operation, operation);
    this.operationTail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  private checkRevision(baseRevision: number): RejectedAuthoringResult | undefined {
    if (baseRevision === this.documentRevisionValue) return undefined;
    return this.reject("revision-conflict", [
      authoringDiagnostic(
        ANIMFLOW_DIAGNOSTIC_CODES.revisionConflict,
        `Expected revision ${this.documentRevisionValue}, received ${baseRevision}.`,
      ),
    ]);
  }

  private reject(
    reason: RejectedAuthoringResult["reason"],
    diagnostics: readonly Diagnostic[],
  ): RejectedAuthoringResult {
    return {
      status: "rejected",
      reason,
      currentRevision: this.documentRevisionValue,
      diagnostics,
    };
  }

  private async applyCandidate(
    source: string,
    allowInvalidDraft: boolean,
    history: HistoryEntry,
  ): Promise<AuthoringResult> {
    const compiled = await compileAnimFlow(source);
    if (!compiled.ok && !allowInvalidDraft) {
      return this.reject("invalid-semantic-command", compiled.diagnostics);
    }
    this.past.push(history);
    this.future.length = 0;
    return this.commitSnapshot(source, compiled, history.afterSelectionId);
  }

  private async applyHistorySnapshot(
    source: string,
    selectionId: string | undefined,
  ): Promise<AppliedAuthoringResult> {
    const compiled = await compileAnimFlow(source);
    return this.commitSnapshot(source, compiled, selectionId);
  }

  private async commitSnapshot(
    source: string,
    compiled: Awaited<ReturnType<typeof compileAnimFlow>>,
    selectionId: string | undefined,
  ): Promise<AppliedAuthoringResult> {
    this.sourceText = source;
    this.documentRevisionValue += 1;
    this.diagnosticsValue = compiled.diagnostics;
    if (compiled.ok) {
      this.planSequence += 1;
      this.currentPlanRevision = this.planSequence;
      this.lastValidPlanRevisionValue = this.planSequence;
      this.lastValidPlanValue = compiled.value;
    } else {
      this.currentPlanRevision = undefined;
    }
    this.selectionValue = selectionId
      ? await resolveSelection(this.sourceText, selectionId)
      : undefined;

    const transactionId = `tx-${++this.transactionSequence}`;
    if (compiled.ok) {
      return {
        status: "applied-valid",
        transactionId,
        documentRevision: this.documentRevisionValue,
        planRevision: this.currentPlanRevision,
        lastValidPlanRevision: this.lastValidPlanRevisionValue,
        source: this.sourceText,
        diagnostics: compiled.diagnostics,
      };
    }
    return {
      status: "applied-invalid-draft",
      transactionId,
      documentRevision: this.documentRevisionValue,
      lastValidPlanRevision: this.lastValidPlanRevisionValue,
      source: this.sourceText,
      diagnostics: compiled.diagnostics,
    };
  }
}

function patchCommand(
  source: string,
  document: ParsedAnimFlowDocument,
  command: Exclude<AuthoringCommand, { readonly type: "source.replace" }>,
): PatchResult {
  switch (command.type) {
    case "canvas.update": return updateCanvas(source, document, command.replacement);
    case "graph.add": return addGraph(source, document, command);
    case "graph.update": return updateGraph(source, document, command.graphId, command.layout);
    case "graph.remove": return removeGraph(source, document, command.graphId);
    case "node.add": return addNode(source, document, command);
    case "node.update": return updateNode(source, document, command.nodeId, command.replacement);
    case "node.remove": return removeNode(source, document, command.nodeId);
    case "edge.add": return addEdge(source, document, command);
    case "edge.update": return updateEdge(source, document, command.edgeId, command.replacement);
    case "edge.remove": return removeEdge(source, document, command.edgeId);
    case "overlay.add": return addOverlay(source, document, command);
    case "overlay.update": return updateOverlay(source, document, command.overlayId, command.replacement);
    case "overlay.remove": return removeOverlay(source, document, command.overlayId);
    case "declaration.rename": return renameDeclaration(source, document, command);
    case "scene.add": return addScene(source, document, command);
    case "scene.move": return moveScene(source, document, command.sceneId, command.index);
    case "scene.remove": return removeScene(source, document, command.sceneId);
    case "action.add": return addAction(source, document, command);
    case "action.update": return updateAction(source, document, command.actionId, command.replacement);
    case "action.remove": return removeAction(source, document, command.actionId);
    case "narration.set": return setNarration(source, document, command.sceneId, command.text);
  }
}

function updateCanvas(
  source: string,
  document: ParsedAnimFlowDocument,
  replacement: Extract<AuthoringCommand, { readonly type: "canvas.update" }>["replacement"],
): PatchResult {
  const range = requireCst(document.canvas);
  const indent = indentationAt(source, range.start);
  return {
    ok: true,
    source: replaceRange(source, range, renderCanvas(replacement, indent).slice(indent.length)),
  };
}

function addGraph(
  source: string,
  document: ParsedAnimFlowDocument,
  command: Extract<AuthoringCommand, { readonly type: "graph.add" }>,
): PatchResult {
  if (!identifier(command.graphId)) return invalidIdentifier("graph", command.graphId);
  const index = normalizeInsertionIndex(command.index, document.graphs.length);
  if (index === undefined) return invalidIndex(command.index);
  const target = document.graphs[index];
  const nextDeclaration = target ?? document.overlays[0] ?? document.story;
  const insertionOffset = leadingCommentStart(source, requireCst(nextDeclaration).start);
  return { ok: true, source: insertAt(source, insertionOffset, `${renderGraph(command.graphId, command.layout)}\n\n`) };
}

function updateGraph(
  source: string,
  document: ParsedAnimFlowDocument,
  graphId: string,
  layout: Extract<AuthoringCommand, { readonly type: "graph.update" }>["layout"],
): PatchResult {
  const graph = document.graphs.find((candidate) => candidate.name === graphId);
  if (!graph) return targetNotFound("graph", graphId);
  const range = requireCst(graph.layout);
  const indent = indentationAt(source, range.start);
  return {
    ok: true,
    source: replaceRange(source, range, renderFlowLayout(layout, indent).slice(indent.length)),
  };
}

function removeGraph(source: string, document: ParsedAnimFlowDocument, graphId: string): PatchResult {
  const graph = document.graphs.find((candidate) => candidate.name === graphId);
  if (!graph) return targetNotFound("graph", graphId);
  return { ok: true, source: replaceRange(source, lineBlockRange(source, requireCst(graph)), "") };
}

function addNode(
  source: string,
  document: ParsedAnimFlowDocument,
  command: Extract<AuthoringCommand, { readonly type: "node.add" }>,
): PatchResult {
  if (!identifier(command.nodeId)) return invalidIdentifier("node", command.nodeId);
  return addGraphMember(
    source,
    document,
    command.graphId,
    command.index,
    (indent) => renderNode(command.nodeId, command.node, indent),
  );
}

function updateNode(
  source: string,
  document: ParsedAnimFlowDocument,
  nodeId: string,
  replacement: Extract<AuthoringCommand, { readonly type: "node.update" }>["replacement"],
): PatchResult {
  const node = findNode(document, nodeId);
  if (!node) return targetNotFound("node", nodeId);
  return replaceDeclaration(source, node, renderNode(nodeId, replacement, indentationAt(source, requireCst(node).start)));
}

function removeNode(source: string, document: ParsedAnimFlowDocument, nodeId: string): PatchResult {
  const node = findNode(document, nodeId);
  if (!node) return targetNotFound("node", nodeId);
  return { ok: true, source: replaceRange(source, lineBlockRange(source, requireCst(node)), "") };
}

function addEdge(
  source: string,
  document: ParsedAnimFlowDocument,
  command: Extract<AuthoringCommand, { readonly type: "edge.add" }>,
): PatchResult {
  if (!identifier(command.edgeId)) return invalidIdentifier("edge", command.edgeId);
  return addGraphMember(
    source,
    document,
    command.graphId,
    command.index,
    (indent) => renderEdge(command.edgeId, command.edge, indent),
  );
}

function updateEdge(
  source: string,
  document: ParsedAnimFlowDocument,
  edgeId: string,
  replacement: Extract<AuthoringCommand, { readonly type: "edge.update" }>["replacement"],
): PatchResult {
  const edge = findEdge(document, edgeId);
  if (!edge) return targetNotFound("edge", edgeId);
  return replaceDeclaration(source, edge, renderEdge(edgeId, replacement, indentationAt(source, requireCst(edge).start)));
}

function removeEdge(source: string, document: ParsedAnimFlowDocument, edgeId: string): PatchResult {
  const edge = findEdge(document, edgeId);
  if (!edge) return targetNotFound("edge", edgeId);
  return { ok: true, source: replaceRange(source, lineBlockRange(source, requireCst(edge)), "") };
}

function addGraphMember(
  source: string,
  document: ParsedAnimFlowDocument,
  graphId: string,
  requestedIndex: number | undefined,
  render: (indent: string) => string,
): PatchResult {
  const graph = document.graphs.find((candidate) => candidate.name === graphId);
  if (!graph) return targetNotFound("graph", graphId);
  const index = normalizeInsertionIndex(requestedIndex, graph.members.length);
  if (index === undefined) return invalidIndex(requestedIndex);
  const target = graph.members[index];
  const graphRange = requireCst(graph);
  const close = closingBraceOffset(source, graphRange);
  if (close === undefined) return missingCst("graph closing brace");
  const insertionOffset = target ? leadingCommentStart(source, requireCst(target).start) : lineStart(source, close);
  const indent = target ? indentationAt(source, requireCst(target).start) : `${indentationAt(source, close)}  `;
  return { ok: true, source: insertAt(source, insertionOffset, `${render(indent)}\n`) };
}

function addOverlay(
  source: string,
  document: ParsedAnimFlowDocument,
  command: Extract<AuthoringCommand, { readonly type: "overlay.add" }>,
): PatchResult {
  if (!identifier(command.overlayId)) return invalidIdentifier("overlay", command.overlayId);
  const index = normalizeInsertionIndex(command.index, document.overlays.length);
  if (index === undefined) return invalidIndex(command.index);
  const target = document.overlays[index];
  const nextDeclaration = target ?? document.story;
  const insertionOffset = leadingCommentStart(source, requireCst(nextDeclaration).start);
  return { ok: true, source: insertAt(source, insertionOffset, `${renderOverlay(command.overlayId, command.overlay)}\n\n`) };
}

function updateOverlay(
  source: string,
  document: ParsedAnimFlowDocument,
  overlayId: string,
  replacement: Extract<AuthoringCommand, { readonly type: "overlay.update" }>["replacement"],
): PatchResult {
  const overlay = document.overlays.find((candidate) => candidate.name === overlayId);
  if (!overlay) return targetNotFound("overlay", overlayId);
  return replaceDeclaration(source, overlay, renderOverlay(overlayId, replacement, indentationAt(source, requireCst(overlay).start)));
}

function removeOverlay(source: string, document: ParsedAnimFlowDocument, overlayId: string): PatchResult {
  const overlay = document.overlays.find((candidate) => candidate.name === overlayId);
  if (!overlay) return targetNotFound("overlay", overlayId);
  return { ok: true, source: replaceRange(source, lineBlockRange(source, requireCst(overlay)), "") };
}

function replaceDeclaration(
  source: string,
  declaration: { readonly $cstNode?: { readonly offset: number; readonly end: number } },
  rendered: string,
): PatchResult {
  const range = requireCst(declaration);
  const indent = indentationAt(source, range.start);
  return { ok: true, source: replaceRange(source, range, rendered.slice(indent.length)) };
}

function renameDeclaration(
  source: string,
  document: ParsedAnimFlowDocument,
  command: Extract<AuthoringCommand, { readonly type: "declaration.rename" }>,
): PatchResult {
  if (!identifier(command.newId)) return invalidIdentifier(command.kind, command.newId);
  const declaration = findDeclaration(document, command.kind, command.id);
  if (!declaration) return targetNotFound(command.kind, command.id);
  const nameNode = GrammarUtils.findNodeForProperty(declaration.$cstNode, "name");
  if (!nameNode) return missingCst(`${command.kind} name`);

  const edits: Array<{ readonly start: number; readonly end: number; readonly newText: string }> = [
    { start: nameNode.offset, end: nameNode.end, newText: command.newId },
  ];
  for (const node of AstUtils.streamAst(document)) {
    for (const info of AstUtils.streamReferences(node)) {
      if (!AstUtils.getReferenceNodes(info.reference).includes(declaration)) continue;
      const referenceNode = info.reference.$refNode;
      if (referenceNode) {
        edits.push({ start: referenceNode.offset, end: referenceNode.end, newText: command.newId });
      }
    }
  }
  return { ok: true, source: applyTextEdits(source, edits) };
}

function findDeclaration(
  document: ParsedAnimFlowDocument,
  kind: RenamableDeclarationKind,
  id: string,
): AstNode | undefined {
  switch (kind) {
    case "graph": return document.graphs.find((candidate) => candidate.name === id);
    case "node": return findNode(document, id);
    case "edge": return findEdge(document, id);
    case "overlay": return document.overlays.find((candidate) => candidate.name === id);
    case "story": return document.story.name === id ? document.story : undefined;
    case "scene": return document.story.scenes.find((candidate) => candidate.name === id);
    case "action": return findAction(document, id)?.action;
  }
}

function findNode(document: ParsedAnimFlowDocument, id: string): Node | undefined {
  for (const graph of document.graphs) {
    const node = graph.members.find((candidate): candidate is Node => candidate.$type === "Node" && candidate.name === id);
    if (node) return node;
  }
  return undefined;
}

function findEdge(document: ParsedAnimFlowDocument, id: string): Edge | undefined {
  for (const graph of document.graphs) {
    const edge = graph.members.find((candidate): candidate is Edge => candidate.$type === "Edge" && candidate.name === id);
    if (edge) return edge;
  }
  return undefined;
}

function addScene(
  source: string,
  document: ParsedAnimFlowDocument,
  command: Extract<AuthoringCommand, { readonly type: "scene.add" }>,
): PatchResult {
  if (!identifier(command.sceneId)) return invalidIdentifier("scene", command.sceneId);
  const scenes = document.story.scenes;
  const index = normalizeInsertionIndex(command.index, scenes.length);
  if (index === undefined) return invalidIndex(command.index);
  const target = scenes[index];
  const storyRange = cstRange(document.story);
  if (!storyRange) return missingCst("story");
  const close = closingBraceOffset(source, storyRange);
  if (close === undefined) return missingCst("story closing brace");
  const insertionOffset = target ? leadingCommentStart(source, requireCst(target).start) : lineStart(source, close);
  const indent = target ? indentationAt(source, requireCst(target).start) : `${indentationAt(source, close)}  `;
  return { ok: true, source: insertAt(source, insertionOffset, `${renderScene(command, indent)}\n`) };
}

function moveScene(
  source: string,
  document: ParsedAnimFlowDocument,
  sceneId: string,
  requestedIndex: number,
): PatchResult {
  const scenes = document.story.scenes;
  const moving = scenes.find((scene) => scene.name === sceneId);
  if (!moving) return targetNotFound("scene", sceneId);
  if (!Number.isInteger(requestedIndex) || requestedIndex < 0 || requestedIndex >= scenes.length) {
    return invalidIndex(requestedIndex);
  }
  const currentIndex = scenes.indexOf(moving);
  if (currentIndex === requestedIndex) return { ok: true, source };

  const movingCst = requireCst(moving);
  const movingRange = {
    start: leadingCommentStart(source, movingCst.start),
    end: lineEnd(source, movingCst.end),
  };
  const segment = source.slice(movingRange.start, movingRange.end);
  const remaining = scenes.filter((scene) => scene !== moving);
  const target = remaining[requestedIndex];
  const storyRange = cstRange(document.story);
  if (!storyRange) return missingCst("story");
  const close = closingBraceOffset(source, storyRange);
  if (close === undefined) return missingCst("story closing brace");
  let insertionOffset = target ? leadingCommentStart(source, requireCst(target).start) : lineStart(source, close);
  const without = replaceRange(source, movingRange, "");
  if (insertionOffset > movingRange.end) insertionOffset -= movingRange.end - movingRange.start;
  return { ok: true, source: insertAt(without, insertionOffset, segment) };
}

function removeScene(source: string, document: ParsedAnimFlowDocument, sceneId: string): PatchResult {
  const scene = document.story.scenes.find((candidate) => candidate.name === sceneId);
  if (!scene) return targetNotFound("scene", sceneId);
  return { ok: true, source: replaceRange(source, lineBlockRange(source, requireCst(scene)), "") };
}

function addAction(
  source: string,
  document: ParsedAnimFlowDocument,
  command: Extract<AuthoringCommand, { readonly type: "action.add" }>,
): PatchResult {
  if (!identifier(command.actionId)) return invalidIdentifier("action", command.actionId);
  const scene = document.story.scenes.find((candidate) => candidate.name === command.sceneId);
  if (!scene) return targetNotFound("scene", command.sceneId);

  let statements: readonly SceneStatement[] = scene.statements;
  let containerRange = cstRange(scene);
  if (command.parentActionId) {
    const parent = findAction(document, command.parentActionId);
    if (!parent) return targetNotFound("action", command.parentActionId);
    if (parent.scene !== scene) return invalidCommand(`Action ${command.parentActionId} is not in scene ${command.sceneId}.`);
    if (parent.action.body.$type !== "SequenceStatement" && parent.action.body.$type !== "StaggerStatement") {
      return invalidCommand(`Action ${command.parentActionId} cannot contain child actions.`);
    }
    statements = parent.action.body.statements;
    containerRange = cstRange(parent.action.body);
  }
  if (!containerRange) return missingCst("action container");
  const index = normalizeInsertionIndex(command.index, statements.length);
  if (index === undefined) return invalidIndex(command.index);
  const target = statements[index];
  const close = closingBraceOffset(source, containerRange);
  if (close === undefined) return missingCst("action container closing brace");
  const insertionOffset = target ? leadingCommentStart(source, requireCst(target).start) : lineStart(source, close);
  const indent = target ? indentationAt(source, requireCst(target).start) : `${indentationAt(source, close)}  `;
  return { ok: true, source: insertAt(source, insertionOffset, `${renderNamedAction(command.actionId, command.action, indent)}\n`) };
}

function updateAction(
  source: string,
  document: ParsedAnimFlowDocument,
  actionId: string,
  replacement: ActionDraft,
): PatchResult {
  const location = findAction(document, actionId);
  if (!location) return targetNotFound("action", actionId);
  const range = requireCst(location.action);
  const indent = indentationAt(source, range.start);
  const rendered = renderNamedAction(actionId, replacement, indent).slice(indent.length);
  return { ok: true, source: replaceRange(source, range, rendered) };
}

function removeAction(source: string, document: ParsedAnimFlowDocument, actionId: string): PatchResult {
  const location = findAction(document, actionId);
  if (!location) return targetNotFound("action", actionId);
  return { ok: true, source: replaceRange(source, removableStatementRange(source, requireCst(location.action)), "") };
}

function setNarration(
  source: string,
  document: ParsedAnimFlowDocument,
  sceneId: string,
  text: string | null,
): PatchResult {
  const scene = document.story.scenes.find((candidate) => candidate.name === sceneId);
  if (!scene) return targetNotFound("scene", sceneId);
  const narration = scene.statements.find(
    (statement): statement is SayStatement => statement.$type === "SayStatement",
  );
  if (narration) {
    const range = requireCst(narration);
    return text === null
      ? { ok: true, source: replaceRange(source, removableStatementRange(source, range), "") }
      : { ok: true, source: replaceRange(source, range, `say ${JSON.stringify(text)}`) };
  }
  if (text === null) return invalidCommand(`Scene ${sceneId} has no narration to remove.`);
  const sceneRange = cstRange(scene);
  if (!sceneRange) return missingCst("scene");
  const close = closingBraceOffset(source, sceneRange);
  if (close === undefined) return missingCst("scene closing brace");
  const insertionOffset = lineStart(source, close);
  const indent = `${indentationAt(source, close)}  `;
  return { ok: true, source: insertAt(source, insertionOffset, `${indent}say ${JSON.stringify(text)}\n`) };
}

function renderScene(
  command: Extract<AuthoringCommand, { readonly type: "scene.add" }>,
  indent: string,
): string {
  const bodyIndent = `${indent}  `;
  const statements: string[] = [];
  if (command.narration !== undefined) statements.push(`${bodyIndent}say ${JSON.stringify(command.narration)}`);
  for (const action of command.actions ?? []) {
    statements.push(renderNamedAction(action.actionId, action.action, bodyIndent));
  }
  const body = statements.length === 0 ? "" : `\n${statements.join("\n")}`;
  return `${indent}scene ${command.sceneId} ${JSON.stringify(command.title)} duration ${renderDuration(command.duration)} {${body}\n${indent}}`;
}

function findAction(document: ParsedAnimFlowDocument, actionId: string): ActionLocation | undefined {
  for (const scene of document.story.scenes) {
    const found = findActionInStatements(scene.statements, scene, actionId);
    if (found) return found;
  }
  return undefined;
}

function findActionInStatements(
  statements: readonly SceneStatement[],
  scene: Scene,
  actionId: string,
  parent?: SequenceStatement | StaggerStatement,
): ActionLocation | undefined {
  for (const statement of statements) {
    if (statement.$type !== "ActionStatement") continue;
    if (statement.name === actionId) return { action: statement, scene, statements, parent };
    if (statement.body.$type === "SequenceStatement" || statement.body.$type === "StaggerStatement") {
      const nested = findActionInStatements(statement.body.statements, scene, actionId, statement.body);
      if (nested) return nested;
    }
  }
  return undefined;
}

async function resolveSelection(source: string, id: string): Promise<AuthoringSelection | undefined> {
  const parsed = await parseAnimFlow(source);
  if (!parsed.ok) return undefined;
  try {
    for (const graph of parsed.value.graphs) {
      if (graph.name === id) return selectionFromNode(source, id, "graph", graph);
      const member = graph.members.find((candidate) => candidate.name === id);
      if (member) {
        return selectionFromNode(
          source,
          id,
          member.$type === "Node" ? "node" : "edge",
          member,
        );
      }
    }
    const overlay = parsed.value.overlays.find((candidate) => candidate.name === id);
    if (overlay) return selectionFromNode(source, id, "overlay", overlay);
    const scene = parsed.value.story.scenes.find((candidate) => candidate.name === id);
    if (scene) return selectionFromNode(source, id, "scene", scene);
    const action = findAction(parsed.value, id);
    return action ? selectionFromNode(source, id, "action", action.action) : undefined;
  } finally {
    await releaseAnimFlowDocument(parsed.value);
  }
}

function selectionFromNode(
  source: string,
  id: string,
  kind: AuthoringSelection["kind"],
  node: Graph | Node | Edge | Overlay | Scene | ActionStatement,
): AuthoringSelection {
  return { id, kind, range: sourceRange(source, requireCst(node)) };
}

function cstRange(node: { readonly $cstNode?: { readonly offset: number; readonly end: number } }): TextRange | undefined {
  const cst = node.$cstNode;
  return cst ? { start: cst.offset, end: cst.end } : undefined;
}

function requireCst(node: { readonly $cstNode?: { readonly offset: number; readonly end: number } }): TextRange {
  const range = cstRange(node);
  if (!range) throw new Error("Validated AnimFlow AST node is missing its CST range.");
  return range;
}

function closingBraceOffset(source: string, range: TextRange): number | undefined {
  const offset = source.lastIndexOf("}", Math.max(range.start, range.end - 1));
  return offset >= range.start ? offset : undefined;
}

function lineStart(source: string, offset: number): number {
  const newline = source.lastIndexOf("\n", Math.max(0, offset - 1));
  return newline === -1 ? 0 : newline + 1;
}

function lineEnd(source: string, offset: number): number {
  const newline = source.indexOf("\n", offset);
  return newline === -1 ? source.length : newline + 1;
}

function leadingCommentStart(source: string, offset: number): number {
  let cursor = lineStart(source, offset);
  while (cursor > 0) {
    const previousEnd = cursor - 1;
    const previousStart = lineStart(source, previousEnd);
    const previousLine = source.slice(previousStart, previousEnd).trim();
    if (previousLine.startsWith("//")) {
      cursor = previousStart;
      continue;
    }
    if (previousLine.endsWith("*/")) {
      let commentStart = previousStart;
      while (!source.slice(commentStart, lineEnd(source, commentStart)).includes("/*")) {
        if (commentStart === 0) break;
        commentStart = lineStart(source, commentStart - 1);
      }
      cursor = commentStart;
      continue;
    }
    break;
  }
  return cursor;
}

function indentationAt(source: string, offset: number): string {
  const start = lineStart(source, offset);
  const prefix = source.slice(start, offset);
  return /^\s*$/.test(prefix) ? prefix : "";
}

function lineBlockRange(source: string, range: TextRange): TextRange {
  return { start: lineStart(source, range.start), end: lineEnd(source, range.end) };
}

function removableStatementRange(source: string, range: TextRange): TextRange {
  const start = lineStart(source, range.start);
  const end = lineEnd(source, range.end);
  const before = source.slice(start, range.start);
  const after = source.slice(range.end, end).replace(/[\r\n]+$/, "");
  return /^\s*$/.test(before) && /^\s*$/.test(after) ? { start, end } : range;
}

function replaceRange(source: string, range: TextRange, replacement: string): string {
  return `${source.slice(0, range.start)}${replacement}${source.slice(range.end)}`;
}

function applyTextEdits(
  source: string,
  edits: readonly { readonly start: number; readonly end: number; readonly newText: string }[],
): string {
  return [...edits]
    .sort((left, right) => right.start - left.start || right.end - left.end)
    .reduce(
      (current, edit) => replaceRange(current, edit, edit.newText),
      source,
    );
}

function insertAt(source: string, offset: number, text: string): string {
  return `${source.slice(0, offset)}${text}${source.slice(offset)}`;
}

function normalizeInsertionIndex(index: number | undefined, length: number): number | undefined {
  if (index === undefined) return length;
  return Number.isInteger(index) && index >= 0 && index <= length ? index : undefined;
}

function identifier(value: string): boolean {
  return /^[_a-zA-Z][\w_]*$/.test(value);
}

function invalidIdentifier(kind: string, value: string): PatchResult {
  return invalidCommand(`${kind} ID ${JSON.stringify(value)} is not a valid AnimFlow identifier.`);
}

function invalidIndex(index: number | undefined): PatchResult {
  return invalidCommand(`Index ${String(index)} is outside the target collection.`);
}

function invalidCommand(message: string): PatchResult {
  return { ok: false, diagnostic: authoringDiagnostic(ANIMFLOW_DIAGNOSTIC_CODES.invalidAuthoringCommand, message) };
}

function targetNotFound(kind: string, id: string): PatchResult {
  return {
    ok: false,
    diagnostic: authoringDiagnostic(
      ANIMFLOW_DIAGNOSTIC_CODES.authoringTargetNotFound,
      `${kind} ${JSON.stringify(id)} was not found.`,
    ),
  };
}

function missingCst(label: string): PatchResult {
  return invalidCommand(`Cannot edit ${label} because its CST range is unavailable.`);
}

function authoringDiagnostic(code: Diagnostic["code"], message: string): Diagnostic {
  return { code, severity: "error", message, range: zeroRange() };
}

function zeroRange(): SourceRange {
  const position: SourcePosition = { offset: 0, line: 0, character: 0 };
  return { start: position, end: position };
}

function sourceRange(source: string, range: TextRange): SourceRange {
  return { start: positionAt(source, range.start), end: positionAt(source, range.end) };
}

function positionAt(source: string, offset: number): SourcePosition {
  const bounded = Math.max(0, Math.min(offset, source.length));
  const lines = source.slice(0, bounded).split("\n");
  return { offset: bounded, line: lines.length - 1, character: lines.at(-1)?.length ?? 0 };
}
