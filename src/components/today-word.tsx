"use client";

// Le mot du jour dépend de la date de l'appareil, que le serveur ne connaît
// pas (fuseau, prérendu mis en cache). Il est donc choisi côté client ; le
// serveur n'affiche qu'un emplacement.

import { useEffect, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { reviewService, wordOfTheDayService } from "@/services/container";

import { WordOfTheDay } from "./word-of-the-day";

// Revenir sur l'app (onglet ou appli rouverte le lendemain) relit la date.
function subscribe(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function getTodayWord() {
  return wordOfTheDayService.getWordOfTheDay(new Date());
}

function getServerWord() {
  return null;
}

type TodayWordProps = {
  onReview: () => void;
};

export function TodayWord({ onReview }: TodayWordProps) {
  const word = useSyncExternalStore(subscribe, getTodayWord, getServerWord);
  const wordId = word?.id;

  // Un mot affiché comme mot du jour entre dans la révision.
  useEffect(() => {
    if (wordId !== undefined) void reviewService.recordWordOfTheDay(new Date());
  }, [wordId]);

  if (word === null) {
    return (
      <p aria-busy="true" className="text-lg text-muted-foreground">
        Chargement du mot du jour…
      </p>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <WordOfTheDay word={word} />
      <Button size="xl" className="w-full" onClick={onReview}>
        Réviser
      </Button>
    </div>
  );
}
