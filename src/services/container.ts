// Point de composition : seul fichier de la couche service autorisé à
// instancier les vrais repositories. La présentation importe d'ici.

import { createLocalStorageProgressRepository } from "@/data/progress.repository";
import { createJsonWordRepository } from "@/data/words.repository";

import { createReviewService } from "./review.service";
import { createWordOfTheDayService } from "./word-of-the-day.service";

const wordRepository = createJsonWordRepository();
const progressRepository = createLocalStorageProgressRepository();

export const wordOfTheDayService = createWordOfTheDayService(wordRepository);

export const reviewService = createReviewService(
  wordRepository,
  progressRepository,
);
