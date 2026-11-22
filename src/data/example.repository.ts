// Exemple vide de la couche données : un type de domaine, une interface
// de repository et une implémentation en mémoire. À remplacer par les
// vrais repositories (mots, progression).

export type Example = {
  label: string;
};

export interface ExampleRepository {
  get(): Example;
}

export function createInMemoryExampleRepository(
  example: Example,
): ExampleRepository {
  return {
    get: () => example,
  };
}
