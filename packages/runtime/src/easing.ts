import type { EasingName } from "@animflow-dsl/model";

export function ease(name: EasingName, progress: number): number {
  const value = clamp(progress, 0, 1);
  switch (name) {
    case "linear":
      return value;
    case "easeIn":
      return value * value * value;
    case "easeOut":
      return 1 - (1 - value) ** 3;
    case "easeInOut":
      return value < 0.5
        ? 4 * value ** 3
        : 1 - (-2 * value + 2) ** 3 / 2;
    case "spring": {
      if (value === 0 || value === 1) return value;
      return 1 - Math.exp(-7 * value) * Math.cos(10 * value);
    }
  }
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
