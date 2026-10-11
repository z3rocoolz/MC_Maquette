'use strict';

/**
 * Lecture et écriture du contenu, avec historique.
 *
 * Chaque enregistrement archive la version précédente : c'est le filet de
 * sécurité d'un outil où l'on édite directement le site en ligne.
 */

const fs = require('node:fs');
const path = require('node:path');

const cheerio = require('cheerio');

const RACINE = path.resolve(__dirname, '..', '..');
const CONTENU = path.join(RACINE, 'content');
const VERSIONS = path.join(CONTENU, '.versions');
const VERSIONS_GARDEES = 20;
const FRONT = path.resolve(RACINE, '..', 'front');

/** Un slug ne doit jamais pouvoir désigner un fichier hors de `content/`. */
const SLUG_VALIDE = /^[a-z0-9][a-z0-9_-]*$/i;

function cheminPage(slug) {
  if (!SLUG_VALIDE.test(slug)) throw new Error(`Identifiant de page invalide : ${slug}`);
  const chemin = path.join(CONTENU, `${slug}.json`);
  if (path.dirname(chemin) !== CONTENU) throw new Error('Chemin refusé');
  return chemin;
}

/**
 * Libellés des pages, tels qu'ils apparaissent dans le menu du site.
 *
 * Le titre de référencement — « Rhinoplastie Marseille Nice Draguignan » pour
 * l'accueil — ne dit pas de quelle page il s'agit. Le menu, lui, nomme chaque
 * page comme le visiteur la voit, et range les pages par rubrique.
 *
 * @returns {Map<string, {libelle: string, rubrique: string|null}>}
 */
function libellesDuMenu() {
  const table = new Map();
  const fichierSite = path.join(CONTENU, '_site.json');
  if (!fs.existsSync(fichierSite)) return table;

  const site = JSON.parse(fs.readFileSync(fichierSite, 'utf8'));
  const menus = Object.values((site.variantes && site.variantes.menu) || {});
  if (!menus.length) return table;

  const $ = cheerio.load(menus[0], null, false);

  // Entrées simples, hors rubrique.
  $('a.mm-a').each((i, a) => {
    const href = $(a).attr('href');
    if (href) table.set(href, { libelle: $(a).text().trim(), rubrique: null });
  });

  // Entrées rangées sous une rubrique dépliable.
  $('.mm-acc').each((i, acc) => {
    const rubrique = $(acc).find('.mm-acc-btn').first().text().replace(/[›\s]+$/, '').trim();
    $(acc)
      .find('.mm-acc-body a')
      .each((j, a) => {
        const href = $(a).attr('href');
        if (href && !table.has(href)) table.set(href, { libelle: $(a).text().trim(), rubrique });
      });
  });

  // Pages légales : elles ne figurent que dans le pied de page.
  const pieds = Object.values((site.variantes && site.variantes.footer) || {});
  if (pieds.length) {
    const $pied = cheerio.load(pieds[0], null, false);
    $pied('.footer-col a').each((i, a) => {
      const href = $pied(a).attr('href');
      if (href && !table.has(href)) table.set(href, { libelle: $pied(a).text().trim(), rubrique: 'Légal' });
    });
  }

  return table;
}

function listerPages() {
  const libelles = libellesDuMenu();

  return fs
    .readdirSync(CONTENU)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_') && !f.startsWith('.'))
    .map((f) => {
      const page = JSON.parse(fs.readFileSync(path.join(CONTENU, f), 'utf8'));
      const blocs = page.sections.reduce((n, s) => n + s.blocks.length, 0);
      return {
        slug: page.slug,
        url: page.url,
        titre: page.seo.title,
        libelle: (libelles.get(page.url) || {}).libelle || page.seo.title.split('–')[0].trim(),
        rubrique: (libelles.get(page.url) || {}).rubrique || null,
        template: page.template,
        sections: page.sections.length,
        blocs,
        // Une page sans équivalent dans `front/` a été créée pour ce projet :
        // c'est celle qu'on met à jour régulièrement, elle passe en tête.
        propre: !fs.existsSync(path.join(FRONT, `${page.slug}.html`)),
        modifie: fs.statSync(path.join(CONTENU, f)).mtime,
      };
    })
    .sort((a, b) => {
      if (a.propre !== b.propre) return a.propre ? -1 : 1;
      if (a.url === '/' || b.url === '/') return a.url === '/' ? -1 : 1;
      return a.slug.localeCompare(b.slug);
    });
}

const lirePage = (slug) => JSON.parse(fs.readFileSync(cheminPage(slug), 'utf8'));

const lireSite = () => JSON.parse(fs.readFileSync(path.join(CONTENU, '_site.json'), 'utf8'));

/** Archive la version courante avant de la remplacer. */
function archiver(slug) {
  const source = cheminPage(slug);
  if (!fs.existsSync(source)) return;

  fs.mkdirSync(VERSIONS, { recursive: true });
  const horodatage = new Date().toISOString().replace(/[:.]/g, '-');
  fs.copyFileSync(source, path.join(VERSIONS, `${slug}.${horodatage}.json`));

  const anciennes = fs
    .readdirSync(VERSIONS)
    .filter((f) => f.startsWith(`${slug}.`))
    .sort()
    .reverse()
    .slice(VERSIONS_GARDEES);
  for (const f of anciennes) fs.unlinkSync(path.join(VERSIONS, f));
}

function enregistrerPage(slug, page) {
  archiver(slug);
  fs.writeFileSync(cheminPage(slug), `${JSON.stringify(page, null, 2)}\n`);
}

function versions(slug) {
  if (!fs.existsSync(VERSIONS)) return [];
  return fs
    .readdirSync(VERSIONS)
    .filter((f) => f.startsWith(`${slug}.`))
    .sort()
    .reverse()
    .map((f) => ({
      fichier: f,
      date: new Date(fs.statSync(path.join(VERSIONS, f)).mtime),
    }));
}

function restaurer(slug, fichier) {
  if (!fichier.startsWith(`${slug}.`) || fichier.includes('/') || fichier.includes('..')) {
    throw new Error('Version invalide');
  }
  const source = path.join(VERSIONS, fichier);
  if (!fs.existsSync(source)) throw new Error('Version introuvable');

  archiver(slug);
  fs.copyFileSync(source, cheminPage(slug));
}

/** Libellé d'une page, tel qu'il figure dans le menu du site. */
function libelleDePage(url) {
  const entree = libellesDuMenu().get(url);
  return entree ? entree.libelle : null;
}

module.exports = { CONTENU, libelleDePage, enregistrerPage, lirePage, lireSite, listerPages, restaurer, versions };
