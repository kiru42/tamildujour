// Série de jours : augmente d'1 par jour où la séance est faite. Un seul
// jour manqué ne la remet pas à zéro ; deux jours manqués d'affilée, oui.

import type { DayKey, ProgressRepository } from "@/data/progress.repository";

import { toDayKey } from "./review.service";

export type Streak = {
  days: number;
  // Hier a été manqué et la série tient encore : « Ne rate pas deux fois ».
  missedYesterday: boolean;
};

export type StreakService = {
  getStreak(date: Date): Promise<Streak>;
  completeSession(date: Date): Promise<Streak>;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Numéro de jour calendaire : Date.UTC ignore fuseaux et changements d'heure.
function dayNumber(day: DayKey): number {
  const [year, month, date] = day.split("-").map(Number);
  return Math.round(Date.UTC(year, month - 1, date) / MS_PER_DAY);
}

export function computeStreak(completedDays: DayKey[], today: DayKey): Streak {
  const todayNumber = dayNumber(today);
  const done = new Set(
    completedDays.map(dayNumber).filter((day) => day <= todayNumber),
  );

  const missedYesterday =
    !done.has(todayNumber - 1) && done.has(todayNumber - 2);

  // Dernière séance : aujourd'hui, hier ou avant-hier (un jour manqué).
  let current = [todayNumber, todayNumber - 1, todayNumber - 2].find((day) =>
    done.has(day),
  );
  if (current === undefined) return { days: 0, missedYesterday: false };

  let days = 1;
  for (;;) {
    if (done.has(current - 1)) current -= 1;
    else if (done.has(current - 2)) current -= 2;
    else break;
    days += 1;
  }

  return { days, missedYesterday };
}

export function createStreakService(
  progressRepository: ProgressRepository,
): StreakService {
  return {
    async getStreak(date) {
      const progress = await progressRepository.load();
      return computeStreak(progress.completedDays, toDayKey(date));
    },

    async completeSession(date) {
      const today = toDayKey(date);
      const progress = await progressRepository.update((current) =>
        current.completedDays.includes(today)
          ? current
          : { ...current, completedDays: [...current.completedDays, today] },
      );
      return computeStreak(progress.completedDays, today);
    },
  };
}
