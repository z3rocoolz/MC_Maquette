# Installer Pages CMS + Cloudflare Pages pour le site du Dr Mattia Coda

## Architecture livrée

`Dr Coda → Pages CMS → dépôt GitHub privé → build Node existant → Cloudflare Pages → site HTML statique`.

**Pas de serveur applicatif, pas de base de données et pas d'Eleventy.** La génération HTML existe déjà dans le projet. Pages CMS modifie seulement des fichiers JSON sur GitHub ; chaque modification déclenche un nouveau build Cloudflare.

Deux espaces d'édition :

- **Articles et actualités** : le CMS crée/modifie des fichiers JSON dans `content/articles`. Chaque publication approuvée génère une page `actualite-<nom>.html`, visible dans `actualites.html`, avec une vignette sur l'accueil pour les 3 plus récents.
- **Pages existantes** : le CMS modifie 38 fichiers `content/cms-pages/*.json` pour les titres, accroches, métadonnées SEO et un nouveau bloc éditorial facultatif. Les sections médicales techniques conservées dans `content/*.json` ne sont **pas** encore modifiables depuis Pages CMS ; elles restent protégées dans le projet.

## Étape 1 — Préparer Windows / WSL et décompresser

1. Utiliser Node.js **22** (ou 24) et npm **du même environnement Linux** dans WSL. Vérifier :

   ```bash
   which node; node -v
   which npm; npm -v
   ```

   `which npm` ne doit pas indiquer `/mnt/c/Program Files/nodejs/...`. Si Node 18 ou npm Windows apparaissent, installer/activer Node 22 pour Linux (par exemple avec nvm) avant la suite.

2. Décompresser l'archive livrée. Ouvrir un terminal dans le **dossier `projetWeb/`** contenant `package.json` et `.pages.yml`.

3. Générer et contrôler localement :

   ```bash
   npm ci
   npm run cms:test
   npm run build
   npm run preflight
   npm run preview
   ```

   Ouvrir l'adresse locale indiquée par le serveur, puis vérifier `actualites.html`. Le premier article est **en brouillon**, donc la liste apparaît vide : c'est intentionnel. `npm run preflight` dépend des ressources du site ; corriger ses alertes avant ouverture au public.

## Étape 2 — Créer le dépôt GitHub

1. Sur GitHub, créer un **dépôt privé** (exemple : `site-dr-coda`). Ne pas ajouter de README ni de .gitignore lors de cette création : ces fichiers sont déjà dans le projet.
2. Vérifier que les dossiers contenant des photos cliniques privées ne sont pas envoyés. Le `.gitignore` fourni exclut `medias/avant-apres-*`, `medias/.avant-apres.json`, les secrets et `dist/`. **Contrôler également toutes les autres données patient et documents confidentiels avant chaque commit**.
3. Dans le dossier du projet :

   ```bash
   git init
   git branch -M main
   git add .
   git status --short
   git commit -m "Site Dr Coda et gestion Pages CMS"
   git remote add origin https://github.com/VOTRE_COMPTE/site-dr-coda.git
   git push -u origin main
   ```

   Si le dépôt existe déjà, ne pas réinitialiser son historique : copier les fichiers modifiés dans le dépôt existant, commiter puis pousser sur la branche de déploiement. Ne jamais commiter `.env`, les sessions locales, des images ou données patients non autorisées.

4. Vérifier sur GitHub que `.pages.yml` est **à la racine du dépôt**, au même niveau que `package.json`. Si le dépôt contient un répertoire `projetWeb/` au-dessus, adapter le répertoire racine du build et celui découvert par Pages CMS : le plus simple est de mettre le **contenu** de `projetWeb/` à la racine du dépôt.

## Étape 3 — Relier le dépôt à Pages CMS

1. Aller sur [https://pagescms.org/](https://pagescms.org/) et s'authentifier avec GitHub.
2. Autoriser l'application à accéder au dépôt du Dr Coda avec les permissions nécessaires à l'édition. Limiter l'autorisation à ce dépôt si l'interface le permet.
3. Sélectionner le dépôt `site-dr-coda` sur la branche `main`.
4. Les deux collections attendues sont **« Articles et actualités »** et **« Pages existantes (titres, accroches, SEO) »**. La configuration est dans `.pages.yml`.
5. Ouvrir l'article de démonstration `mon-premier-article.json` : il est marqué **non publié**. Corriger son contenu, choisir une image si besoin, puis ne cocher « Publication approuvée » qu'après validation du praticien.
6. Ouvrir une page existante (par exemple `rhinoplastie-primaire`), modifier son *accroche*, enregistrer, puis observer le commit créé par Pages CMS sur GitHub.

**Important :** la connexion Pages CMS / GitHub demande un accès GitHub au dépôt. Le Dr Coda devra recevoir les droits de collaboration adaptés et utiliser son compte GitHub. Ne jamais transmettre vos mots de passe ni de token GitHub à un tiers.

**Attention aux noms d'article :** leur nom de fichier devient leur URL (normalisé en minuscules, sans accents). Éviter de renommer le fichier après publication, sous peine de changer l'URL. Le champ titre public peut, lui, être modifié.

## Étape 4 — Déployer le site sur Cloudflare Pages

1. Créer / ouvrir un compte Cloudflare, puis choisir **Workers & Pages → Create → Pages → Connect to Git** (les libellés peuvent évoluer).
2. Autoriser l'intégration GitHub avec accès au dépôt `site-dr-coda` et le sélectionner.
3. Paramètres de déploiement :

   | Paramètre | Valeur |
   |---|---|
   | Branche de production | `main` |
   | Root directory | `/` (racine du dépôt) |
   | Framework preset | `None` / aucun |
   | Build command | `npm ci && npm run build` |
   | Build output directory | `dist` |
   | Variable d'environnement | `NODE_VERSION=22` si nécessaire |

4. Lancer le premier déploiement et ouvrir le sous-domaine Cloudflare fourni (ex. `nom-du-projet.pages.dev`).
5. Contrôler `index.html`, `rhinoplastie.html`, `actualites.html`, `404.html`, les photos et les CSS. Vérifier aussi la présence de `robots.txt`, `_headers` et `_redirects` dans la sortie `dist/`.
6. Ne pas utiliser **Direct Upload** pour ce flux si vous souhaitez les reconstructions automatiques après chaque commit. Connecter un dépôt GitHub.

La première version reste **privée du point de vue de l'indexation** : `custom/refonte.json` contient `prototype: true`, ce qui produit `noindex` et `robots.txt` bloquant. Cela ne constitue pas une protection par mot de passe : quiconque possède l'URL de prévisualisation peut consulter le site. Éviter d'y mettre du contenu privé.

## Étape 5 — Publier un article de test

1. Dans Pages CMS → Articles, ouvrir le brouillon de démonstration ou créer un nouvel article.
2. Remplir : **titre**, **date**, **résumé**, **texte**, éventuellement **image**, **description alternative**, **titre/description SEO**.
3. Vérifier la lisibilité des informations, les liens et le consentement d'utilisation des images. Faire valider le contenu médical par le Dr Coda.
4. Activer **« Publication approuvée »** (`publie: true`), puis enregistrer.
5. Vérifier la création du commit dans GitHub puis le nouveau déploiement dans Cloudflare Pages. Ouvrir `actualites.html` et la nouvelle page `actualite-....html`.
6. Pour retirer un article, désactiver la publication et enregistrer : le build **supprime entièrement le vieux `dist/`** avant génération, ainsi l'article ne devrait plus être présent dans le nouveau déploiement. Vérifier le résultat sur le domaine public. La suppression de la page ne garantit pas l'effacement des caches et copies tiers.

**Éditeur d'articles :** le champ riche est converti à partir d'un Markdown courant (paragraphes, titres, listes, emphase, liens et images). Le rendu Markdown n'est pas exhaustif : vérifier manuellement tableaux, imbrications complexes et collages depuis Word avant publication.

## Étape 6 — Relier le nom de domaine

1. Dans le projet Cloudflare Pages : **Custom domains / Domaines personnalisés**, ajouter le nom officiel validé par le Dr Coda.
2. Suivre les indications Cloudflare pour la vérification DNS (zone Cloudflare ou CNAME selon le fournisseur et le domaine). Ne pas inventer les enregistrements DNS, reprendre les valeurs affichées par Cloudflare.
3. Avant la mise en production publique, modifier `custom/refonte.json` :

   ```json
   {
     "prototype": false,
     "origin": "https://www.DOMAINEDUDOCTEUR.fr"
   }
   ```

   **Ne modifier que ces deux valeurs dans le JSON existant**, ne pas remplacer tout le fichier par l'extrait ci-dessus. Configurer le domaine canonique réellement retenu (`www` ou non).
4. Faire approuver auparavant les textes médicaux, lieux, RPPS et coordonnées, les mentions légales, la politique de confidentialité, les photographies et la communication professionnelle. Vérifier la conformité avec les obligations déontologiques de la profession.
5. Commettre, pousser, attendre le nouveau déploiement, puis vérifier le SEO (`robots.txt`, `sitemap.xml`, canoniques, HTTPS) et les tests manuels mobile / clavier / liens.

## Étape 7 — Exploitation et sauvegardes

- Le CMS édite **le dépôt GitHub**, pas directement Cloudflare. L'historique Git permet les retours arrière. Conserver le dépôt privé et donner uniquement les accès nécessaires.
- Pour annuler une erreur : revenir au commit Git précédent ou rétablir la version Cloudflare précédente, puis corriger le dépôt pour éviter que le prochain build reproduise l'erreur.
- Distinguer **modifications de contenu** (Pages CMS) et **modifications techniques / gabarits** (toi, via GitHub).
- Le CMS n'est pas un dossier patient. Ne pas y publier de photos de patients ou de données personnelles sans base légale, autorisations et contrôles adaptés.
- La collecte de données de santé, formulaires médicaux, prise de rendez-vous ou espace patient demanderait une architecture séparée, des protections et une analyse de conformité.
- Les anciennes maquettes et le serveur d'administration locale présents dans les sources ne sont pas nécessaires pour Pages CMS et ne doivent pas être exposés publiquement. Seul `dist/` est servi.

## Dépannage rapide

| Symptôme | À vérifier |
|---|---|
| Le site ne se construit pas | Root `/`, `NODE_VERSION=22`, build `npm ci && npm run build`, journal Cloudflare |
| Le CMS n'affiche pas les collections | `.pages.yml` à la racine de la branche `main`, accès GitHub et YAML valide |
| Un article n'apparaît pas | `publie: true`, fichier JSON valide dans `content/articles/`, commit sur `main`, build Cloudflare terminé |
| Une photo est absente | Elle doit se trouver dans `assets/uploads/` (format JPG/PNG/WebP/GIF/AVIF), avec un chemin dans le JSON |
| Une page existante ne change pas | Modifier `content/cms-pages/<slug>.json`, pas le seul fichier original `content/<slug>.json` |
| Un article retiré reste visible | Vérifier déploiement Cloudflare actif, cache local/CDN, redirections et historique de pages |
| Tout le site est `noindex` | C'est intentionnel tant que `prototype: true` ; changer après validation du site complet |
| GitHub refuse les fichiers | Vérifier droits, branche protégée, et si le CMS a accès en écriture au dépôt |

## Limites / tests non effectués dans cette livraison

La structure et les scripts CMS ont été contrôlés par tests unitaires sans dépendances. Le **build complet de la version modifiée** et la **connexion Pages CMS/GitHub/Cloudflare en conditions réelles** demandent `npm ci` et les comptes du propriétaire ; ils doivent être validés à l'étape 1 puis aux étapes 3–5. La configuration et les paramètres exacts des interfaces SaaS peuvent changer ; corriger si la documentation de leur version en vigueur l'exige.
