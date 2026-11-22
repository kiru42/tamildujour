// En-tête : la série de jours 🔥 et, le lendemain d'un jour manqué, un
// encouragement. Le calcul vient du service.

import { Badge } from "@/components/ui/badge";
import type { Streak } from "@/services/streak.service";

type StreakBannerProps = {
  streak: Streak | null;
};

export function StreakBanner({ streak }: StreakBannerProps) {
  return (
    <header className="flex min-h-12 w-full max-w-md items-center justify-between gap-3">
      {streak !== null && (
        <>
          <Badge
            variant="secondary"
            aria-label={`Série : ${streak.days} ${streak.days > 1 ? "jours" : "jour"}`}
            className="h-12 gap-2 px-4 text-2xl font-semibold"
          >
            <span aria-hidden="true">🔥</span>
            <span aria-hidden="true">{streak.days}</span>
          </Badge>
          {streak.missedYesterday && (
            <p className="text-lg font-semibold text-primary">
              Ne rate pas deux fois
            </p>
          )}
        </>
      )}
    </header>
  );
}
