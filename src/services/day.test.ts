import { describe, expect, it } from "vitest";

import { toDayKey } from "./day";

describe("toDayKey", () => {
  it("donne le jour local au format AAAA-MM-JJ", () => {
    expect(toDayKey(new Date(2026, 10, 22, 0, 5))).toBe("2026-11-22");
    expect(toDayKey(new Date(2026, 0, 3, 23, 59))).toBe("2026-01-03");
  });
});
