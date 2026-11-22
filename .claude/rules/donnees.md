---
paths:
  - "src/data/**"
---

# Couche données

Périmètre : `src/data`.

## Règles

- Seule couche qui lit le fichier JSON des mots (`src/data/words.json`, versionné et relu par un humain) et seule couche qui touche au stockage de l'appareil (`localStorage`, IndexedDB), où vit la progression : mots vus, mots à revoir, série.
- Expose des interfaces de repository (`XRepository`) et des types de domaine. Le JSON brut et les valeurs sérialisées du stockage ne sortent jamais : le repository les valide puis les convertit.
- Aucune règle métier. Un repository lit et écrit ce qu'on lui demande. Choisir le mot du jour, ordonner la révision ou calculer la série appartient au service.
- N'importe ni `@/services`, ni `@/app`, ni `@/components`.
- Passer du stockage de l'appareil à un stockage en ligne ne modifie que ce dossier : les signatures des interfaces de repository restent stables.
- Aucune donnée personnelle, aucun appel à un service tiers. Si un stockage en ligne arrive, ses secrets vont dans `.env.local`, jamais dans un fichier versionné.
- Chaque repository a un test colocalisé qui tourne en mémoire ou sur un faux stockage.

## Comment vérifier

1. `pnpm test src/data` passe.
2. Aucun accès au fichier des mots ni au stockage hors de `src/data` (résultat attendu : vide) :
   ```bash
   grep -rnE "words\.json|localStorage|sessionStorage|indexedDB" src --include='*.ts' --include='*.tsx' | grep -v '^src/data/'
   ```
3. Aucune dépendance remontante (résultat attendu : vide) :
   ```bash
   grep -rnE "from ['\"]@/(services|app|components)" src/data
   ```
4. Remplacer l'implémentation d'un repository (par ex. mémoire ↔ `localStorage` ↔ en ligne) ne demande aucune modification hors de `src/data`.
