# Vérification de la maquette — 23 septembre 2026

## Mise à jour : palette lumineuse

La palette ivoire, bleu pétrole, turquoise et sable remplace le prune. Les deux pages sont à nouveau valides selon Nu HTML Checker. Les contrôles axe-core ne signalent aucune violation : accueil à 1 280 et 320 px, page d’informations à 1 280 px. Aucun débordement horizontal. La nouvelle palette a été revue visuellement sur ordinateur et à petite largeur. Preuves : `preuves/a11y-couleurs.json`, `preuves/contrastes.json` et `preuves/w3c-html.json`.

## Mise à jour précédente : identité de Mr Mattia Coda

Après adaptation du nom, des textes et des métadonnées, les deux pages ont été de nouveau vérifiées par Nu HTML Checker : aucun message. L’accueil a été contrôlé à 320, 390 et 1 280 px, ainsi que la page d’informations à 1 280 px : aucune violation axe-core et aucun débordement horizontal. Les photos se chargent. Les illustrations, le nom et la navigation ont fait l’objet d’une revue visuelle. Résultats : `preuves/a11y-mattia-coda.json` et `preuves/w3c-html.json`.

Les contrôles d’interaction, de zoom et sans JavaScript ci-dessous ont été réalisés sur la version initiale ; le code JavaScript et les règles de mise en page n’ont pas changé lors de cette adaptation.

## Résultats

| Contrôle | Résultat |
|---|---|
| Nu HTML Checker, moteur utilisé par le validateur W3C | Deux pages vérifiées ; 0 erreur, 0 avertissement, 0 message informatif. Version 26.9.16 (e63d468). |
| Syntaxe JavaScript | `node --check assets/script.js` réussi. |
| Structure et navigation | Un h1 et langue française par page, identifiants uniques, liens locaux/ancres/fichiers présents, données structurées JSON lisibles. |
| Accessibilité automatique | axe-core 4.13.0, règles WCAG 2 A/AA, 2.1 AA, 2.2 AA et bonnes pratiques ; aucune violation signalée sur les états vérifiés. |
| Accueil responsive | Contrôlé à 320, 390, 768 et 1 280 px dans Chrome : aucun débordement horizontal de page. |
| Texte agrandi | Taille racine à 200 % sur une surface de 1 280 px : aucun débordement horizontal après correction du menu. Ce test ne remplace pas tous les tests de zoom natif. |
| Images | Les trois photographies se chargent, avec alternatives et dimensions explicites. |
| Menu mobile | Ouverture, mise à jour de aria-expanded et fermeture avec Échap vérifiées. |
| Guide de consultation | Ouverture, boucle Tab/Maj+Tab, fermeture avec Échap et retour du focus au déclencheur vérifiés. |
| FAQ | Ouverture d’une réponse avec Entrée vérifiée ; composant HTML natif. |
| Lien d’évitement | L’activation au clavier place le focus sur main#contenu. |
| Sans JavaScript | La navigation et la préparation de consultation restent visibles et accessibles. |

## Contrastes des principales surfaces

Ratios calculés avec la luminance relative définie par les WCAG.

| Texte / fond | Ratio |
|---|---:|
| Texte principal / ivoire | 11,62:1 |
| Texte secondaire / ivoire | 5,73:1 |
| Texte secondaire / eau | 5,17:1 |
| Boutons blancs / turquoise | 5,88:1 |
| Titres turquoise / eau | 5,15:1 |
| Texte clair / bleu pétrole | 6,96:1 |
| Accent menthe / bleu pétrole | 5,6:1 |
| Légende portrait | 11,96:1 |
| Texte secondaire / sable | 5,09:1 |
| Focus / ivoire | 5,45:1 |

Le dégradé de l’accueil empêche axe-core de conclure automatiquement sur les textes placés dessus. Leurs contrastes ont été calculés aux deux extrémités du dégradé : ils restent supérieurs à 4,5:1. L’analyse automatique demande également une revue manuelle de deux flèches décoratives et du monogramme MC. sur la photo. Ces éléments portent aria-hidden. Les deux liens contenant les flèches disposent d’un nom accessible et d’un texte ou pictogramme contrasté ; le monogramme n’apporte aucune information et n’est pas interactif. Les légendes qui transmettent une information disposent d’un fond opaque.

## Limites du contrôle

Il ne s’agit pas d’une certification WCAG ou RGAA. Aucun audit complet avec NVDA, JAWS ou VoiceOver n’a été réalisé. Les essais dans Safari/Firefox, les appareils mobiles physiques, le zoom natif à 400 %, les réglages système de contraste renforcé et un audit RGAA complet restent à effectuer pour le site public définitif. Le réglage de réduction des animations et les styles pour couleurs forcées sont implémentés dans la CSS, mais n’ont pas fait l’objet d’un audit système dédié.

Les captures illustrent le rendu observé dans Chrome. Les rapports automatisés vérifient des propriétés techniques ; ils ne mesurent ni la qualité des soins ni la véracité médicale du futur contenu.

## Référencement et performance

Les titres, descriptions, métadonnées, canoniques, contenu HTML initial et JSON-LD sont présents. La démonstration est volontairement non indexable. Aucun classement Google, score Lighthouse ou score Core Web Vitals n’est annoncé : ils n’ont pas été mesurés.

Les trois photos sont en WebP, avec variante mobile pour le portrait. Les polices sont locales. Il n’y a ni framework chargé côté client, ni bibliothèque d’animation, ni service externe nécessaire au rendu. Les scripts de vérification ont été retirés des fichiers publiés.

Les preuves JSON sont dans `docs/preuves/`. Le dossier ne conserve pas les rapports des anomalies initiales corrigées.
