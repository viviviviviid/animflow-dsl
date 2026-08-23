import { describe, expect, test } from "vitest";
import fixture from "../fixtures/basic-render-plan.json";
import {
  actionId,
  assertValidRenderPlan,
  documentId,
  edgeId,
  elementHandle,
  freezeRenderPlan,
  graphId,
  hasErrors,
  nodeId,
  overlayId,
  sceneId,
  sourceHash,
  storyId,
  themeToken,
  validateRenderPlan,
  type Diagnostic,
  type RenderPlan,
} from "../src";

const validPlan = fixture as unknown as RenderPlan;

describe("branded contract constructors", () => {
  test("accept stable identifiers", () => {
    expect(documentId("checkoutDemo")).toBe("checkoutDemo");
    expect(graphId("checkout")).toBe("checkout");
    expect(storyId("main")).toBe("main");
    expect(sceneId("requestScene")).toBe("requestScene");
    expect(actionId("traceRequest")).toBe("traceRequest");
    expect(nodeId("api_2")).toBe("api_2");
    expect(edgeId("request")).toBe("request");
    expect(overlayId("retryNote")).toBe("retryNote");
    expect(themeToken("status.danger-strong")).toBe("status.danger-strong");
    expect(elementHandle(0)).toBe(0);
  });

  test("reject invalid identifiers, hashes, and handles", () => {
    expect(() => nodeId("2api")).toThrow("NodeId must match");
    expect(() => edgeId("request->api")).toThrow("EdgeId must match");
    expect(() => actionId("request.trace")).toThrow("ActionId must match");
    expect(() => themeToken("danger red")).toThrow("ThemeToken must match");
    expect(() => sourceHash("abc")).toThrow("64-character SHA-256");
    expect(() => elementHandle(-1)).toThrow("non-negative safe integer");
  });
});

describe("RenderPlan invariants", () => {
  test("accept the canonical JSON fixture", () => {
    expect(validateRenderPlan(validPlan)).toEqual([]);
    expect(() => assertValidRenderPlan(validPlan)).not.toThrow();
  });

  test("is deterministic and JSON-only", () => {
    const first = JSON.stringify(validPlan);
    const second = JSON.stringify(structuredClone(validPlan));

    expect(second).toBe(first);
    expect(first).not.toContain("createdAt");
    expect(first).not.toContain("updatedAt");
  });

  test("restores deep immutability after structured clone", () => {
    const cloned = structuredClone(validPlan);
    expect(Object.isFrozen(cloned)).toBe(false);

    const frozen = freezeRenderPlan(cloned);
    expect(frozen).toBe(cloned);
    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.scenes[0]?.tracks)).toBe(true);
  });

  test("rejects duplicate and non-dense element handles", () => {
    const invalid = structuredClone(validPlan) as RenderPlan;
    (invalid.elements as Array<{ handle: number }>)[1].handle = 0;

    const codes = validateRenderPlan(invalid).map((violation) => violation.code);
    expect(codes).toContain("MODEL_DUPLICATE_ELEMENT_HANDLE");
    expect(codes).toContain("MODEL_NON_DENSE_HANDLE");
  });

  test("rejects incomplete snapshots and tracks outside scenes", () => {
    const invalid = structuredClone(validPlan) as RenderPlan;
    (invalid.initial.elements as unknown[]).pop();
    (invalid.scenes[0].tracks as Array<{ startMs: number; durationMs: number }>)[0]
      .durationMs = 1200;

    const codes = validateRenderPlan(invalid).map((violation) => violation.code);
    expect(codes).toContain("MODEL_INCOMPLETE_SNAPSHOT");
    expect(codes).toContain("MODEL_TRACK_OUTSIDE_SCENE");
  });

  test("rejects mismatched plan duration", () => {
    const invalid = structuredClone(validPlan) as RenderPlan;
    (invalid as { durationMs: number }).durationMs = 999;

    expect(validateRenderPlan(invalid).map((violation) => violation.code)).toContain(
      "MODEL_DURATION_MISMATCH"
    );
  });

  test("rejects incomplete or dangling authoring provenance", () => {
    const invalid = structuredClone(validPlan) as RenderPlan;
    (invalid as unknown as { authoring: unknown }).authoring = {
      sourceVersion: "2.1",
      actions: [
        {
          id: actionId("traceRequest"),
          sceneId: invalid.scenes[0].id,
          parentActionId: actionId("missingParent"),
          kind: "draw",
          range: {
            start: { offset: 10, line: 1, character: 0 },
            end: { offset: 20, line: 1, character: 10 },
          },
        },
      ],
    };

    const codes = validateRenderPlan(invalid).map((violation) => violation.code);
    expect(codes).toContain("MODEL_UNKNOWN_PARENT_ACTION");
    expect(codes).toContain("MODEL_MISSING_TRACK_ACTION");
  });
});

describe("diagnostic result helpers", () => {
  test("detect errors without treating warnings as errors", () => {
    const warning = {
      code: "AF501",
      severity: "warning",
      message: "Possible label collision",
      range: {
        start: { offset: 0, line: 0, character: 0 },
        end: { offset: 1, line: 0, character: 1 },
      },
    } satisfies Diagnostic;
    const error = { ...warning, code: "AF210", severity: "error" } satisfies Diagnostic;

    expect(hasErrors([warning])).toBe(false);
    expect(hasErrors([warning, error])).toBe(true);
  });
});
