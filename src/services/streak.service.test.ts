import { describe, expect, it } from "vitest";

import type { Progress, ProgressRepository } from "@/data/progress.repository";

import { computeStreak, createStreakService } from "./streak.service";

// Les jours sont des clés « AAAA-MM-JJ » ; les dates passées au service sont
// construites en heure locale (TZ=Europe/Paris, voir vitest.config.mts).

function fakeProgressRepository(completedDays: string[] = []) {
  let stored: Progress = { words: [], completedDays };
  const repository: ProgressRepository = {
    load: async () => structuredClone(stored),
    update: async (change) => {
      stored = structuredClone(change(structuredClone(stored)));
      return structuredClone(stored);
    },
  };
  return { repository, stored: () => stored };
}

describe("computeStreak", () => {
  it("vaut 0 sans aucune séance", () => {
    expect(computeStreak([], "2026-11-22")).toEqual({
      days: 0,
      missedYesterday: false,
    });
  });

  it("vaut 1 après la première séance, le jour même", () => {
    expect(computeStreak(["2026-11-22"], "2026-11-22").days).toBe(1);
  });

  it("compte les jours d'affilée", () => {
    const days = ["2026-11-20", "2026-11-21", "2026-11-22"];

    expect(computeStreak(days, "2026-11-22").days).toBe(3);
  });

  it("garde la série d'hier tant que la séance du jour n'est pas faite", () => {
    expect(computeStreak(["2026-11-20", "2026-11-21"], "2026-11-22")).toEqual({
      days: 2,
      missedYesterday: false,
    });
  });

  it("ne remet pas la série à zéro pour un seul jour manqué", () => {
    // Le 21 est manqué.
    const days = ["2026-11-19", "2026-11-20", "2026-11-22"];

    expect(computeStreak(days, "2026-11-22").days).toBe(3);
  });

  it("garde la série le lendemain d'un jour manqué, avant la séance", () => {
    expect(computeStreak(["2026-11-19", "2026-11-20"], "2026-11-22")).toEqual({
      days: 2,
      missedYesterday: true,
    });
  });

  it("tolère plusieurs jours manqués s'ils ne se suivent pas", () => {
    const days = ["2026-11-16", "2026-11-18", "2026-11-20", "2026-11-22"];

    expect(computeStreak(days, "2026-11-22").days).toBe(4);
  });

  it("remet la série à zéro après deux jours manqués d'affilée", () => {
    // Les 20 et 21 sont manqués.
    expect(computeStreak(["2026-11-18", "2026-11-19"], "2026-11-22")).toEqual({
      days: 0,
      missedYesterday: false,
    });
  });

  it("repart de 1 après deux jours manqués d'affilée", () => {
    const days = ["2026-11-18", "2026-11-19", "2026-11-22"];

    expect(computeStreak(days, "2026-11-22").days).toBe(1);
  });

  it("enchaîne les jours au changement de mois", () => {
    const days = ["2026-10-30", "2026-10-31", "2026-11-01"];

    expect(computeStreak(days, "2026-11-01").days).toBe(3);
  });

  it("tolère un jour manqué au changement de mois (28 février → 2 mars)", () => {
    // 2027 n'est pas bissextile : le 1er mars est le seul jour manqué.
    expect(computeStreak(["2027-02-27", "2027-02-28"], "2027-03-02")).toEqual({
      days: 2,
      missedYesterday: true,
    });
  });

  it("remet à zéro après deux jours manqués au changement de mois", () => {
    expect(computeStreak(["2026-11-29", "2026-11-30"], "2026-12-03").days).toBe(
      0,
    );
  });

  it("enchaîne les jours au changement d'année", () => {
    const days = ["2026-12-31", "2027-01-01"];

    expect(computeStreak(days, "2027-01-01").days).toBe(2);
  });

  it("n'affiche « Ne rate pas deux fois » que s'il y a une série à sauver", () => {
    // Hier manqué, mais avant-hier aussi : plus de série.
    expect(computeStreak(["2026-11-19"], "2026-11-22").missedYesterday).toBe(
      false,
    );
  });

  it("garde le message le lendemain d'un jour manqué, même séance faite", () => {
    const days = ["2026-11-20", "2026-11-22"];

    expect(computeStreak(days, "2026-11-22")).toEqual({
      days: 2,
      missedYesterday: true,
    });
  });

  it("ignore les doublons et les jours futurs", () => {
    const days = ["2026-11-21", "2026-11-21", "2026-11-22", "2026-11-25"];

    expect(computeStreak(days, "2026-11-22").days).toBe(2);
  });
});

describe("createStreakService", () => {
  it("augmente la série d'1 quand la séance du jour est faite", async () => {
    const fake = fakeProgressRepository(["2026-11-21"]);
    const service = createStreakService(fake.repository);
    const today = new Date(2026, 10, 22, 18);

    expect((await service.getStreak(today)).days).toBe(1);
    await service.completeSession(today);

    expect((await service.getStreak(today)).days).toBe(2);
  });

  it("n'augmente la série qu'une fois par jour", async () => {
    const fake = fakeProgressRepository();
    const service = createStreakService(fake.repository);

    await service.completeSession(new Date(2026, 10, 22, 9));
    await service.completeSession(new Date(2026, 10, 22, 20));

    expect(fake.stored().completedDays).toEqual(["2026-11-22"]);
    expect((await service.getStreak(new Date(2026, 10, 22))).days).toBe(1);
  });

  it("renvoie la série à jour après la séance", async () => {
    const fake = fakeProgressRepository(["2026-11-20"]);
    const service = createStreakService(fake.repository);

    const streak = await service.completeSession(new Date(2026, 10, 22));

    expect(streak).toEqual({ days: 2, missedYesterday: true });
  });

  it("calcule la série selon le jour local de la date donnée", async () => {
    const fake = fakeProgressRepository(["2026-11-21", "2026-11-22"]);
    const service = createStreakService(fake.repository);

    // 0 h 30 le 23 : la série d'hier tient toujours.
    expect(await service.getStreak(new Date(2026, 10, 23, 0, 30))).toEqual({
      days: 2,
      missedYesterday: false,
    });
  });
});
