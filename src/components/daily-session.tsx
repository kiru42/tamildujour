"use client";

// Séance du jour : le mot du jour, puis la révision des mots déjà vus.

import { useState } from "react";

import { reviewService } from "@/services/container";
import type { Word } from "@/services/review.service";

import { ReviewSession } from "./review-session";
import { TodayWord } from "./today-word";

type Step = { kind: "word" } | { kind: "review"; cards: Word[] };

export function DailySession() {
  const [step, setStep] = useState<Step>({ kind: "word" });

  async function startReview() {
    setStep({ kind: "review", cards: await reviewService.getReviewCards() });
  }

  if (step.kind === "review") {
    return (
      <ReviewSession
        cards={step.cards}
        onAnswer={(wordId, answer) =>
          void reviewService.answer(wordId, answer, new Date())
        }
      />
    );
  }

  return <TodayWord onReview={() => void startReview()} />;
}
