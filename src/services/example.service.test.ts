import { describe, expect, it } from "vitest";

import type { ExampleRepository } from "@/data/example.repository";

import { createExampleService } from "./example.service";

describe("createExampleService", () => {
  it("renvoie l'exemple fourni par le repository", () => {
    const fakeRepository: ExampleRepository = {
      get: () => ({ label: "vide" }),
    };

    const service = createExampleService(fakeRepository);

    expect(service.getExample()).toEqual({ label: "vide" });
  });
});
