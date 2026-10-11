# Vérifications de la version Crème & sauge et textes techniques

Résultats de la révision du 11 octobre 2026. Aucune validation clinique ni certification d’accessibilité n’est déduite de ces contrôles.

| Contrôle exécuté | Résultat |
| --- | --- |
| Génération | 38 contenus, alias et page 404 |
| HTML Nu | 48 fichiers, zéro erreur et zéro avertissement ; comprend trois HTML historiques |
| Structure et liens locaux | 45 HTML courants, zéro anomalie |
| Interactions / administration en DOM simulé | 35 assertions réussies |
| Préparation, URL des lieux, sauvegarde des adresses | 4 tests réussis |
| Rubriques, liens directs, focus, ouverture globale et impression | 5 tests réussis |
| Conservation des sources et lecture technique | 4 tests réussis ; 28 fichiers inchangés, 18 pages, 115 rubriques, 583 fragments |
| Contrastes de couleurs pleines | 11 paires aux seuils applicables ; texte courant : minimum 5,313:1 |
| Syntaxe des scripts et espaces du diff | Contrôlés |

Preuves courantes : `preuves/validation-nu-technique.json`, `preuves/structure.json`, `preuves/interactions.json`, `preuves/patient-reading-technical-tests.txt`, `preuves/fidelite-technique.json`. Les 13 tests patients, lecture et textes techniques passent ensemble. `preuves/contrastes-serenite.json` documente les couleurs pleines de la charte conservée ; il ne remplace pas une mesure du rendu des nouveaux composants. Les fichiers portant « synthese » ou « validation-nu-serenite » décrivent les versions précédentes.

Les tests utilisent LinkeDOM, sans rendu visuel ni lecteur d’écran. Ils vérifient le menu et Échap, les accès directs, le filtre, les structures conservées par l’éditeur, le nettoyage du contenu actif, la régénération, les cases de préparation, les URL canoniques et les rubriques. L’impression testée est le cycle JavaScript avant/après impression, pas une sortie papier.

La précédente relecture a permis de rétablir quatre pages orphelines et de corriger un contraste de survol. Une nouvelle relecture des textes techniques a contrôlé la fidélité des 28 fichiers au ZIP, les exclusions et 118 liens techniques sans destination manquante ni identifiant dupliqué. Elle n’a relevé aucun problème concret dans ce périmètre.

La configuration Playwright/axe et Lighthouse est fournie dans `qa/` et `.github/workflows/quality.yml`, avec les parcours de rubriques, de lecture technique, de clavier et un test sans JavaScript. Elle n’a pas été exécutée ici, le contrôle navigateur autorisé n’étant pas disponible. Les contrôles réels à 320 px, zoom 200 %/400 %, captures comparatives, impression, NVDA, VoiceOver, Lighthouse, axe et Core Web Vitals terrain restent à réaliser. Aucun score n’est annoncé.

Seul `dist/` est destiné à l’hébergement. Les sources, originaux photographiques non publiés et l’administration locale ne sont pas servis. Le site reste privé et non indexable jusqu’à validation des contenus et de sa publication officielle.
