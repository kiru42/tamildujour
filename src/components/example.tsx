// Exemple vide de la couche présentation : affiche ce que le service
// renvoie, sans logique métier.

import type { Example as ExampleData } from "@/services/example.service";

type ExampleProps = {
  example: ExampleData;
};

export function Example({ example }: ExampleProps) {
  return <p className="text-foreground">{example.label}</p>;
}
