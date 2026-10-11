'use strict';

const cheerio = require('cheerio');

/**
 * Longueur minimale d'un fragment contrôlé.
 * Fixée trop haut (25), elle laissait passer les libellés courts — les tags et
 * les noms de villes du hero d'accueil disparaissaient sans alerte.
 */
const SEUIL = 8;
/** Longueur de la sonde recherchée dans le contenu extrait. */
const SONDE = 45;

/** Texte réel d'un fragment HTML, entités décodées. */
function decode(html) {
  if (!html) return '';
  return cheerio
    .load(`<div>${html}</div>`)('div')
    .text()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Toutes les chaînes portées par l'objet page, à plat. */
function chaines(valeur, acc = []) {
  if (typeof valeur === 'string') acc.push(valeur);
  else if (Array.isArray(valeur)) valeur.forEach((v) => chaines(v, acc));
  else if (valeur && typeof valeur === 'object') Object.values(valeur).forEach((v) => chaines(v, acc));
  return acc;
}

/**
 * Contrôle de non-perte : chaque fragment de texte visible de la page
 * d'origine doit se retrouver dans le contenu extrait.
 *
 * Comparer des volumes de caractères ne suffit pas — les entités HTML et les
 * espaces faussent le compte. On vérifie donc la présence de chaque fragment.
 *
 * @param {import('cheerio').CheerioAPI} $original  page d'origine, chrome retiré
 * @param {object} page  page extraite
 * @returns {{perdus: number, caracteres: number, details: object[]}}
 */
function verifierPage($original, page) {
  const extrait = ` ${chaines(page).map(decode).join(' ')} `;
  const details = [];
  let caracteres = 0;

  $original('*')
    .contents()
    .each((i, noeud) => {
      if (noeud.type !== 'text') return;
      const texte = noeud.data.replace(/\s+/g, ' ').trim();
      if (texte.length < SEUIL) return;
      if (extrait.includes(texte.slice(0, SONDE))) return;

      const $parent = $original(noeud).parent();
      caracteres += texte.length;
      details.push({
        contexte: $parent.attr('class') || $parent.get(0).tagName,
        extrait: `${texte.slice(0, 70)}…`,
        longueur: texte.length,
      });
    });

  return { perdus: details.length, caracteres, details };
}

module.exports = { verifierPage, decode, chaines };
