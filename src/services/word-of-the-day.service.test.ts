import { describe, expect, it } from "vitest";

import type { Word, WordRepository } from "@/data/words.repository";

import { createWordOfTheDayService } from "./word-of-the-day.service";

// Les dates sont construites en heure locale (TZ=Europe/Paris, voir
// vitest.config.mts) : new Date(année, mois 0-11, jour, heure, minute).

function makeWord(id: string): Word {
  return {
    id,
    tamil: "அ",
    transliteration: id,
    french: id,
    example: { tamil: "அ", transliteration: id, french: id },
  };
}

function repositoryOf(words: Word[]): WordRepository {
  return { getAll: () => words };
}

const words = ["a", "b", "c", "d", "e"].map(makeWord);
const service = createWordOfTheDayService(repositoryOf(words));

function wordOn(year: number, month: number, day: number, hour = 12) {
  return service.getWordOfTheDay(new Date(year, month, day, hour));
}

function nextInList(word: Word) {
  return words[(words.indexOf(word) + 1) % words.length];
}

describe("getWordOfTheDay", () => {
  it("donne le même mot toute la journée", () => {
    const morning = service.getWordOfTheDay(new Date(2026, 10, 22, 0, 1));
    const evening = service.getWordOfTheDay(new Date(2026, 10, 22, 23, 59));

    expect(evening).toBe(morning);
  });

  it("donne un autre mot le lendemain", () => {
    expect(wordOn(2026, 10, 23)).not.toBe(wordOn(2026, 10, 22));
  });

  it("passe au mot suivant de la liste chaque jour", () => {
    expect(wordOn(2026, 10, 23)).toBe(nextInList(wordOn(2026, 10, 22)));
  });

  it("montre chaque mot une fois sur autant de jours qu'il y a de mots", () => {
    const shown = [0, 1, 2, 3, 4].map((offset) => wordOn(2026, 10, 22 + offset));

    expect(new Set(shown).size).toBe(words.length);
  });

  it("recommence le cycle quand tous les mots ont été montrés", () => {
    expect(wordOn(2026, 10, 22 + words.length)).toBe(wordOn(2026, 10, 22));
  });

  it("enchaîne les mots au changement de mois et d'année", () => {
    expect(wordOn(2026, 11, 1)).toBe(nextInList(wordOn(2026, 10, 30)));
    expect(wordOn(2027, 0, 1)).toBe(nextInList(wordOn(2026, 11, 31)));
  });

  it("enchaîne les mots au passage à l'heure d'été et d'hiver", () => {
    // 29 mars 2026 : journée de 23 h ; 25 octobre 2026 : journée de 25 h.
    expect(wordOn(2026, 2, 29, 0)).toBe(nextInList(wordOn(2026, 2, 28, 23)));
    expect(wordOn(2026, 2, 30, 0)).toBe(nextInList(wordOn(2026, 2, 29, 23)));
    expect(wordOn(2026, 9, 25, 0)).toBe(nextInList(wordOn(2026, 9, 24, 23)));
    expect(wordOn(2026, 9, 26, 0)).toBe(nextInList(wordOn(2026, 9, 25, 23)));
  });

  it("fonctionne pour une date ancienne", () => {
    expect(words).toContain(wordOn(1999, 5, 15));
    expect(wordOn(1999, 5, 16)).toBe(nextInList(wordOn(1999, 5, 15)));
  });

  it("donne toujours le même mot s'il n'y en a qu'un", () => {
    const only = makeWord("seul");
    const single = createWordOfTheDayService(repositoryOf([only]));

    expect(single.getWordOfTheDay(new Date(2026, 10, 22))).toBe(only);
    expect(single.getWordOfTheDay(new Date(2026, 10, 23))).toBe(only);
  });

  it("lève une erreur explicite s'il n'y a aucun mot", () => {
    const empty = createWordOfTheDayService(repositoryOf([]));

    expect(() => empty.getWordOfTheDay(new Date(2026, 10, 22))).toThrow(
      /aucun mot/i,
    );
  });
});
