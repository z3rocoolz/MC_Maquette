# Dr Mattia Coda — Crème & sauge, navigation compacte

Site personnel en HTML, CSS et JavaScript natifs. Logo et palette crème, sauge, graphite et champagne fournis ; rhinoplastie au premier plan et accès aux autres compétences. Les textes, les ressources locales et l’administration du projet sont conservés dans une structure éditable.

## Gérer les articles avec Pages CMS et Cloudflare Pages

**Nouveau :** les articles et les textes d'introduction sont gérés sur [Pages CMS](https://pagescms.org/) sans PHP ni base de données. Le site reste généré en HTML/CSS/JavaScript par les scripts Node existants : **Eleventy n'est pas nécessaire**.

- Articles : `content/articles/*.json` — création, images, brouillons et publication explicite.
- Pages existantes : `content/cms-pages/*.json` — titres, surtitres, accroches, SEO et bloc d'introduction optionnel sur 38 pages. Les sections médicales techniques historiques demeurent dans `content/*.json` et ne sont pas réécrites par le CMS.
- Images du CMS : `assets/uploads/` ; copies publiques automatiques dans `dist/assets/uploads/`.
- Configuration du CMS : `.pages.yml` ; accès de l'éditeur par `https://pagescms.org/`.
- Commandes : `npm ci`, `npm run cms:test`, `npm run build` ; publier **uniquement `dist/`** avec Cloudflare Pages.
- Les brouillons (`publie: false`) ne génèrent aucune page HTML. Un article dépublié disparaît au build suivant. La version reste volontairement en `prototype: true` (noindex) jusqu'à validation du praticien.

**Installation détaillée : `docs/GUIDE-PAGES-CMS-CLOUDFLARE.md`.** Ne pas employer l'administration locale historique pour modifier les titres/accroches simultanément avec Pages CMS : les champs Pages CMS sont prioritaires.

## Voir le site

Exécuter `npm ci && npm run build`, puis ouvrir `dist/index.html`. Les 38 pages de contenu, les images, les polices et les scripts sont inclus. Doctolib et les références externes nécessitent Internet. La page « À propos de ce site » conserve les liens vers les anciennes propositions.

Cette version est privée et non indexable. Les pages médicales et les informations officielles nécessitent l’approbation du praticien avant une ouverture publique.

## Deux niveaux de lecture

Les 18 pages de prise en charge gardent leurs repères patients et proposent une rubrique « Détails techniques » reprenant les textes d’origine du Dr Mattia Coda. Les 115 sous-rubriques sont repliées au départ. Les 28 JSON actifs du ZIP initial sont conservés sans modification dans `sources-originales/content/`, avec leurs empreintes dans `sources-originales/manifest.json`. Voir `docs/CONTENUS-TECHNIQUES.md` pour le périmètre et les contrôles de fidélité.

## Ce qui a changé

- Accueil réduit : rhinoplastie, quatre accès directs aux autres compétences, présentation du chirurgien et préparation de visite.
- Guides consultables par rubriques natives dépliables, avec liens directs, commande « Tout afficher » et ouverture du contenu à l’impression.
- Logo fourni intégré ; nouvelle photographie de profil et portrait réel du chirurgien mieux cadré.
- Parcours en cinq étapes ; fiche de préparation à cocher et à imprimer, sans collecte.
- Quatre guides principaux restructurés avec risques, alternatives, suites, questions et références.
- Pages de lieux utiles et URL `consultation-marseille.html`, `consultation-nice.html`, `consultation-draguignan.html` ; anciens fichiers conservés en alias.
- Navigation : Rhinoplastie, Interventions, Dr Coda, Infos pratiques, rendez-vous.
- Données structurées différenciées, références et dossier de validation.

## Construire le site

Utiliser Node 22 ou 24 avec son npm associé. Le site affiché n’a pas besoin de Node ; il sert uniquement à la génération et à l’administration.

```sh
npm ci
npm run release
```

`npm run release` régénère les pages, les robots, le sitemap et les routes, puis contrôle les ressources et liens locaux.

- `content/*.json` : 38 contenus et compositions.
- `assets/css/coda-serenite.css` : nouvelle charte ; `patient.css` : composants de préparation. Les anciennes feuilles sont conservées pour les versions antérieures.
- `assets/js/coda.js` : navigation et filtres ; `patient.js` : fiche de préparation ; `reading.js` : rubriques, ancres, lecture technique et impression.
- `tools/lib/templates/` : gabarits et contenu de la fiche imprimable (`preparation.js`).
- `custom/refonte.json` : domaine canonique, thème et état privé/noindex (`prototype`).
- `custom/liens.json` : fiche Doctolib et liens propres aux villes.
- `custom/menu.json` : photo du praticien ; les anciens réglages de menu ne pilotent pas la nouvelle navigation.
- `qa/` : dépendances de recette séparées, tests axe/Playwright et Lighthouse.

## Administration locale

```sh
npm run admin:password
npm run admin
```

Ouvrir l’adresse locale indiquée. Définir son propre mot de passe : aucun identifiant ni fichier de session n’est fourni. Les changements de contenus régénèrent les pages dans `dist/`. Les compositions utilisent des champs HTML ; les textes classiques et les titres ont leurs champs dédiés. La liste de préparation se modifie dans son gabarit ; elle n’est pas un dossier patient.

## Livraison et publication

Seul `dist/` doit être hébergé. Le code source et l’administration ne doivent pas être déposés dans le répertoire public. Le `.htaccess` contient les redirections pour Apache ; tout autre hébergeur doit disposer de sa configuration adaptée. Les alias HTML restent utilisables sans ces redirections et pointent vers la bonne URL canonique.

Avant de rendre le site officiel, suivre `docs/validation-maintenance.md`, renseigner le domaine réel, valider les contenus et désactiver `prototype`. La version publique future doit disposer de mentions légales complétées, des bonnes coordonnées et d’une politique adaptée à son hébergement.

## Dossier de conception et de recette

- `docs/STYLE-SERENITE.md` : nouvelle direction visuelle et réduction du défilement.
- `docs/specification-synthese.md` : architecture de contenus.
- `docs/matrice-conformite.md` : réalisé, vérifié et restant.
- `docs/registre-sources.json` et `docs/registre-validation.json` : provenance et approbation par page.
- `docs/VERIFICATION.md` : résultats réellement obtenus et limites.
- `docs/validation-maintenance.md` : recette manuelle et maintenance.

Le HTML passe Nu sur 48 fichiers ; ce résultat n’est pas une certification WCAG/RGAA. Les essais visuels, zoom, lecteurs d’écran et la CI navigateur restent à exécuter. La configuration GitHub Actions est fournie ; le dossier `.github` doit se trouver à la racine du dépôt de sources pour être actif.

Le portrait du chirurgien est issu du dossier fourni. Les photos d’illustration ont été générées pour les maquettes : elles ne montrent pas des patients opérés. Les polices locales ont leurs licences jointes. Les photos avant/après d’origine restent dans l’archive de départ du propriétaire ; elles ne doivent pas être poussées sur GitHub ni copiées dans `dist/`. Elles sont exclues de la livraison Pages CMS. Dépendances installées, sessions, secrets et copies imbriquées inutiles sont exclus de l’archive.
