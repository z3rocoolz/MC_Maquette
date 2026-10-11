# Recette automatisée préparée

Cette configuration est livrée pour une exécution sur un poste ou dans GitHub Actions. Elle n’a pas été exécutée dans le navigateur pendant la réalisation de cette version : l’environnement ne dispose pas du moyen de contrôle navigateur autorisé.

Les versions des trois outils principaux ont été vérifiées avec le registre npm le 10 octobre 2026. Les dépendances de QA sont séparées de celles du site et ne sont pas publiées dans `dist/`.

Après `npm ci` et `npm run release` dans le projet :

```sh
cd qa
npm ci
npx playwright install chromium
npm run browser
npm run lighthouse
```

Lighthouse nécessite un Chrome/Chromium utilisable. Si nécessaire, renseigner `CHROME_PATH` avec le chemin local du navigateur. Aucun rapport n’est envoyé vers un serveur public : les résultats restent dans `qa/reports/`.

La CI teste les pages canoniques à 320 px avec axe, le menu clavier, la fiche imprimable et les contenus sans JavaScript. Les essais de zoom natif 200/400 %, NVDA, VoiceOver, l’ordre de lecture, les alternatives d’images, le sens des libellés, la vision à contraste élevé et la pertinence éditoriale restent manuels. Un viewport de 320 px ne prouve pas à lui seul le comportement au zoom.

Lighthouse mesure ici un environnement de laboratoire. Les Core Web Vitals réels et l’INP nécessitent une mesure terrain appropriée après publication. L’indexation est volontairement désactivée dans cette version privée : le score SEO n’est donc pas utilisé comme critère de passage.
