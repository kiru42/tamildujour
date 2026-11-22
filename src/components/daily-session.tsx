"use client";

// Séance du jour : la série en haut, le mot du jour, puis la révision des
// mots déjà vus. Finir la révision termine la séance du jour.

import { useEffect, useState } from "react";

import { reviewService, streakService } from "@/services/container";
import type { Word } from "@/services/review.service";
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

  async function startReview() {
    setStep({ kind: "review", cards: await reviewService.getReviewCards() });
  }

  async function finishSession() {
    setStreak(await streakService.completeSession(new Date()));
  }

  return (
    <>
      <StreakBanner streak={streak} />
      <div className="flex w-full flex-1 items-center justify-center">
        {step.kind === "review" ? (
          <ReviewSession
            cards={step.cards}
            onAnswer={(wordId, answer) =>
              void reviewService.answer(wordId, answer, new Date())
            }
            onFinish={() => void finishSession()}
          />
        ) : (
          <TodayWord onReview={() => void startReview()} />
        )}
      </div>
    </>
  );
}
