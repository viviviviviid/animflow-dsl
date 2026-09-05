import { measurePath, flattenPath, type CompiledPath, type EdgeRouting, type PathCommand, type PortName, type Rect, type Vec2 } from "@animflow-dsl/model";

export function portDirection(bounds: Rect, port: PortName, toward: Vec2): Vec2 {
  const dx = toward.x - (bounds.x + bounds.width / 2);
  const dy = toward.y - (bounds.y + bounds.height / 2);
  const side = port === "auto" ? Math.abs(dx) >= Math.abs(dy) ? dx >= 0 ? "e" : "w" : dy >= 0 ? "s" : "n" : port;
  return side === "e" ? { x: 1, y: 0 } : side === "w" ? { x: -1, y: 0 } : side === "s" ? { x: 0, y: 1 } : { x: 0, y: -1 };
}

/** Route from the outward source normal to the inward destination normal. */
export function routeConnection(
  routing: EdgeRouting,
  start: Vec2,
  end: Vec2,
  fromNormal: Vec2,
  toNormal: Vec2,
  obstacles: readonly Rect[],
  lane = 0,
  selfLoop = false,
): CompiledPath {
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  const lead = selfLoop ? 28 : Math.max(8, Math.min(28, distance / 3));
  const a = add(start, fromNormal, clearLead(start, fromNormal, lead, obstacles));
  const b = add(end, toNormal, clearLead(end, toNormal, lead, obstacles));
  if (selfLoop && distance < 1) {
    const side = { x: -fromNormal.y, y: fromNormal.x };
    const extent = 48 + Math.abs(lane);
    const reach = clearLead(a, fromNormal, extent, obstacles);
    let fallback: Vec2[] | undefined;
    for (const sign of lane < 0 ? [-1, 1] : [1, -1]) {
      for (const size of [extent, extent * 1.5, extent * 2]) {
        const turn = add(a, side, sign * size);
        const points = [start, a, turn, add(turn, fromNormal, reach), add(a, fromNormal, reach), a, end];
        fallback ??= points;
        if (points.slice(1).every((point, index) => obstacles.every((rect) => !crosses(points[index]!, point, rect)))) return roundedPolyline(points);
      }
    }
    return roundedPolyline(fallback!);
  }
  if (routing === "straight" && !selfLoop && lane === 0) return roundedPolyline([start, end], 0);
  if (routing === "curve" && !selfLoop && lane === 0) {
    const reach = Math.max(36, distance / 2);
    const commands: PathCommand[] = [
      { kind: "move", to: start },
      { kind: "cubic", control1: add(start, fromNormal, reach), control2: add(end, toNormal, reach), to: end },
    ];
    const samples = flattenPath({ commands });
    if (samples.every((point) => obstacles.every((rect) => !inside(point, rect)))) return makePath(commands, fromNormal, negate(toNormal));
  }

  const candidates: Vec2[][] = [];
  const push = (middle: Vec2[]) => candidates.push(simplify([start, a, ...middle, b, end]));
  if (lane === 0) {
    push([{ x: b.x, y: a.y }]);
    push([{ x: a.x, y: b.y }]);
    push([{ x: (a.x + b.x) / 2, y: a.y }, { x: (a.x + b.x) / 2, y: b.y }]);
    push([{ x: a.x, y: (a.y + b.y) / 2 }, { x: b.x, y: (a.y + b.y) / 2 }]);
  } else if (fromNormal.x !== 0) {
    push([{ x: a.x, y: (a.y + b.y) / 2 + lane }, { x: b.x, y: (a.y + b.y) / 2 + lane }]);
  } else {
    push([{ x: (a.x + b.x) / 2 + lane, y: a.y }, { x: (a.x + b.x) / 2 + lane, y: b.y }]);
  }
  const clearance = 22 + Math.abs(lane);
  const xs = [...new Set(obstacles.flatMap((rect) => [rect.x - clearance, rect.x + rect.width + clearance]))];
  const ys = [...new Set(obstacles.flatMap((rect) => [rect.y - clearance, rect.y + rect.height + clearance]))];
  for (const x of xs) push([{ x, y: a.y }, { x, y: b.y }]);
  for (const y of ys) push([{ x: a.x, y }, { x: b.x, y }]);

  const valid = (points: readonly Vec2[]) => {
    if (points.length < 2) return false;
    const first = subtract(points[1]!, points[0]!);
    const last = subtract(points[points.length - 1]!, points[points.length - 2]!);
    if (dot(first, fromNormal) <= 0 || dot(last, toNormal) >= 0) return false;
    return points.slice(1).every((point, index) => obstacles.every((rect) =>
      (index === 0 && inside(start, rect) && !inside(point, rect)) ||
      (index === points.length - 2 && inside(end, rect) && !inside(points[index]!, rect)) ||
      !crosses(points[index]!, point, rect)));
  };
  let available = candidates.filter(valid);
  // Opposing and mixed ports sometimes need both an exterior row and column.
  if (!available.length) {
    const outerXs = [Math.min(a.x, b.x, ...xs), Math.max(a.x, b.x, ...xs)];
    const outerYs = [Math.min(a.y, b.y, ...ys), Math.max(a.y, b.y, ...ys)];
    for (const x of outerXs) for (const y of outerYs) {
      push([{ x, y: a.y }, { x, y }, { x: b.x, y }]);
      push([{ x: a.x, y }, { x, y }, { x, y: b.y }]);
    }
    available = candidates.filter(valid);
  }
  const cost = (points: readonly Vec2[]) => points.slice(1).reduce((sum, point, index) => sum + Math.hypot(point.x - points[index]!.x, point.y - points[index]!.y), 0) + points.length * 8;
  // Keep a deterministic route even if user-pinned overlapping shapes obstruct every exit.
  const chosen = (lane !== 0 && candidates[0] && valid(candidates[0]) ? candidates[0] : undefined) ?? available.sort((left, right) => cost(left) - cost(right))[0] ?? candidates[0] ?? [start, end];
  return roundedPolyline(chosen, routing === "straight" ? 0 : 8);
}

function roundedPolyline(raw: readonly Vec2[], radius = 8): CompiledPath {
  const points = simplify(raw);
  const commands: PathCommand[] = [{ kind: "move", to: points[0]! }];
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1]!;
    const point = points[index]!;
    const next = points[index + 1]!;
    const incoming = subtract(point, previous);
    const outgoing = subtract(next, point);
    const before = Math.hypot(incoming.x, incoming.y);
    const after = Math.hypot(outgoing.x, outgoing.y);
    const r = Math.min(radius, before / 2, after / 2);
    if (r === 0) { commands.push({ kind: "line", to: point }); continue; }
    const entry = add(point, incoming, -r / before);
    const exit = add(point, outgoing, r / after);
    commands.push({ kind: "line", to: entry }, { kind: "cubic", control1: add(entry, incoming, r * 0.55228475 / before), control2: add(exit, outgoing, -r * 0.55228475 / after), to: exit });
  }
  commands.push({ kind: "line", to: points[points.length - 1]! });
  return makePath(commands, normalize(subtract(points[1] ?? points[0]!, points[0]!)), normalize(subtract(points[points.length - 1]!, points[points.length - 2] ?? points[0]!)));
}

function makePath(commands: readonly PathCommand[], startTangent: Vec2, endTangent: Vec2): CompiledPath {
  const rounded = commands.map((command): PathCommand => command.kind === "close" ? command : command.kind === "cubic" ? { ...command, to: round(command.to), control1: round(command.control1), control2: round(command.control2) } : { ...command, to: round(command.to) });
  return { commands: rounded, startTangent, endTangent, length: Math.round(measurePath(rounded) * 1000) / 1000 };
}
function simplify(points: readonly Vec2[]): Vec2[] {
  const result: Vec2[] = [];
  for (const point of points) {
    const last = result[result.length - 1];
    if (last && Math.hypot(last.x - point.x, last.y - point.y) < 0.001) continue;
    const before = result[result.length - 2];
    if (before && last && ((before.x === last.x && last.x === point.x && (last.y - before.y) * (point.y - last.y) >= 0) || (before.y === last.y && last.y === point.y && (last.x - before.x) * (point.x - last.x) >= 0))) result.pop();
    result.push(point);
  }
  return result.length ? result : [{ x: 0, y: 0 }];
}
function inside(point: Vec2, rect: Rect): boolean { return point.x > rect.x + 0.001 && point.x < rect.x + rect.width - 0.001 && point.y > rect.y + 0.001 && point.y < rect.y + rect.height - 0.001; }
function clearLead(point: Vec2, direction: Vec2, desired: number, obstacles: readonly Rect[]): number {
  let length = desired;
  for (const rect of obstacles) {
    const aligned = direction.x ? point.y > rect.y && point.y < rect.y + rect.height : point.x > rect.x && point.x < rect.x + rect.width;
    if (!aligned) continue;
    const distance = direction.x > 0 ? rect.x - point.x : direction.x < 0 ? point.x - rect.x - rect.width : direction.y > 0 ? rect.y - point.y : point.y - rect.y - rect.height;
    if (distance > 0.001) length = Math.min(length, distance / 2);
  }
  return length;
}
function crosses(a: Vec2, b: Vec2, rect: Rect): boolean {
  if (inside(a, rect) || inside(b, rect)) return true;
  if (Math.abs(a.x - b.x) < 0.001) return a.x > rect.x + 0.001 && a.x < rect.x + rect.width - 0.001 && Math.max(a.y, b.y) > rect.y + 0.001 && Math.min(a.y, b.y) < rect.y + rect.height - 0.001;
  if (Math.abs(a.y - b.y) < 0.001) return a.y > rect.y + 0.001 && a.y < rect.y + rect.height - 0.001 && Math.max(a.x, b.x) > rect.x + 0.001 && Math.min(a.x, b.x) < rect.x + rect.width - 0.001;
  return true;
}
function add(a: Vec2, b: Vec2, scale = 1): Vec2 { return { x: a.x + b.x * scale, y: a.y + b.y * scale }; }
function subtract(a: Vec2, b: Vec2): Vec2 { return { x: a.x - b.x, y: a.y - b.y }; }
function dot(a: Vec2, b: Vec2): number { return a.x * b.x + a.y * b.y; }
function negate(a: Vec2): Vec2 { return { x: a.x === 0 ? 0 : -a.x, y: a.y === 0 ? 0 : -a.y }; }
function normalize(a: Vec2): Vec2 { const length = Math.hypot(a.x, a.y) || 1; return { x: a.x / length, y: a.y / length }; }
function round(a: Vec2): Vec2 { return { x: Math.round(a.x * 1000) / 1000, y: Math.round(a.y * 1000) / 1000 }; }
