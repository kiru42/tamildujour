# Intention · Tamil du jour

## Produit
Une petite app web qui fait apprendre un mot tamoul par jour à des enfants qui grandissent en France, accompagnés d'un parent.
Chaque jour, l'app montre un mot : son écriture tamoule, sa prononciation en lettres latines, sa traduction en français et une phrase d'exemple.
L'enfant révise ensuite les mots déjà vus en cartes (« je sais » / « à revoir ») et garde une série de jours d'affilée.
But : transmettre la langue un peu chaque jour, sans écran long ni pression.

## Utilisateurs
- Un parent tamoulophone ou non, qui lance la séance (2 à 5 minutes).
- Un enfant de 4 à 10 ans qui ne lit pas encore forcément le tamoul.

## Architecture
Trois couches bien séparées : l'interface, la logique métier, l'accès aux données.
Les mots viennent d'un fichier de données versionné dans le repo (JSON), relu par un humain ; seule la couche données le lit.
La progression (mots vus, à revoir, série) est gardée sur l'appareil ; seule la couche données y touche, pour pouvoir passer plus tard à un stockage en ligne sans toucher au reste.
La logique métier (choix du mot du jour, file de révision, calcul de la série) est pure et couverte par des tests unitaires.

## Contraintes
- Next.js avec les composants shadcn, en français.
- Installable sur téléphone (PWA) et utilisable hors ligne une fois chargée.
- Hébergement sur Vercel ; repo public.
- L'écriture tamoule s'affiche correctement sur iPhone et Android (police avec les glyphes tamouls).
- Accessible : gros boutons, texte lisible par un enfant, contraste suffisant.
- Aucune donnée personnelle collectée ; aucun traceur.

## Hors périmètre
- Aucun compte, aucune authentification.
- Pas de son ni d'enregistrement de voix dans la V1.
- Pas de grammaire, pas d'écriture à la main, pas de jeux.

## Critères d'acceptation
- Le même jour, l'app montre le même mot ; le lendemain, un autre.
- Un mot marqué « à revoir » revient dans la révision avant les mots sus.
- La série augmente quand la séance du jour est faite ; un seul jour manqué ne la remet pas à zéro, deux jours d'affilée oui.
- La progression est conservée après fermeture et rechargement de l'app.
- Installée sur le téléphone, l'app s'ouvre et fonctionne sans réseau.
- Ajouter des mots ne demande que de modifier le fichier de données.
