"use client";

// Le mot du jour dépend de la date de l'appareil, que le serveur ne connaît
// pas (fuseau, prérendu mis en cache). Il est donc choisi côté client ; le
// serveur n'affiche qu'un emplacement.

import { useSyncExternalStore } from "react";

import { wordOfTheDayService } from "@/services/container";

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

export function TodayWord() {
  const word = useSyncExternalStore(subscribe, getTodayWord, getServerWord);

  if (word === null) {
    return (
      <p aria-busy="true" className="text-lg text-muted-foreground">
        Chargement du mot du jour…
      </p>
    );
  }

  return <WordOfTheDay word={word} />;
}
