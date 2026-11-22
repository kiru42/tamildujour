import { describe, expect, it } from "vitest";

import { createInMemoryExampleRepository } from "./example.repository";

describe("createInMemoryExampleRepository", () => {
  it("renvoie l'exemple qu'on lui a donné", () => {
    const repository = createInMemoryExampleRepository({ label: "vide" });

    expect(repository.get()).toEqual({ label: "vide" });
  });
});
