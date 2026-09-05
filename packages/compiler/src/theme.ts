import { themeToken, type ResolvedTheme, type RgbaColor, type ThemeToken } from "@animflow-dsl/model";

const fixedColors: Readonly<Record<string, RgbaColor>> = {
  surface: { r: 1, g: 0.996, b: 0.984, a: 1 },
  neutral: { r: 0.16, g: 0.17, b: 0.19, a: 1 },
  primary: { r: 0.16, g: 0.42, b: 0.88, a: 1 },
  accent: { r: 0.96, g: 0.48, b: 0.18, a: 1 },
  info: { r: 0.08, g: 0.65, b: 0.76, a: 1 },
  success: { r: 0.12, g: 0.65, b: 0.38, a: 1 },
  warning: { r: 0.93, g: 0.66, b: 0.14, a: 1 },
  danger: { r: 0.86, g: 0.2, b: 0.28, a: 1 },
};

export function resolveTheme(name: string, tokens: Iterable<string>): ResolvedTheme {
  const palette = name === "dark" ? { ...fixedColors,
    surface: { r: 0.075, g: 0.094, b: 0.133, a: 1 },
    neutral: { r: 0.80, g: 0.85, b: 0.92, a: 1 },
    primary: { r: 0.48, g: 0.66, b: 1, a: 1 },
    accent: { r: 1, g: 0.69, b: 0.42, a: 1 },
    info: { r: 0.43, g: 0.79, b: 0.89, a: 1 },
    success: { r: 0.39, g: 0.82, b: 0.64, a: 1 },
    warning: { r: 0.96, g: 0.81, b: 0.39, a: 1 },
    danger: { r: 1, g: 0.49, b: 0.56, a: 1 },
  } : fixedColors;
  const colors: Record<string, RgbaColor> = {};
  for (const value of [...new Set(tokens)].sort()) {
    colors[themeToken(value)] = palette[value] ?? colorFromToken(value);
  }
  return {
    name,
    colors: colors as Readonly<Record<ThemeToken, RgbaColor>>,
    fontFamily: '"Excalifont", "Gaegu", "Segoe Print", "Noto Sans KR", sans-serif',
    fontSize: 20,
    fontWeight: 400,
  };
}

function colorFromToken(value: string): RgbaColor {
  const hex = value.match(/^hex_([a-fA-F0-9]{6})([a-fA-F0-9]{2})?$/);
  if (hex) {
    return {
      r: Number.parseInt(hex[1]!.slice(0, 2), 16) / 255,
      g: Number.parseInt(hex[1]!.slice(2, 4), 16) / 255,
      b: Number.parseInt(hex[1]!.slice(4, 6), 16) / 255,
      a: hex[2] ? Number.parseInt(hex[2], 16) / 255 : 1,
    };
  }
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const hue = (hash >>> 0) % 360;
  return hslToRgb(hue / 360, 0.58, 0.5);
}

function hslToRgb(hue: number, saturation: number, lightness: number): RgbaColor {
  const channel = (offset: number): number => {
    const value = (offset + hue * 12) % 12;
    const amplitude = saturation * Math.min(lightness, 1 - lightness);
    return lightness - amplitude * Math.max(-1, Math.min(value - 3, 9 - value, 1));
  };
  return { r: channel(0), g: channel(8), b: channel(4), a: 1 };
}
