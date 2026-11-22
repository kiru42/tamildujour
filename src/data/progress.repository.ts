// Couche données de la progression : seule à toucher au stockage de
// l'appareil. Ce qui est relu est validé puis converti en type de domaine.
// Les méthodes sont asynchrones pour qu'un stockage en ligne puisse
// remplacer le stockage de l'appareil sans changer l'interface.

export type WordStatus = "new" | "known" | "toReview";

// Un jour est noté « AAAA-MM-JJ » (jour local de l'appareil).
export type DayKey = string;

export type WordProgress = {
  wordId: string;
  firstSeenOn: DayKey;
  status: WordStatus;
  lastReviewedOn: DayKey | null;
};

export type Progress = {
  words: WordProgress[];
};

export interface ProgressRepository {
  load(): Promise<Progress>;
  save(progress: Progress): Promise<void>;
}

export const EMPTY_PROGRESS: Progress = { words: [] };

export const PROGRESS_STORAGE_KEY = "tamildujour:progress:v1";

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES: readonly WordStatus[] = ["new", "known", "toReview"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDayKey(value: unknown): value is DayKey {
  return typeof value === "string" && DAY_KEY.test(value);
}

function parseWordProgress(raw: unknown): WordProgress | null {
  if (!isRecord(raw)) return null;
  const { wordId, firstSeenOn, status, lastReviewedOn } = raw;
  if (typeof wordId !== "string" || wordId.trim() === "") return null;
  if (!isDayKey(firstSeenOn)) return null;
  if (!STATUSES.includes(status as WordStatus)) return null;
  if (lastReviewedOn !== null && !isDayKey(lastReviewedOn)) return null;
  return {
    wordId,
    firstSeenOn,
    status: status as WordStatus,
    lastReviewedOn,
  };
}

// Une valeur illisible donne une progression vide ; une entrée invalide est
// écartée sans perdre les autres.
export function parseProgress(raw: unknown): Progress {
  if (!isRecord(raw) || !Array.isArray(raw.words)) {
    return { words: [] };
  }
  const words = raw.words
    .map(parseWordProgress)
    .filter((entry): entry is WordProgress => entry !== null);
  return { words };
}

function browserStorage(): Storage | undefined {
  return typeof window === "undefined" ? undefined : window.localStorage;
}

export function createLocalStorageProgressRepository(
  getStorage: () => Storage | undefined = browserStorage,
): ProgressRepository {
  return {
    async load() {
      const text = getStorage()?.getItem(PROGRESS_STORAGE_KEY);
      if (text == null) return { words: [] };
      try {
        return parseProgress(JSON.parse(text));
      } catch {
        return { words: [] };
      }
    },
    async save(progress) {
      getStorage()?.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    },
  };
}

export function createInMemoryProgressRepository(
  initial: Progress = { words: [] },
): ProgressRepository {
  let stored = structuredClone(initial);
  return {
    load: async () => structuredClone(stored),
    save: async (progress) => {
      stored = structuredClone(progress);
    },
  };
}
