import { describe, expect, test } from "vitest";
import { measurePath, pointAtPathProgress, type CompiledPath } from "../src";

describe("arc-length path sampling", () => {
  const path: CompiledPath = { commands: [{ kind: "move", to: { x: 0, y: 0 } }, { kind: "line", to: { x: 100, y: 0 } }, { kind: "line", to: { x: 100, y: 10 } }], length: 110, startTangent: { x: 1, y: 0 }, endTangent: { x: 0, y: 1 } };
  test("places halfway on the actual length rather than the middle segment", () => {
    expect(pointAtPathProgress(path, 0.5)).toEqual({ x: 55, y: 0 });
    expect(measurePath(path.commands)).toBe(110);
  });
  test("clamps endpoints, including degenerate segments", () => {
    expect(pointAtPathProgress(path, -1)).toEqual({ x: 0, y: 0 });
    expect(pointAtPathProgress(path, 2)).toEqual({ x: 100, y: 10 });
    expect(pointAtPathProgress({ commands: [path.commands[0]!, path.commands[0]!] }, 0.5)).toEqual({ x: 0, y: 0 });
  });
});
