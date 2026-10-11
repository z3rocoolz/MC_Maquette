'use strict';

/**
 * Assainissement du HTML recu du formulaire.
 *
 * Ce qui est enregistre ici finit dans les pages publiques du site. Le
 * nettoyage fait dans le navigateur n'est qu'un confort d'edition : il ne
 * protege de rien, puisque la requete peut etre forgee. C'est ce module-ci
 * qui fait autorite, et il travaille par liste blanche : tout ce qui n'est
 * pas explicitement permis disparait.
 */

const cheerio = require('cheerio');

/** Texte courant : la mise en forme que le site sait rendre, rien de plus. */
const BALISES_RICHES = new Set(['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'span', 'sup', 'sub']);

/** Blocs HTML libres : on tolere la structure, jamais le comportement. */
const BALISES_STRUCTURE = new Set([
  ...BALISES_RICHES,
  'div', 'section', 'article', 'address', 'h2', 'h3', 'h4', 'h5', 'h6',
  'img', 'figure', 'figcaption', 'blockquote', 'cite',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'small',
  'nav', 'aside', 'details', 'summary', 'button', 'picture', 'source',
  'svg', 'path', 'circle',
]);

/** Balises dont le contenu part avec elles. */
const A_SUPPRIMER = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'form',
  'input', 'textarea', 'link', 'meta', 'noscript', 'math',
]);

const EQUIVALENCES = { b: 'strong', i: 'em', font: 'span', div: 'p' };

const ATTRIBUTS = {
  a: new Set(['href', 'target', 'rel', 'style', 'class']),
  img: new Set(['src', 'srcset', 'sizes', 'alt', 'width', 'height', 'loading', 'class']),
  source: new Set(['srcset', 'sizes', 'media', 'type']),
  button: new Set(['type']),
  svg: new Set(['viewBox', 'viewbox', 'width', 'height', 'xmlns', 'focusable']),
  path: new Set(['d', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin']),
  circle: new Set(['cx', 'cy', 'r', 'fill', 'stroke', 'stroke-width']),
  span: new Set(['class', 'style']),
  td: new Set(['colspan', 'rowspan', 'class']),
  th: new Set(['colspan', 'rowspan', 'class']),
};
const ATTRIBUTS_COMMUNS = new Set([
  'class', 'id', 'hidden', 'role', 'tabindex',
  'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-hidden',
  'aria-live', 'aria-pressed', 'aria-expanded', 'aria-controls', 'aria-current',
  'data-technique-link', 'data-technique-panel', 'data-specialty-category',
  'data-specialty-filter', 'data-filter-status', 'data-filter',
]);

const PROTOCOLES = /^(https?:|mailto:|tel:|\/|#|\.\/|\.\.\/)/i;

/**
 * Espaces et caracteres invisibles servant a deguiser un protocole
 * (« java	script: », espaces insecables, marques de direction, BOM).
 */
const INVISIBLES = /[\s\u00A0\u1680\u2000-\u200F\u2028\u2029\u202F\u205F\u3000\uFEFF]/g;

/** Seule la couleur est toleree, et uniquement sous une forme inoffensive. */
const STYLE_SUR = /^\s*color\s*:\s*(#[0-9a-f]{3,8}|[a-z]+|var\(--[a-z0-9-]+\))\s*;?\s*$/i;

function adresseSure(valeur) {
  const propre = String(valeur || '').trim();
  if (!propre) return false;

  const compact = propre.replace(INVISIBLES, '').toLowerCase();
  if (/^(javascript|vbscript|data):/.test(compact)) return false;

  return PROTOCOLES.test(propre) || /^(?:[a-z0-9_-]+\/)*[a-z0-9_.-]+(?:[?#][^\s]*)?$/i.test(propre);
}

/**
 * @param {string} html
 * @param {'riche'|'structure'} profil
 * @returns {string} HTML ne contenant que des balises et attributs permis
 */
function assainir(html, profil = 'riche') {
  const entree = String(html ?? '');
  if (!entree.trim()) return '';

  const autorisees = profil === 'structure' ? BALISES_STRUCTURE : BALISES_RICHES;
  const $ = cheerio.load(`<div id="racine">${entree}</div>`, null, false);
  const $racine = $('#racine');

  $racine.find([...A_SUPPRIMER].join(',')).remove();

  // Remplacer un element recree ses descendants : on repasse jusqu'a ce que
  // l'arbre soit stable, sinon un <b> imbrique dans un <div> resterait.
  let change = true;
  let passes = 0;

  while (change && passes < 8) {
    change = false;
    passes += 1;

    $racine.find('*').each((i, element) => {
      const $el = $(element);
      const balise = element.tagName.toLowerCase();

      if (A_SUPPRIMER.has(balise)) {
        $el.remove();
        change = true;
        return;
      }

      if (!autorisees.has(balise)) {
        const equivalent = EQUIVALENCES[balise];
        if (equivalent) $el.replaceWith(`<${equivalent}>${$el.html() || ''}</${equivalent}>`);
        else $el.replaceWith($el.html() || '');
        change = true;
        return;
      }

      const permis = new Set([...ATTRIBUTS_COMMUNS, ...(ATTRIBUTS[balise] || [])]);
      for (const nom of Object.keys(element.attribs || {})) {
        const valeur = element.attribs[nom];

        if (/^on/i.test(nom) || !permis.has(nom)) {
          $el.removeAttr(nom);
          continue;
        }
        if ((nom === 'href' || nom === 'src') && !adresseSure(valeur)) {
          $el.removeAttr(nom);
          continue;
        }
        if (nom === 'srcset') {
          const candidats = valeur.split(',').map(s => s.trim().split(/\s+/));
          if (!candidats.every(c => adresseSure(c[0]) && (c.length === 1 || (c.length === 2 && /^\d+(?:\.\d+)?[wx]$/.test(c[1]))))) $el.removeAttr(nom);
        }
        if ((nom === 'fill' || nom === 'stroke') && !/^(none|currentColor|#[0-9a-f]{3,8})$/i.test(valeur)) $el.removeAttr(nom);
        if (nom === 'style' && !STYLE_SUR.test(valeur)) {
          $el.removeAttr(nom);
        }
      }

      if (balise === 'a' && $el.attr('target') === '_blank') $el.attr('rel', 'noopener');
      if (balise === 'button') $el.attr('type', 'button');
    });
  }

  return ($racine.html() || '').trim();
}

/**
 * Champ d'une seule ligne : aucune balise n'est admise. Les chevrons saisis
 * volontairement sont echappes plutot que supprimes.
 */
function texteSimple(valeur) {
  return String(valeur ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Champ contenant une adresse : vide si elle n'est pas d'un type accepte. */
function lienSimple(valeur) {
  const propre = texteSimple(valeur);
  return adresseSure(propre) ? propre : '';
}

module.exports = { assainir, adresseSure, lienSimple, texteSimple };
