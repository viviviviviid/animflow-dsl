import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { calculateFlowchartLayout, parseDsl } = require("../dist/core.js");

function parse(source) {
  const result = parseDsl(source);
  assert.equal(result.success, true, result.errors?.[0]?.message);
  assert.ok(result.data);
  return result.data;
}

test("parses inline Mermaid node definitions in chained edges", () => {
  const data = parse(`flowchart LR
    A[Start] --> B[Process] --> C[End]`);

  assert.deepEqual(
    data.nodes.map(({ id, label }) => ({ id, label })),
    [
      { id: "A", label: "Start" },
      { id: "B", label: "Process" },
      { id: "C", label: "End" },
    ]
  );
  assert.deepEqual(
    data.edges.map(({ from, to }) => ({ from, to })),
    [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
    ]
  );
});

test("replaces an implicit node with its later explicit definition", () => {
  const data = parse(`flowchart TD
    A --> B
    A([Explicit start])
    B{Decision}`);

  assert.deepEqual(
    data.nodes.map(({ id, label, shape }) => ({ id, label, shape })),
    [
      { id: "A", label: "Explicit start", shape: "terminator" },
      { id: "B", label: "Decision", shape: "diamond" },
    ]
  );
});

test("parses documented camera syntax, arrays, styles, and config", () => {
  const data = parse(`flowchart TB
    A((Start))

  @animation
    step 1: camera focus A
      duration: 1s
    step 2: move A
      by: [50, 0]
  @end

  @style
    A:
      fill: #ffffff
      stroke-width: 3px
  @end

  @config
    autoplay: true
    loop: true
    speed: 1.5
  @end`);

  assert.equal(data.metadata.direction, "TB");
  assert.deepEqual(data.animations[0].targets, ["A"]);
  assert.equal(data.animations[0].properties.cameraAction, "focus");
  assert.deepEqual(data.animations[1].properties.by, [50, 0]);
  assert.deepEqual(data.nodes[0].style, { fill: "#ffffff", strokeWidth: 3 });
  assert.deepEqual(data.config, { autoplay: true, loop: true, speed: 1.5 });
});

test("rejects invalid and unsupported DSL instead of returning an empty success", () => {
  const result = parseDsl("this is not a flowchart");

  assert.equal(result.success, false);
  assert.equal(result.errors?.[0]?.line, 1);
  assert.match(result.errors?.[0]?.message ?? "", /Unsupported flowchart syntax/);
});

test("calculates circle and diamond edge endpoints on visual boundaries", () => {
  const data = parse(`flowchart LR
    A((Circle)) --> B{Decision}`);
  const laidOut = calculateFlowchartLayout(data.nodes, data.edges, data.metadata.direction);
  const [circle, diamond] = laidOut.nodes;
  const points = laidOut.edges[0].points;
  assert.ok(circle.position && circle.width && points?.length);
  assert.ok(diamond.position && diamond.width && diamond.height);

  const start = points[0];
  const circleDistance = Math.hypot(
    start.x - circle.position.x,
    start.y - circle.position.y
  );
  assert.ok(Math.abs(circleDistance - circle.width / 2) < 0.001);

  const end = points.at(-1);
  assert.ok(end);
  const diamondBoundary =
    Math.abs(end.x - diamond.position.x) / (diamond.width / 2) +
    Math.abs(end.y - diamond.position.y) / (diamond.height / 2);
  assert.ok(Math.abs(diamondBoundary - 1) < 0.001);
});
