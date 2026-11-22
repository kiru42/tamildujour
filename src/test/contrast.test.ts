import { describe, expect, it } from "vitest";

import { contrastRatio, parseOklch, readThemeTokens } from "./theme";

// Paires (fond, texte) réellement utilisées par l'interface.
const PAIRS = [
  ["background", "foreground"],
  ["background", "muted-foreground"],
  ["background", "primary"],
  ["card", "card-foreground"],
  ["card", "muted-foreground"],
  ["card", "primary"],
  ["muted", "foreground"],
  ["muted", "muted-foreground"],
  ["primary", "primary-foreground"],
  ["secondary", "secondary-foreground"],
  ["accent", "accent-foreground"],
  ["highlight", "highlight-foreground"],
] as const;

// WCAG 2.2, niveau AA pour du texte de taille normale.
const AA_NORMAL_TEXT = 4.5;

describe.each([":root", ".dark"] as const)("contraste du thème %s", (theme) => {
  const tokens = readThemeTokens(theme);

  it.each(PAIRS)("%s / %s atteint le niveau AA (≥ 4,5:1)", (bg, fg) => {
    const ratio = contrastRatio(parseOklch(tokens[bg]), parseOklch(tokens[fg]));

    expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });
});

describe("contrastRatio", () => {
  it("donne 21:1 entre le noir et le blanc", () => {
    expect(contrastRatio([0, 0, 0], [1, 1, 1])).toBeCloseTo(21);
  });
});
