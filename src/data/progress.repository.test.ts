import { describe, expect, it } from "vitest";

import {
  createInMemoryProgressRepository,
  createLocalStorageProgressRepository,
  EMPTY_PROGRESS,
  parseProgress,
  PROGRESS_STORAGE_KEY,
  type Progress,
} from "./progress.repository";

// Faux stockage de l'appareil : même interface que window.localStorage.
function createFakeStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
    clear: () => items.clear(),
    key: (index: number) => [...items.keys()][index] ?? null,
    get length() {
      return items.size;
    },
  } satisfies Storage;
}

const progress: Progress = {
  words: [
    {
      wordId: "vanakkam",
      firstSeenOn: "2026-11-20",
      status: "toReview",
      lastReviewedOn: "2026-11-21",
    },
    {
      wordId: "ammaa",
      firstSeenOn: "2026-11-21",
      status: "new",
      lastReviewedOn: null,
    },
  ],
  completedDays: ["2026-11-20", "2026-11-21"],
};

describe("parseProgress", () => {
  it("accepte une progression valide", () => {
    expect(parseProgress(progress)).toEqual(progress);
  });

  it("renvoie une progression vide pour une valeur qui n'est pas un objet", () => {
    expect(parseProgress(null)).toEqual(EMPTY_PROGRESS);
    expect(parseProgress("oups")).toEqual(EMPTY_PROGRESS);
    expect(parseProgress({ words: "oups" })).toEqual(EMPTY_PROGRESS);
  });

  it("écarte les entrées invalides et garde les autres", () => {
    const raw = {
      words: [
        progress.words[0],
        { ...progress.words[1], status: "inconnu" },
        { ...progress.words[1], firstSeenOn: "21/11/2026" },
        { ...progress.words[1], wordId: "" },
        "oups",
      ],
    };

    expect(parseProgress(raw)).toEqual({
      words: [progress.words[0]],
      completedDays: [],
    });
  });

  it("relit une progression enregistrée avant la série (sans jours de séance)", () => {
    expect(parseProgress({ words: progress.words })).toEqual({
      words: progress.words,
      completedDays: [],
    });
  });

  it("écarte les jours de séance mal formés", () => {
    const raw = {
      words: [],
      completedDays: ["2026-11-20", "20/11/2026", 3, null, "2026-11-21"],
    };

    expect(parseProgress(raw).completedDays).toEqual([
      "2026-11-20",
      "2026-11-21",
    ]);
  });
});

describe("createLocalStorageProgressRepository", () => {
  it("renvoie une progression vide quand rien n'est enregistré", async () => {
    const repository = createLocalStorageProgressRepository(() =>
      createFakeStorage(),
    );

    expect(await repository.load()).toEqual(EMPTY_PROGRESS);
  });

  it("relit ce qu'il a enregistré", async () => {
    const storage = createFakeStorage();
    const repository = createLocalStorageProgressRepository(() => storage);

    await repository.update(() => progress);

    expect(await repository.load()).toEqual(progress);
  });

  it("passe la progression actuelle au changement et renvoie la nouvelle", async () => {
    const storage = createFakeStorage();
    const repository = createLocalStorageProgressRepository(() => storage);
    await repository.update(() => progress);

    const updated = await repository.update((current) => ({
      ...current,
      completedDays: [...current.completedDays, "2026-11-22"],
    }));

    expect(updated.completedDays).toEqual([
      "2026-11-20",
      "2026-11-21",
      "2026-11-22",
    ]);
    expect(await repository.load()).toEqual(updated);
  });

  it("ne perd aucune écriture lors de changements simultanés", async () => {
    const storage = createFakeStorage();
    const repository = createLocalStorageProgressRepository(() => storage);

    await Promise.all([
      repository.update((current) => ({
        ...current,
        words: [...current.words, progress.words[0]],
      })),
      repository.update((current) => ({
        ...current,
        completedDays: [...current.completedDays, "2026-11-22"],
      })),
    ]);

    expect(await repository.load()).toEqual({
      words: [progress.words[0]],
      completedDays: ["2026-11-22"],
    });
  });

  it("relit après les changements en cours", async () => {
    const storage = createFakeStorage();
    const repository = createLocalStorageProgressRepository(() => storage);

    const pending = repository.update(() => progress);
    const loaded = await repository.load();
    await pending;

    expect(loaded).toEqual(progress);
  });

  it("ne bloque pas les changements suivants si un changement échoue", async () => {
    const storage = createFakeStorage();
    const repository = createLocalStorageProgressRepository(() => storage);

    await expect(
      repository.update(() => {
        throw new Error("oups");
      }),
    ).rejects.toThrow("oups");
    await repository.update(() => progress);

    expect(await repository.load()).toEqual(progress);
  });

  it("garde la progression après fermeture et rechargement de l'app", async () => {
    const storage = createFakeStorage();
    await createLocalStorageProgressRepository(() => storage).update(
      () => progress,
    );

    // Nouvelle instance sur le même stockage : l'app a été rechargée.
    const reloaded = createLocalStorageProgressRepository(() => storage);

    expect(await reloaded.load()).toEqual(progress);
  });

  it("stocke la progression sous une clé dédiée, en JSON", async () => {
    const storage = createFakeStorage();

    await createLocalStorageProgressRepository(() => storage).update(
      () => progress,
    );

    expect(JSON.parse(storage.getItem(PROGRESS_STORAGE_KEY)!)).toEqual(
      progress,
    );
  });

  it("renvoie une progression vide si le stockage contient du JSON illisible", async () => {
    const storage = createFakeStorage({ [PROGRESS_STORAGE_KEY]: "{oups" });

    const loaded = await createLocalStorageProgressRepository(
      () => storage,
    ).load();

    expect(loaded).toEqual(EMPTY_PROGRESS);
  });

  it("ne plante pas sans stockage disponible (rendu serveur)", async () => {
    const repository = createLocalStorageProgressRepository(() => undefined);

    await expect(repository.update(() => progress)).resolves.toEqual(progress);
    expect(await repository.load()).toEqual(EMPTY_PROGRESS);
  });
});

describe("createInMemoryProgressRepository", () => {
  it("part de la progression donnée et relit ce qu'on enregistre", async () => {
    const repository = createInMemoryProgressRepository(progress);
    expect(await repository.load()).toEqual(progress);

    await repository.update(() => EMPTY_PROGRESS);

    expect(await repository.load()).toEqual(EMPTY_PROGRESS);
  });
});
