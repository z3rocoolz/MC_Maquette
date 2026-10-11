# Textes d’origine et niveaux de lecture

Révision du 11 octobre 2026, à la demande du propriétaire : conserver les écrits techniques du Dr Mattia Coda comme approfondissement des pages d’intervention.

## Parcours de lecture

Les pages présentent d’abord les repères destinés aux patients. Deux liens, « L’essentiel » et « Détails techniques », donnent accès aux deux niveaux. Le sommaire latéral propose également l’accès technique.

La rubrique technique est fermée au chargement normal. Elle contient des sous-rubriques natives `details`/`summary`, également fermées : anatomie, indications, techniques, déroulement, suites, risques et questions selon le texte d’origine. Le contenu est inclus dans le HTML ; aucune requête supplémentaire n’est nécessaire pour le lire. Les rubriques restent utilisables sans JavaScript.

Avec JavaScript, un lien vers une sous-rubrique ouvre ses parents ; une activation volontaire place le focus sur la destination. « Tout afficher » ouvre aussi les questions imbriquées. Le cycle d’impression ouvre les rubriques puis restaure leur état. Sans JavaScript, ouvrir les rubriques souhaitées avant impression. L’accueil conserve sa présentation courte.

## Périmètre et provenance

Les 28 JSON de contenu actifs du ZIP initial ont été copiés à l’octet dans `sources-originales/content/`. Les sauvegardes imbriquées et `_site.json`, fichier de configuration, ne sont pas comptés. Le manifeste enregistre les empreintes SHA-256, la sélection par page et les exclusions.

Les textes techniques affichés couvrent 18 pages, 115 rubriques et 583 fragments textuels contrôlés. Les introductions d’origine sont également reprises. Le fichier `rhinoplastie_v3.json` alimente la page canonique `rhinoplastie.html` et son alias historique.

| Page | Rubriques techniques |
| --- | ---: |
| Rhinoplastie, guide général | 11 |
| Rhinoplastie primaire | 6 |
| Rhinoplastie secondaire | 5 |
| Rhinoplastie ultrasonique | 6 |
| Rhinoplastie de préservation | 5 |
| Rhinoplastie fonctionnelle | 5 |
| Rhinoplastie chez l’homme | 7 |
| Pointe du nez | 6 |
| Bosse du nez | 6 |
| Déviation de la cloison nasale | 6 |
| Blépharoplastie | 7 |
| Lifting cervico-facial | 6 |
| Lifting sourcilier | 6 |
| Chirurgie orthognathique | 7 |
| Profiloplastie | 7 |
| Féminisation faciale | 6 |
| Dents de sagesse | 6 |
| Médecine esthétique | 7 |

Les modules de coordonnées, de lieux, de rendez-vous et de navigation entre pages ne sont pas répétés dans ce niveau de lecture. Ils restent présents dans les originaux archivés. Les passages cliniques des rubriques « Consultation », les tarifs et les questions fréquentes sélectionnés sont conservés. Les 28 fichiers archivés ne signifient donc pas que les 28 pages originales sont reproduites intégralement à l’écran.

Les textes ne sont pas reformulés. Seuls leur balisage, les niveaux de titres, les identifiants, les liens internes et les espaces de fin de ligne sont adaptés au nouveau site.

## Édition et validation

Les résumés patients restent dans `content/` et sont éditables dans l’administration locale. Les textes techniques proviennent séparément de `sources-originales/` : une modification des résumés ne les écrase pas. Préserver cette archive comme référence ; toute future correction médicale doit être validée et tracée, avec mise à jour de la provenance et des tests.

`tools/lib/templates/technical.js` construit le niveau technique. `docs/verification/check-technical.cjs` compare les empreintes et chaque fragment original à sa rubrique générée. La preuve est enregistrée dans `docs/preuves/fidelite-technique.json`.

Cette réintégration vérifie la fidélité éditoriale, pas l’exactitude clinique. Les statuts d’approbation médicale restent à valider par le praticien. Les limites de la recette d’accessibilité figurent dans `VERIFICATION.md`.
