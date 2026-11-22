// Affiche un mot reçu du service : écriture tamoule, prononciation,
// traduction et phrase d'exemple. Aucune logique métier.

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Word } from "@/services/word-of-the-day.service";

type WordOfTheDayProps = {
  word: Word;
};

export function WordOfTheDay({ word }: WordOfTheDayProps) {
  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader className="gap-3">
        <CardDescription className="text-base">Le mot du jour</CardDescription>
        <CardTitle>
          <h1
            lang="ta"
            className="font-heading text-6xl leading-tight text-foreground"
          >
            {word.tamil}
          </h1>
        </CardTitle>
        <p className="text-2xl text-muted-foreground">{word.transliteration}</p>
        <p className="text-3xl font-semibold text-primary">{word.french}</p>
      </CardHeader>
      <CardContent>
        <section
          aria-label="Exemple"
          className="flex flex-col gap-1 rounded-lg bg-muted p-4"
        >
          <p lang="ta" className="font-heading text-2xl text-foreground">
            {word.example.tamil}
          </p>
          <p className="text-lg text-muted-foreground">
            {word.example.transliteration}
          </p>
          <p className="text-lg text-foreground">{word.example.french}</p>
        </section>
      </CardContent>
    </Card>
  );
}
