import { describe, expect, it } from "vitest";

import rawWords from "./words.json";
import {
  createInMemoryWordRepository,
  createJsonWordRepository,
  parseWords,
  type Word,
} from "./words.repository";

const validWord: Word = {
  id: "vanakkam",
  tamil: "வணக்கம்",
  transliteration: "vanakkam",
  french: "bonjour",
  example: {
    tamil: "வணக்கம் அம்மா!",
    transliteration: "vanakkam ammaa !",
    french: "Bonjour maman !",
  },
};

function without(object: Record<string, unknown>, key: string) {
  const copy = { ...object };
  delete copy[key];
  return copy;
}

describe("parseWords", () => {
  it("accepte une liste de mots valides", () => {
    expect(parseWords([validWord])).toEqual([validWord]);
  });

  it("refuse autre chose qu'une liste", () => {
    expect(() => parseWords({ words: [validWord] })).toThrow(/liste/);
  });

  it.each(["id", "tamil", "transliteration", "french", "example"])(
    "refuse un mot sans le champ « %s »",
    (field) => {
      expect(() => parseWords([without(validWord, field)])).toThrow(
        new RegExp(field),
      );
    },
  );

  it.each(["tamil", "transliteration", "french"])(
    "refuse un exemple sans le champ « %s »",
    (field) => {
      const word = { ...validWord, example: without(validWord.example, field) };

      expect(() => parseWords([word])).toThrow(new RegExp(`example.${field}`));
    },
  );

  it("refuse un champ vide", () => {
    expect(() => parseWords([{ ...validWord, french: "  " }])).toThrow(
      /french/,
    );
  });

  it("indique quel mot est invalide", () => {
    const second = { ...validWord, id: "nandri", french: undefined };

    expect(() => parseWords([validWord, second])).toThrow(/nandri/);
  });

  it("refuse deux mots avec le même id", () => {
    expect(() => parseWords([validWord, { ...validWord }])).toThrow(
      /vanakkam/,
    );
  });

  it("refuse un champ tamoul écrit sans caractère tamoul", () => {
    expect(() => parseWords([{ ...validWord, tamil: "vanakkam" }])).toThrow(
      /tamil/,
    );
    expect(() =>
      parseWords([
        { ...validWord, example: { ...validWord.example, tamil: "Bonjour" } },
      ]),
    ).toThrow(/example.tamil/);
  });
});

describe("words.json", () => {
  it("est valide et contient au moins 20 mots", () => {
    const words = parseWords(rawWords);

    expect(words.length).toBeGreaterThanOrEqual(20);
  });
});

describe("createJsonWordRepository", () => {
  it("renvoie les mots du fichier, validés", () => {
    const repository = createJsonWordRepository();

    expect(repository.getAll()).toEqual(parseWords(rawWords));
  });

  it("renvoie toujours la même liste (référence stable)", () => {
    const repository = createJsonWordRepository();

    expect(repository.getAll()).toBe(repository.getAll());
  });
});

describe("createInMemoryWordRepository", () => {
  it("renvoie les mots qu'on lui a donnés", () => {
    const repository = createInMemoryWordRepository([validWord]);

    expect(repository.getAll()).toEqual([validWord]);
  });
});
