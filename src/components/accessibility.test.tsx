// @vitest-environment jsdom
// Lisibilité pour un enfant : gros boutons (≥ 44 px) et aucun texte plus
// petit que 16 px. jsdom ne calcule pas la mise en page : on lit les classes
// Tailwind effectives (après fusion par cn) de chaque élément.
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it } from "vitest";

import type { Word } from "@/services/review.service";

import { DailySession } from "./daily-session";
import { ReviewSession } from "./review-session";
import { StreakBanner } from "./streak-banner";

afterEach(cleanup);

const SPACING_PX = 4; // 1 unité Tailwind = 0,25 rem = 4 px
const MIN_TARGET_PX = 44;
const MIN_TEXT_PX = 16;
const TEXT_PX: Record<string, number> = {
  xs: 12, sm: 14, base: 16, lg: 18, xl: 20, "2xl": 24, "3xl": 30,
  "4xl": 36, "5xl": 48, "6xl": 60, "7xl": 72, "8xl": 96, "9xl": 128,
};

function classes(element: Element) {
  return (element.getAttribute("class") ?? "").split(/\s+/);
}

function heightPx(element: Element): number {
  const sizes = classes(element)
    .map((name) => name.match(/^(?:h|size|min-h)-(\d+(?:\.\d+)?)$/))
    .filter((match) => match !== null)
    .map((match) => Number(match[1]) * SPACING_PX);
  return Math.max(0, ...sizes);
}

function fontSizePx(element: Element): number {
  for (let node: Element | null = element; node; node = node.parentElement) {
    const size = classes(node)
      .map((name) => name.match(/^text-(xs|sm|base|lg|\d?xl)$/)?.[1])
      .find((match) => match !== undefined);
    if (size) return TEXT_PX[size];
  }
  return 16; // taille par défaut du navigateur
}

function textElements(root: Element) {
  return [...root.querySelectorAll("*")].filter((element) =>
    [...element.childNodes].some(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent!.trim() !== "",
    ),
  );
}

function expectReadable(ui: ReactElement | HTMLElement) {
  const root = ui instanceof HTMLElement ? ui : render(ui).container;

  for (const button of root.querySelectorAll("button")) {
    expect(heightPx(button), `bouton « ${button.textContent} »`).toBeGreaterThanOrEqual(
      MIN_TARGET_PX,
    );
  }
  for (const element of textElements(root)) {
    expect(fontSizePx(element), `texte « ${element.textContent} »`).toBeGreaterThanOrEqual(
      MIN_TEXT_PX,
    );
  }
}

const word: Word = {
  id: "poonai",
  tamil: "பூனை",
  transliteration: "poonai",
  french: "chat",
  example: {
    tamil: "பூனை தூங்குகிறது.",
    transliteration: "poonai thoongukirathu.",
    french: "Le chat dort.",
  },
};

describe("lisibilité et cibles tactiles", () => {
  it("écran du mot du jour", async () => {
    const { container } = render(<DailySession />);
    await screen.findByRole("button", { name: "Réviser" });

    expectReadable(container);
  });

  it("carte de révision, recto, verso et fin de séance", () => {
    const { container } = render(<ReviewSession cards={[word]} onAnswer={() => {}} />);
    expectReadable(container);

    fireEvent.click(screen.getByRole("button", { name: "Retourner la carte" }));
    expectReadable(container);

    fireEvent.click(screen.getByRole("button", { name: "Je sais" }));
    expectReadable(container);
  });

  it("série et message « Ne rate pas deux fois »", () => {
    expectReadable(<StreakBanner streak={{ days: 3, missedYesterday: true }} />);
  });

  it("le mot tamoul est affiché en très grand (≥ 48 px)", () => {
    render(<ReviewSession cards={[word]} onAnswer={() => {}} />);

    expect(fontSizePx(screen.getByRole("heading", { name: "பூனை" }))).toBeGreaterThanOrEqual(48);
  });
});
