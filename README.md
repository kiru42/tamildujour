# Tamil du jour

Une petite app web qui fait apprendre un mot tamoul par jour à des enfants qui grandissent en France, accompagnés d'un parent. La séance dure de 2 à 5 minutes :

1. **Le mot du jour** : l'écriture tamoule, la prononciation en lettres latines, la traduction et une phrase d'exemple. Le même jour, tout le monde voit le même mot.
2. **La révision** : jusqu'à 5 cartes de mots déjà vus. On retourne la carte, puis on répond « Je sais » ou « À revoir ». Les mots « à revoir » reviennent en premier.
3. **La série 🔥** : elle augmente d'un jour à chaque séance terminée. Un jour manqué ne la remet pas à zéro (« Ne rate pas deux fois ») ; deux jours manqués d'affilée, si.

L'app s'installe sur l'écran d'accueil (PWA) et fonctionne sans réseau une fois chargée. Aucun compte, aucune donnée personnelle, aucun traceur : la progression reste sur l'appareil.

L'intention produit et les critères d'acceptation sont dans [INTENT.md](INTENT.md).

## Lancer l'app

Prérequis : Node.js 20 ou plus récent et pnpm.

```bash
pnpm install
pnpm dev      # http://localhost:3000
```

Autres commandes :

```bash
pnpm test     # tests Vitest (données, logique métier, interface)
pnpm test:e2e # parcours complet hors ligne sur le build de production (Playwright)
pnpm lint     # ESLint
pnpm build    # build de production
pnpm start    # sert le build de production
```

Le service worker (mode hors ligne) n'est actif qu'en production : pour l'essayer en local, lancer `pnpm build` puis `pnpm start`. `pnpm test:e2e` le vérifie automatiquement ; la première fois, installer le navigateur avec `pnpm test:e2e:install`.

## Ajouter des mots

Les mots sont dans un seul fichier, `src/data/words.json`, relu par un humain. Ajouter un mot ne demande que de modifier ce fichier : ajoutez un objet à la fin de la liste.

```json
{
  "id": "meen",
  "tamil": "மீன்",
  "transliteration": "meen",
  "french": "poisson",
  "example": {
    "tamil": "மீன் நீந்துகிறது.",
    "transliteration": "meen neenthukirathu.",
    "french": "Le poisson nage."
  }
}
```

- `id` : identifiant unique, en lettres latines. Ne le changez plus une fois publié, car la progression des enfants s'y rattache.
- `tamil` et `example.tamil` : en écriture tamoule.
- Tous les champs sont obligatoires et non vides.

Lancez ensuite `pnpm test` : un mot invalide (champ manquant, id en double, champ tamoul sans écriture tamoule) fait échouer le test de validation des données, avec le nom du mot en cause.

Les mots défilent dans l'ordre du fichier, un par jour, puis le cycle recommence. Ajoutez les nouveaux mots à la fin, pour ne pas changer le mot du jour des jours déjà passés.

## Architecture

Trois couches séparées :

- `src/data` : accès aux données. C'est la seule couche qui lit `words.json` et le stockage de l'appareil (`localStorage`).
- `src/services` : logique métier pure (mot du jour, file de révision, série), couverte par des tests unitaires.
- `src/app` et `src/components` : l'interface (Next.js, composants shadcn). Elle ne parle qu'aux services.

Les règles de chaque couche sont dans `.claude/rules/`.

## Mise en ligne

L'app est hébergée sur Vercel : chaque fusion dans `main` déploie la production. On travaille sur `dev`, et les PR vont de `dev` vers `main`.
