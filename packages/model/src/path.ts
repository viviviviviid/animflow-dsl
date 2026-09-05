import type { CompiledPath, PathCommand, Vec2 } from "./geometry";

/** Deterministic arc-length sampling, shared by compilation and SVG playback. */
export function flattenPath(path: Pick<CompiledPath, "commands">): readonly Vec2[] {
  const points: Vec2[] = [];
  let current: Vec2 = { x: 0, y: 0 };
  let first = current;
  for (const command of path.commands) {
    if (command.kind === "move") {
      current = command.to;
      first = current;
      points.push(current);
    } else if (command.kind === "line") {
      current = command.to;
      points.push(current);
    } else if (command.kind === "cubic") {
      const start = current;
      for (let step = 1; step <= 32; step += 1) {
        const t = step / 32;
        const u = 1 - t;
        points.push({
          x: u ** 3 * start.x + 3 * u ** 2 * t * command.control1.x + 3 * u * t ** 2 * command.control2.x + t ** 3 * command.to.x,
          y: u ** 3 * start.y + 3 * u ** 2 * t * command.control1.y + 3 * u * t ** 2 * command.control2.y + t ** 3 * command.to.y,
        });
      }
      current = command.to;
    } else {
      points.push(first);
      current = first;
    }
  }
  return points;
}

export function measurePath(commands: readonly PathCommand[]): number {
  const points = flattenPath({ commands });
  return points.reduce((length, point, index) => index === 0 ? 0 : length + Math.hypot(point.x - points[index - 1]!.x, point.y - points[index - 1]!.y), 0);
}

export function pointAtPathProgress(path: Pick<CompiledPath, "commands">, progress: number): Vec2 {
  const points = flattenPath(path);
  if (!points.length) return { x: 0, y: 0 };
  const lengths = points.slice(1).map((point, index) => Math.hypot(point.x - points[index]!.x, point.y - points[index]!.y));
  let remaining = lengths.reduce((sum, length) => sum + length, 0) * Math.max(0, Math.min(1, progress));
  for (let index = 0; index < lengths.length; index += 1) {
    const length = lengths[index]!;
    if (remaining <= length && length > 0) {
      const start = points[index]!;
      const end = points[index + 1]!;
      return { x: start.x + (end.x - start.x) * remaining / length, y: start.y + (end.y - start.y) * remaining / length };
    }
    remaining -= length;
  }
  return points[points.length - 1]!;
}
