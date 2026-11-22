"use client";

// Séance de révision : une carte à la fois, face tamoule puis verso
// (prononciation, traduction). Les cartes et leur ordre viennent du
// service ; ce composant ne fait que les montrer et transmettre les réponses.

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ReviewAnswer, Word } from "@/services/review.service";

type ReviewSessionProps = {
  cards: Word[];
  onAnswer: (wordId: string, answer: ReviewAnswer) => void;
  onFinish?: () => void;
};

export function ReviewSession({ cards, onAnswer, onFinish }: ReviewSessionProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = cards[index];

  if (card === undefined) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader className="gap-3">
          <CardTitle>
            <h2 className="text-4xl text-foreground">Fini pour aujourd&apos;hui</h2>
          </CardTitle>
          <p className="text-xl text-muted-foreground">À demain !</p>
        </CardHeader>
      </Card>
    );
  }

  function answer(value: ReviewAnswer) {
    onAnswer(card.id, value);
    setFlipped(false);
    setIndex(index + 1);
    if (index + 1 === cards.length) onFinish?.();
  }

  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader className="gap-3">
        <CardDescription className="text-base">
          Carte {index + 1} sur {cards.length}
        </CardDescription>
        <CardTitle>
          <h2
            lang="ta"
            className="font-heading text-6xl leading-tight text-foreground"
          >
            {card.tamil}
          </h2>
        </CardTitle>
      </CardHeader>
      {flipped && (
        <CardContent className="flex flex-col gap-1">
          <p className="text-2xl text-muted-foreground">
            {card.transliteration}
          </p>
          <p className="text-3xl font-semibold text-primary">{card.french}</p>
        </CardContent>
      )}
      <CardFooter className="flex flex-col gap-3 sm:flex-row">
        {flipped ? (
          <>
            <Button
              size="xl"
              className="w-full sm:flex-1"
              onClick={() => answer("known")}
            >
              Je sais
            </Button>
            <Button
              size="xl"
              variant="outline"
              className="w-full sm:flex-1"
              onClick={() => answer("toReview")}
            >
              À revoir
            </Button>
          </>
        ) : (
          <Button
            size="xl"
            variant="secondary"
            className="w-full"
            onClick={() => setFlipped(true)}
          >
            Retourner la carte
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
