// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Word } from "@/services/review.service";

import { ReviewSession } from "./review-session";

afterEach(cleanup);

function makeWord(id: string, tamil: string, french: string): Word {
  return {
    id,
    tamil,
    transliteration: id,
    french,
    example: { tamil, transliteration: id, french },
  };
}

const poonai = makeWord("poonai", "பூனை", "chat");
const naai = makeWord("naai", "நாய்", "chien");

function click(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

describe("<ReviewSession />", () => {
  it("montre d'abord le mot en tamoul, sans sa traduction", () => {
    render(<ReviewSession cards={[poonai]} onAnswer={() => {}} />);

    const tamil = screen.getByRole("heading", { name: "பூனை" });
    expect(tamil.getAttribute("lang")).toBe("ta");
    expect(screen.queryByText("chat")).toBeNull();
    expect(screen.queryByRole("button", { name: "Je sais" })).toBeNull();
  });

  it("retourne la carte : prononciation et traduction, puis les deux réponses", () => {
    render(<ReviewSession cards={[poonai]} onAnswer={() => {}} />);

    click("Retourner la carte");

    expect(screen.getByText("poonai")).toBeDefined();
    expect(screen.getByText("chat")).toBeDefined();
    expect(screen.getByRole("button", { name: "Je sais" })).toBeDefined();
    expect(screen.getByRole("button", { name: "À revoir" })).toBeDefined();
  });

  it("transmet la réponse et passe à la carte suivante", () => {
    const onAnswer = vi.fn();
    render(<ReviewSession cards={[poonai, naai]} onAnswer={onAnswer} />);

    click("Retourner la carte");
    click("À revoir");

    expect(onAnswer).toHaveBeenCalledWith("poonai", "toReview");
    expect(screen.getByRole("heading", { name: "நாய்" })).toBeDefined();
    expect(screen.queryByText("chien")).toBeNull();

    click("Retourner la carte");
    click("Je sais");

    expect(onAnswer).toHaveBeenLastCalledWith("naai", "known");
  });

  it("affiche « Fini pour aujourd'hui » après la dernière carte et prévient la fin", () => {
    const onFinish = vi.fn();
    render(
      <ReviewSession cards={[poonai]} onAnswer={() => {}} onFinish={onFinish} />,
    );

    click("Retourner la carte");
    click("Je sais");

    expect(screen.getByText("Fini pour aujourd'hui")).toBeDefined();
    expect(onFinish).toHaveBeenCalledOnce();
  });

  it("indique la position de la carte dans la séance", () => {
    render(<ReviewSession cards={[poonai, naai]} onAnswer={() => {}} />);

    expect(screen.getByText("Carte 1 sur 2")).toBeDefined();
  });
});
