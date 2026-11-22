# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Projet

L'intention produit, les contraintes et les critères d'acceptation sont dans `INTENT.md`, qui fait référence. Le projet n'est encore qu'un squelette, sans aucune fonctionnalité.

## Avant tout travail

- Lis INTENT.md.
- Lis les règles du projet dans .claude/rules/.

## Commandes

```bash
pnpm dev     # serveur de dev (Turbopack)
pnpm build   # build de production
pnpm lint    # ESLint (configs next core-web-vitals + typescript)
pnpm test    # Vitest, une passe (pnpm test src/data pour un dossier)
pnpm test:watch
pnpm test:e2e  # Playwright (e2e/), sur le build de production lancé sur le port 3100
```

Vitest 5 (`vitest.config.mts`) : environnement `node` par défaut, les tests de composants passent en jsdom avec `// @vitest-environment jsdom`. Les alias `@/*` sont résolus par Vite (`resolve.tsconfigPaths`), sans plugin.

## Branches

On travaille sur `dev`. `main` sert de branche de production.

## Stack : points non évidents

- **Next.js 16.4, App Router.** `next.config.ts` active `cacheComponents` et `partialPrefetching`. Consulter `node_modules/next/dist/docs/` avant d'écrire du code Next (voir AGENTS.md).
- **Tailwind v4 configuré en CSS.** Il n'y a ni `tailwind.config` ni config PostCSS : le CSS passe par le loader `@tailwindcss/turbopack` déclaré dans `next.config.ts`. Le thème (variables shadcn, `@theme inline`) se trouve dans `src/app/globals.css`.
- **shadcn, style `base-nova`.** Les composants reposent sur Base UI (`@base-ui/react`), pas sur Radix. Ajouter un composant : `pnpm dlx shadcn@latest add <nom>`, qui l'écrit dans `src/components/ui`.
- **Fonction `cn`.** Elle vient du paquet `cn` (publié par shadcn, à la place de clsx + tailwind-merge) et est réexportée par `@/lib/utils`.
- **Alias.** `@/*` pointe vers `src/*`.
- **Polices.** Elles passent par `next/font` : auto-hébergées au build, elles n'entraînent aucune requête tierce à l'exécution. C'est cohérent avec la contrainte « aucun traceur » d'INTENT.md.

## Architecture cible (INTENT.md)

- Trois couches séparées : interface, logique métier, accès aux données.
- Les mots viennent d'un fichier JSON versionné dans le repo. Seule la couche données le lit.
- La progression (mots vus, à revoir, série) est stockée sur l'appareil. Seule la couche données y touche, pour qu'on puisse passer plus tard à un stockage en ligne sans modifier le reste.
- La logique métier (mot du jour, file de révision, série) est pure et couverte par des tests unitaires.
- PWA utilisable hors ligne, aucun traceur ni analytics, police avec les glyphes tamouls.

## Git
- On travaille sur dev. Jamais de commit direct sur main.
- Un seul commit par lot : feat(lot-N): <titre du lot>.
- Les PR vont de dev vers main.
- Les tests passent avant toute PR.

## Secrets
- Les valeurs vont dans .env.local, ignoré par Git. Le repo ne contient que .env.example, sans valeurs.
- Ne lis jamais .env ni .env.local.
