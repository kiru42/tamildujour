# ADR 001 — Progression stockée dans localStorage, derrière un repository asynchrone

- Status: accepted
- Date: 2026-11-22
- Scope: story lot-4

## Context
La progression (mots vus, statut « je sais » / « à revoir », jours de séance faits) doit survivre à la fermeture et au rechargement de l'app, y compris hors ligne (PWA). INTENT.md exclut tout compte et toute donnée personnelle collectée, mais demande de pouvoir passer plus tard à un stockage en ligne sans toucher aux couches service et présentation. Le volume est faible : quelques centaines de mots au plus.

## Decision
- La progression est sérialisée en JSON sous une seule clé `localStorage` versionnée : `tamildujour:progress:v1`.
- Seule la couche données y accède, via l'interface `ProgressRepository` (`load()`, `update(change)`), qui est asynchrone même si `localStorage` est synchrone.
- Toute écriture passe par `update(change)`. Les changements sont mis en file et appliqués l'un après l'autre, si bien qu'une révision et une mise à jour de la série simultanées ne s'écrasent pas.
- La valeur relue est validée : une valeur illisible donne une progression vide, une entrée invalide est écartée sans perdre les autres.
- Une implémentation en mémoire sert aux tests. Le choix de l'implémentation réelle se fait uniquement dans `src/services/container.ts`.

## Considered options
- IndexedDB — rejeté : API plus lourde, injustifiée pour un seul petit document JSON.
- Stockage en ligne (base + API) — rejeté pour la V1 : il imposerait une identification, hors périmètre, et casserait l'usage hors ligne. L'interface asynchrone le garde possible.
- Cookies — rejeté : envoyés au serveur à chaque requête, contraire à « aucune donnée collectée », et limités en taille.
- Interface synchrone calquée sur `localStorage` — rejeté : le passage à un stockage en ligne aurait changé les signatures et touché les services.

## Consequences
- Bien : marche hors ligne, aucune donnée ne quitte l'appareil, les services sont testés avec le repository en mémoire, et changer de stockage ne touche que `src/data`.
- Mal : la progression est liée à un navigateur sur un appareil. Pas de synchronisation entre appareils, et vider les données du site efface tout.
- Mal : un changement de format demande une nouvelle clé (`v2`) et une migration dans la couche données.
