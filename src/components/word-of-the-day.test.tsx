// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { Word } from "@/services/word-of-the-day.service";

import { WordOfTheDay } from "./word-of-the-day";

afterEach(cleanup);

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

describe("<WordOfTheDay />", () => {
  it("affiche le mot en tamoul comme titre", () => {
    render(<WordOfTheDay word={word} />);

    expect(screen.getByRole("heading", { name: "பூனை" })).toBeDefined();
  });

  it("affiche la prononciation, la traduction et la phrase d'exemple", () => {
    render(<WordOfTheDay word={word} />);

    expect(screen.getByText("poonai")).toBeDefined();
    expect(screen.getByText("chat")).toBeDefined();
    expect(screen.getByText("பூனை தூங்குகிறது.")).toBeDefined();
    expect(screen.getByText("poonai thoongukirathu.")).toBeDefined();
    expect(screen.getByText("Le chat dort.")).toBeDefined();
  });

  it("marque le texte tamoul comme tel et lui donne la police à glyphes tamouls", () => {
    render(<WordOfTheDay word={word} />);

    for (const text of ["பூனை", "பூனை தூங்குகிறது."]) {
      const element = screen.getByText(text);
      expect(element.getAttribute("lang")).toBe("ta");
      expect(element.className).toContain("font-heading");
    }
  });
});
