import { describe, expect, it } from "vitest";

import type {
  Progress,
  ProgressRepository,
  WordProgress,
} from "@/data/progress.repository";
import type { Word, WordRepository } from "@/data/words.repository";

import {
  buildReviewQueue,
  createReviewService,
  REVIEW_SESSION_SIZE,
} from "./review.service";
import {
  createWordOfTheDayService,
  type WordOfTheDayService,
} from "./word-of-the-day.service";

function makeWord(id: string): Word {
  return {
    id,
    tamil: "அ",
    transliteration: id,
    french: id,
    example: { tamil: "அ", transliteration: id, french: id },
  };
}

function progressOf({ words }: Pick<Progress, "words">): Progress {
  return { words, completedDays: [] };
}

function fakeProgressRepository(initial: Pick<Progress, "words"> = { words: [] }) {
  let stored = progressOf(structuredClone(initial));
  const repository: ProgressRepository = {
    load: async () => structuredClone(stored),
    update: async (change) => {
      stored = structuredClone(change(structuredClone(stored)));
      return structuredClone(stored);
    },
  };
  return { repository, stored: () => stored };
}

function seen(
  wordId: string,
  status: WordProgress["status"],
  lastReviewedOn: string | null = null,
  firstSeenOn = "2026-11-01",
): WordProgress {
  return { wordId, firstSeenOn, status, lastReviewedOn };
}

const words = ["a", "b", "c", "d", "e", "f", "g", "h"].map(makeWord);
const wordRepository: WordRepository = { getAll: () => words };
const wordOfTheDay = createWordOfTheDayService(wordRepository);

describe("buildReviewQueue", () => {
  it("ne contient que les mots déjà vus", () => {
    const progress = progressOf({ words: [seen("c", "new"), seen("a", "new")] });

    const queue = buildReviewQueue(words, progress);

    expect(queue.map((word) => word.id).sort()).toEqual(["a", "c"]);
  });

  it("est vide si aucun mot n'a été vu", () => {
    expect(buildReviewQueue(words, progressOf({ words: [] }))).toEqual([]);
  });

  it("met les mots « à revoir » avant les mots sus", () => {
    const progress = progressOf({
      words: [
        seen("a", "known", "2026-11-10"),
        seen("b", "toReview", "2026-11-20"),
        seen("c", "known", "2026-11-05"),
        seen("d", "toReview", "2026-11-15"),
      ],
    });

    const queue = buildReviewQueue(words, progress).map((word) => word.id);

    expect(queue.slice(0, 2).sort()).toEqual(["b", "d"]);
    expect(queue.slice(2).sort()).toEqual(["a", "c"]);
  });

  it("place les mots jamais révisés entre les mots « à revoir » et les mots sus", () => {
    const progress = progressOf({
      words: [
        seen("a", "known", "2026-11-10"),
        seen("b", "new"),
        seen("c", "toReview", "2026-11-10"),
      ],
    });

    const queue = buildReviewQueue(words, progress).map((word) => word.id);

    expect(queue).toEqual(["c", "b", "a"]);
  });

  it("dans un même groupe, montre d'abord le mot révisé il y a le plus longtemps", () => {
    const progress = progressOf({
      words: [
        seen("a", "known", "2026-11-20"),
        seen("b", "known", "2026-11-02"),
        seen("c", "known", "2026-11-11"),
      ],
    });

    const queue = buildReviewQueue(words, progress).map((word) => word.id);

    expect(queue).toEqual(["b", "c", "a"]);
  });

  it("fait au plus 5 cartes", () => {
    const progress = progressOf({
      words: words.map((word) => seen(word.id, "new")),
    });

    expect(REVIEW_SESSION_SIZE).toBe(5);
    expect(buildReviewQueue(words, progress)).toHaveLength(5);
  });

  it("garde les mots « à revoir » quand il faut couper à 5 cartes", () => {
    const progress = progressOf({
      words: [
        ...["a", "b", "c", "d", "e"].map((id) => seen(id, "known", "2026-11-01")),
        seen("h", "toReview", "2026-11-21"),
      ],
    });

    const queue = buildReviewQueue(words, progress).map((word) => word.id);

    expect(queue).toHaveLength(5);
    expect(queue[0]).toBe("h");
  });

  it("ignore un mot vu qui n'existe plus dans le fichier des mots", () => {
    const progress = progressOf({
      words: [seen("disparu", "toReview"), seen("a", "new")],
    });

    expect(buildReviewQueue(words, progress).map((word) => word.id)).toEqual([
      "a",
    ]);
  });
});

describe("createReviewService", () => {
  it("enregistre le mot donné par le service du mot du jour reçu", async () => {
    const fake = fakeProgressRepository();
    const fixed: WordOfTheDayService = { getWordOfTheDay: () => words[6] };
    const service = createReviewService(wordRepository, fake.repository, fixed);

    await service.recordWordOfTheDay(new Date(2026, 10, 22, 9));

    expect(fake.stored().words).toEqual([seen("g", "new", null, "2026-11-22")]);
  });

  it("enregistre le mot du jour comme vu", async () => {
    const fake = fakeProgressRepository();
    const service = createReviewService(wordRepository, fake.repository, wordOfTheDay);
    const day = new Date(2026, 10, 22, 9);

    await service.recordWordOfTheDay(day);

    expect(fake.stored().words).toEqual([
      seen(wordOfTheDay.getWordOfTheDay(day).id, "new", null, "2026-11-22"),
    ]);
  });

  it("n'enregistre qu'une fois un mot du jour vu plusieurs fois", async () => {
    const fake = fakeProgressRepository();
    const service = createReviewService(wordRepository, fake.repository, wordOfTheDay);

    await service.recordWordOfTheDay(new Date(2026, 10, 22, 9));
    await service.recordWordOfTheDay(new Date(2026, 10, 22, 18));

    expect(fake.stored().words).toHaveLength(1);
  });

  it("ne garde pas l'état d'un mot déjà révisé quand il redevient mot du jour", async () => {
    const day = new Date(2026, 10, 22);
    const id = wordOfTheDay.getWordOfTheDay(day).id;
    const fake = fakeProgressRepository({
      words: [seen(id, "toReview", "2026-11-01")],
    });
    const service = createReviewService(wordRepository, fake.repository, wordOfTheDay);

    await service.recordWordOfTheDay(day);

    expect(fake.stored().words).toEqual([seen(id, "toReview", "2026-11-01")]);
  });

  it("ne propose en révision que les mots montrés comme mot du jour", async () => {
    const fake = fakeProgressRepository();
    const service = createReviewService(wordRepository, fake.repository, wordOfTheDay);
    const days = [new Date(2026, 10, 20), new Date(2026, 10, 22)];

    for (const day of days) await service.recordWordOfTheDay(day);
    const cards = await service.getReviewCards();

    expect(cards.map((word) => word.id).sort()).toEqual(
      days.map((day) => wordOfTheDay.getWordOfTheDay(day).id).sort(),
    );
  });

  it("enregistre la réponse « à revoir » et la date de révision", async () => {
    const fake = fakeProgressRepository({ words: [seen("a", "new")] });
    const service = createReviewService(wordRepository, fake.repository, wordOfTheDay);

    await service.answer("a", "toReview", new Date(2026, 10, 22, 9));

    expect(fake.stored().words).toEqual([
      seen("a", "toReview", "2026-11-22"),
    ]);
  });

  it("un mot « à revoir » revient avant les mots sus à la séance suivante", async () => {
    const fake = fakeProgressRepository({
      words: [seen("a", "new"), seen("b", "new"), seen("c", "new")],
    });
    const service = createReviewService(wordRepository, fake.repository, wordOfTheDay);
    const day = new Date(2026, 10, 22);

    await service.answer("a", "known", day);
    await service.answer("b", "known", day);
    await service.answer("c", "toReview", day);
    const cards = await service.getReviewCards();

    expect(cards.map((word) => word.id)).toEqual(["c", "a", "b"]);
  });

  it("ignore une réponse pour un mot jamais vu", async () => {
    const fake = fakeProgressRepository({ words: [seen("a", "new")] });
    const service = createReviewService(wordRepository, fake.repository, wordOfTheDay);

    await service.answer("b", "known", new Date(2026, 10, 22));

    expect(fake.stored().words).toEqual([seen("a", "new")]);
  });
});
