import { measurePath, type CompiledPath, type Vec2 } from "@animflow-dsl/model";

/** Deform only the transient drag preview; committed positions are compiler-owned. */
export function movePathEndpoints(path: CompiledPath, from: Vec2, to: Vec2): CompiledPath {
  const drawable = path.commands.filter((command) => command.kind !== "close");
  const count = drawable.length;
  const offset = (point: Vec2, weight: number): Vec2 => ({ x: point.x + from.x * (1 - weight) + to.x * weight, y: point.y + from.y * (1 - weight) + to.y * weight });
  let index = 0;
  const commands = path.commands.map((command) => {
    if (command.kind === "close") return command;
    const current = index++;
    const weight = current === 0 ? 0 : current === count - 1 ? 1 : Math.max(0, Math.min(1, (current - 1) / Math.max(1, count - 3)));
    if (command.kind === "cubic") {
      const previous = Math.max(0, Math.min(1, (current - 2) / Math.max(1, count - 3)));
      return { ...command, to: offset(command.to, weight), control1: offset(command.control1, previous), control2: offset(command.control2, weight) };
    }
    return { ...command, to: offset(command.to, weight) };
  });
  return { ...path, commands, length: measurePath(commands) };
}
