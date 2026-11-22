// Outils de test : lit les tokens du thème dans globals.css et calcule les
// couleurs sRGB et les contrastes WCAG (formules OKLCH → OKLab → sRGB).

import { readFileSync } from "node:fs";
import path from "node:path";

export type Rgb = [number, number, number]; // sRGB linéaire, 0..1

const GLOBALS_CSS = path.join(process.cwd(), "src/app/globals.css");

export function readThemeTokens(selector: ":root" | ".dark") {
  const css = readFileSync(GLOBALS_CSS, "utf8");
  const escaped = selector.replace(".", "\\.");
  const block = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  if (!block) throw new Error(`Bloc ${selector} introuvable dans globals.css`);

  const tokens: Record<string, string> = {};
  for (const [, name, value] of block[1].matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    tokens[name] = value.trim();
  }
  return tokens;
}

export function parseOklch(value: string): Rgb {
  const match = value.match(/^oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)$/);
  if (!match) throw new Error(`Couleur OKLCH opaque attendue : ${value}`);
  const [lightness, chroma, hue] = match.slice(1).map(Number);

  const angle = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(angle);
  const b = chroma * Math.sin(angle);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return rgb.map((channel) => Math.min(1, Math.max(0, channel))) as Rgb;
}

function luminance([r, g, b]: Rgb): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(first: Rgb, second: Rgb): number {
  const [light, dark] = [luminance(first), luminance(second)].sort(
    (x, y) => y - x,
  );
  return (light + 0.05) / (dark + 0.05);
}

export function toHex(color: Rgb): string {
  return `#${color
    .map((channel) => {
      const encoded =
        channel <= 0.0031308
          ? 12.92 * channel
          : 1.055 * channel ** (1 / 2.4) - 0.055;
      return Math.round(encoded * 255)
        .toString(16)
        .padStart(2, "0");
    })
    .join("")}`;
}
