// Point de composition : seul fichier de la couche service autorisé à
// instancier les vrais repositories. La présentation importe d'ici.

import { createJsonWordRepository } from "@/data/words.repository";

import { createWordOfTheDayService } from "./word-of-the-day.service";

export const wordOfTheDayService = createWordOfTheDayService(
  createJsonWordRepository(),
);
