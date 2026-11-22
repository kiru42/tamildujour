// Point de composition : seul fichier de la couche service autorisé à
// instancier les vrais repositories. La présentation importe d'ici.

import { createLocalStorageProgressRepository } from "@/data/progress.repository";
import { createJsonWordRepository } from "@/data/words.repository";

import { createDailySessionService } from "./daily-session.service";
import { createReviewService } from "./review.service";
import { createStreakService } from "./streak.service";
import { createWordOfTheDayService } from "./word-of-the-day.service";

const wordRepository = createJsonWordRepository();
const progressRepository = createLocalStorageProgressRepository();

export const wordOfTheDayService = createWordOfTheDayService(wordRepository);

const reviewService = createReviewService(
  wordRepository,
  progressRepository,
  wordOfTheDayService,
);

export const streakService = createStreakService(progressRepository);

export const dailySessionService = createDailySessionService(
  reviewService,
  streakService,
);
