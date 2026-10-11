# État de l'adaptation Pages CMS

## Réalisé dans les sources

- Configuration `.pages.yml` : collection d'articles JSON et collection de 38 pages existantes.
- Génération des 38 données éditables dans `content/cms-pages/`, sans modifier le contenu médical source dans `content/*.json` ni les fragments conservés dans `sources-originales/`.
- Ajout d'un brouillon d'exemple non publié dans `content/articles/`.
- Rendu dynamique au build : `actualites.html`, `actualite-<nom>.html`, cartes des articles sur l'accueil, SEO, sitemap, navigation.
- Brouillon par défaut, contrôle explicite `publie`, suppression de l'ancien dossier `dist/` avant reconstruction, images dans `assets/uploads/`.
- Configuration de sortie Cloudflare : `_headers` et `_redirects`.
- Tests unitaires `npm run cms:test` : brouillon/publié, 38 surcharges, préservation des sections, Markdown, URL et images.

## Contrôles effectués pendant la préparation

- Scripts modifiés : vérification syntaxique Node OK (`node --check`).
- JSON : 153 fichiers valides, 38 pages et 38 surcharges CMS présentes.
- YAML `.pages.yml` : syntaxe valide, deux collections et un dossier de médias.
- Tests unitaires Pages CMS : OK.

## Restant impérativement à tester

- `npm ci`, `npm run build` et `npm run preflight` sur un environnement Node 22 avec ses dépendances (non disponibles dans l'environnement de génération).
- Apparition des collections dans l'interface en ligne Pages CMS et sauvegarde d'un fichier en conditions réelles.
- Déploiement Cloudflare Pages et relecture de l'article publié, du responsive, du HTML, des liens et des images.
- Validation médicale, déontologique, juridique et éditoriale avant indexation et mise en production.

## Gestion des anciennes données patient

Les images `medias/avant-apres-*` de l'archive d'origine sont **volontairement exclues de cette nouvelle archive**. Elles restent à disposition de leur propriétaire dans l'archive d'origine, et ne doivent pas être transférées vers GitHub / Cloudflare sans un contrôle de confidentialité et des autorisations appropriés.

## Fonctionnalités non incluses

- Modification graphique des gabarits directement dans Pages CMS.
- Modification de tous les blocs médicaux techniques historiques (ils restent protégés en source).
- Prévisualisation instantanée dans l'éditeur avant le build Cloudflare.
- Recherche plein texte, versionnement éditorial avancé, workflow multipersonne d'approbation imposé par CMS.
- Protection par mot de passe du site de prévisualisation ; `noindex` n'est pas un contrôle d'accès.
