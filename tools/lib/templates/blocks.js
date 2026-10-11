'use strict';

/**
 * Rendu des blocs vers le HTML du site.
 *
 * Chaque bloc restitue la classe qu'il portait à l'extraction (`className`) :
 * c'est elle qui porte la mise en forme. À défaut, une classe par défaut
 * cohérente avec la feuille de style existante.
 */

const { echapper, galerieAvantApres } = require('../personnalisation');

const cls = (bloc, defaut) => bloc.className || defaut;
const attr = (valeur) => String(valeur).replace(/"/g, '&quot;');

/** Texte libre (légende) : échappé, avec les retours à la ligne convertis en <br>. */
const texteLibre = (valeur) => echapper(valeur).replace(/\r\n|\r|\n/g, '<br>');

/** Attributs d'un lien : cible et rel sur les liens externes. */
function lien({ href, style, external }) {
  const morceaux = [`href="${attr(href || '#')}"`];
  if (external) morceaux.push('target="_blank"', 'rel="noopener"');
  if (style) morceaux.push(`class="${attr(style)}"`);
  return morceaux.join(' ');
}

const rendus = {
  // Un paragraphe nu se rend tel quel ; seul un conteneur `.txt` en reprend un.
  text: (b) => (b.enveloppe === false ? b.html : `<div class="${cls(b, 'txt')}">\n${b.html}\n</div>`),

  heading: (b) => `<h${b.level}>${b.html}</h${b.level}>`,

  html: (b) => b.html,

  buttons: (b) =>
    `<div class="${cls(b, 'cta-btns')}">\n` +
    b.items
      .map((i) =>
        i.image
          ? `  <a ${lien(i)}><img src="${attr(i.image)}" alt="${attr(i.alt || i.label || '')}" loading="lazy"></a>`
          : `  <a ${lien(i)}>${i.label}</a>`
      )
      .join('\n') +
    `\n</div>`,

  faq: (b) => {
    const baliseQ = b.questionTag || 'button';
    const classeQ = b.questionClass || 'faq-btn';
    const classeR = b.answerClass || 'faq-body';
    const attributsQ = baliseQ === 'button' ? ' type="button" aria-expanded="false"' : '';
    const icone = baliseQ === 'button' ? '<span class="faq-icon">+</span>' : '';
    return (
      `<div class="${cls(b, 'faq-list')}">\n` +
      b.items
        .map(
          (i) =>
            `  <div class="faq-item">\n` +
            `    <${baliseQ} class="${attr(classeQ)}"${attributsQ}>${i.question}${icone}</${baliseQ}>\n` +
            `    <div class="${attr(classeR)}">${i.answer}</div>\n` +
            `  </div>`
        )
        .join('\n') +
      `\n</div>`
    );
  },

  villes: (b) =>
    `<div class="${cls(b, 'villes-grid')}">\n` +
    b.items
      .map((i) => {
        const lignes = [`  <div class="ville-card">`];
        if (i.badge) lignes.push(`    <span class="ville-badge">${i.badge}</span>`);
        if (i.name) lignes.push(`    <div class="ville-name">${i.name}</div>`);
        if (i.address) lignes.push(`    <p class="ville-addr">${i.address}</p>`);
        if (i.phone) lignes.push(`    <a class="ville-tel" href="tel:${attr(i.phone.replace(/\s/g, ''))}">${i.phone}</a>`);
        if (i.extra) lignes.push(`    ${i.extra}`);
        if (i.linkLabel) lignes.push(`    <a class="ville-btn" href="${attr(i.link || '#')}">${i.linkLabel}</a>`);
        lignes.push(`  </div>`);
        return lignes.join('\n');
      })
      .join('\n') +
    `\n</div>`,

  cards: (b) =>
    `<div class="${cls(b, 'grid')}">\n` +
    b.items
      .map((i) => {
        const balise = i.tag || (i.link ? 'a' : 'div');
        const classe = i.className || 'card';
        const href = i.link && balise === 'a' ? ` href="${attr(i.link)}"` : '';
        const baliseTitre = i.titleTag || 'h3';
        const classeTitre = i.titleClass ? ` class="${attr(i.titleClass)}"` : '';
        const titre = i.title ? `    <${baliseTitre}${classeTitre}>${i.title}</${baliseTitre}>\n` : '';
        return `  <${balise} class="${attr(classe)}"${href}>\n${titre}    ${i.html}\n  </${balise}>`;
      })
      .join('\n') +
    `\n</div>`,

  group: (b) => {
    const attributs = [
      b.className ? ` class="${attr(b.className)}"` : '',
      b.id ? ` id="${attr(b.id)}"` : '',
    ].join('');
    const interieur = b.blocks.map((e) => rendreBloc(e)).join('\n');
    return `<${b.tag || 'div'}${attributs}>\n${interieur}\n</${b.tag || 'div'}>`;
  },

  note: (b) => {
    const titre = b.title ? `  <div class="ibox-title">${b.title}</div>\n` : '';
    return `<div class="${cls(b, 'note-med')}">\n${titre}  ${b.html}\n</div>`;
  },

  chrono: (b) =>
    `<div class="${cls(b, 'chrono')}">\n` +
    b.items
      .map(
        (i) =>
          `  <div class="chrono-item">\n` +
          (i.badge ? `    <span class="chrono-badge">${i.badge}</span>\n` : '') +
          `    <div class="chrono-txt">${i.html}</div>\n` +
          `  </div>`
      )
      .join('\n') +
    `\n</div>`,

  list: (b) => {
    const balise = b.ordered ? 'ol' : 'ul';
    return (
      `<${balise} class="${cls(b, 'liste')}">\n` +
      b.items.map((i) => `  <li>${i}</li>`).join('\n') +
      `\n</${balise}>`
    );
  },

  table: (b) => {
    const cellules = (ligne, balise) =>
      ligne.map((c) => `      <${balise}>${c}</${balise}>`).join('\n');
    const entete = b.head && b.head.length
      ? `  <thead>\n    <tr>\n${cellules(b.head, 'th')}\n    </tr>\n  </thead>\n`
      : '';
    const corps = b.rows.map((r) => `    <tr>\n${cellules(r, 'td')}\n    </tr>`).join('\n');
    return `<table class="${cls(b, 'prix-table')}">\n${entete}  <tbody>\n${corps}\n  </tbody>\n</table>`;
  },

  /**
   * Diaporama avant/après : les entrées ne viennent pas du contenu de la
   * page, mais de `medias/avant-apres.json`, alimenté depuis
   * l'administration (ajout, suppression). La page se contente de poser
   * l'emplacement ; le nombre de photos affichées peut changer sans jamais
   * toucher au contenu de la page elle-même.
   */
  diaporama: (b) => {
    const entrees = galerieAvantApres();
    if (!entrees.length) {
      return (
        `<div class="${cls(b, 'aa-diaporama')} aa-vide">\n` +
        `  <p>Aucune photo pour l'instant. Ajoutez-en depuis l'administration.</p>\n` +
        `</div>`
      );
    }

    const diapositives = entrees
      .map(
        (e, i) =>
          `  <div class="aa-diapo${i === 0 ? ' aa-active' : ''}" data-aa-index="${i}"${i === 0 ? '' : ' hidden'}>\n` +
          `    <div class="aa-photo"><span class="aa-etiquette">Avant</span><img src="/assets/medias/${attr(e.avant)}" alt="Avant${e.legende ? ` — ${attr(e.legende)}` : ''}" loading="${i === 0 ? 'eager' : 'lazy'}"></div>\n` +
          `    <div class="aa-photo"><span class="aa-etiquette">Après</span><img src="/assets/medias/${attr(e.apres)}" alt="Après${e.legende ? ` — ${attr(e.legende)}` : ''}" loading="${i === 0 ? 'eager' : 'lazy'}"></div>\n` +
          (e.legende ? `    <p class="aa-legende">${texteLibre(e.legende)}</p>\n` : '') +
          `  </div>`
      )
      .join('\n');

    const commandes =
      entrees.length > 1
        ? `\n  <div class="aa-commandes">\n` +
          `    <button type="button" class="aa-prec" aria-label="Cas précédent">‹</button>\n` +
          `    <div class="aa-puces">\n` +
          entrees
            .map((e, i) => `      <button type="button" class="aa-puce${i === 0 ? ' aa-active' : ''}" data-aa-index="${i}" aria-label="Cas ${i + 1}"></button>`)
            .join('\n') +
          `\n    </div>\n` +
          `    <button type="button" class="aa-suiv" aria-label="Cas suivant">›</button>\n` +
          `  </div>\n`
        : '\n';

    return `<div class="${cls(b, 'aa-diaporama')}" data-aa-total="${entrees.length}">\n${diapositives}\n${commandes}</div>`;
  },
};

/**
 * @param {object} bloc
 * @returns {string} HTML du bloc
 */
function rendreBloc(bloc) {
  const rendu = rendus[bloc.type];
  if (!rendu) throw new Error(`Type de bloc inconnu au rendu : ${bloc.type}`);
  return rendu(bloc);
}

module.exports = { rendreBloc, lien, attr };
