// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { wordOfTheDayService } from "@/services/container";

import { TodayWord } from "./today-word";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("<TodayWord />", () => {
  it("affiche le mot du jour de l'appareil", async () => {
    vi.setSystemTime(new Date(2026, 10, 22, 9, 0));
    const expected = wordOfTheDayService.getWordOfTheDay(
      new Date(2026, 10, 22),
    );

    render(<TodayWord />);

    expect(
      await screen.findByRole("heading", { name: expected.tamil }),
    ).toBeDefined();
  });

  it("affiche un autre mot le lendemain", async () => {
    vi.setSystemTime(new Date(2026, 10, 22, 9, 0));
    const today = wordOfTheDayService.getWordOfTheDay(new Date(2026, 10, 22));
    vi.setSystemTime(new Date(2026, 10, 23, 9, 0));
    const tomorrow = wordOfTheDayService.getWordOfTheDay(
      new Date(2026, 10, 23),
    );

    render(<TodayWord />);

    expect(
      await screen.findByRole("heading", { name: tomorrow.tamil }),
    ).toBeDefined();
    expect(screen.queryByRole("heading", { name: today.tamil })).toBeNull();
  });
});
