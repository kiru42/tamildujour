// Couche données de la progression : seule à toucher au stockage de
// l'appareil. Ce qui est relu est validé puis converti en type de domaine.
// Les méthodes sont asynchrones pour qu'un stockage en ligne puisse
// remplacer le stockage de l'appareil sans changer l'interface.
//
// Toute écriture passe par update(change) : le changement reçoit la
// progression actuelle et les changements s'appliquent l'un après l'autre,
// pour qu'aucune écriture simultanée (révision, série) ne soit perdue.

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
  // Jours où la séance du jour a été faite.
  completedDays: DayKey[];
};

export type ProgressChange = (current: Progress) => Progress;

export interface ProgressRepository {
  load(): Promise<Progress>;
  update(change: ProgressChange): Promise<Progress>;
}

export const EMPTY_PROGRESS: Progress = { words: [], completedDays: [] };

function emptyProgress(): Progress {
  return { words: [], completedDays: [] };
}

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
    return emptyProgress();
  }
  const words = raw.words
    .map(parseWordProgress)
    .filter((entry): entry is WordProgress => entry !== null);
  // Absent dans une progression enregistrée avant la série.
  const completedDays = Array.isArray(raw.completedDays)
    ? raw.completedDays.filter(isDayKey)
    : [];
  return { words, completedDays };
}

// Applique les changements l'un après l'autre, même si l'un d'eux échoue ;
// une lecture attend les changements en cours.
function serialize(
  read: () => Promise<Progress>,
  write: (progress: Progress) => Promise<void>,
): ProgressRepository {
  let pending: Promise<unknown> = Promise.resolve();
  return {
    load: () => pending.then(read),
    update(change) {
      const result = pending.then(async () => {
        const next = change(await read());
        await write(next);
        return next;
      });
      pending = result.catch(() => undefined);
      return result;
    },
  };
}

function browserStorage(): Storage | undefined {
  return typeof window === "undefined" ? undefined : window.localStorage;
}

export function createLocalStorageProgressRepository(
  getStorage: () => Storage | undefined = browserStorage,
): ProgressRepository {
  async function read(): Promise<Progress> {
    const text = getStorage()?.getItem(PROGRESS_STORAGE_KEY);
    if (text == null) return emptyProgress();
    try {
      return parseProgress(JSON.parse(text));
    } catch {
      return emptyProgress();
    }
  }

  async function write(progress: Progress) {
    getStorage()?.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  }

  return serialize(read, write);
}

export function createInMemoryProgressRepository(
  initial: Progress = EMPTY_PROGRESS,
): ProgressRepository {
  let stored = structuredClone(initial);
  return serialize(
    async () => structuredClone(stored),
    async (progress) => {
      stored = structuredClone(progress);
    },
  );
}
