# Lots · Tamil du jour

Chaque lot est une chose que l'utilisateur fait de bout en bout. Un lot = une issue `lot`, une PR, un commit `feat(lot-N)`.
Ordre : chaque lot s'appuie sur le précédent. Les critères viennent d'INTENT.md.

## Lot 3 · Voir le mot du jour
Parcours : j'ouvre l'app → je vois le mot du jour en grand (écriture tamoule), sa prononciation en lettres latines, sa traduction et une phrase d'exemple.
- [ ] Les mots viennent de `src/data/words.json` (20 mots de départ, relus) ; seule la couche données le lit.
- [ ] Le même jour, l'app montre le même mot ; le lendemain, un autre (choix déterministe à partir de la date, testé avec des dates fixes).
- [ ] Quand tous les mots ont été montrés, le cycle recommence sans planter.
- [ ] L'écriture tamoule s'affiche avec une police qui a les glyphes tamouls (pas de carrés vides).
- [ ] Ajouter un mot ne demande que de modifier `src/data/words.json` ; un mot invalide (champ manquant) fait échouer un test de validation des données.

## Lot 4 · Réviser les mots déjà vus
Parcours : après le mot du jour, je touche « Réviser » → une carte montre un mot déjà vu en tamoul → je la retourne → je réponds « je sais » ou « à revoir » → carte suivante → « Fini pour aujourd'hui ».
- [ ] Seuls les mots déjà montrés comme mot du jour entrent dans la révision.
- [ ] Un mot « à revoir » revient avant les mots sus.
- [ ] Une séance de révision fait au plus 5 cartes.
- [ ] La progression (vus, sus, à revoir) est gardée sur l'appareil ; seule la couche données y touche.
- [ ] La progression est conservée après fermeture et rechargement de l'app.

## Lot 5 · Garder ma série de jours
Parcours : je termine la séance du jour (mot vu + révision finie) → la série 🔥 augmente → je la vois en haut de l'écran.
- [ ] La série augmente d'1 quand la séance du jour est faite, une seule fois par jour.
- [ ] Un seul jour manqué ne remet pas la série à zéro ; deux jours manqués d'affilée, oui.
- [ ] Le lendemain d'un jour manqué, l'app affiche « Ne rate pas deux fois ».
- [ ] Le calcul de la série est une fonction pure, testée avec des dates fixes (dont un changement de mois).

## Lot 6 · Installer l'app et l'utiliser sans réseau
Parcours : j'ouvre le site sur mon téléphone → je l'ajoute à l'écran d'accueil → je l'ouvre en mode avion → tout marche.
- [ ] Manifeste PWA (nom, icônes, couleurs) : l'app s'installe sur iPhone et Android.
- [ ] Une fois chargée, l'app s'ouvre et fonctionne sans réseau (mot du jour, révision, série).
- [ ] Gros boutons (≥ 44 px), texte lisible par un enfant, contraste AA vérifié.
- [ ] Aucun traceur, aucun appel réseau vers un service tiers (vérifié dans le test).

## Lot 7 · Mettre l'app en ligne
Parcours : je partage un lien → n'importe qui ouvre l'app et fait la séance du jour.
- [ ] Déployée sur Vercel depuis `main` ; l'URL publique répond.
- [ ] Un mot vu et une série gardés restent après rechargement sur l'URL publique.
- [ ] Le README explique le projet, comment lancer l'app et comment ajouter des mots.
- [ ] Le repo ne contient ni secret ni `.env` (vérifié par le sous-agent securite).