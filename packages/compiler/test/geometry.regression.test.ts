import { describe, expect, test } from "vitest";
import { flattenPath, pointAtPathProgress, type EdgeGeometry, type NodeGeometry } from "@animflow-dsl/model";
import { compileAnimFlow } from "../src/index.js";
import { routeConnection } from "../src/routing.js";

const document = (graph: string, direction = "right") => `animflow 2.2
canvas { size 1600 by 900 theme signalDesk background surface }
graph pipeline { layout flow ${direction} { nodeGap 52 rankGap 110 routing orthogonal }
${graph}
}
story main { initial { show pipeline.* camera fit(pipeline) padding 40 }
scene overview "Overview" duration 1s { say "Overview" } }`;

async function compile(graph: string, direction = "right") {
  const result = await compileAnimFlow(document(graph, direction));
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  return result.value;
}

describe("connection geometry regressions", () => {
  test("routes through a narrow exit without intersecting the next node", () => {
    const path = routeConnection("orthogonal", { x: 140, y: 36 }, { x: 450, y: 36 }, { x: 1, y: 0 }, { x: -1, y: 0 }, [{ x: 0, y: 0, width: 140, height: 72 }, { x: 157, y: 0, width: 80, height: 72 }, { x: 450, y: 0, width: 140, height: 72 }]);
    for (let step = 0; step <= 100; step += 1) {
      const point = pointAtPathProgress(path, step / 100);
      expect(point.x > 157 && point.x < 237 && point.y > 0 && point.y < 72).toBe(false);
    }
  });
  test("separates self loops and avoids a neighboring node", () => {
    const obstacles = [{ x: 0, y: 0, width: 140, height: 72 }, { x: 200, y: 0, width: 140, height: 72 }];
    const paths = [-18, 18].map((lane) => routeConnection("orthogonal", { x: 140, y: 36 }, { x: 140, y: 36 }, { x: 1, y: 0 }, { x: 1, y: 0 }, obstacles, lane, true));
    expect(paths[0]!.commands).not.toEqual(paths[1]!.commands);
    for (const path of paths) for (let step = 0; step <= 100; step += 1) {
      const point = pointAtPathProgress(path, step / 100);
      expect(point.x > 200 && point.x < 340 && point.y > 0 && point.y < 72).toBe(false);
    }
  });
  test.each([
    ["right", "e", "w", 1, 0], ["left", "w", "e", -1, 0],
    ["down", "s", "n", 0, 1], ["up", "n", "s", 0, -1],
  ] as const)("curves respect %s flow ports", async (direction, from, to, x, y) => {
    const plan = await compile(`node a "A" {} node b "B" {}
edge link: a.${from} -> b.${to} { routing curve }`, direction);
    const edge = plan.geometry.find((item): item is EdgeGeometry => item.kind === "edge")!;
    expect(edge.path.startTangent).toEqual({ x, y });
    expect(edge.path.endTangent).toEqual({ x, y });
  });

  test("lays out a feedback cycle across ranks instead of collapsing it into one column", async () => {
    const plan = await compile(`node a "A" {} node b "B" {} node c "C" {}
edge ab: a.e -> b.w {} edge bc: b.e -> c.w {} edge ca: c.s -> a.s {}`);
    const nodes = plan.geometry.filter((item): item is NodeGeometry => item.kind === "node");
    expect(nodes[0]!.bounds.x).toBeLessThan(nodes[1]!.bounds.x);
    expect(nodes[1]!.bounds.x).toBeLessThan(nodes[2]!.bounds.x);
  });

  test("routes a same-port self loop outside its node and includes the route in camera fit", async () => {
    const plan = await compile('node retry "Retry" {} edge again: retry.e -> retry.e {}');
    const node = plan.geometry.find((item): item is NodeGeometry => item.kind === "node")!;
    const edge = plan.geometry.find((item): item is EdgeGeometry => item.kind === "edge")!;
    expect(edge.path.length).toBeGreaterThan(node.bounds.height);
    const points = flattenPath(edge.path);
    expect(points.every((point) => !(point.x > node.bounds.x && point.x < node.bounds.x + node.bounds.width && point.y > node.bounds.y && point.y < node.bounds.y + node.bounds.height))).toBe(true);
    const view = plan.initial.camera.viewBox;
    expect(points.every((point) => point.x >= view.x && point.x <= view.x + view.width && point.y >= view.y && point.y <= view.y + view.height)).toBe(true);
  });

  test("avoids an intervening pinned node", async () => {
    const plan = await compile(`node a "A" { position x 200 y 200 pin }
node obstacle "Obstacle" { position x 480 y 200 pin }
node b "B" { position x 760 y 200 pin }
edge link: a.e -> b.w {}`);
    const blocker = (plan.geometry[1] as NodeGeometry).bounds;
    const edge = plan.geometry.find((item): item is EdgeGeometry => item.kind === "edge")!;
    for (let step = 0; step <= 200; step += 1) {
      const point = pointAtPathProgress(edge.path, step / 200);
      expect(point.x > blocker.x && point.x < blocker.x + blocker.width && point.y > blocker.y && point.y < blocker.y + blocker.height).toBe(false);
    }
  });

  test("separates parallel connections", async () => {
    const plan = await compile('node a "A" {} node b "B" {} edge request: a.e -> b.w {} edge response: a.e -> b.w {}');
    const edges = plan.geometry.filter((item): item is EdgeGeometry => item.kind === "edge");
    expect(edges[0]!.path.commands).not.toEqual(edges[1]!.path.commands);
  });

  test("wraps long multilingual node labels without losing explicit line breaks", async () => {
    const label = "결제 요청을 검증하고 데이터베이스에 저장하는 아주 긴 처리 단계\\n결과 확인";
    const plan = await compile(`node a "${label}" { shape diamond }`);
    const node = plan.geometry[0] as NodeGeometry;
    expect(node.label.lines.length).toBeGreaterThan(2);
    expect(node.label.lines.at(-1)).toBe("결과 확인");
    expect(node.bounds.height).toBeGreaterThan(72);
    expect(node.label.lines.join("")).not.toContain("\\n");
  });
});
