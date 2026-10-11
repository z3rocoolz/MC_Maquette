'use strict';

/**
 * Ajouts au site qui ne viennent pas des fichiers d'origine.
 *
 * Le chrome (navigation, menu mobile, pied de page) est extrait de `front/` et
 * régénéré à chaque extraction : y écrire directement serait effacé au
 * prochain `npm run extract`. Les ajouts sont donc réappliqués ici, au moment
 * du rendu, sur chaque variante de markup.
 */

const fs = require('node:fs');
const path = require('node:path');
const cheerio = require('cheerio');

const RACINE = path.resolve(__dirname, '..', '..');
const FICHIER_MENU = path.join(RACINE, 'custom', 'menu.json');
const FICHIER_LIENS = path.join(RACINE, 'custom', 'liens.json');
const FICHIER_GALERIE = path.join(RACINE, 'medias', '.avant-apres.json');

/** Adresse générique vers laquelle pointent les pages d'origine. */
const DOCTOLIB_GENERIQUE = 'https://www.doctolib.fr';

function lireNavigation() {
  if (!fs.existsSync(FICHIER_MENU)) return null;
  const donnees = JSON.parse(fs.readFileSync(FICHIER_MENU, 'utf8'));
  const nav = donnees.navigation;
  return nav && nav.harmoniser && Array.isArray(nav.liens) ? nav : null;
}

function lireFilAriane() {
  if (!fs.existsSync(FICHIER_MENU)) return null;
  const donnees = JSON.parse(fs.readFileSync(FICHIER_MENU, 'utf8'));
  return donnees.filAriane || null;
}

/**
 * Fil d'Ariane d'une page, une fois les réglages appliqués.
 *
 * `masquerAccueil` retire la première marche : le logo et le menu mènent déjà
 * à l'accueil, et elle allongeait le fil sans rien apprendre au lecteur.
 * Le réglage est appliqué au rendu, jamais dans le contenu : le fil reste
 * complet dans les fichiers, et l'affichage se règle d'un seul endroit.
 *
 * @param {object[]} fil
 * @returns {object[]}
 */
function filAriane(fil) {
  const reglages = lireFilAriane();
  if (!reglages || !reglages.masquerAccueil || !Array.isArray(fil)) return fil || [];
  return fil.filter((marche) => marche.href !== '/' && marche.label !== 'Accueil');
}

/**
 * En-tête réduit à son titre.
 *
 * Sur les pages d'une rubrique donnée, l'en-tête répétait le fil d'Ariane,
 * une accroche et deux boutons avant d'entrer dans le sujet. Ne garder que le
 * titre raccourcit l'attente du lecteur ; les boutons de rendez-vous restent
 * présents plus bas dans la page.
 *
 * @param {object} hero
 * @returns {object} en-tête, réduit si la page entre dans la règle
 */
/**
 * La règle de réduction s'applique-t-elle à cette page ?
 * Réponse directe, pour que l'administration n'ait pas à la deviner en
 * comparant l'avant et l'après.
 */
function enTeteEstReduit(hero, slug) {
  if (!fs.existsSync(FICHIER_MENU)) return false;

  const reglages = (JSON.parse(fs.readFileSync(FICHIER_MENU, 'utf8')).hero || {}).reduireAuTitre;
  if (!reglages) return false;

  const parRubrique =
    reglages.quandFilPassePar &&
    (hero.breadcrumb || []).some((marche) => marche.href === reglages.quandFilPassePar);
  const parNom = Array.isArray(reglages.pages) && reglages.pages.includes(slug);

  return Boolean(parRubrique || parNom);
}

function heroReduit(hero, slug) {
  if (!fs.existsSync(FICHIER_MENU)) return hero;

  const reglages = (JSON.parse(fs.readFileSync(FICHIER_MENU, 'utf8')).hero || {}).reduireAuTitre;
  if (!reglages) return hero;

  // Deux façons de désigner une page : par la rubrique dont elle dépend, ou
  // nommément — toutes les pages ne se rangent pas sous une même rubrique.
  const parRubrique =
    reglages.quandFilPassePar &&
    (hero.breadcrumb || []).some((marche) => marche.href === reglages.quandFilPassePar);
  const parNom = Array.isArray(reglages.pages) && reglages.pages.includes(slug);

  if (!parRubrique && !parNom) return hero;

  // Sur certaines pages, le titre répète mot pour mot le bandeau du haut.
  // Il est alors retiré de l'affichage mais conservé dans le code : une page
  // sans titre principal se lit mal aux lecteurs d'écran, et Google s'en sert.
  const masquerTitre = Array.isArray(reglages.titreMasqueVisuellement)
    && reglages.titreMasqueVisuellement.includes(slug);

  return {
    ...hero,
    breadcrumb: [],
    eyebrow: reglages.garderSurtitre === false ? '' : hero.eyebrow,
    lead: '',
    buttons: [],
    titreMasque: masquerTitre,
  };
}

function lireEntrees() {
  if (!fs.existsSync(FICHIER_MENU)) return [];
  const donnees = JSON.parse(fs.readFileSync(FICHIER_MENU, 'utf8'));
  return Array.isArray(donnees.entrees) ? donnees.entrees : [];
}

const echapper = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/** Insère un lien dans la barre de navigation, avant le bouton de rendez-vous. */
function ajouterAuNav(html, entree) {
  const $ = cheerio.load(html, null, false);
  const $liens = $('.nav-links').first();
  if (!$liens.length) return html;
  if ($liens.find(`a[href="${entree.url}"]`).length) return html;

  const lien = `<a href="${echapper(entree.url)}">${echapper(entree.libelle)}</a>`;
  const $rdv = $liens.find('.nav-rdv').first();

  if ($rdv.length) $rdv.before(`${lien}\n    `);
  else $liens.append(`\n    ${lien}`);

  return $.html();
}

/** Insère un lien dans le menu mobile, après les entrées simples du haut. */
function ajouterAuMenuMobile(html, entree) {
  const $ = cheerio.load(html, null, false);
  if ($(`a[href="${entree.url}"]`).length) return html;

  const lien = `<a class="mm-a" href="${echapper(entree.url)}">${echapper(entree.libelle)}</a>`;
  const $dernierSimple = $('a.mm-a').last();

  if ($dernierSimple.length) $dernierSimple.after(`\n  ${lien}`);
  else $($.root().children().first()).prepend(`\n  ${lien}`);

  return $.html();
}

/** Ajoute le lien dans une colonne du pied de page. */
function ajouterAuFooter(html, entree) {
  if (!entree.colonneFooter) return html;

  const $ = cheerio.load(html, null, false);
  if ($(`a[href="${entree.url}"]`).length) return html;

  // La colonne peut être désignée par son titre ou par son rang. Le rang est
  // plus sûr ici : la colonne du milieu s'appelle « Spécialités », « Visage »,
  // « Chirurgie du Visage » ou « Chirurgie & Médecine » selon les pages.
  const $colonnes = $('.footer-col');
  const $colonne =
    typeof entree.colonneFooter === 'number'
      ? $colonnes.eq(entree.colonneFooter - 1)
      : $colonnes
          .filter((i, el) => $(el).find('.footer-col-title, h4').first().text().trim() === entree.colonneFooter)
          .first();
  if (!$colonne.length) return html;

  const $liste = $colonne.find('ul').first();
  const lien = `<a href="${echapper(entree.url)}">${echapper(entree.libelle)}</a>`;

  if ($liste.length) $liste.append(`<li>${lien}</li>`);
  else $colonne.append(lien);

  return $.html();
}

/**
 * Impose la même barre de navigation à toutes les pages.
 *
 * Le site en comptait dix-sept versions : chacune mettait en avant la rubrique
 * de sa propre page, si bien que les entrées changeaient d'une page à l'autre.
 * Seuls les liens sont remplacés — le bloc logo et le bouton du menu mobile
 * restent ceux de la page, car la moitié des feuilles de style ne connaissent
 * que `.nav-logo` et l'autre moitié que `.logo-wrap` : uniformiser ce markup
 * laisserait la moitié du site sans logo.
 *
 * @returns {{variantes: number, liens: number}}
 */
function harmoniserNavigation(site) {
  const navigation = lireNavigation();
  if (!navigation || !site.variantes || !site.variantes.nav) return { variantes: 0, liens: 0 };

  const bouton = navigation.bouton;
  let variantes = 0;

  for (const [empreinte, html] of Object.entries(site.variantes.nav)) {
    const $ = cheerio.load(html, null, false);
    const $liens = $('.nav-links').first();
    if (!$liens.length) continue;

    const rendus = navigation.liens.map(
      (l) => `    <a href="${echapper(l.url)}">${echapper(l.libelle)}</a>`
    );

    if (bouton) {
      const attributs = bouton.externe ? ' target="_blank" rel="noopener"' : '';
      rendus.push(
        `    <a href="${echapper(bouton.url)}"${attributs} class="${echapper(bouton.classe || 'nav-rdv')}">${echapper(bouton.libelle)}</a>`
      );
    }

    $liens.empty().append(`\n${rendus.join('\n')}\n  `);
    site.variantes.nav[empreinte] = $.html();
    variantes += 1;
  }

  return { variantes, liens: navigation.liens.length + (bouton ? 1 : 0) };
}

/**
 * Lien toujours visible dans le bandeau, posé après le logo.
 *
 * La barre horizontale ayant cédé la place au seul bouton à trois traits,
 * plus aucun accès à la prise de rendez-vous n'était visible sans ouvrir le
 * menu. Ce lien rétablit un chemin direct.
 *
 * @returns {number} variantes modifiées
 */
function ajouterLienPermanent(site) {
  const navigation = lireNavigation();
  const lien = navigation && navigation.lienPermanent;
  if (!lien || !site.variantes || !site.variantes.nav) return 0;

  // « doctolib » renvoie à l'adresse centralisée : une seule valeur à tenir
  // à jour, celle de la fiche du praticien.
  const doctolib = lireLiens();
  const url = lien.url === 'doctolib' ? doctolib && (doctolib.fiche || null) : lien.url;
  if (!url) return 0;

  let modifiees = 0;

  for (const [empreinte, html] of Object.entries(site.variantes.nav)) {
    const $ = cheerio.load(html, null, false);
    if ($(`.${lien.classe || 'nav-doctolib'}`).length) continue;

    const $logo = $('nav#nav').children().first();
    const cible = $logo.length ? $logo : $($.root().children().first()).children().first();
    if (!cible.length) continue;

    const externe = /^https?:/.test(url);
    const attributs = externe ? ' target="_blank" rel="noopener"' : '';
    const contenu = lien.image
      ? `<img src="${echapper(lien.image)}" alt="${echapper(lien.libelle)}" loading="lazy">`
      : echapper(lien.libelle);
    cible.after(
      `\n  <a class="${echapper(lien.classe || 'nav-doctolib')}" href="${echapper(url)}"${attributs}>${contenu}</a>`
    );

    site.variantes.nav[empreinte] = $.html();
    modifiees += 1;
  }

  return modifiees;
}

/**
 * Retire de la barre l'entrée qui mène à la page affichée.
 *
 * Proposer un lien vers la page qu'on lit déjà n'aide personne, et la barre
 * y gagne une entrée de largeur. Le traitement se fait au rendu de chaque
 * page : les variantes de chrome sont partagées, les modifier directement
 * priverait du lien toutes les pages qui s'appuient sur la même.
 *
 * @param {string} html  barre de navigation
 * @param {string} url   adresse de la page rendue
 * @returns {string}
 */
function retirerLienCourant(html, url, portee = '.nav-links') {
  const navigation = lireNavigation();
  if (!navigation || !navigation.masquerPageCourante || !url) return html;

  const $ = cheerio.load(html, null, false);

  // Chaque conteneur reçoit sa propre clause : concaténer une portée qui
  // contient déjà une virgule (« #menu, #mobile-menu ») produirait
  // « #menu, #mobile-menu a[href=…] », dont la première moitié désigne le
  // panneau entier — qui serait alors supprimé.
  const selecteur = portee
    .split(',')
    .map((p) => `${p.trim()} a[href="${url}"]`)
    .join(', ');

  const $liens = $(selecteur).not('.nav-rdv, .mm-btn');
  if (!$liens.length) return html;

  $liens.remove();
  return $.html();
}

/**
 * Applique les ajouts à toutes les variantes de chrome.
 *
 * @param {object} site  contenu de `_site.json`, modifié en place
 * @returns {{entrees: number, variantes: number}}
 */
function appliquerMenu(site) {
  const entrees = lireEntrees();
  if (!entrees.length || !site.variantes) return { entrees: 0, variantes: 0 };

  let touchees = 0;

  // Quand la barre est harmonisée, elle contient déjà toutes les entrées :
  // les rajouter ferait doublon.
  const navHarmonisee = Boolean(lireNavigation());

  for (const entree of entrees) {
    if (entree.nav !== false && !navHarmonisee) {
      for (const [empreinte, html] of Object.entries(site.variantes.nav || {})) {
        const modifie = ajouterAuNav(html, entree);
        if (modifie !== html) touchees += 1;
        site.variantes.nav[empreinte] = modifie;
      }
    }
    if (entree.menuMobile !== false) {
      for (const [empreinte, html] of Object.entries(site.variantes.menu || {})) {
        const modifie = ajouterAuMenuMobile(html, entree);
        if (modifie !== html) touchees += 1;
        site.variantes.menu[empreinte] = modifie;
      }
    }
    if (entree.colonneFooter) {
      for (const [empreinte, html] of Object.entries(site.variantes.footer || {})) {
        const modifie = ajouterAuFooter(html, entree);
        if (modifie !== html) touchees += 1;
        site.variantes.footer[empreinte] = modifie;
      }
    }
  }

  // La version structurée sert à l'affichage dans l'administration.
  for (const entree of entrees) {
    if (entree.nav !== false && !(site.nav || []).some((l) => l.href === entree.url)) {
      site.nav = [...(site.nav || []), { label: entree.libelle, href: entree.url }];
    }
  }

  return { entrees: entrees.length, variantes: touchees };
}

/**
 * Installe les pages propres au projet, absentes de `front/`.
 *
 * Le modele n'est copie que si la page n'existe pas encore : une fois creee,
 * elle appartient a l'administration et ne doit jamais etre ecrasee par une
 * reextraction.
 *
 * @param {string} dossierContenu
 * @returns {string[]} slugs installes a cet appel
 */
function installerPages(dossierContenu) {
  const modeles = path.join(RACINE, 'custom', 'modeles');
  if (!fs.existsSync(modeles)) return [];

  const installes = [];
  for (const fichier of fs.readdirSync(modeles).filter((f) => f.endsWith('.json'))) {
    const cible = path.join(dossierContenu, fichier);
    if (fs.existsSync(cible)) continue;
    fs.copyFileSync(path.join(modeles, fichier), cible);
    installes.push(path.basename(fichier, '.json'));
  }
  return installes;
}

/**
 * Photo affichée sous le bandeau, sur la page d'accueil.
 *
 * Le fichier vit dans `medias/` et se remplace depuis l'administration : ni
 * le contenu ni le code n'ont à être touchés pour changer de portrait.
 *
 * @returns {{fichier: string, alt: string, taille: number}|null}
 */
function photoAccueil() {
  if (!fs.existsSync(FICHIER_MENU)) return null;

  const accueil = JSON.parse(fs.readFileSync(FICHIER_MENU, 'utf8')).accueil;
  const photo = accueil && accueil.photo;
  if (!photo || !photo.fichier) return null;

  if (!fs.existsSync(path.join(RACINE, 'medias', photo.fichier))) return null;

  return { fichier: photo.fichier, alt: photo.alt || '', taille: photo.taille || 200 };
}

/* ─── Galerie avant/après ────────────────────────────────────────── */

/**
 * Entrées de la galerie avant/après, telles qu'enregistrées depuis
 * l'administration. Chaque entrée porte deux fichiers, posés dans `medias/`
 * comme la photo d'accueil : ni l'un ni l'autre n'est écrasé par une
 * réextraction.
 *
 * @returns {{id: string, avant: string, apres: string, legende: string}[]}
 */
function galerieAvantApres() {
  if (!fs.existsSync(FICHIER_GALERIE)) return [];
  try {
    const donnees = JSON.parse(fs.readFileSync(FICHIER_GALERIE, 'utf8'));
    return Array.isArray(donnees.entrees) ? donnees.entrees : [];
  } catch {
    return [];
  }
}

/* ─── Adresses externes ─────────────────────────────────────────── */

function lireLiens() {
  if (!fs.existsSync(FICHIER_LIENS)) return null;
  const donnees = JSON.parse(fs.readFileSync(FICHIER_LIENS, 'utf8'));
  const doctolib = donnees.doctolib || {};
  if (!doctolib.fiche && !Object.values(doctolib.parVille || {}).some(Boolean)) return null;
  return doctolib;
}

/**
 * Adresse à utiliser pour un bouton donné.
 *
 * Certains libellés nomment la ville (« Prendre rendez-vous à Nice ») : si un
 * agenda propre à ce cabinet est renseigné, il prime sur la fiche générale.
 */
function adresseDoctolib(doctolib, libelle = '') {
  for (const [ville, adresse] of Object.entries(doctolib.parVille || {})) {
    if (adresse && new RegExp(ville, 'i').test(libelle)) return adresse;
  }
  return doctolib.fiche || null;
}

/** Remplace l'adresse générique dans un fragment de HTML. */
function remplacerDansHtml(html, doctolib) {
  if (!html) return html;
  const $ = cheerio.load(html, null, false);
  let change = false;

  $(`a[href="${DOCTOLIB_GENERIQUE}"], a[href="${DOCTOLIB_GENERIQUE}/"]`).each((i, el) => {
    const adresse = adresseDoctolib(doctolib, $(el).text());
    if (!adresse) return;
    $(el).attr('href', adresse);
    change = true;
  });

  return change ? $.html() : html;
}

/**
 * Pointe les liens de prise de rendez-vous vers la fiche du praticien.
 *
 * Les pages d'origine renvoient toutes vers l'accueil de Doctolib : le patient
 * doit y rechercher le praticien lui-même. Les 111 liens sont réécrits ici, au
 * rendu, depuis une seule valeur.
 *
 * @returns {{configure: boolean, liens: number}}
 */
function appliquerLiens(page, site) {
  const doctolib = lireLiens();
  if (!doctolib) return { configure: false, liens: 0 };

  let liens = 0;

  const traiterBouton = (bouton) => {
    if (!bouton || bouton.href !== DOCTOLIB_GENERIQUE) return;
    const adresse = adresseDoctolib(doctolib, bouton.label || '');
    if (!adresse) return;
    bouton.href = adresse;
    liens += 1;
  };

  /**
   * Parcourt tout l'objet : les liens de rendez-vous se logent aussi bien dans
   * un bouton structuré que dans un fragment de HTML conservé tel quel — le
   * hero de l'accueil, une carte de cabinet, la barre latérale du guide.
   */
  const parcourirTout = (valeur) => {
    if (!valeur || typeof valeur !== 'object') return;

    if (Array.isArray(valeur)) {
      valeur.forEach(parcourirTout);
      return;
    }

    if (typeof valeur.href === 'string') traiterBouton(valeur);

    for (const cle of ['html', 'raw', 'extra']) {
      if (typeof valeur[cle] !== 'string') continue;
      const neuf = remplacerDansHtml(valeur[cle], doctolib);
      if (neuf !== valeur[cle]) {
        valeur[cle] = neuf;
        liens += 1;
      }
    }

    for (const [cle, enfant] of Object.entries(valeur)) {
      if (cle === 'html' || cle === 'raw' || cle === 'extra') continue;
      parcourirTout(enfant);
    }
  };

  parcourirTout(page.hero);
  parcourirTout(page.sections);

  // Le chrome est partagé : on ne le traite qu'une fois.
  if (site && !site._liensAppliques) {
    for (const famille of ['nav', 'menu', 'footer']) {
      for (const [empreinte, html] of Object.entries((site.variantes || {})[famille] || {})) {
        const neuf = remplacerDansHtml(html, doctolib);
        if (neuf !== html) liens += 1;
        site.variantes[famille][empreinte] = neuf;
      }
    }
    site._liensAppliques = true;
  }

  return { configure: true, liens };
}

module.exports = {
  appliquerLiens,
  echapper,
  appliquerMenu,
  ajouterLienPermanent,
  harmoniserNavigation,
  installerPages,
  lireEntrees,
  lireLiens,
  enTeteEstReduit,
  filAriane,
  galerieAvantApres,
  heroReduit,
  photoAccueil,
  lireNavigation,
  retirerLienCourant,
};
