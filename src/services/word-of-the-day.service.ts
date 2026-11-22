// Choix du mot du jour : déterministe à partir de la date locale. Les mots
// défilent dans l'ordre du fichier, un par jour, puis le cycle recommence.

import type { Word, WordRepository } from "@/data/words.repository";

export type { Example, Word } from "@/data/words.repository";

export type WordOfTheDayService = {
  getWordOfTheDay(date: Date): Word;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Origine arbitraire du cycle : le 1er janvier 2026 montre le premier mot.
const CYCLE_START = Date.UTC(2026, 0, 1);

// Nombre de jours calendaires depuis l'origine, selon le jour local de
// `date`. Passer par Date.UTC neutralise les journées de 23 h ou 25 h du
// changement d'heure.
function daysSinceCycleStart(date: Date): number {
  const localDay = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((localDay - CYCLE_START) / MS_PER_DAY);
}

export function createWordOfTheDayService(
  repository: WordRepository,
): WordOfTheDayService {
  return {
    getWordOfTheDay(date) {
      const words = repository.getAll();
      if (words.length === 0) {
        throw new Error("Aucun mot disponible pour choisir le mot du jour.");
      }

      const days = daysSinceCycleStart(date);
      const index = ((days % words.length) + words.length) % words.length;
      return words[index];
    },
  };
}
