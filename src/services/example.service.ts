// Exemple vide de la couche service : le repository est injecté,
// aucune dépendance à React, Next ou au stockage.

import type { Example, ExampleRepository } from "@/data/example.repository";

export type { Example };

export type ExampleService = {
  getExample(): Example;
};

export function createExampleService(
  repository: ExampleRepository,
): ExampleService {
  return {
    getExample: () => repository.get(),
  };
}
