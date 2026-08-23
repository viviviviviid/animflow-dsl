import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { renderToStaticMarkup } from "react-dom/server";

import { AnimFlowPlayer, ANIMFLOW_SDK_VERSION, type AnimFlowDiagnostic } from "../src/index.js";

type WorkerMode = "invalid" | "mismatch" | "story";
let mode: WorkerMode;

class FakeWorker {
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: { message?: string }) => void) | null = null;
  constructor() {
    queueMicrotask(() => this.onmessage?.({ data: mode === "mismatch" ? { type: "ready", protocolVersion: 99, sourceVersions: [], compilerVersion: "wrong", renderPlanVersion: 99 } : { type: "ready", protocolVersion: 1, sourceVersions: ["2", "2.1"], compilerVersion: "0.0.0", renderPlanVersion: 2 } }));
  }
  postMessage(message: unknown) {
    const jobId = (message as { jobId: number }).jobId;
    queueMicrotask(() => this.onmessage?.({ data: mode === "invalid" ? { type: "result", jobId, ok: false, diagnostics: [{ code: "AF101", severity: "error", message: "Expected a document.", range: zeroRange() }] } : { type: "result", jobId, ok: true, diagnostics: [], plan: { version: 2, documentId: "doc", sourceHash: "a".repeat(64), storyId: "actual", seed: 1, durationMs: 0, canvas: { width: 1, height: 1, viewport: { x: 0, y: 0, width: 1, height: 1 } }, theme: { name: "default", tokens: {} }, symbols: [], elements: [], geometry: [], initial: { elements: [], camera: { x: 0, y: 0, width: 1, height: 1 } }, scenes: [] } } }));
  }
  terminate() {}
}

beforeEach(() => {
  vi.stubGlobal("Worker", FakeWorker);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("public React façade", () => {
  it("renders a deterministic SSR placeholder without touching Worker", () => {
    const worker = globalThis.Worker;
    vi.stubGlobal("Worker", undefined);
    const markup = renderToStaticMarkup(<AnimFlowPlayer source="animflow 2" ssrPlaceholder="Lecture preview" />);
    expect(markup).toContain('data-animflow-sdk="loading"');
    expect(markup).toContain("Lecture preview");
    expect(ANIMFLOW_SDK_VERSION).toBe("0.1.0");
    vi.stubGlobal("Worker", worker);
  });

  it("surfaces invalid source through the stable diagnostic callback", async () => {
    mode = "invalid";
    const diagnostics: AnimFlowDiagnostic[] = [];
    let renderer!: ReactTestRenderer;
    await act(async () => { renderer = create(<AnimFlowPlayer onDiagnostic={(diagnostic) => diagnostics.push(diagnostic)} source="invalid" />); await flush(); });
    expect(renderer.root.findByProps({ "data-animflow-sdk": "error" }).props.role).toBe("alert");
    expect(diagnostics).toMatchObject([{ code: "AF101", severity: "error" }]);
    renderer.unmount();
  });

  it("stops on worker protocol mismatch instead of silently compiling", async () => {
    mode = "mismatch";
    const diagnostics: AnimFlowDiagnostic[] = [];
    let renderer!: ReactTestRenderer;
    await act(async () => { renderer = create(<AnimFlowPlayer onDiagnostic={(diagnostic) => diagnostics.push(diagnostic)} source="source" />); await flush(); });
    expect(diagnostics[0]?.code).toBe("AF703");
    expect(renderer.toJSON()).toMatchObject({ props: { "data-animflow-sdk": "error" } });
    renderer.unmount();
  });

  it("treats story as a single-story assertion", async () => {
    mode = "story";
    const diagnostics: AnimFlowDiagnostic[] = [];
    let renderer!: ReactTestRenderer;
    await act(async () => { renderer = create(<AnimFlowPlayer onDiagnostic={(diagnostic) => diagnostics.push(diagnostic)} source="source" story="expected" />); await flush(); });
    expect(diagnostics[0]).toMatchObject({ code: "AF305", message: expect.stringContaining("exactly one story") });
    expect(renderer.root.findByProps({ "data-animflow-sdk": "error" })).toBeDefined();
    renderer.unmount();
  });
});

async function flush(): Promise<void> {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function zeroRange() {
  return { start: { offset: 0, line: 0, character: 0 }, end: { offset: 0, line: 0, character: 0 } };
}
