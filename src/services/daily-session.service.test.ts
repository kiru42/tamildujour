import { describe, expect, it } from "vitest";

import type { Progress, ProgressRepository } from "@/data/progress.repository";
import type { Word, WordRepository } from "@/data/words.repository";

import {
  createDailySessionService,
  isSessionDone,
} from "./daily-session.service";
import { createReviewService } from "./review.service";
import { createStreakService } from "./streak.service";
import { createWordOfTheDayService } from "./word-of-the-day.service";

function makeWord(id: string): Word {
  return {
    id,
    tamil: "அ",
    transliteration: id,
    french: id,
    example: { tamil: "அ", transliteration: id, french: id },
  };
}

function fakeProgressRepository(initial: Progress = { words: [], completedDays: [] }) {
  let stored = structuredClone(initial);
  const repository: ProgressRepository = {
    load: async () => structuredClone(stored),
    update: async (change) => {
      stored = structuredClone(change(structuredClone(stored)));
      return structuredClone(stored);
    },
  };
  return { repository, stored: () => stored };
}

function setup(words: Word[] = ["a", "b", "c"].map(makeWord), initial?: Progress) {
  const wordRepository: WordRepository = { getAll: () => words };
  const progress = fakeProgressRepository(initial);
  const wordOfTheDay = createWordOfTheDayService(wordRepository);
  const service = createDailySessionService(
    createReviewService(wordRepository, progress.repository, wordOfTheDay),
    createStreakService(progress.repository),
  );
  return { service, stored: progress.stored };
}

const morning = new Date(2026, 10, 22, 9);
const evening = new Date(2026, 10, 22, 18);

describe("isSessionDone", () => {
  it("est faite quand le mot est vu et toutes les cartes répondues", () => {
    expect(
      isSessionDone({ wordSeen: true, cards: ["a", "b"], answered: ["b", "a"] }),
    ).toBe(true);
  });

  it("n'est pas faite tant qu'une carte reste sans réponse", () => {
    expect(
      isSessionDone({ wordSeen: true, cards: ["a", "b"], answered: ["a"] }),
    ).toBe(false);
  });

  it("n'est pas faite si le mot du jour n'a pas été vu", () => {
    expect(
      isSessionDone({ wordSeen: false, cards: ["a"], answered: ["a"] }),
    ).toBe(false);
  });

  it("est faite sans aucune carte, une fois le mot du jour vu", () => {
    expect(isSessionDone({ wordSeen: true, cards: [], answered: [] })).toBe(true);
  });

  it("n'est pas faite sans carte ni mot vu", () => {
    expect(isSessionDone({ wordSeen: false, cards: [], answered: [] })).toBe(
      false,
    );
  });

  it("ne compte pas une réponse à un mot hors de la séance", () => {
    expect(
      isSessionDone({ wordSeen: true, cards: ["a", "b"], answered: ["a", "z"] }),
    ).toBe(false);
  });
});

describe("createDailySessionService", () => {
  it("augmente la série quand le mot est vu et la révision finie", async () => {
    const { service, stored } = setup();

    await service.seeWordOfTheDay(morning);
    const { cards } = await service.startReview(morning);
    const results = [];
    for (const card of cards) {
      results.push(await service.answer(card.id, "known", morning));
    }

    expect(cards.length).toBeGreaterThan(0);
    expect(results.at(-1)).toEqual({
      done: true,
      streak: { days: 1, missedYesterday: false },
    });
    expect(results.slice(0, -1).every((result) => !result.done)).toBe(true);
    expect(stored().completedDays).toEqual(["2026-11-22"]);
  });

  it("enregistre le mot du jour comme vu et transmet les réponses", async () => {
    const { service, stored } = setup();

    await service.seeWordOfTheDay(morning);
    const { cards } = await service.startReview(morning);
    await service.answer(cards[0].id, "toReview", morning);

    expect(stored().words).toEqual([
      {
        wordId: cards[0].id,
        firstSeenOn: "2026-11-22",
        status: "toReview",
        lastReviewedOn: "2026-11-22",
      },
    ]);
  });

  it("n'augmente pas la série tant que la révision n'est pas finie", async () => {
    const seen = (wordId: string) => ({
      wordId,
      firstSeenOn: "2026-11-01",
      status: "new" as const,
      lastReviewedOn: null,
    });
    const { service, stored } = setup(undefined, {
      words: [seen("a"), seen("b"), seen("c")],
      completedDays: [],
    });

    await service.seeWordOfTheDay(morning);
    const { cards } = await service.startReview(morning);
    const result = await service.answer(cards[0].id, "known", morning);

    expect(cards).toHaveLength(3);
    expect(result).toEqual({ done: false, streak: null });
    expect(stored().completedDays).toEqual([]);
  });

  it("n'augmente pas la série si le mot du jour n'a pas été vu", async () => {
    const { service, stored } = setup(undefined, {
      words: [
        { wordId: "a", firstSeenOn: "2026-11-01", status: "new", lastReviewedOn: null },
      ],
      completedDays: [],
    });

    const { cards } = await service.startReview(morning);
    const result = await service.answer(cards[0].id, "known", morning);

    expect(result.done).toBe(false);
    expect(stored().completedDays).toEqual([]);
  });

  it("finit la séance dès le début de la révision s'il n'y a aucune carte", async () => {
    const { service, stored } = setup([]);

    await service.seeWordOfTheDay(morning);
    const start = await service.startReview(morning);

    expect(start).toEqual({
      cards: [],
      done: true,
      streak: { days: 1, missedYesterday: false },
    });
    expect(stored().completedDays).toEqual(["2026-11-22"]);
  });

  it("ne finit pas une révision sans carte si le mot du jour n'a pas été vu", async () => {
    const { service, stored } = setup([]);

    const start = await service.startReview(morning);

    expect(start).toEqual({ cards: [], done: false, streak: null });
    expect(stored().completedDays).toEqual([]);
  });

  it("ne compte pas la réponse à un mot hors de la séance", async () => {
    const { service, stored } = setup();

    await service.seeWordOfTheDay(morning);
    await service.startReview(morning);
    const result = await service.answer("inconnu", "known", morning);

    expect(result.done).toBe(false);
    expect(stored().completedDays).toEqual([]);
  });

  it("garde le mot vu le matin pour une révision le soir", async () => {
    const { service, stored } = setup();

    await service.seeWordOfTheDay(morning);
    const { cards } = await service.startReview(evening);
    for (const card of cards) await service.answer(card.id, "known", evening);

    expect(stored().completedDays).toEqual(["2026-11-22"]);
  });

  it("repart de zéro le lendemain : le mot de la veille ne compte pas", async () => {
    const { service, stored } = setup();
    const tomorrow = new Date(2026, 10, 23, 9);

    await service.seeWordOfTheDay(morning);
    const { cards } = await service.startReview(tomorrow);
    for (const card of cards) await service.answer(card.id, "known", tomorrow);

    expect(stored().completedDays).toEqual([]);
  });
});
