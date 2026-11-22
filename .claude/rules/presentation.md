---
paths:
  - "src/app/**"
  - "src/components/**"
---

# Couche présentation

Périmètre : `src/app` (App Router) et `src/components`.

## Règles

- N'appelle que la couche service (`@/services/*`). Jamais `@/data`, jamais le fichier JSON des mots, jamais le stockage de l'appareil (`localStorage`, IndexedDB). Les types nécessaires sont réexportés par le service.
- Aucune règle métier : pas de choix du mot du jour, de tri de la révision ni de calcul de série. Elle affiche ce que le service renvoie et lui transmet les actions de l'utilisateur.
- N'utilise que les composants du design system (shadcn, `src/components/ui`). S'il en manque un : `pnpm dlx shadcn@latest add <composant>`. Pas de composant maison équivalent, pas de `<button>`, `<input>`, `<select>`, `<textarea>`, `<table>` bruts hors de `src/components/ui`.
- Aucune couleur en dur : ni hex, `rgb()`, `hsl()`, `oklch()`, ni palette Tailwind brute (`zinc-*`, `slate-*`, `black`, `white`…), ni valeur arbitraire (`bg-[#…]`), ni `style={{ color }}`. Uniquement les tokens du thème : `background`, `foreground`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `card`, `popover`, `highlight`, `chart-1..5`, `sidebar-*`.
- Un besoin de couleur nouveau → ajouter un token dans `src/app/globals.css` (`:root`, `.dark` et `@theme inline`), jamais dans le composant.

## Comment vérifier

1. `pnpm lint` passe (la règle `no-restricted-imports` bloque `@/data` depuis `src/app` et `src/components`).
2. Aucune couleur en dur (résultat attendu : vide) :
   ```bash
   grep -rnE '#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(|-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]|-(black|white)\b' src/app src/components --include='*.tsx' --include='*.ts'
   ```
3. Aucun élément de formulaire brut hors design system (résultat attendu : vide) :
   ```bash
   grep -rnE '<(button|input|select|textarea|table)[ >]' src/app src/components --include='*.tsx' | grep -v 'src/components/ui/'
   ```
4. Aucun accès au fichier des mots ni au stockage de l'appareil (résultat attendu : vide) :
   ```bash
   grep -rnE "words\.json|localStorage|sessionStorage|indexedDB" src/app src/components --include='*.ts' --include='*.tsx'
   ```
