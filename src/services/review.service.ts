// Révision : enregistre les mots du jour vus, construit la file de cartes
// (« à revoir » d'abord, puis jamais révisés, puis sus) et note les réponses.

import type {
  DayKey,
  Progress,
  ProgressRepository,
  WordProgress,
  WordStatus,
} from "@/data/progress.repository";
import type { Word, WordRepository } from "@/data/words.repository";

import { createWordOfTheDayService } from "./word-of-the-day.service";

export type { Example, Word } from "@/data/words.repository";

export type ReviewAnswer = Exclude<WordStatus, "new">;

export const REVIEW_SESSION_SIZE = 5;

export type ReviewService = {
  recordWordOfTheDay(date: Date): Promise<void>;
  getReviewCards(): Promise<Word[]>;
  answer(wordId: string, answer: ReviewAnswer, date: Date): Promise<void>;
};

export function toDayKey(date: Date): DayKey {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

const STATUS_ORDER: Record<WordStatus, number> = {
  toReview: 0,
  new: 1,
  known: 2,
};

function compareForReview(a: WordProgress, b: WordProgress): number {
  return (
    STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
    // Jamais révisé ("") avant révisé ; sinon le plus ancien d'abord.
    (a.lastReviewedOn ?? "").localeCompare(b.lastReviewedOn ?? "") ||
    a.firstSeenOn.localeCompare(b.firstSeenOn) ||
    a.wordId.localeCompare(b.wordId)
  );
}

export function buildReviewQueue(
  words: Word[],
  progress: Progress,
  size = REVIEW_SESSION_SIZE,
): Word[] {
  const byId = new Map(words.map((word) => [word.id, word]));
  return progress.words
    .filter((entry) => byId.has(entry.wordId))
    .sort(compareForReview)
    .slice(0, size)
    .map((entry) => byId.get(entry.wordId)!);
}

export function createReviewService(
  wordRepository: WordRepository,
  progressRepository: ProgressRepository,
): ReviewService {
  const wordOfTheDay = createWordOfTheDayService(wordRepository);

  return {
    async recordWordOfTheDay(date) {
      const word = wordOfTheDay.getWordOfTheDay(date);
      await progressRepository.update((progress) =>
        progress.words.some((entry) => entry.wordId === word.id)
          ? progress
          : {
              ...progress,
              words: [
                ...progress.words,
                {
                  wordId: word.id,
                  firstSeenOn: toDayKey(date),
                  status: "new",
                  lastReviewedOn: null,
                },
              ],
            },
      );
    },

    async getReviewCards() {
      const progress = await progressRepository.load();
      return buildReviewQueue(wordRepository.getAll(), progress);
    },

    async answer(wordId, answer, date) {
      await progressRepository.update((progress) => ({
        ...progress,
        words: progress.words.map((entry) =>
          entry.wordId === wordId
            ? { ...entry, status: answer, lastReviewedOn: toDayKey(date) }
            : entry,
        ),
      }));
    },
  };
}
