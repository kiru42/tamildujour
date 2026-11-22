// Jour local d'une date, noté « AAAA-MM-JJ ». Partagé par la révision et la
// série.

import type { DayKey } from "@/data/progress.repository";

export function toDayKey(date: Date): DayKey {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
