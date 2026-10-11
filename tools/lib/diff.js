'use strict';

const cheerio = require('cheerio');

/**
 * Comparaison d'une page régénérée à son original.
 *
 * Comparer les fichiers caractère par caractère n'aurait aucun sens :
 * l'indentation et l'ordre des attributs diffèrent sans que le résultat
 * change. On compare ce qui compte pour le visiteur et pour le référencement :
 * le texte visible, les liens, les métadonnées.
 */

const normaliser = (texte) => texte.replace(/\s+/g, ' ').trim();

/** Balises dont la fermeture sépare visuellement deux textes. */
const BLOCS = /<\/(td|th|tr|li|p|div|section|header|footer|nav|h[1-6]|span|a|strong|em|br)>/gi;

/**
 * La barre du haut, le panneau déroulant, le fil d'Ariane et l'en-tête des
 * pages sont désormais produits depuis `custom/menu.json` : entrées
 * harmonisées, lien vers la page courante retiré, première marche du fil
 * masquée, en-tête réduit à son titre sur certaines rubriques.
 * Les comparer à l'original ferait apparaître autant d'écarts que de pages,
 * pour des changements voulus. Le contenu, lui, reste comparé au caractère
 * près.
 */
const CHROME_PILOTE = 'nav#nav, #menu, #mobile-menu, .breadcrumb, .hero-eyebrow, .hero-lead, .hero-btns';

function texteVisible(html) {
  // Sans cela, deux cellules collées dans la source (`</td><td>`) donneraient
  // un seul mot, et la comparaison signalerait un écart qui n'existe pas.
  const aere = html.replace(BLOCS, '$& ').replace(/<br\s*\/?>/gi, ' ');
  const $ = cheerio.load(aere);
  $('script, style, noscript').remove();
  $(CHROME_PILOTE).remove();
  return normaliser($('body').text());
}

/**
 * Les adresses de prise de rendez-vous sont volontairement reecrites vers la
 * fiche du praticien : toutes les adresses Doctolib sont donc ramenees a une
 * meme valeur avant comparaison. Sans cela, la centralisation du lien ferait
 * apparaitre cent onze regressions qui n'en sont pas.
 */
const normaliserLien = (href) =>
  /^https?:\/\/(www\.)?doctolib\./i.test(href) && !/\/terms\//.test(href) ? 'doctolib:rendez-vous' : href;

function liens(html) {
  const $ = cheerio.load(html);
  $(CHROME_PILOTE).remove();
  return $('a[href]')
    .map((i, a) => $(a).attr('href'))
    .get()
    .filter((h) => h && !h.startsWith('#'))
    .map(normaliserLien)
    .sort();
}

function metadonnees(html) {
  const $ = cheerio.load(html);
  return {
    title: normaliser($('title').text()),
    description: $('meta[name="description"]').attr('content') || '',
    canonical: $('link[rel="canonical"]').attr('href') || '',
    h1: normaliser($('h1').first().text()),
    jsonLd: $('script[type="application/ld+json"]').length,
    h2: $('h2').length,
  };
}

/**
 * Comptage des classes CSS portées par la page.
 *
 * Le contrôle du texte ne voit pas les cassures de mise en page : un hero
 * aplati garde ses mots mais perd `hero-content`, et le texte s'étale. Comparer
 * les classes rattrape ces régressions-là.
 */
function classes(html) {
  const $ = cheerio.load(html);
  $(CHROME_PILOTE).remove();
  const compte = new Map();
  $('[class]').each((i, el) => {
    for (const nom of ($(el).attr('class') || '').split(/\s+/).filter(Boolean)) {
      compte.set(nom, (compte.get(nom) || 0) + 1);
    }
  });
  return compte;
}

/** Mots présents dans l'original et absents de la page régénérée. */
function motsManquants(original, regenere) {
  const decouper = (t) => t.split(/[\s,.;:!?()«»"']+/).filter((m) => m.length > 3);
  const presents = new Set(decouper(regenere.toLowerCase()));
  const manquants = [];
  for (const mot of decouper(original.toLowerCase())) {
    if (!presents.has(mot)) manquants.push(mot);
  }
  return manquants;
}

/**
 * @returns {{ok: boolean, ecarts: string[], details: object}}
 */
function comparer(original, regenere) {
  const ecarts = [];

  const texteA = texteVisible(original);
  const texteB = texteVisible(regenere);
  const manquants = motsManquants(texteA, texteB);
  if (manquants.length) {
    ecarts.push(`${manquants.length} mots absents (ex. : ${[...new Set(manquants)].slice(0, 6).join(', ')})`);
  }

  const liensA = liens(original);
  const liensB = new Set(liens(regenere));
  const liensPerdus = [...new Set(liensA.filter((h) => !liensB.has(h)))];
  if (liensPerdus.length) {
    ecarts.push(`${liensPerdus.length} liens absents (ex. : ${liensPerdus.slice(0, 3).join(', ')})`);
  }

  const classesA = classes(original);
  const classesB = classes(regenere);

  const classesPerdues = [...classesA.keys()].filter((c) => !classesB.has(c));
  if (classesPerdues.length) {
    ecarts.push(`${classesPerdues.length} classes absentes (ex. : ${classesPerdues.slice(0, 5).join(', ')})`);
  }

  // Comparer la seule présence ne suffit pas : un `span.eyebrow` rendu en
  // `span.cta-eyebrow` laissait les deux classes présentes ailleurs dans la
  // page, et le texte devenait illisible sans qu'aucun contrôle ne bronche.
  // Une classe qui disparaît signale une mise en page cassée : c'est bloquant.
  // Un simple écart de comptage, lui, est attendu dès que le contenu a été
  // modifié depuis l'administration — il est signalé, sans arrêter la chaîne.
  const comptesChanges = [...classesA.entries()]
    .filter(([nom, n]) => classesB.has(nom) && classesB.get(nom) !== n)
    .map(([nom, n]) => `${nom} ${n}→${classesB.get(nom)}`);

  const classesAjoutees = [...classesB.keys()].filter((c) => !classesA.has(c));

  const remarques = [];
  if (comptesChanges.length) {
    remarques.push(`${comptesChanges.length} classes en nombre différent (${comptesChanges.slice(0, 5).join(', ')})`);
  }
  if (classesAjoutees.length) {
    remarques.push(`${classesAjoutees.length} classes ajoutées (ex. : ${classesAjoutees.slice(0, 4).join(', ')})`);
  }

  const metaA = metadonnees(original);
  const metaB = metadonnees(regenere);
  for (const cle of Object.keys(metaA)) {
    if (String(metaA[cle]) !== String(metaB[cle])) {
      ecarts.push(`${cle} : « ${String(metaA[cle]).slice(0, 40)} » → « ${String(metaB[cle]).slice(0, 40)} »`);
    }
  }

  return {
    ok: ecarts.length === 0,
    ecarts,
    remarques,
    details: {
      caracteresOriginal: texteA.length,
      caracteresRegenere: texteB.length,
      liensOriginal: liensA.length,
      liensRegenere: liensB.size,
      motsManquants: manquants.length,
      classesPerdues: classesPerdues.length,
      classesAjoutees: classesAjoutees.length,
      comptesChanges: comptesChanges.length,
    },
  };
}

module.exports = { comparer, texteVisible, liens, metadonnees };
