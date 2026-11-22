// Critère d'INTENT.md : une fois chargée, l'app s'ouvre et fonctionne sans
// réseau (mot du jour, révision, série), sur le build de production.

import { expect, test } from "@playwright/test";

test("parcours complet sans réseau une fois l'app chargée", async ({
  context,
  page,
}) => {
  // 1. Première visite en ligne : le service worker s'installe et prend la main.
  await page.goto("/");
  const word = page.getByRole("heading", { level: 1 });
  await expect(word).toBeVisible();
  const tamil = (await word.textContent())!;
  await page.waitForFunction(
    () => navigator.serviceWorker.controller !== null,
  );

  // 2. Réseau coupé : l'app se rouvre depuis le service worker.
  await context.setOffline(true);
  const offline = await page.reload();
  expect(offline?.fromServiceWorker()).toBe(true);

  // Mot du jour.
  await expect(page.getByRole("heading", { level: 1, name: tamil })).toBeVisible();
  await expect(page.getByLabel("Série : 0 jour")).toBeVisible();

  // Révision : toutes les cartes.
  await page.getByRole("button", { name: "Réviser" }).click();
  const flip = page.getByRole("button", { name: "Retourner la carte" });
  await expect(flip).toBeVisible();
  while (await flip.isVisible()) {
    await flip.click();
    await page.getByRole("button", { name: "Je sais" }).click();
  }
  await expect(page.getByText("Fini pour aujourd'hui")).toBeVisible();

  // Série.
  await expect(page.getByLabel("Série : 1 jour")).toBeVisible();

  // 3. Toujours hors ligne, l'app rouverte garde la progression.
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: tamil })).toBeVisible();
  await expect(page.getByLabel("Série : 1 jour")).toBeVisible();
});
