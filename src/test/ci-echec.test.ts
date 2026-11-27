// Test volontairement en échec : vérifie que la protection de main bloque la fusion.
import { expect, it } from "vitest";

it("échoue exprès", () => {
  expect(1).toBe(2);
});
