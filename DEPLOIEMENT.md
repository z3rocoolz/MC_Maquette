# Publier la refonte

Le site public est le dossier `dist/`, jamais la racine du projet. Le serveur n’a besoin ni de Node ni de l’administration.

1. Valider les textes médicaux, les coordonnées, les mentions légales et les droits des images.
2. Configurer `origin` et `prototype` dans `custom/refonte.json` ; garder `prototype: true` pour tout aperçu.
3. Exécuter `npm ci`, puis `npm run release`.
4. Transférer le contenu de `dist/`, avec ses ressources et sa configuration de redirection.
5. Sur Apache, autoriser `mod_rewrite` et vérifier les anciennes adresses. Sur un autre hébergement, convertir les règles de `.htaccess`.
6. Vérifier visuellement l’installation finale, ses pages d’erreur, le clavier, les lecteurs d’écran et le lien de rendez-vous.

Les anciens scripts de transfert SSH sont conservés, mais ne sont pas nécessaires pour consulter ou modifier la maquette. Ne pas les exécuter sans renseigner et vérifier leur destination ; ils synchronisent le dossier cible.

Le mode maquette bloque l’indexation volontairement. Aucune garantie de positionnement dans les moteurs de recherche n’est formulée.
