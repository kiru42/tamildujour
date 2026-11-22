// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Parcours complet avec les vrais services et le stockage de l'appareil
// (stockage de jsdom). Chaque import dynamique après vi.resetModules()
// simule un rechargement de l'app.
async function loadApp() {
  vi.resetModules();
  const { DailySession } = await import("./daily-session");
  const { wordOfTheDayService } = await import("@/services/container");
  return { DailySession, wordOfTheDayService };
}

function click(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

// Chaque fichier de test a son propre jsdom, donc un stockage vide.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("<DailySession />", () => {
  it("mot du jour → Réviser → carte → réponse → « Fini pour aujourd'hui »", async () => {
    vi.setSystemTime(new Date(2026, 10, 22, 9));
    const { DailySession, wordOfTheDayService } = await loadApp();
    const today = wordOfTheDayService.getWordOfTheDay(new Date(2026, 10, 22));

    render(<DailySession />);
    expect(
      await screen.findByRole("heading", { name: today.tamil }),
    ).toBeDefined();

    click("Réviser");
    await screen.findByRole("button", { name: "Retourner la carte" });
    expect(screen.getByRole("heading", { name: today.tamil })).toBeDefined();

    click("Retourner la carte");
    click("Je sais");

    expect(await screen.findByText("Fini pour aujourd'hui")).toBeDefined();
  });

  it("augmente la série en haut de l'écran quand la séance du jour est faite", async () => {
    vi.setSystemTime(new Date(2026, 11, 1, 9));
    const { DailySession } = await loadApp();

    render(<DailySession />);
    expect(await screen.findByLabelText("Série : 0 jour")).toBeDefined();

    click("Réviser");
    await screen.findByRole("button", { name: "Retourner la carte" });
    while (screen.queryByRole("button", { name: "Retourner la carte" })) {
      click("Retourner la carte");
      click("Je sais");
    }

    expect(await screen.findByLabelText("Série : 1 jour")).toBeDefined();
  });
});
