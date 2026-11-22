"use client";

// Séance du jour : la série en haut, le mot du jour, puis la révision des
// mots déjà vus. Le service décide quand la séance du jour est faite et
// renvoie alors la série à jour.

import { useEffect, useState } from "react";

import { dailySessionService, streakService } from "@/services/container";
import type { SessionResult } from "@/services/daily-session.service";
import type { ReviewAnswer, Word } from "@/services/review.service";
import type { Streak } from "@/services/streak.service";

import { ReviewSession } from "./review-session";
import { StreakBanner } from "./streak-banner";
import { TodayWord } from "./today-word";

type Step = { kind: "word" } | { kind: "review"; cards: Word[] };

export function DailySession() {
  const [step, setStep] = useState<Step>({ kind: "word" });
  const [streak, setStreak] = useState<Streak | null>(null);

  useEffect(() => {
    let active = true;
    void streakService.getStreak(new Date()).then((current) => {
      if (active) setStreak(current);
    });
    return () => {
      active = false;
    };
  }, []);

  function showStreak({ streak: updated }: SessionResult) {
    if (updated !== null) setStreak(updated);
  }

  async function startReview() {
    const start = await dailySessionService.startReview(new Date());
    setStep({ kind: "review", cards: start.cards });
    showStreak(start);
  }

  async function answer(wordId: string, value: ReviewAnswer) {
    showStreak(await dailySessionService.answer(wordId, value, new Date()));
  }

  return (
    <>
      <StreakBanner streak={streak} />
      <div className="flex w-full flex-1 items-center justify-center">
        {step.kind === "review" ? (
          <ReviewSession
            cards={step.cards}
            onAnswer={(wordId, value) => void answer(wordId, value)}
          />
        ) : (
          <TodayWord onReview={() => void startReview()} />
        )}
      </div>
    </>
  );
}
