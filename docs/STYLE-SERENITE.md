# Coda — Crème & sauge

Révision du 11 octobre 2026 à partir du logo et de la palette fournis le 10 octobre. Elle remplace la direction noire et champagne du site courant.

## Direction visuelle

| Usage | Couleur |
| --- | --- |
| Titres, texte principal, boutons | Graphite `#252927` |
| Filets décoratifs, identité | Champagne `#C9A96E` |
| Fond principal | Crème `#F8F6F2` |
| Cartes d’accompagnement | Sauge `#DDE6DF` |
| Surfaces de lecture | Blanc `#FFFFFF` |
| Liens sur blanc/crème et focus | Or profond `#816037` |

Le logo original est conservé dans `assets/img/logo-coda-original.png`. Sa conversion WebP sert à l’affichage : le symbole est cadré en CSS dans l’en-tête, avec le nom en texte accessible ; le logo complet est repris au pied de page. Le nom de spécialité utilisé dans les textes et données structurées reste « chirurgien maxillo-facial et stomatologue ».

Le titre utilise Cormorant Garamond, les textes Manrope. Les polices sont locales. La photographie d’illustration de profil a été renouvelée ; le vrai portrait du chirurgien est conservé, avec un cadrage CSS adapté. Aucune photographie n’est présentée comme un résultat opératoire. Les images WebP disposent de dimensions et de variantes de résolution.

## Réduire le défilement

L’accueil passe de dix compositions successives à une introduction avec quatre accès directs aux autres compétences, puis deux cartes : le praticien et les démarches utiles. Les informations chirurgicales restent dans les pages dédiées. Aucun carrousel automatique, plein écran imposé, contenu tronqué ou défilement interne de page n’est ajouté.

Les pages internes ont une introduction plus courte. Les grandes photographies décoratives répétées sont supprimées. Les rubriques des guides utilisent `details` et `summary`, la première étant ouverte. Une commande permet de tout ouvrir ou replier ; les liens directs ouvrent leur rubrique et préservent l’accès au clavier. Les rubriques restent manipulables sans JavaScript. L’impression ouvre temporairement tous les détails puis rétablit leur état de lecture.

Les lieux de consultation apparaissent avant les explications du parcours. L’en-tête reste disponible sur bureau ; il reprend le flux normal sur petit écran pour laisser de la place au contenu. Le sommaire peut se déplier sans occuper plusieurs écrans sur mobile.

## Contraste et vérifications

L’or profond sur sauge atteint 4,495:1 : il n’est donc pas utilisé pour le texte courant sur ce fond. Ces textes et leurs survols sont graphite. L’or profond convient aux indicateurs non textuels et au focus, dont le seuil visé est 3:1. Les onze paires calculées et leurs usages figurent dans `preuves/contrastes-serenite.json` ; ces calculs ne remplacent pas une inspection du rendu réel.

Les mesures en pixels de hauteur totale, les essais de zoom et les rendus navigateur n’ont pas été réalisés dans cet environnement. Aucun pourcentage de réduction du défilement n’est annoncé. Le détail des contrôles réellement exécutés est dans `VERIFICATION.md`.

Références : [W3C — Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [W3C — Keyboard accessible](https://www.w3.org/WAI/WCAG21/Understanding/keyboard-accessible), [W3C — Accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/). Les contrôles HTML natifs sont privilégiés ; aucun rôle ARIA de tabulation n’est simulé.
