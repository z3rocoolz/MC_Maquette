# Signature Coda — proposition issue du site fourni

Variante du 10 octobre 2026. Les couleurs ont été relevées dans l’archive originale transmise par le commanditaire, et non déduites des refontes précédentes.

| Couleur relevée | Valeur | Utilisation proposée |
| --- | --- | --- |
| Noir profond | `#0A0A0A` | En-tête, séquence sur les techniques et pied de page |
| Or champagne | `#C9A96E` | Boutons, monogramme, accents sur fond noir |
| Champagne clair | `#E2C99A` | Survols et bloc de consultation |
| Crème | `#F8F6F2` | Fond principal et grands espaces de lecture |
| Gris chaud | `#F1EDE8` | Fonds secondaires |
| Texte anthracite | `#3A3A3A` | Paragraphes |
| Bronze lisible | `#7D6944` | Petits titres et liens sur les fonds clairs |
| Gris secondaire | `#6C6C6C` | Textes complémentaires |

Sources exactes dans le ZIP original : `projetWeb/assets/css/style-099d0f3fd054.css` pour la palette principale et `projetWeb/theme/lisibilite.css` pour le bronze et le gris corrigés. Les valeurs sont reprises du code fourni.

## Direction graphique

En-tête noir, nom clair et accents or, suivis d’un premier écran crème avec une grande photographie de profil. Le dessin conserve les espaces de lecture de la refonte, affine les arrondis des cartes et utilise le noir pour ponctuer le parcours. Les boutons dorés portent un texte noir. Le portrait réel du chirurgien et les autres photographies restent présents.

La rhinoplastie reste prioritaire. Les pages et les entrées vers les autres compétences sont conservées. Le choix d’ambiance ne change pas les informations médicales.

## Comparaison et modification

`dist/index.html` ouvre Signature Coda ; `dist/horizon.html` conserve l’accueil vert et ivoire. Les liens de comparaison sont de vrais liens HTML et fonctionnent sans JavaScript. Ils sont visibles en mode maquette. La comparaison Horizon porte sur l’accueil ; les autres pages utilisent le thème choisi dans `custom/refonte.json`.

`assets/css/coda-signature.css` contient le nouveau style. `assets/css/coda.css` conserve Horizon. Le paramètre `theme` de `custom/refonte.json` vaut `signature` ou `horizon`. Reconstruire après modification. Le paramètre est lu par le générateur et par l’administration.

## Contrastes et limites

Onze paires de couleurs pleines ont été calculées : elles dépassent toutes 4,5:1, avec un minimum de 4,506:1. Le contraste noir/or des boutons est de 8,847:1. Le bronze sur crème atteint 4,893:1. Le doré clair reste réservé aux fonds sombres, aux aplats et aux éléments décoratifs ; il n’est pas utilisé pour les petits textes sur crème.

Référence : [W3C — WCAG 2.2, contraste minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). La norme vise 4,5:1 pour les textes courants et 3:1 pour les grands textes. Le détail calculé est dans `docs/preuves/contrastes-signature.json`.

La nouvelle sortie comporte 39 fichiers HTML en comptant les anciennes maquettes. Les contrôles de liens portent sur les 36 fichiers actuels, dont l’accueil Horizon. Les contrôles Nu et de structure sont relancés pour cette livraison. La validation ne constitue pas un audit complet WCAG/RGAA ; le rendu visuel dans un navigateur réel, sur mobile, avec zoom et lecteurs d’écran reste à vérifier.
