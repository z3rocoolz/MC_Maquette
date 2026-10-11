# Validation et maintenance

## Avant l’ouverture au public

Le site est utilisable dans son espace privé existant. Les points suivants ne bloquent pas cette revue privée ; ils doivent être résolus avant une publication officielle indexable.

1. Faire approuver les 38 pages dans `registre-validation.json`, avec le nom réel du relecteur et sa date. Le texte n’est pas présenté comme signé par le Dr Coda.
2. Confirmer le périmètre des actes, notamment médecine esthétique, féminisation, techniques spécifiques, qualifications, sites de consultation et sites opératoires. Résoudre le code postal contradictoire de Beauregard ; vérifier le second lieu marseillais.
3. Valider secteur de conventionnement, honoraires, modalités de devis et prise en charge. Ne pas reprendre automatiquement des prix d’annuaire susceptibles de changer.
4. Compléter l’identité juridique de l’éditeur, le responsable de publication, les coordonnées de contact et l’hébergeur retenu. Vérifier les autorisations pour le portrait et les contenus originaux.
5. Examiner la communication au regard des règles professionnelles et des articles R6322-49 à R6322-51 issus du décret du 23 septembre 2026. Ces textes visent les communications en faveur d’installations de chirurgie esthétique ; leur application au site personnel dépend du contexte. Aucune conformité juridique générale n’est certifiée.
6. Exécuter la recette ci-dessous et corriger les problèmes observés.
7. Renseigner le vrai domaine dans `custom/refonte.json`, régler `prototype:false`, retirer les anciennes maquettes du dossier public si elles ne doivent plus être accessibles, reconstruire et vérifier les URL canoniques, robots et sitemap. Préserver un point de retour à la version antérieure.

## Recette manuelle à renseigner

Échantillon : accueil, guide de rhinoplastie, compétences, préparation, lieu de consultation, mentions légales, page 404. Étendre si un gabarit ou un comportement diffère.

| Essai | Attendu | Résultat actuel |
| --- | --- | --- |
| Mobile 320, 390 et 768 px | Pas de perte de contenu ou défilement horizontal global | À réaliser |
| Bureau 1280 et 1440 px | Pas de chevauchement, navigation et images cohérentes | À réaliser |
| Zoom navigateur 200 % et 400 % | Lecture, navigation et commandes utilisables | À réaliser |
| Clavier seul | Ordre logique, focus visible, pas de piège, Échap, cases, liens | À réaliser |
| NVDA + Firefox / Chrome | Régions et titres cohérents, annonces compréhensibles | À réaliser |
| VoiceOver + Safari | Menu, liens, états et fiche accessibles | À réaliser |
| Impression de la préparation | Cases et textes lisibles, marges et pagination adaptées | À réaliser |
| Mouvement réduit / contraste forcé | Information et focus préservés | À réaliser |
| Sans JavaScript | Navigation et textes disponibles | DOM vérifié pour composants, recette visuelle restante |
| 404 et redirections HTTP | Vrais statuts 404/301 sur l’hébergement cible | À réaliser sur hébergeur définitif |
| Doctolib | Bon praticien, bon lieu, parcours externe compréhensible | Lien public vérifié ; pas de réservation test |
| Test auprès de patients | Trouver un sujet, comprendre les limites, préparer le rendez-vous | À organiser |

## Mise à jour

- À chaque changement annoncé : coordonnées, lieux, agenda, honoraires et périmètre des actes.
- Tous les six mois proposés : liens, bibliographie, mentions légales, contexte réglementaire et contenu médical. Cette cadence est une proposition de maintenance, pas une exigence réglementaire affirmée.
- À chaque version : construction, contrôle de liens, Nu, tests des interactions et CI navigateur. Conserver date, version et résultats.
- Avant un nouvel outil tiers : documenter son utilité, les données traitées, sa configuration et l’information du visiteur.

L’administration doit rester locale ou faire l’objet d’une sécurisation dédiée avant exposition : HTTPS, contrôle d’accès, secrets hors dépôt, sauvegardes, dépendances suivies et limitation des téléversements. Elle n’est pas contenue dans le site statique mis en ligne.
