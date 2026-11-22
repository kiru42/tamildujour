// Séance du jour : le mot du jour est vu, puis la révision est finie. Seul ce
// service décide que la séance est faite et fait alors augmenter la série ;
// la présentation ne fait que lui signaler les actions de l'utilisateur.

import type { DayKey } from "@/data/progress.repository";

import { toDayKey } from "./day";
import type { ReviewAnswer, ReviewService, Word } from "./review.service";
import type { Streak, StreakService } from "./streak.service";

export type SessionState = {
  wordSeen: boolean;
  // Mots proposés en révision, et mots déjà répondus.
  cards: string[];
  answered: string[];
};

export type SessionResult = {
  done: boolean;
  // Série à jour quand la séance vient d'être faite, sinon null.
  streak: Streak | null;
};

export type ReviewStart = SessionResult & { cards: Word[] };

export type DailySessionService = {
  seeWordOfTheDay(date: Date): Promise<void>;
  startReview(date: Date): Promise<ReviewStart>;
  answer(wordId: string, answer: ReviewAnswer, date: Date): Promise<SessionResult>;
};

export function isSessionDone({ wordSeen, cards, answered }: SessionState): boolean {
  return wordSeen && cards.every((id) => answered.includes(id));
}

export function createDailySessionService(
  reviewService: ReviewService,
  streakService: StreakService,
): DailySessionService {
  let day: DayKey | null = null;
  let state: SessionState = { wordSeen: false, cards: [], answered: [] };

  // Un autre jour commence une nouvelle séance.
  function stateOf(date: Date): SessionState {
    const today = toDayKey(date);
    if (day !== today) {
      day = today;
      state = { wordSeen: false, cards: [], answered: [] };
    }
    return state;
  }

  async function settle(date: Date): Promise<SessionResult> {
    if (!isSessionDone(stateOf(date))) return { done: false, streak: null };
    return { done: true, streak: await streakService.completeSession(date) };
  }

  return {
    async seeWordOfTheDay(date) {
      // Vu dès l'affichage, même si la révision démarre avant la fin de
      // l'écriture.
      stateOf(date).wordSeen = true;
      await reviewService.recordWordOfTheDay(date);
    },

    async startReview(date) {
      const cards = await reviewService.getReviewCards();
      const current = stateOf(date);
      current.cards = cards.map((card) => card.id);
      current.answered = [];
      return { cards, ...(await settle(date)) };
    },

    async answer(wordId, answer, date) {
      await reviewService.answer(wordId, answer, date);
      const current = stateOf(date);
      if (!current.answered.includes(wordId)) current.answered.push(wordId);
      return settle(date);
    },
  };
}
