import rough from "roughjs";

const generator = rough.generator();

/** Stable, DOM-free pencil strokes. Keep endpoints on the compiler's ports. */
export function sketchPath(path: string, id: string, singleStroke = false): string {
  let seed = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    seed = Math.imul(seed ^ id.charCodeAt(index), 16777619);
  }
  const drawable = generator.path(path, {
    seed: (seed >>> 0) || 1,
    roughness: singleStroke ? 0.8 : 1.1,
    bowing: 0.85,
    maxRandomnessOffset: 1.6,
    preserveVertices: true,
    disableMultiStroke: singleStroke,
    fixedDecimalPlaceDigits: 2,
  });
  return generator.toPaths(drawable).map((stroke) => stroke.d).join(" ");
}

export function roundedRectPath(x: number, y: number, width: number, height: number, radius: number): string {
  const r = Math.min(radius, width / 2, height / 2);
  return `M ${x + r} ${y} H ${x + width - r} Q ${x + width} ${y} ${x + width} ${y + r} V ${y + height - r} Q ${x + width} ${y + height} ${x + width - r} ${y + height} H ${x + r} Q ${x} ${y + height} ${x} ${y + height - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
}
