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

describe("<DailySession /> après rechargement", () => {
  it("garde la progression après rechargement : le mot « à revoir » revient en premier", async () => {
    vi.setSystemTime(new Date(2026, 10, 22, 9));
    let app = await loadApp();
    const day1 = app.wordOfTheDayService.getWordOfTheDay(
      new Date(2026, 10, 22),
    );
    render(<app.DailySession />);
    await screen.findByRole("heading", { name: day1.tamil });
    click("Réviser");
    await screen.findByRole("button", { name: "Retourner la carte" });
    click("Retourner la carte");
    click("À revoir");
    await screen.findByText("Fini pour aujourd'hui");
    cleanup();

    // Le lendemain, l'app est rouverte.
    vi.setSystemTime(new Date(2026, 10, 23, 9));
    app = await loadApp();
    const day2 = app.wordOfTheDayService.getWordOfTheDay(
      new Date(2026, 10, 23),
    );
    render(<app.DailySession />);
    await screen.findByRole("heading", { name: day2.tamil });
    click("Réviser");
    await screen.findByRole("button", { name: "Retourner la carte" });

    expect(screen.getByText("Carte 1 sur 2")).toBeDefined();
    expect(screen.getByRole("heading", { name: day1.tamil })).toBeDefined();
  });
});
