'use strict';

const { decode, chaines } = require('./verify');
const { textOf } = require('./report');

/**
 * Conversion d'une section HTML en blocs éditables.
 *
 * Règle directrice : ne jamais perdre de contenu. Ce qui n'est pas reconnu
 * devient un bloc `html` conservé tel quel, éditable en HTML libre dans
 * l'administration. Le rapport d'extraction distingue les deux.
 */

/** Éléments purement décoratifs, sans contenu rédactionnel. */
const DECORATIF = ['gold-bar', 'sec-num', 'pourquoi-icon', 'page-card-icon', 'faq-icon', 'ville-btn'];

/** Encadrés : même structure, seule la couleur change. */
const NOTES = {
  ibox: 'info',
  'info-box': 'info',
  'note-med': 'medical',
  'note-warn': 'avertissement',
  'techniques-autres': 'complement',
};

const has = (classes, name) => classes.includes(name);
const classesOf = ($el) => ($el.attr('class') || '').trim().split(/\s+/).filter(Boolean);

/** Nettoie un libellé en supprimant les éléments décoratifs qu'il contient. */
function labelOf($, el) {
  const $clone = $(el).clone();
  $clone.find(DECORATIF.map((c) => `.${c}`).join(',')).remove();
  // Sans cela « Beauregard<br>23 rue… » donnerait « Beauregard23 rue… ».
  $clone.find('br').replaceWith(' ');
  return $clone.text().trim().replace(/\s+/g, ' ');
}

function bodyOf($, el) {
  return ($(el).html() || '').trim();
}

/**
 * Contenu d'un élément une fois retirés les fragments déjà extraits en champs.
 * Évite d'avoir à prévoir un champ pour chaque variante : le reliquat est
 * conservé tel quel plutôt que de faire éclater le composant.
 */
function residu($, el, selecteurs) {
  const $clone = $(el).clone();
  $clone.find(selecteurs.join(',')).remove();
  const reste = ($clone.html() || '').trim();
  return textOf(reste) ? reste : '';
}

/* ─── Reconnaissance des composants ─────────────────────────────── */

function asFaq($, $el) {
  const $items = $el.find('.faq-item');
  if (!$items.length) return null;

  // Deux dialectes coexistent dans le site : `button.faq-btn` + `.faq-body`
  // sur les pages internes, `.faq-q` + `.faq-a` sur l'accueil. Les uniformiser
  // casserait la mise en forme de l'un des deux.
  const $premiere = $items.first().find('.faq-btn, .faq-q').first();
  const $reponse = $items.first().find('.faq-body, .faq-a').first();

  return {
    type: 'faq',
    questionTag: $premiere.length ? $premiere.get(0).tagName.toLowerCase() : 'button',
    questionClass: $premiere.attr('class') || 'faq-btn',
    answerClass: $reponse.attr('class') || 'faq-body',
    items: $items
      .map((i, it) => ({
        question: labelOf($, $(it).find('.faq-btn, .faq-q').first()),
        answer: bodyOf($, $(it).find('.faq-body, .faq-a').first()),
      }))
      .get(),
  };
}

function asVilles($, $el) {
  const $cards = $el.find('.ville-card');
  if (!$cards.length) return null;
  return {
    type: 'villes',
    items: $cards
      .map((i, c) => ({
        name: labelOf($, $(c).find('.ville-name').first()),
        address: bodyOf($, $(c).find('.ville-addr').first()),
        phone: labelOf($, $(c).find('.ville-tel').first()),
        badge: labelOf($, $(c).find('.ville-badge').first()),
        link: $(c).find('.ville-btn').first().attr('href') || $(c).find('a').last().attr('href') || null,
        linkLabel: labelOf($, $(c).find('.ville-btn').first()),
        extra: residu($, c, ['.ville-name', '.ville-addr', '.ville-tel', '.ville-btn', '.ville-badge']),
      }))
      .get(),
  };
}

function asNote($, $el, classes) {
  const key = Object.keys(NOTES).find((k) => has(classes, k));
  if (!key) return null;
  const $title = $el.find('.ibox-title, .info-box-title').first();
  const $clone = $el.clone();
  $clone.find('.ibox-title, .info-box-title').remove();
  return {
    type: 'note',
    variant: NOTES[key],
    title: $title.length ? labelOf($, $title) : '',
    html: ($clone.html() || '').trim(),
  };
}

function asChrono($, $el) {
  const $items = $el.find('.chrono-item');
  if (!$items.length) return null;
  return {
    type: 'chrono',
    items: $items
      .map((i, it) => ({
        badge: labelOf($, $(it).find('.chrono-badge').first()),
        html: bodyOf($, $(it).find('.chrono-txt').first()) || bodyOf($, it),
      }))
      .get(),
  };
}

function asList($, $el, classes) {
  if (!has(classes, 'liste') && !$el.is('ul, ol')) return null;
  const $li = $el.find('li');
  if (!$li.length) return null;
  return {
    type: 'list',
    ordered: $el.is('ol'),
    items: $li.map((i, li) => bodyOf($, li)).get(),
  };
}

function asTable($, $el) {
  const $table = $el.is('table') ? $el : $el.find('table').first();
  if (!$table.length) return null;
  // `.map()` de cheerio aplatit les tableaux qu'on lui renvoie : les lignes
  // seraient fusionnées en une liste plate de cellules. D'où le `.get()` avant.
  const rows = $table
    .find('tr')
    .get()
    .map((tr) =>
      $(tr)
        .find('th, td')
        .get()
        .map((cell) => bodyOf($, cell))
    );
  const head = $table.find('thead tr').length ? rows.shift() : [];
  return { type: 'table', head, rows };
}

/** Grilles de cartes : plusieurs variantes de style, une seule structure. */
function asCards($, $el) {
  const $cards = $el.children().filter((i, c) => /(card|acte|anat-item|diplome-item|etape)/.test($(c).attr('class') || ''));
  if ($cards.length < 2) return null;
  return {
    type: 'cards',
    variant: (classesOf($el)[0] || 'grid').replace(/-grid$/, ''),
    items: $cards
      .map((i, c) => {
        const $c = $(c);
        const $title = $c.find('h3, h4, [class*="-name"], [class*="-title"]').first();
        const $clone = $c.clone();
        if ($title.length) $clone.find($title.get(0).tagName + (($title.attr('class') || '') ? `.${$title.attr('class').split(/\s+/)[0]}` : '')).first().remove();
        return {
          className: $c.attr('class') || null,
          tag: c.tagName.toLowerCase(),
          title: $title.length ? labelOf($, $title) : '',
          titleTag: $title.length ? $title.get(0).tagName.toLowerCase() : null,
          titleClass: $title.length ? $title.attr('class') || null : null,
          html: ($clone.html() || '').trim(),
          link: $c.find('a').first().attr('href') || null,
        };
      })
      .get(),
  };
}

function asButtons($, $el, classes) {
  if (!has(classes, 'cta-btns') && !has(classes, 'hero-btns')) return null;
  const $links = $el.children('a');
  if (!$links.length) return null;
  return {
    type: 'buttons',
    items: $links
      .map((i, a) => ({
        label: labelOf($, a),
        href: $(a).attr('href'),
        style: $(a).attr('class') || null,
        external: /^https?:/.test($(a).attr('href') || ''),
      }))
      .get(),
  };
}

/* ─── Conversion d'un élément en bloc ───────────────────────────── */

/** Longueur minimale d'un fragment de texte contrôlé dans un conteneur. */
const FRAGMENT_MIN = 6;

/** Fragments de texte portés par un élément. */
function fragmentsDe($, el) {
  const out = [];
  $(el)
    .find('*')
    .addBack()
    .contents()
    .each((i, noeud) => {
      if (noeud.type !== 'text') return;
      const texte = noeud.data.replace(/\s+/g, ' ').trim();
      if (texte.length >= FRAGMENT_MIN) out.push(texte);
    });
  return out;
}

/**
 * Un composant n'est retenu que s'il ne laisse échapper aucun fragment de son
 * conteneur. Comparer des volumes de caractères ne suffisait pas : une grille
 * de cartes frôlait le seuil et se retrouvait éclatée en fragments inertes.
 * Le critère est désormais le même que le contrôle final — ne rien perdre.
 */
function neRienPerdre($, el, bloc) {
  const porte = ` ${chaines(bloc).map(decode).join(' ')} `;
  return fragmentsDe($, el).every((f) => porte.includes(f.slice(0, 45)));
}

/** Premier composant reconnu pour cet élément, ou null. */
function reconnaitre($, $el, classes, tag) {
  return (
    asFaq($, $el) ||
    asVilles($, $el) ||
    asChrono($, $el) ||
    asNote($, $el, classes) ||
    asButtons($, $el, classes) ||
    asList($, $el, classes) ||
    asTable($, $el) ||
    asCards($, $el) ||
    // `enveloppe` distingue un conteneur `.txt` d'un paragraphe nu : sans
    // cette marque, le rendu ajouterait un `div.txt` là où la page d'origine
    // n'en avait pas.
    (has(classes, 'txt') ? { type: 'text', enveloppe: true, html: bodyOf($, $el) } : null) ||
    (tag === 'p' ? { type: 'text', enveloppe: false, html: $.html($el) } : null) ||
    (/^h[2-6]$/.test(tag) ? { type: 'heading', level: Number(tag[1]), html: bodyOf($, $el) } : null)
  );
}

/** Fusionne les paragraphes voisins en un seul bloc de texte éditable. */
function fusionnerTextes(blocs) {
  const out = [];
  for (const bloc of blocs) {
    const precedent = out[out.length - 1];
    if (
      bloc.type === 'text' &&
      precedent &&
      precedent.type === 'text' &&
      precedent.enveloppe === bloc.enveloppe
    ) {
      precedent.html = `${precedent.html}\n${bloc.html}`.trim();
      continue;
    }
    out.push(bloc);
  }
  return out;
}

/**
 * Convertit un élément en un ou plusieurs blocs éditables.
 *
 * Un composant n'est retenu que s'il porte l'essentiel du texte de son
 * conteneur. Sinon l'élément est décomposé enfant par enfant : c'est ce qui
 * évite qu'une grille de cartes ou une chronologie n'emporte au passage les
 * paragraphes et encadrés posés à côté d'elle.
 *
 * @returns {object[]} jamais null — au pire un bloc `html` intégral.
 */
function toBlocks($, el) {
  const $el = $(el);
  const classes = classesOf($el);
  const tag = el.tagName ? el.tagName.toLowerCase() : '';

  if (DECORATIF.some((c) => has(classes, c)) && !$el.text().trim()) return [];
  if (!$el.text().trim() && !$el.find('img').length) {
    // Sans texte mais porteur d'une classe : un trait, un séparateur. Le jeter
    // ferait disparaître un élément de mise en forme.
    return classes.length ? [{ type: 'html', html: $.html($el) }] : [];
  }

  const candidat = reconnaitre($, $el, classes, tag);
  if (candidat && neRienPerdre($, el, candidat)) {
    // La classe d'origine est conservée : c'est elle qui porte la mise en forme
    // au moment de régénérer la page.
    return [classes.length ? { ...candidat, className: classes.join(' ') } : candidat];
  }

  // Un enfant sans texte peut porter de la mise en forme (trait, séparateur) :
  // il n'est écarté que s'il n'a ni classe, ni identifiant, ni image.
  const enfants = $el
    .children()
    .filter((i, c) => $(c).text().trim() || $(c).find('img').length || $(c).attr('class') || $(c).attr('id'));
  if (enfants.length) {
    const blocs = [];
    enfants.each((i, c) => blocs.push(...toBlocks($, c)));
    if (!blocs.length) return [candidat || { type: 'html', html: $.html($el) }];

    const contenu = fusionnerTextes(blocs);

    // Un conteneur porteur de mise en forme est restitué autour de ses blocs.
    // Le dissoudre ferait perdre `author-band`, `sommaire` et consorts.
    if (classes.length || $el.attr('id')) {
      return [
        {
          type: 'group',
          tag,
          className: classes.join(' ') || null,
          id: $el.attr('id') || null,
          blocks: contenu,
        },
      ];
    }
    return contenu;
  }

  return [candidat || { type: 'html', html: $.html($el) }];
}

/**
 * Descend à travers les conteneurs de mise en page qui n'enveloppent qu'un
 * seul élément (`.cta-inner`, `.apropos-wrap`…). Sans cela, le titre et
 * l'accroche d'une section se retrouvent enfouis d'un niveau et échappent au
 * modèle.
 *
 * Les conteneurs traversés sont restitués : ils portent la mise en page, et les
 * dissoudre suffit à casser la colonne.
 *
 * @returns {{contenu: import('cheerio').Cheerio, wrappers: object[]}}
 */
function deballer($, el) {
  let $courant = $(el);
  const wrappers = [];

  for (let profondeur = 0; profondeur < 3; profondeur += 1) {
    const $enfants = $courant.children();
    if ($enfants.length !== 1) break;
    const $seul = $enfants.first();
    if (!$seul.is('div, section')) break;
    const tag = $seul.get(0).tagName.toLowerCase();
    if (reconnaitre($, $seul, classesOf($seul), tag)) break;
    if (!$seul.children().length) break;

    wrappers.push({ tag, className: $seul.attr('class') || null, id: $seul.attr('id') || null });
    $courant = $seul;
  }

  return { contenu: $courant, wrappers };
}

/* ─── Conversion d'une section ──────────────────────────────────── */

/**
 * @param {import('cheerio').CheerioAPI} $
 * @param {any} sectionEl
 * @returns {{id: string|null, variant: string|null, eyebrow: string, title: string, blocks: object[]}}
 */
function sectionToBlocks($, sectionEl) {
  const $section = $(sectionEl);
  const section = {
    id: $section.attr('id') || null,
    variant: classesOf($section).filter((c) => c !== 'sec').join(' ') || null,
    eyebrow: '',
    title: '',
    blocks: [],
  };

  const { contenu, wrappers } = deballer($, sectionEl);
  section.wrappers = wrappers;

  contenu.children().each((i, child) => {
    const $child = $(child);
    const classes = classesOf($child);
    const tag = child.tagName ? child.tagName.toLowerCase() : '';

    // Métadonnées de la section, remontées hors des blocs.
    if (has(classes, 'eyebrow') || has(classes, 'sec-eyebrow') || has(classes, 'cta-eyebrow')) {
      section.eyebrow = labelOf($, child);
      section.eyebrowTag = tag;
      section.eyebrowClass = classes.join(' ');
      section.eyebrowStyle = $child.attr('style') || null;
      return;
    }
    if ((tag === 'h2' || has(classes, 'sec-title')) && !section.title) {
      section.title = bodyOf($, child);
      section.titleTag = tag;
      section.titleClass = classes.join(' ') || null;
      return;
    }

    section.blocks.push(...toBlocks($, child));
  });

  section.blocks = fusionnerTextes(section.blocks);
  return section;
}

module.exports = { sectionToBlocks, toBlocks };
