#!/usr/bin/env node
'use strict';

/**
 * Extrait le contenu éditable des pages HTML de `front/` vers un modèle JSON.
 *
 * Objectif : zéro perte. Chaque page extraite doit porter autant de texte que
 * l'original ; ce qui n'entre pas dans un bloc typé est conservé en HTML brut.
 *
 *   node tools/extract.js [--verbose] [--forcer]
 *
 * L'extraction est une opération d'initialisation, pas une étape de build.
 * Une page déjà extraite appartient à l'administration : elle n'est jamais
 * réécrite, sauf demande explicite avec `--forcer`. Sans cette garde, la
 * moindre publication écraserait tous les textes saisis par le client.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const cheerio = require('cheerio');

const { extractImages, extractStyle, extractScripts } = require('./lib/assets');
const { extractSeo, extractExternalAssets } = require('./lib/seo');
const { sectionToBlocks, toBlocks } = require('./lib/blocks');
const { textOf, textLength, blockStats } = require('./lib/report');
const { verifierPage } = require('./lib/verify');
const { installerPages } = require('./lib/personnalisation');

const ROOT = path.resolve(__dirname, '..');
const FRONT_DIR = path.resolve(ROOT, '..', 'front');
const CONTENT_DIR = path.join(ROOT, 'content');
const IMG_DIR = path.join(ROOT, 'assets', 'img');
const JS_DIR = path.join(ROOT, 'assets', 'js');
const CSS_DIR = path.join(ROOT, 'assets', 'css');
const IMG_PUBLIC = '/assets/img';

// Pages hors modèle standard (structure propre, traitées à part).
const TEMPLATES = { drmattiacoda_v8: 'home', rhinoplastie_v3: 'guide' };
const ALIASES = { drmattiacoda_v8: '/', rhinoplastie_v3: '/rhinoplastie/' };
const IGNORED = new Set(['404.html', '500.html']);

const verbose = process.argv.includes('--verbose');
const forcer = process.argv.includes('--forcer') || process.argv.includes('--force');

/** Éléments communs à toutes les pages : ils vivent dans site.json. */
const CHROME = 'nav#nav, #overlay, #menu-overlay, #menu, #mobile-menu, footer, script, style, noscript';

function extractHero($) {
  const $hero = $('header.hero, section.hero, .hero').first();
  if (!$hero.length) {
    return { tag: 'header', className: 'hero', id: null, eyebrow: '', title: '', lead: '', buttons: [], breadcrumb: [], blocks: [] };
  }

  const $fil = $hero.find('.breadcrumb').first();
  const $separateur = $fil.children().filter((i, el) => $(el).text().trim() === '›').first();
  const separateurClass = $separateur.length ? $separateur.attr('class') || null : null;

  const breadcrumb = $fil
    .children()
    .map((i, el) => {
      const $el = $(el);
      const label = $el.text().trim();
      if (!label || label === '›') return null;
      return { label, href: $el.attr('href') || null, className: $el.attr('class') || null };
    })
    .get()
    .filter(Boolean);

  // Le hero de l'accueil a sa propre charpente (`hero-bg`, `hero-content`)
  // qui porte toute la mise en page. L'aplatir en champs la détruirait : on ne
  // modélise que les heros à structure plate et on conserve les autres tels
  // quels, quitte à ce qu'ils s'éditent en HTML.
  const STANDARD = '.breadcrumb, .hero-eyebrow, .eyebrow, h1, .hero-lead, .hero-btns';
  const atypique = $hero.children().toArray().some((el) => !$(el).is(STANDARD));

  if (atypique) {
    return {
      tag: $hero.get(0).tagName.toLowerCase(),
      className: $hero.attr('class') || 'hero',
      id: $hero.attr('id') || null,
      raw: $.html($hero),
      eyebrow: $hero.find('.hero-eyebrow, .eyebrow').first().text().trim(),
      title: ($hero.find('h1').first().html() || '').trim(),
      lead: ($hero.find('.hero-lead').first().html() || '').trim(),
      buttons: [],
      breadcrumb,
      separateurClass,
      blocks: [],
    };
  }

  const blocks = [];

  return {
    tag: $hero.get(0).tagName.toLowerCase(),
    className: $hero.attr('class') || 'hero',
    id: $hero.attr('id') || null,
    blocks,
    eyebrow: $hero.find('.hero-eyebrow, .eyebrow').first().text().trim(),
    title: ($hero.find('h1').first().html() || '').trim(),
    lead: ($hero.find('.hero-lead').first().html() || '').trim(),
    buttons: $hero
      .find('.hero-btns a, .cta-btns a')
      .map((i, a) => ({
        label: $(a).text().trim().replace(/\s+/g, ' '),
        href: $(a).attr('href'),
        style: $(a).attr('class') || null,
        external: /^https?:/.test($(a).attr('href') || ''),
      }))
      .get(),
    breadcrumb,
    separateurClass,
  };
}

/**
 * Parcourt le corps de la page dans l'ordre de lecture.
 *
 * Le parcours part de `<body>` et non de `<main>` : les pages ne partagent pas
 * la même charpente — certaines n'ont pas de `<main>`, d'autres l'imbriquent
 * dans un conteneur, et du contenu réel (bandeau auteur, sommaire, encadrés,
 * appel à l'action) vit à côté. Le chrome est écarté explicitement, tout le
 * reste est extrait ; ce qui traîne entre deux sections est regroupé dans une
 * section sans titre.
 *
 * La chaîne de conteneurs traversée jusqu'aux sections est mémorisée
 * (`layout`) : c'est elle qui porte la largeur de colonne. Sans elle, le texte
 * régénéré s'étalerait sur toute la page.
 *
 * @returns {{sections: object[], layout: object[]}}
 */
function extractSections($) {
  const sections = [];
  const pile = [];
  let layout = null;
  let libres = [];

  const viderLibres = () => {
    if (!libres.length) return;
    sections.push({ id: null, variant: 'libre', eyebrow: '', title: '', blocks: libres });
    libres = [];
  };

  const parcourir = ($parent) => {
    $parent.children().each((i, el) => {
      const $el = $(el);

      if ($el.is(CHROME) || $el.is('.hero')) return;

      // Section, ou bloc d'appel à l'action : même traitement.
      if ($el.is('section, div.cta')) {
        viderLibres();
        if (!layout && !$el.is('div.cta')) layout = [...pile];
        sections.push(sectionToBlocks($, el));
        return;
      }

      // Conteneur de mise en page : on descend au lieu de le figer en HTML.
      if ($el.find('section').length) {
        pile.push({
          tag: el.tagName.toLowerCase(),
          className: $el.attr('class') || null,
          id: $el.attr('id') || null,
        });
        parcourir($el);
        pile.pop();
        return;
      }

      libres.push(...toBlocks($, el));
    });
  };

  parcourir($('body'));
  viderLibres();

  return { sections, layout: layout || [] };
}

/**
 * Navigation, menu mobile et pied de page.
 *
 * Ce markup n'est pas uniforme : les pages ont été produites à des moments
 * différents et le logo, notamment, n'y porte pas les mêmes classes. Plutôt
 * que d'imposer une charpente unique — ce qui casserait la mise en forme de
 * certaines pages — chaque variante est conservée et dédoublonnée par
 * empreinte ; la page référence la sienne.
 *
 * @returns {{nav: string|null, menu: string|null, footer: string|null}} empreintes
 */
function extractChrome($, registry) {
  const enregistrer = (famille, html) => {
    if (!html || !html.trim()) return null;
    const hash = crypto.createHash('sha1').update(html).digest('hex').slice(0, 12);
    if (!registry[famille].has(hash)) registry[famille].set(hash, html);
    return hash;
  };

  return {
    nav: enregistrer('nav', $.html($('nav#nav').first())),
    // Le voile du menu mobile est vide de texte mais indispensable :
    // le script d'ouverture du menu échoue sans lui.
    overlay: enregistrer('overlay', $.html($('#overlay, #menu-overlay').first())),
    menu: enregistrer('menu', $.html($('#menu, #mobile-menu').first())),
    footer: enregistrer('footer', $.html($('footer').first())),
  };
}

/** Lecture structurée du chrome, pour l'édition des menus. */
function chromeStructure($) {
  const $footer = $('footer').first();
  return {
    nav: $('nav#nav')
      .first()
      .find('a')
      .map((i, a) => ({ label: $(a).text().trim().replace(/\s+/g, ' '), href: $(a).attr('href') }))
      .get(),
    mobileMenu: $('#menu, #mobile-menu')
      .first()
      .find('a')
      .map((i, a) => ({ label: $(a).text().trim().replace(/\s+/g, ' '), href: $(a).attr('href') }))
      .get(),
    footer: {
      columns: $footer
        .find('.footer-col')
        .map((i, col) => ({
          title: $(col).find('.footer-col-title, h4, .footer-title, strong').first().text().trim(),
          links: $(col)
            .find('a')
            .map((j, a) => ({ label: $(a).text().trim().replace(/\s+/g, ' '), href: $(a).attr('href') }))
            .get(),
        }))
        .get(),
    },
  };
}

/** Texte visible de la page d'origine, hors navigation et pied de page. */
function originalText($) {
  const $clone = cheerio.load($.html());
  $clone(CHROME).remove();
  return textOf($clone('body').html()).length;
}

/**
 * Représentation stable d'un objet : les clés sont triées, de sorte que deux
 * objets de même contenu donnent la même chaîne quel que soit l'ordre dans
 * lequel leurs propriétés ont été posées.
 */
function texteStable(valeur) {
  if (Array.isArray(valeur)) return `[${valeur.map(texteStable).join(',')}]`;
  if (valeur && typeof valeur === 'object') {
    return `{${Object.keys(valeur)
      .sort()
      .map((cle) => `${JSON.stringify(cle)}:${texteStable(valeur[cle])}`)
      .join(',')}}`;
  }
  return JSON.stringify(valeur) ?? 'null';
}

/** Empreinte du contenu rédactionnel, hors métadonnées d'extraction. */
function empreinteContenu(page) {
  const { _extraction, ...contenu } = page;
  return crypto.createHash('sha1').update(texteStable(contenu)).digest('hex').slice(0, 16);
}

function extractPage(file, registries) {
  const slug = path.basename(file, '.html');
  const raw = fs.readFileSync(path.join(FRONT_DIR, file), 'utf8');

  // Les images base64 deviennent des fichiers avant toute analyse.
  const { html, used } = extractImages(raw, IMG_DIR, IMG_PUBLIC, registries.images);
  const $ = cheerio.load(html, { decodeEntities: false });

  const before = originalText($);
  const style = extractStyle($, CSS_DIR, registries.css);
  const scripts = extractScripts($, JS_DIR, registries.js);

  const page = {
    slug,
    url: ALIASES[slug] || `/${slug}/`,
    template: TEMPLATES[slug] || 'standard',
    style: style ? style.file : null,
    scripts,
    chrome: extractChrome($, registries.chrome),
    images: used,
    seo: extractSeo($),
    hero: extractHero($),
    ...(() => {
      const { sections, layout } = extractSections($);
      return { layout, sections };
    })(),
  };

  for (const name of used) registries.images.get(name).pages.add(slug);
  if (style) registries.css.get(style.file).pages.push(slug);

  const after = textLength(page);
  const stats = blockStats(page);

  const $controle = cheerio.load($.html());
  $controle(CHROME).remove();
  const controle = verifierPage($controle, page);

  return { page, audit: { slug, before, after, ...stats, controle } };
}

function main() {
  if (!fs.existsSync(FRONT_DIR)) {
    console.error(`Dossier introuvable : ${FRONT_DIR}`);
    process.exit(1);
  }
  fs.mkdirSync(CONTENT_DIR, { recursive: true });

  const registries = {
    images: new Map(),
    css: new Map(),
    js: new Map(),
    chrome: { nav: new Map(), overlay: new Map(), menu: new Map(), footer: new Map() },
  };
  const files = fs
    .readdirSync(FRONT_DIR)
    .filter((f) => f.endsWith('.html') && !IGNORED.has(f))
    .sort();

  const audits = [];
  const conservees = [];
  let chrome = null;

  for (const file of files) {
    const { page, audit } = extractPage(file, registries);
    // Empreinte du contenu tel qu'extrait : elle permettra de reconnaître
    // plus tard qu'une page a été modifiée depuis l'administration, et donc
    // que la comparer au fichier d'origine n'a plus de sens.
    page._extraction = { empreinte: empreinteContenu(page), date: new Date().toISOString().slice(0, 10) };

    const cible = path.join(CONTENT_DIR, `${page.slug}.json`);

    // Ne jamais écraser un contenu que l'administration a pu modifier.
    if (fs.existsSync(cible) && !forcer) {
      conservees.push(page.slug);

      // Une page extraite avant l'introduction des empreintes n'en a pas :
      // on lui pose celle de l'extraction fraîche, sans toucher à son
      // contenu. Si celui-ci a déjà été modifié, la différence apparaîtra.
      const existante = JSON.parse(fs.readFileSync(cible, 'utf8'));
      if (!existante._extraction) {
        existante._extraction = page._extraction;
        fs.writeFileSync(cible, `${JSON.stringify(existante, null, 2)}\n`);
      }
    } else {
      fs.writeFileSync(cible, `${JSON.stringify(page, null, 2)}\n`);
    }
    audits.push(audit);

    if (!chrome) {
      const $ = cheerio.load(fs.readFileSync(path.join(FRONT_DIR, file), 'utf8'));
      chrome = { ...chromeStructure($), externalAssets: extractExternalAssets($) };
    }
  }

  const variantes = {
    nav: Object.fromEntries(registries.chrome.nav),
    overlay: Object.fromEntries(registries.chrome.overlay),
    menu: Object.fromEntries(registries.chrome.menu),
    footer: Object.fromEntries(registries.chrome.footer),
  };

  fs.writeFileSync(
    path.join(CONTENT_DIR, '_site.json'),
    `${JSON.stringify(
      { ...chrome, variantes, generatedAt: new Date().toISOString().slice(0, 10) },
      null,
      2
    )}\n`
  );

  const installes = installerPages(CONTENT_DIR);
  printReport(audits, registries);

  if (conservees.length) {
    console.log('');
    console.log(`  ${conservees.length} pages déjà extraites : contenu conservé, rien n'a été écrasé.`);
    console.log('  Pour repartir des fichiers d’origine et perdre les modifications : --forcer');
  }

  if (installes.length) {
    console.log('');
    console.log(`  Pages propres au projet installées : ${installes.join(', ')}`);
  }
}

function printReport(audits, registries) {
  const pct = (a, b) => (b === 0 ? 100 : Math.round((a / b) * 100));

  if (verbose) {
    console.log(`${'PAGE'.padEnd(30)}${'TEXTE'.padStart(8)}${'COUV.'.padStart(7)}${'BLOCS'.padStart(7)}   TYPES`);
    console.log('─'.repeat(88));
    for (const a of audits) {
      const types = Object.entries(a.counts)
        .sort((x, y) => y[1] - x[1])
        .map(([t, n]) => `${t}:${n}`)
        .join(' ');
      const cov = pct(a.after, a.before);
      console.log(
        a.slug.padEnd(30) +
          String(a.before).padStart(8) +
          `${cov}%`.padStart(7) +
          String(a.total).padStart(7) +
          `   ${types}`
      );
    }
    console.log('');
  }

  const before = audits.reduce((n, a) => n + a.before, 0);
  const after = audits.reduce((n, a) => n + a.after, 0);
  const brut = audits.reduce((n, a) => n + a.brut, 0);
  const blocks = audits.reduce((n, a) => n + a.total, 0);

  const types = {};
  for (const a of audits) for (const [t, n] of Object.entries(a.counts)) types[t] = (types[t] || 0) + n;

  const imgBytes = [...registries.images.values()].reduce((n, i) => n + i.bytes, 0);
  const cssBytes = [...registries.css.values()].reduce((n, c) => n + c.bytes, 0);

  console.log(`${audits.length} pages extraites vers content/`);
  console.log('');
  console.log(`  Texte d'origine      ${before.toLocaleString('fr-FR')} caractères`);
  console.log(`  Texte extrait        ${after.toLocaleString('fr-FR')} caractères`);
  console.log(`  Volume comparé       ${pct(after, before)} % (indicatif : les entités faussent le compte)`);
  console.log('');
  console.log(`  Blocs produits       ${blocks}`);
  console.log(
    `  dont HTML libre      ${types.html || 0} blocs (${pct(brut, after)} % du texte) — le reste est en champs structurés`
  );
  console.log('');
  console.log('  Types de blocs :');
  for (const [t, n] of Object.entries(types).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${t.padEnd(10)} ${String(n).padStart(4)}`);
  }
  console.log('');
  console.log(`  Images extraites     ${registries.images.size} fichiers, ${Math.round(imgBytes / 1024)} Ko`);
  console.log(`  Feuilles CSS         ${registries.css.size} fichiers, ${Math.round(cssBytes / 1024)} Ko`);
  const jsBytes = [...registries.js.values()].reduce((n, j) => n + j.bytes, 0);
  console.log(`  Scripts              ${registries.js.size} fichiers, ${Math.round(jsBytes / 1024)} Ko`);
  console.log(
    `  Variantes de chrome  nav ${registries.chrome.nav.size}, menu ${registries.chrome.menu.size}, pied ${registries.chrome.footer.size}`
  );

  console.log('');
  const incompletes = audits.filter((a) => a.controle.perdus > 0);
  if (!incompletes.length) {
    console.log(`  Contrôle de non-perte : aucun fragment perdu sur ${audits.length} pages.`);
  } else {
    const total = incompletes.reduce((n, a) => n + a.controle.caracteres, 0);
    console.log(`  Contrôle de non-perte : ${total.toLocaleString('fr-FR')} caractères absents`);
    for (const a of incompletes) {
      console.log(`    ${a.slug.padEnd(30)} ${a.controle.perdus} fragments (${a.controle.caracteres} car.)`);
      if (verbose) for (const d of a.controle.details.slice(0, 3)) console.log(`        [${d.contexte}] ${d.extrait}`);
    }
    process.exitCode = 1;
  }
}

main();
