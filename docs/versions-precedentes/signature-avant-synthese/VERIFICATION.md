# Vérification de la refonte — 10 octobre 2026

La variante Signature Coda et ses contrastes sont documentés dans `STYLE-SIGNATURE-CODA.md`.

Ce dossier décrit uniquement les contrôles exécutés sur cette refonte. Les anciens rapports ne valent pas validation du nouveau rendu.

| Contrôle | Résultat constaté |
| --- | --- |
| Installation des dépendances avec le verrou fourni | `npm ci --ignore-scripts --no-audit --no-fund` réussi, 96 paquets installés. |
| Génération | 32 pages de contenu, deux alias et une page 404. |
| Nu HTML Checker | 39 fichiers HTML, anciennes maquettes comprises ; aucune erreur, aucun avertissement et aucun message informatif. |
| Structure et ressources | 36 fichiers actuels ; aucun lien local, ancrage ou fichier référencé manquant ; titres, langue, alternatives d’images, métadonnées et JSON-LD contrôlés. |
| Interactions | 35 assertions réussies en DOM simulé : menu, Échap et restitution du focus, affichage des techniques, filtres, maintien des contenus sans JavaScript, conservation des structures à l’édition, filtrage de HTML actif et régénération d’une modification. |
| Contrastes de la palette | Neuf paires de couleurs pleines calculées ; rapports de 5,31:1 à 11,37:1. Le texte superposé aux photos n’est pas couvert par ce calcul. |

## Accessibilité mise en œuvre

Langue française déclarée, un titre principal par page, repères sémantiques, lien d’évitement, focus visible, alternatives des images, boutons et liens natifs, états ARIA du menu et des filtres, FAQ avec `details/summary`, réduction des animations et prise en charge des couleurs forcées. Sans JavaScript, les contenus restent présents et les choix de techniques deviennent des liens d’ancrage.

Les vérifications d’interactions utilisent LinkeDOM. Elles ne mesurent ni mise en page, ni débordement, ni ordre de lecture effectivement restitué par un lecteur d’écran. Aucun navigateur de contrôle compatible n’était disponible pour cette livraison : les vérifications visuelles à 320/390 px, le zoom, le tactile, VoiceOver/NVDA et un audit WCAG/RGAA complet restent à effectuer. Il n’est donc pas revendiqué de conformité complète.

## Référencement

Présence de titres et descriptions, liens internes, URL canoniques, Open Graph, données structurées et sitemap. Le mode maquette garde les directives de non-indexation. L’activation du référencement nécessite un domaine définitif, des contenus validés et un nouveau build. Aucun positionnement ni résultat enrichi n’est garanti.

## Reproduire les contrôles

`npm run release` lance la génération et le contrôle des liens. Les résultats bruts sont dans `docs/preuves/` : `w3c.json`, `structure.json`, `interactions.json`, `contrastes.json` et `admin-assainissement.json`.

Pour le Nu HTML Checker, passer uniquement la liste des fichiers `.html` à `java -jar vnu.jar --format json` ; ne pas lui passer les images ou polices. Le vérificateur peut aussi être utilisé à [validator.w3.org/nu/](https://validator.w3.org/nu/).

Le script d’interactions est fourni dans `docs/verification/check-behaviour.cjs`. Il utilise le module de développement `linkedom` et la variable `CODA_SOURCE_ROOT` pour désigner la racine du projet. Il modifie temporairement le titre de l’accueil puis restaure le JSON initial et régénère sa page dans un bloc `finally`.
