# Site personnel du Dr Mattia Coda — synthèse appliquée

Date de conception : 10 octobre 2026. Version de travail privée, sans indexation.

## Objectif

Permettre à un patient de comprendre sa demande, les options et leurs limites, puis de préparer une consultation. La rhinoplastie est le sujet principal ; la chirurgie du visage, des mâchoires et la stomatologie restent accessibles dès l’accueil. Il s’agit du site d’un chirurgien, pas d’une clinique.

## Architecture retenue

- Navigation : Dr Coda, Interventions, Votre parcours, Informations pratiques, rendez-vous sur Doctolib.
- Deux entrées : intervention connue ou motif exprimé en langage courant.
- Parcours en cinq étapes : comprendre, réfléchir, choisir son interlocuteur, préparer, anticiper le suivi.
- Pages des interventions : résumé, indications et alternatives, déroulement, risques et limites, suites, questions, références.
- Lieux : pages de consultation utiles et spécifiques ; conservation des anciennes adresses de pages.
- Préparation : liste à cocher dans le navigateur, impression native, aucune transmission ni sauvegarde applicative de données de santé.

## Direction artistique

Révision du 11 octobre : palette de l’image fournie, graphite #252927, champagne #C9A96E, crème #F8F6F2, sauge #DDE6DF, blanc #FFFFFF, or profond #816037. Voir STYLE-SERENITE.md. Titres Cormorant Garamond, texte Manrope, polices locales. Photographies des maquettes précédentes et portrait fourni du chirurgien. Images d’illustration identifiées ; aucune photographie assimilée à un résultat clinique.

## Critères de recette

HTML validé avec Nu ; liens, ancres, métadonnées et JSON-LD contrôlés. Navigation utilisable sans JavaScript, menu amélioré au clavier avec Échap, champs natifs étiquetés, focus visible, impression lisible, contrastes contrôlés. Les tests de DOM simulé ne valent pas des tests de navigateur ou de lecteur d’écran.

La recette navigateur à 320 px, zoom 200/400 %, axe, Lighthouse et les essais NVDA/VoiceOver restent à exécuter dans un environnement équipé. Les scripts CI et la grille de recette rendent ces contrôles reproductibles. Aucun score de conformité RGAA ou WCAG n’est annoncé.

## Publication et validation éditoriale

Le site construit est publié dans son espace privé existant. L’indexation demeure désactivée. Avant ouverture publique : signature médicale des textes, périmètre exact des actes, coordonnées/qualifications, honoraires, droits d’image et mentions légales à confirmer. Ne pas attribuer au chirurgien une relecture qui n’a pas eu lieu. Les références officielles accompagnent les pages principales ; le dossier distingue provenance et validation.

Pas de témoignages promotionnels, de garantie de résultat, de réduction tarifaire ou de simulation présentée comme une promesse. Les contenus ne constituent pas une recommandation individuelle de chirurgie.

## Hors périmètre de cette livraison

Pas de compte patient, de dossier médical, de formulaire de diagnostic, de paiement, de mesure d’audience ni de campagne publicitaire. La demande de rendez-vous reste portée par la fiche Doctolib existante. Les volumes SEO, l’audit juridique complet et les tests auprès de patients n’ont pas été réalisés.
