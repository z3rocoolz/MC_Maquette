'use strict';

/**
 * Formulaire d'édition : quels champs se présentent pour quel bloc, et comment
 * les valeurs saisies retrouvent leur place dans le JSON.
 *
 * Chaque champ porte le chemin de sa valeur (`sections[2].blocks[0].html`).
 * À l'enregistrement, seuls ces chemins sont réécrits : tout ce qui décrit la
 * structure — classes, balises, charpente — reste hors d'atteinte de
 * l'éditeur, et ne peut donc pas être cassé depuis l'interface.
 */

// La refonte affiche les trois champs de l’en-tête sur toutes les pages.

const echapper = (valeur) =>
  String(valeur ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Champs proposés pour un bloc, selon son type. */
function champsDuBloc(bloc, chemin) {
  switch (bloc.type) {
    case 'text':
    case 'heading':
      return [{ cle: `${chemin}.html`, libelle: 'Texte', type: 'riche' }];

    case 'html':
      return [{ cle: `${chemin}.html`, libelle: 'HTML', type: 'code' }];

    case 'note':
      return [
        { cle: `${chemin}.title`, libelle: 'Titre de l’encadré', type: 'ligne' },
        { cle: `${chemin}.html`, libelle: 'Contenu', type: 'riche' },
      ];

    case 'faq':
      return bloc.items.flatMap((item, i) => [
        { cle: `${chemin}.items[${i}].question`, libelle: `Question ${i + 1}`, type: 'ligne' },
        { cle: `${chemin}.items[${i}].answer`, libelle: 'Réponse', type: 'riche' },
      ]);

    case 'villes':
      return bloc.items.flatMap((item, i) => [
        { cle: `${chemin}.items[${i}].name`, libelle: `Ville ${i + 1}`, type: 'ligne' },
        { cle: `${chemin}.items[${i}].address`, libelle: 'Adresse', type: 'riche' },
        { cle: `${chemin}.items[${i}].phone`, libelle: 'Téléphone', type: 'ligne' },
        { cle: `${chemin}.items[${i}].badge`, libelle: 'Mention', type: 'ligne' },
        { cle: `${chemin}.items[${i}].linkLabel`, libelle: 'Libellé du lien', type: 'ligne' },
        { cle: `${chemin}.items[${i}].link`, libelle: 'Adresse du lien', type: 'ligne' },
        { cle: `${chemin}.items[${i}].extra`, libelle: 'Complément', type: 'riche' },
      ]);

    case 'buttons':
      return bloc.items.flatMap((item, i) => [
        { cle: `${chemin}.items[${i}].label`, libelle: `Bouton ${i + 1}`, type: 'ligne' },
        { cle: `${chemin}.items[${i}].href`, libelle: 'Lien', type: 'ligne' },
      ]);

    case 'cards':
      return bloc.items.flatMap((item, i) => [
        { cle: `${chemin}.items[${i}].title`, libelle: `Carte ${i + 1}`, type: 'ligne' },
        { cle: `${chemin}.items[${i}].html`, libelle: 'Contenu', type: 'riche' },
        { cle: `${chemin}.items[${i}].link`, libelle: 'Lien', type: 'ligne' },
      ]);

    case 'chrono':
      return bloc.items.flatMap((item, i) => [
        { cle: `${chemin}.items[${i}].badge`, libelle: `Étape ${i + 1}`, type: 'ligne' },
        { cle: `${chemin}.items[${i}].html`, libelle: 'Contenu', type: 'riche' },
      ]);

    case 'list':
      return bloc.items.map((item, i) => ({
        cle: `${chemin}.items[${i}]`,
        libelle: `Élément ${i + 1}`,
        type: 'riche',
      }));

    case 'table':
      return [
        ...(bloc.head || []).map((cellule, i) => ({
          cle: `${chemin}.head[${i}]`,
          libelle: `En-tête ${i + 1}`,
          type: 'ligne',
        })),
        ...(bloc.rows || []).flatMap((ligne, l) =>
          ligne.map((cellule, c) => ({
            cle: `${chemin}.rows[${l}][${c}]`,
            libelle: `Ligne ${l + 1}, colonne ${c + 1}`,
            type: 'riche',
          }))
        ),
      ];

    default:
      return [];
  }
}

/** Champs d'une page entière, dans l'ordre de lecture. */
function champsDeLaPage(page) {
  // L'en-tête d'abord : c'est le texte que le visiteur lit en haut de la page.
  // Le référencement ferme la marche — ses champs ne s'affichent nulle part
  // sur la page, et les présenter en premier fait croire qu'on édite le titre
  // visible alors qu'on remplit l'onglet du navigateur.
  //
  // Le formulaire suit ce que la page montre réellement : sur les pages dont
  // l'en-tête est réduit à son titre, proposer un surtitre et une accroche
  // ferait saisir des textes qui n'apparaîtraient nulle part.
  const enTete = page.hero || {};
  const reduit = false;
  const champs = [];

  if (!reduit) {
    champs.push({ cle: 'hero.eyebrow', libelle: 'Surtitre', type: 'ligne', groupe: 'En-tête de la page' });
  }

  champs.push({
    cle: 'hero.title',
    libelle: enTete.titreMasque
      ? 'Titre (non affiché sur la page, mais lu par Google et les lecteurs d’écran)'
      : 'Titre principal (grand titre en haut)',
    type: 'riche',
    groupe: 'En-tête de la page',
  });

  if (!reduit) {
    champs.push({ cle: 'hero.lead', libelle: 'Accroche', type: 'riche', groupe: 'En-tête de la page' });
  }

  page.sections.forEach((section, i) => {
    const groupe = section.title
      ? section.title.replace(/<[^>]+>/g, '')
      : section.variant === 'cta'
        ? 'Bloc de rendez-vous'
        : `Section ${i + 1}`;

    if (section.eyebrow) champs.push({ cle: `sections[${i}].eyebrow`, libelle: 'Surtitre', type: 'ligne', groupe });
    if (section.title) champs.push({ cle: `sections[${i}].title`, libelle: 'Titre', type: 'riche', groupe });

    const parcourir = (blocs, prefixe) => {
      blocs.forEach((bloc, j) => {
        const chemin = `${prefixe}[${j}]`;
        if (bloc.type === 'group') {
          parcourir(bloc.blocks, `${chemin}.blocks`);
          return;
        }
        for (const champ of champsDuBloc(bloc, chemin)) champs.push({ ...champ, groupe });
      });
    };
    parcourir(section.blocks, `sections[${i}].blocks`);
  });

  champs.push(
    {
      cle: 'seo.title',
      libelle: 'Titre dans l’onglet du navigateur et sur Google',
      type: 'ligne',
      groupe: 'Référencement (n’apparaît pas sur la page)',
    },
    {
      cle: 'seo.description',
      libelle: 'Résumé affiché par Google sous le lien',
      type: 'zone',
      groupe: 'Référencement (n’apparaît pas sur la page)',
    }
  );

  return champs;
}

/* ─── Lecture et écriture par chemin ────────────────────────────── */

const INTERDITS = new Set(['__proto__', 'constructor', 'prototype']);

/** Découpe `sections[2].blocks[0].items[1].question` en segments. */
function segments(chemin) {
  return chemin
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean);
}

function lireChemin(objet, chemin) {
  let courant = objet;
  for (const segment of segments(chemin)) {
    if (courant == null) return undefined;
    courant = courant[segment];
  }
  return courant;
}

/**
 * Écrit une valeur à l'emplacement désigné — uniquement si cet emplacement
 * existe déjà et contient du texte. Un chemin inventé depuis le navigateur ne
 * peut donc pas créer de champ ni écraser une structure.
 *
 * @returns {boolean} vrai si la valeur a été posée
 */
function ecrireChemin(objet, chemin, valeur) {
  const parties = segments(chemin);
  if (parties.some((p) => INTERDITS.has(p))) return false;

  let courant = objet;
  for (const partie of parties.slice(0, -1)) {
    if (courant == null || typeof courant !== 'object') return false;
    courant = courant[partie];
  }

  const derniere = parties[parties.length - 1];
  if (courant == null || typeof courant !== 'object') return false;
  if (typeof courant[derniere] !== 'string') return false;

  courant[derniere] = valeur;
  return true;
}

module.exports = { champsDeLaPage, champsDuBloc, echapper, ecrireChemin, lireChemin };
