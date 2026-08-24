import { compileAnimFlow } from "@animflow-dsl/compiler";
import { describe, expect, it } from "vitest";

import { AuthoringSession, type ActionDraft, type AuthoringCommand } from "../src/index.js";

const SOURCE = `animflow 2.1

canvas {
  size 1280 by 720
  theme light
  background surface
}

graph lesson {
  layout flow right {
    nodeGap 48
    rankGap 80
    routing orthogonal
  }
  node client "Client" {
    shape rounded
    tone neutral
  }
  node server "Server" {
    shape rectangle
    tone primary
  }
  edge request: client.e -> server.w {
    label "request"
    line solid 2
    arrow end
    tone primary
    routing orthogonal
  }
}

story lecture {
  initial {
    hide lesson.*
    camera fit(lesson) padding 40
  }
  // keep-before-scene
  scene intro "Introduction" duration 2s {
    // keep-before-action
    action reveal: show lesson.* via fade
    action traceRequest: draw request via trace
    say "Original narration"
    // keep-after-action
  }
  scene outro "Conclusion" duration 1s {
    action clear: clearHighlight server
    say "Done"
  }
}
`;

const HIGHLIGHT = {
  kind: "highlight" as const,
  target: "server",
  tone: "accent",
  effect: "pulse" as const,
};

describe("AuthoringSession", () => {
  it("applies canvas and topology CRUD commands as compiler-validated transactions", async () => {
    const session = await AuthoringSession.create(SOURCE);

    await expectApplied(session, {
      type: "canvas.update",
      baseRevision: 0,
      replacement: { width: 1920, height: 1080, theme: "dark", background: "surface" },
    });
    await expectApplied(session, {
      type: "graph.add",
      baseRevision: 1,
      graphId: "details",
      layout: { direction: "down" },
    });
    await expectApplied(session, {
      type: "graph.update",
      baseRevision: 2,
      graphId: "details",
      layout: { direction: "left", nodeGap: 24, rankGap: 40, routing: "curve" },
    });
    await expectApplied(session, {
      type: "node.add",
      baseRevision: 3,
      graphId: "lesson",
      nodeId: "cache",
      node: { label: "Cache", shape: "database", tone: "accent" },
    });
    await expectApplied(session, {
      type: "edge.add",
      baseRevision: 4,
      graphId: "lesson",
      edgeId: "cacheWrite",
      edge: {
        from: { node: "server", port: "e" },
        to: { node: "cache", port: "w" },
        label: "write",
        line: { pattern: "dashed", width: 3 },
        arrow: "end",
        tone: "accent",
        routing: "curve",
        flow: "particles",
      },
    });
    await expectApplied(session, {
      type: "node.update",
      baseRevision: 5,
      nodeId: "cache",
      replacement: { label: "Shared Cache", shape: "database", tone: "primary" },
    });
    await expectApplied(session, {
      type: "edge.update",
      baseRevision: 6,
      edgeId: "cacheWrite",
      replacement: {
        from: { node: "client", port: "s" },
        to: { node: "cache", port: "n" },
        arrow: "both",
        flow: "glow",
      },
    });
    await expectApplied(session, {
      type: "overlay.add",
      baseRevision: 7,
      overlayId: "cacheNote",
      overlay: {
        kind: "callout",
        anchor: { node: "cache", port: "e" },
        text: "Warm path",
        width: 280,
        tone: "accent",
      },
    });
    await expectApplied(session, {
      type: "overlay.update",
      baseRevision: 8,
      overlayId: "cacheNote",
      replacement: {
        kind: "badge",
        anchor: { node: "cache", port: "s" },
        text: "HIT",
      },
    });
    await expectApplied(session, { type: "overlay.remove", baseRevision: 9, overlayId: "cacheNote" });
    await expectApplied(session, { type: "edge.remove", baseRevision: 10, edgeId: "cacheWrite" });
    await expectApplied(session, { type: "node.remove", baseRevision: 11, nodeId: "cache" });
    await expectApplied(session, { type: "graph.remove", baseRevision: 12, graphId: "details" });

    expect(session.state.documentRevision).toBe(13);
    expect(session.state.source).toContain("size 1920 by 1080");
    expect(session.state.source).not.toContain("graph details");
    expect(session.state.source).not.toContain("cacheWrite");
    expect((await compileAnimFlow(session.state.source)).ok).toBe(true);
  });

  it("renames a declaration and every linked reference atomically", async () => {
    const session = await AuthoringSession.create(SOURCE);
    await session.select("server");

    await expectApplied(session, {
      type: "declaration.rename",
      baseRevision: 0,
      kind: "node",
      id: "server",
      newId: "apiServer",
    });

    expect(session.state.selection).toMatchObject({ id: "apiServer", kind: "node" });
    expect(session.state.source).toContain('node apiServer "Server"');
    expect(session.state.source).toContain("client.e -> apiServer.w");
    expect(session.state.source).toContain("clearHighlight apiServer");
    expect(session.state.source).not.toMatch(/\bserver\b/);
    expect((await compileAnimFlow(session.state.source)).ok).toBe(true);

    const undone = await session.undo({ baseRevision: 1 });
    expect(undone.status).toBe("applied-valid");
    expect(session.state.selection).toMatchObject({ id: "server", kind: "node" });
    expect(session.state.source).toBe(SOURCE);
  });

  it("rejects topology mutations that would leave dangling or duplicate references", async () => {
    const session = await AuthoringSession.create(SOURCE);
    const initial = session.state.source;

    const referencedRemoval = await session.execute({
      type: "node.remove",
      baseRevision: 0,
      nodeId: "server",
    });
    expect(referencedRemoval.status).toBe("rejected");
    expect(referencedRemoval.diagnostics.some((diagnostic) => diagnostic.code === "AF210")).toBe(true);

    const duplicateRename = await session.execute({
      type: "declaration.rename",
      baseRevision: 0,
      kind: "node",
      id: "server",
      newId: "client",
    });
    expect(duplicateRename.status).toBe("rejected");
    expect(duplicateRename.diagnostics.some((diagnostic) => diagnostic.code === "AF201")).toBe(true);
    expect(session.state).toMatchObject({ source: initial, documentRevision: 0, canUndo: false });
  });

  it("applies all top-level scene, action, and narration commands as valid transactions", async () => {
    const session = await AuthoringSession.create(SOURCE);
    expect(Object.isFrozen(session.state.plan)).toBe(true);

    await expectApplied(session, {
      type: "scene.add",
      baseRevision: 0,
      sceneId: "details",
      title: "Details",
      duration: { value: 1500, unit: "ms" },
      index: 1,
      narration: "A closer look",
      actions: [{ actionId: "focusDetails", action: HIGHLIGHT }],
    });
    await expectApplied(session, {
      type: "scene.move",
      baseRevision: 1,
      sceneId: "details",
      index: 2,
    });
    await expectApplied(session, {
      type: "action.add",
      baseRevision: 2,
      sceneId: "intro",
      actionId: "cameraServer",
      action: {
        kind: "camera",
        operation: "focus",
        targets: { kind: "named", target: "server" },
        padding: 24,
      },
      index: 1,
    });
    await expectApplied(session, {
      type: "action.update",
      baseRevision: 3,
      actionId: "traceRequest",
      replacement: { kind: "draw", edge: "request", flow: "particles" },
    });
    await expectApplied(session, {
      type: "narration.set",
      baseRevision: 4,
      sceneId: "intro",
      text: "Updated narration",
    });
    await expectApplied(session, {
      type: "action.remove",
      baseRevision: 5,
      actionId: "cameraServer",
    });
    await expectApplied(session, {
      type: "scene.remove",
      baseRevision: 6,
      sceneId: "outro",
    });

    expect(session.state.documentRevision).toBe(7);
    expect(session.state.source).toContain("scene details \"Details\" duration 1500ms");
    expect(session.state.source).toContain("action traceRequest: draw request via trace flow particles");
    expect(session.state.source).toContain('say "Updated narration"');
    expect(session.state.source).not.toContain("scene outro");
    expect((await compileAnimFlow(session.state.source)).ok).toBe(true);
  });

  it("supports nested sequence and stagger actions and child insertion", async () => {
    const session = await AuthoringSession.create(SOURCE);
    await expectApplied(session, {
      type: "action.update",
      baseRevision: 0,
      actionId: "reveal",
      replacement: {
        kind: "sequence",
        statements: [
          {
            kind: "action",
            actionId: "showLesson",
            action: {
              kind: "show",
              targets: { kind: "named", target: "lesson", wildcard: true },
              transition: { kind: "slide", from: "left", distance: 40 },
            },
          },
          {
            kind: "action",
            actionId: "pulseServer",
            action: {
              kind: "stagger",
              interval: { value: 200, unit: "ms" },
              statements: [{ kind: "action", actionId: "highlightServer", action: HIGHLIGHT }],
            },
          },
        ],
      },
    });
    await expectApplied(session, {
      type: "action.add",
      baseRevision: 1,
      sceneId: "intro",
      parentActionId: "reveal",
      actionId: "fitLesson",
      action: {
        kind: "camera",
        operation: "fit",
        targets: { kind: "list", elements: ["client", "server"] },
      },
      index: 1,
    });

    expect(session.state.source).toContain("action reveal: sequence {");
    expect(session.state.source).toContain("action fitLesson: camera fit([client, server])");
    expect(session.state.source).toContain("action pulseServer: stagger 200ms {");
  });

  it.each<[string, ActionDraft]>([
    ["show", { kind: "show", targets: { kind: "named", target: "lesson", wildcard: true }, transition: { kind: "pop" } }],
    ["hide", { kind: "hide", targets: { kind: "list", elements: ["client", "server"] }, transition: { kind: "flip" } }],
    ["draw", { kind: "draw", edge: "request", flow: "lightning" }],
    ["highlight", HIGHLIGHT],
    ["clear-highlight", { kind: "clear-highlight", target: "server" }],
    ["camera", { kind: "camera", operation: "fit", targets: { kind: "named", target: "lesson" }, padding: 16 }],
    ["sequence", { kind: "sequence", statements: [{ kind: "action", actionId: "childClear", action: { kind: "clear-highlight", target: "server" } }] }],
    ["stagger", { kind: "stagger", interval: { value: 100, unit: "ms" }, statements: [{ kind: "action", actionId: "childHide", action: { kind: "hide", targets: { kind: "named", target: "server" }, transition: { kind: "fade" } } }] }],
  ])("round-trips the %s action through the compiler", async (_name, replacement) => {
    const actionSource = SOURCE.replace(
      "    action reveal: show lesson.* via fade\n    action traceRequest: draw request via trace",
      "    action editable: clearHighlight client",
    );
    const session = await AuthoringSession.create(actionSource);
    const result = await session.execute({
      type: "action.update",
      baseRevision: 0,
      actionId: "editable",
      replacement,
    });
    expect(result.status, JSON.stringify(result.diagnostics)).toBe("applied-valid");
    expect((await compileAnimFlow(session.state.source)).ok).toBe(true);
  });

  it("adds, updates, and removes narration without touching neighboring actions", async () => {
    const withoutNarration = SOURCE.replace('    say "Done"\n', "");
    const session = await AuthoringSession.create(withoutNarration);
    await expectApplied(session, {
      type: "narration.set",
      baseRevision: 0,
      sceneId: "outro",
      text: "Added",
    });
    await expectApplied(session, {
      type: "narration.set",
      baseRevision: 1,
      sceneId: "outro",
      text: null,
    });
    expect(session.state.source).not.toContain('say "Added"');
    expect(session.state.source).toContain("action clear: clearHighlight server");
  });

  it("keeps leading scene comments attached during insertion and reordering", async () => {
    const session = await AuthoringSession.create(SOURCE);
    await expectApplied(session, {
      type: "scene.add",
      baseRevision: 0,
      sceneId: "preface",
      title: "Preface",
      duration: { value: 1, unit: "s" },
      index: 0,
    });
    expect(session.state.source.indexOf("scene preface")).toBeLessThan(
      session.state.source.indexOf("// keep-before-scene"),
    );
    expect(session.state.source).toContain("// keep-before-scene\n  scene intro");

    await expectApplied(session, {
      type: "scene.move",
      baseRevision: 1,
      sceneId: "intro",
      index: 2,
    });
    expect(session.state.source).toContain("// keep-before-scene\n  scene intro");
    expect(session.state.source.indexOf("scene outro")).toBeLessThan(
      session.state.source.indexOf("// keep-before-scene"),
    );
  });

  it("rejects conflicts, missing targets, invalid indices, and invalid compiled patches without mutation", async () => {
    const session = await AuthoringSession.create(SOURCE);
    const initial = session.state.source;

    const conflict = await session.execute({
      type: "narration.set",
      baseRevision: 3,
      sceneId: "intro",
      text: "No",
    });
    expect(conflict).toMatchObject({ status: "rejected", reason: "revision-conflict", currentRevision: 0 });

    const missing = await session.execute({
      type: "action.remove",
      baseRevision: 0,
      actionId: "missing",
    });
    expect(missing.status).toBe("rejected");
    expect(missing.diagnostics[0]?.code).toBe("AF712");

    const duplicate = await session.execute({
      type: "action.add",
      baseRevision: 0,
      sceneId: "intro",
      actionId: "traceRequest",
      action: HIGHLIGHT,
    });
    expect(duplicate).toMatchObject({ status: "rejected", reason: "invalid-semantic-command" });
    expect(session.state).toMatchObject({ source: initial, documentRevision: 0, canUndo: false });
  });

  it("serializes concurrent commands so the stale command cannot overwrite the winner", async () => {
    const session = await AuthoringSession.create(SOURCE);
    const [first, second] = await Promise.all([
      session.execute({
        type: "narration.set",
        baseRevision: 0,
        sceneId: "intro",
        text: "First writer",
      }),
      session.execute({
        type: "narration.set",
        baseRevision: 0,
        sceneId: "intro",
        text: "Second writer",
      }),
    ]);

    expect(first.status).toBe("applied-valid");
    expect(second).toMatchObject({ status: "rejected", reason: "revision-conflict", currentRevision: 1 });
    expect(second.diagnostics[0]?.code).toBe("AF710");
    expect(session.state.source).toContain('say "First writer"');
    expect(session.state.source).not.toContain("Second writer");
    expect(session.state.documentRevision).toBe(1);
  });

  it("allows invalid direct-source drafts while retaining the last valid plan", async () => {
    const session = await AuthoringSession.create(SOURCE);
    const plan = session.state.plan;
    const result = await session.execute({
      type: "source.replace",
      baseRevision: 0,
      source: `${SOURCE}\nnot valid`,
    });

    expect(result).toMatchObject({
      status: "applied-invalid-draft",
      documentRevision: 1,
      lastValidPlanRevision: 0,
    });
    expect(session.state.plan).toBe(plan);
    expect(session.state.planRevision).toBeUndefined();
    expect(session.state.canUndo).toBe(true);

    const undo = await session.undo({ baseRevision: 1 });
    expect(undo).toMatchObject({ status: "applied-valid", documentRevision: 2 });
    expect(session.state.source).toBe(SOURCE);
    const redo = await session.redo({ baseRevision: 2 });
    expect(redo).toMatchObject({ status: "applied-invalid-draft", documentRevision: 3 });
    expect(session.state.source).toBe(`${SOURCE}\nnot valid`);
  });

  it("undoes and redoes exact source snapshots with monotonic revisions and selection restoration", async () => {
    const session = await AuthoringSession.create(SOURCE);
    const selected = await session.select("traceRequest");
    expect(selected?.kind).toBe("action");
    const applied = await session.execute({
      type: "action.update",
      baseRevision: 0,
      actionId: "traceRequest",
      replacement: HIGHLIGHT,
    });
    expect(applied.status).toBe("applied-valid");
    const changed = session.state.source;
    expect(session.state.selection?.id).toBe("traceRequest");

    const undone = await session.undo({ baseRevision: 1 });
    expect(undone).toMatchObject({ status: "applied-valid", documentRevision: 2, transactionId: "tx-2" });
    expect(session.state.source).toBe(SOURCE);
    expect(session.state.selection?.id).toBe("traceRequest");

    const redone = await session.redo({ baseRevision: 2 });
    expect(redone).toMatchObject({ status: "applied-valid", documentRevision: 3, transactionId: "tx-3" });
    expect(session.state.source).toBe(changed);
    expect(session.state.planRevision).toBe(3);
  });

  it("maps canvas element IDs to current source ranges", async () => {
    const session = await AuthoringSession.create(SOURCE);
    const node = await session.select("server");
    expect(node).toMatchObject({ id: "server", kind: "node" });
    expect(SOURCE.slice(node!.range.start.offset, node!.range.end.offset)).toContain('node server "Server"');

    const edge = await session.select("request");
    expect(edge).toMatchObject({ id: "request", kind: "edge" });
    expect(SOURCE.slice(edge!.range.start.offset, edge!.range.end.offset)).toContain("edge request:");
  });

  it("requires version 2.1 for semantic visual commands", async () => {
    const v2 = SOURCE.replace("animflow 2.1", "animflow 2").replaceAll(/action [_a-zA-Z][\w_]*: /g, "");
    const session = await AuthoringSession.create(v2);
    const result = await session.execute({
      type: "narration.set",
      baseRevision: 0,
      sceneId: "intro",
      text: "Blocked",
    });
    expect(result.status).toBe("rejected");
    expect(result.diagnostics[0]?.code).toBe("AF713");
  });

  it("preserves unrelated comments and formatting in 30 golden source variants", async () => {
    for (let index = 0; index < 30; index += 1) {
      const marker = `// golden-${index}`;
      const source = SOURCE
        .replace("canvas {", `${marker}\ncanvas${" ".repeat((index % 4) + 1)}{`)
        .replace("// keep-after-action", `// keep-after-action-${index}`);
      const session = await AuthoringSession.create(source);
      const result = await session.execute({
        type: "action.update",
        baseRevision: 0,
        actionId: "traceRequest",
        replacement: { kind: "draw", edge: "request", flow: index % 2 === 0 ? "glow" : "dash" },
      });
      expect(result.status, `golden ${index}`).toBe("applied-valid");
      const expectedFlow = index % 2 === 0 ? "glow" : "dash";
      expect(session.state.source).toBe(
        source.replace(
          "action traceRequest: draw request via trace",
          `action traceRequest: draw request via trace flow ${expectedFlow}`,
        ),
      );
      expect(session.state.source).toContain(marker);
      expect(session.state.source).toContain(`canvas${" ".repeat((index % 4) + 1)}{`);
      expect(session.state.source).toContain(`// keep-after-action-${index}`);
      expect(session.state.source).toContain("// keep-before-action");
    }
  });

  it("produces identical output for the same deterministic 100-command sequence", async () => {
    const left = await AuthoringSession.create(SOURCE);
    const right = await AuthoringSession.create(SOURCE);
    for (let index = 0; index < 100; index += 1) {
      const command: AuthoringCommand = {
        type: "action.update",
        baseRevision: index,
        actionId: "traceRequest",
        replacement: {
          kind: "draw",
          edge: "request",
          flow: index % 3 === 0 ? "particles" : index % 3 === 1 ? "dash" : "glow",
        },
      };
      expect((await left.execute(command)).status).toBe("applied-valid");
      expect((await right.execute(command)).status).toBe("applied-valid");
    }
    expect(left.state.source).toBe(right.state.source);
    expect(left.state.plan?.sourceHash).toBe(right.state.plan?.sourceHash);
    expect(left.state.documentRevision).toBe(100);
  });
});

async function expectApplied(session: AuthoringSession, command: AuthoringCommand): Promise<void> {
  const result = await session.execute(command);
  expect(result, JSON.stringify(result.diagnostics)).toMatchObject({ status: "applied-valid" });
}
