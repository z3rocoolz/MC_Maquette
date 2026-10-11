# Matrice de conception et de recette

Version du 10 octobre 2026. « Réalisé » décrit une vérification précise, pas une conformité globale.

| Exigence de la synthèse | Réalisation | Preuve / limite |
| --- | --- | --- |
| Site d’un chirurgien seul | Identité Dr Mattia Coda, spécialité exacte, portrait fourni | Fiche publique référencée ; validation du praticien attendue |
| Rhinoplastie en priorité | Accueil, guide, approches et page Interventions | Liens internes contrôlés |
| Autres compétences visibles | Visage/regard, mâchoires/profil, médecine esthétique, stomatologie | Périmètre précis de certains actes à confirmer |
| Entrées intervention et besoin | Deux entrées sur l’accueil ; page motifs | Pas de questionnaire diagnostic |
| Parcours patient | Cinq étapes et préparation imprimable | Tests DOM de la fiche réussis ; impression réelle à vérifier |
| HTML sémantique | Titres, régions, navigation, champs natifs, descriptions | 48 HTML passés dans Nu, zéro message |
| Liens et métadonnées | Ressources, ancres, canonical, JSON-LD, sitemap | 45 HTML courants contrôlés, zéro anomalie |
| WCAG 2.2 AA / RGAA | Cible de conception, focus, liens d’évitement, menus et réduction du mouvement | Audit complet non réalisé ; aucun taux annoncé |
| Contrastes | Textes graphite sur sauge ; or profond sur crème ou blanc | 11 paires calculées aux seuils applicables ; texte courant minimum 5,313:1 ; ne couvre pas tous les états rendus |
| Mobile et zoom | Grilles, tailles fluides, composants ajoutés sur base mobile, CSS d’impression | Recette réelle 320 px / 200 % / 400 % restante |
| Clavier | Échap/menu, commandes natives, liens et cases | DOM simulé ; parcours complet dans un navigateur restant |
| NVDA et VoiceOver | Structure et libellés préparés | Non testés ici |
| Lighthouse et axe en CI | Configuration séparée dans qa/ et workflow GitHub Actions | Dépendances verrouillées ; CI navigateur non exécutée |
| Core Web Vitals | Images WebP locales, tailles réservées, polices locales, scripts différés | Pas de mesures terrain ni INP ; pas de score inventé |
| Référencement | Structure par intention, pages de lieux spécifiques, liens cohérents | Volumes et concurrence non mesurés ; noindex privé conservé |
| Fiabilité médicale | Références sur les quatre guides, limites et alternatives explicites | Approbation médicale en attente, registre par page |
| Honoraires | Explication du devis et point de départ du délai légal corrigé | Tarifs et conventionnement à confirmer avant site public |
| Confidentialité | Pas de traceur ajouté, de compte patient ou de collecte médicale | Hébergement et Doctolib ont leurs propres traitements |
| Sécurité | Site public statique ; administration distincte et locale, mot de passe à définir | Audit OWASP complet / configuration d’hébergement non réalisés |
| Maintenance | Registre de sources, approbations et procédure de mise à jour | Responsable et cadence à confirmer avec le praticien |
