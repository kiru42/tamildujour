// Point de composition : seul fichier de la couche service autorisé à
// instancier les vrais repositories. La présentation importe d'ici.

import { createInMemoryExampleRepository } from "@/data/example.repository";

import { createExampleService } from "./example.service";

export const exampleService = createExampleService(
  createInMemoryExampleRepository({ label: "" }),
);
