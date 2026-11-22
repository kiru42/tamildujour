import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import { parseOklch, readThemeTokens, toHex } from "./theme";

vi.mock("next/font/google", () => {
  const font = () => ({ variable: "font" });
  return { Baloo_Thambi_2: font, Geist_Mono: font, Mukta_Malar: font };
});

const PUBLIC = path.join(process.cwd(), "public");

type ManifestIcon = { src: string; sizes: string; type: string; purpose?: string };

const manifest = JSON.parse(
  readFileSync(path.join(PUBLIC, "manifest.webmanifest"), "utf8"),
) as {
  name: string;
  short_name: string;
  lang: string;
  start_url: string;
  scope: string;
  display: string;
  theme_color: string;
  background_color: string;
  icons: ManifestIcon[];
};

// Dimensions lues dans l'en-tête IHDR du PNG.
function pngSize(file: string) {
  const bytes = readFileSync(file);
  expect(bytes.subarray(1, 4).toString("ascii")).toBe("PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function publicFile(src: string) {
  return path.join(PUBLIC, src.replace(/^\//, ""));
}

describe("manifeste PWA", () => {
  it("nomme l'app en français et l'ouvre en plein écran sur l'accueil", () => {
    expect(manifest.name).toBe("Tamil du jour");
    expect(manifest.short_name).toBe("Tamil du jour");
    expect(manifest.lang).toBe("fr");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.display).toBe("standalone");
  });

  it("reprend les couleurs du thème Kolam", () => {
    const tokens = readThemeTokens(":root");

    expect(manifest.theme_color).toBe(toHex(parseOklch(tokens.primary)));
    expect(manifest.background_color).toBe(
      toHex(parseOklch(tokens.background)),
    );
  });

  it.each([
    ["192x192", "any"],
    ["512x512", "any"],
    ["512x512", "maskable"],
  ])("déclare une icône PNG %s (%s) qui existe à la bonne taille", (sizes, purpose) => {
    const icon = manifest.icons.find(
      (candidate) =>
        candidate.sizes === sizes && (candidate.purpose ?? "any") === purpose,
    );
    expect(icon?.type).toBe("image/png");

    const [width, height] = sizes.split("x").map(Number);
    expect(pngSize(publicFile(icon!.src))).toEqual({ width, height });
  });

  it("fournit l'icône d'écran d'accueil iPhone (180 × 180)", () => {
    const file = publicFile("/icons/apple-touch-icon.png");

    expect(existsSync(file)).toBe(true);
    expect(pngSize(file)).toEqual({ width: 180, height: 180 });
  });
});

describe("métadonnées de la page", () => {
  it("relient le manifeste, l'icône iPhone et le mode app sur iPhone", async () => {
    const { metadata } = await import("@/app/layout");

    expect(metadata.manifest).toBe("/manifest.webmanifest");
    expect(metadata.icons).toMatchObject({
      apple: "/icons/apple-touch-icon.png",
    });
    expect(metadata.appleWebApp).toMatchObject({
      capable: true,
      title: "Tamil du jour",
    });
  });
});
