# Vérification — Maquette 02 « Horizon » — 24 septembre 2026

La deuxième proposition est l’accueil `index.html`. La première proposition reste accessible à `version-01.html`. Ses vérifications historiques sont conservées dans `VERIFICATION-VERSION-01.md`.

## Résultats de cette version

| Contrôle | Résultat observé |
|---|---|
| Validation HTML | Nu HTML Checker 26.9.16 (e63d468) : aucun message pour index.html, informations.html et version-01.html. |
| Syntaxe JavaScript | `node --check dist/assets/script.js` réussi. |
| Structure | Langue française, un h1 par page, identifiants uniques, liens locaux et ancres résolus, JSON-LD lisible sur les trois pages. |
| Accessibilité automatique | axe-core : aucune violation signalée dans les six états ci-dessous. Ce résultat ne constitue pas une certification. |
| Mise en page | Accueil vérifié à 1 280, 390 et 320 px ; informations à 1 280 px. Aucun débordement horizontal de page. |
| Texte agrandi | Taille racine doublée à 32 px sur une surface de 1 280 px : aucun débordement horizontal. Ce contrôle ne remplace pas tous les tests de zoom natif. |
| Sans JavaScript | À 390 px, la navigation et le guide de préparation restent visibles ; le bouton de menu destiné au JavaScript est masqué. |
| Menu mobile | Ouverture, aria-expanded et fermeture avec Échap vérifiés. |
| Guide de consultation | Ouverture, boucle Tab/Maj+Tab, fermeture avec Échap et retour du focus au déclencheur vérifiés. |
| Revue visuelle | Accueil et sections revus sur ordinateur et à petite largeur. |

Les six états axe-core sont : accueil à 1 280 px, 390 px et 320 px ; accueil avec texte agrandi à 200 % ; informations à 1 280 px ; accueil sans JavaScript à 390 px. La première proposition a été revalidée en HTML ; ses contrôles d’accessibilité antérieurs sont archivés séparément.

Preuves : `preuves/w3c-maquette-02.json`, `preuves/structure-maquette-02.json`, `preuves/a11y-maquette-02.json` et `preuves/clavier-maquette-02.json`.

## Contrastes des principales surfaces

Ratios calculés à partir de la luminance relative des couleurs CSS.

| Texte ou indicateur / fond | Ratio |
|---|---:|
| Bleu principal / blanc | 9,01:1 |
| Texte secondaire / bleu clair | 5,11:1 |
| Texte secondaire / sable | 5,02:1 |
| Bleu principal / citron doux | 7,82:1 |
| Texte clair / bleu ardoise | 7,64:1 |
| Indicateur de focus / blanc | 6,27:1 |

Preuve : `preuves/contrastes-maquette-02.json`. Les fonds photographiques, transparences et certains signes décoratifs nécessitent une appréciation manuelle : axe-core les signale comme indéterminés. Une revue visuelle a été réalisée, mais ces ratios de couleurs unies ne démontrent pas le contraste de chaque pixel des zones photographiques.

## Limites

Ces vérifications ne constituent pas un audit complet WCAG ou RGAA. Aucun essai avec NVDA, JAWS ou VoiceOver, appareil mobile physique, Safari, Firefox ou zoom natif à 400 % n’est revendiqué. Les préférences de réduction des animations et les couleurs forcées sont prises en compte dans les styles ; elles n’ont pas fait l’objet d’un audit système dédié.

Les composants HTML natifs, le lien d’évitement, les noms accessibles, les états de focus et la navigation sans JavaScript sont présents. La vérification au clavier de cette deuxième proposition porte sur le menu et le guide de consultation ; les autres interactions n’ont pas toutes fait l’objet d’un nouvel essai manuel.

## Référencement, contenu et livraison

Titres distincts, descriptions, liens canoniques, langue française, contenu dans le HTML initial et données structurées sont présents. La maquette est volontairement en `noindex` : les coordonnées, qualifications, spécialités et textes médicaux doivent être confirmés avant de préparer la version publique indexable. Aucun classement Google ni score Lighthouse ou Core Web Vitals n’est annoncé.

Les deux propositions partagent un dossier autonome en HTML, CSS et JavaScript. Quatre photographies d’illustration générées sont incluses au total, en WebP, avec variantes adaptées pour les grands visuels. Les photos ne représentent ni Mr Mattia Coda ni des patients ou résultats réels. Les polices sont locales. Aucun framework côté client ni service externe n’est nécessaire à l’affichage.

Les pages et scripts temporaires d’audit sont exclus de la livraison. Les preuves antérieures conservées dans le dossier correspondent aux versions indiquées dans leurs noms et dans le rapport historique.
