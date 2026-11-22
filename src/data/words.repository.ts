// Couche données des mots : seule à lire words.json. Le JSON brut est
// validé puis converti en type de domaine avant de sortir d'ici.

import rawWords from "./words.json";

export type Example = {
  tamil: string;
  transliteration: string;
  french: string;
};

export type Word = {
  id: string;
  tamil: string;
  transliteration: string;
  french: string;
  example: Example;
};

export interface WordRepository {
  getAll(): Word[];
}

const TAMIL_SCRIPT = /[஀-௿]/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(
  source: Record<string, unknown>,
  field: string,
  path: string,
  label: string,
): string {
  const value = source[field];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} : le champ « ${path} » est manquant ou vide.`);
  }
  return value;
}

function readTamil(
  source: Record<string, unknown>,
  field: string,
  path: string,
  label: string,
): string {
  const value = readText(source, field, path, label);
  if (!TAMIL_SCRIPT.test(value)) {
    throw new Error(
      `${label} : le champ « ${path} » doit être écrit en caractères tamouls.`,
    );
  }
  return value;
}

function parseWord(raw: unknown, index: number): Word {
  const fallback = `Mot n° ${index + 1}`;
  if (!isRecord(raw)) {
    throw new Error(`${fallback} : ce n'est pas un objet.`);
  }

  const label =
    typeof raw.id === "string" && raw.id.trim() !== ""
      ? `Mot « ${raw.id} »`
      : fallback;

  const id = readText(raw, "id", "id", label);
  const tamil = readTamil(raw, "tamil", "tamil", label);
  const transliteration = readText(
    raw,
    "transliteration",
    "transliteration",
    label,
  );
  const french = readText(raw, "french", "french", label);

  if (!isRecord(raw.example)) {
    throw new Error(`${label} : le champ « example » est manquant.`);
  }
  const example: Example = {
    tamil: readTamil(raw.example, "tamil", "example.tamil", label),
    transliteration: readText(
      raw.example,
      "transliteration",
      "example.transliteration",
      label,
    ),
    french: readText(raw.example, "french", "example.french", label),
  };

  return { id, tamil, transliteration, french, example };
}

export function parseWords(raw: unknown): Word[] {
  if (!Array.isArray(raw)) {
    throw new Error("Le fichier des mots doit contenir une liste.");
  }

  const words = raw.map(parseWord);

  const seen = new Set<string>();
  for (const word of words) {
    if (seen.has(word.id)) {
      throw new Error(`Mot « ${word.id} » : cet id est en double.`);
    }
    seen.add(word.id);
  }

  return words;
}

export function createJsonWordRepository(): WordRepository {
  const words = parseWords(rawWords);
  return { getAll: () => words };
}

export function createInMemoryWordRepository(words: Word[]): WordRepository {
  return { getAll: () => words };
}
