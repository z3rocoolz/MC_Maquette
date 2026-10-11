'use strict';

const express = require('express');
const fs = require('node:fs');
const path = require('node:path');

const auth = require('./auth');
const { enregistrerPage, libelleDePage, lirePage, listerPages, restaurer, versions } = require('./content');
const { champsDeLaPage, ecrireChemin, lireChemin } = require('./formulaire');
const { assainir, lienSimple, texteSimple } = require('./assainir');
const { regenerer, regenererTout, DIST } = require('./build');
const parametres = require('./parametres');
const photo = require('./photo');
const avantApres = require('./avantApres');
const { pageConnexion, pageEdition, pageGalerie, pageJetonExpire, pageListe, pageParametres } = require('./vues');

/** Balises de structure qu'un champ de texte peut légitimement contenir. */
const STRUCTURE_PRESENTE = /<(div|ul|ol|li|table|h[2-6]|figure|blockquote|section)\b/i;

/**
 * Filtre une valeur reçue selon la nature de son champ.
 *
 * Le profil dépend de ce que le champ contenait déjà : certains textes
 * enveloppent un encadré (`note-med`) ou une liste (`ul.liste`), et les
 * réduire au jeu de balises minimal les ferait disparaître à la première
 * modification de la page.
 */
function epurer(cle, valeur, type, valeurActuelle) {
  if (/\.(link|href)$/.test(cle)) return lienSimple(valeur);
  if (type === 'code') return assainir(valeur, 'structure');
  if (type === 'riche') {
    return assainir(valeur, STRUCTURE_PRESENTE.test(valeurActuelle || '') ? 'structure' : 'riche');
  }
  return texteSimple(valeur);
}

/** Fichiers dont dépend le rendu : s'ils changent, le serveur doit redémarrer. */
const SOURCES_DU_RENDU = [
  '../../tools/lib/templates/page.js',
  '../../tools/lib/templates/refonte.js',
  '../../tools/lib/refonte-build.js',
  '../../tools/lib/templates/blocks.js',
  '../../tools/lib/personnalisation.js',
  '../../tools/lib/diff.js',
  './build.js',
];

const DEMARRAGE = Date.now();

/**
 * Node charge les modules une seule fois : après une modification du code de
 * rendu, un serveur déjà lancé continue d'appliquer l'ancienne logique et
 * défait en silence ce que la ligne de commande vient de produire. On le
 * signale plutôt que de laisser le doute.
 *
 * @returns {string[]} fichiers plus récents que le démarrage
 */
function sourcesPerimees() {
  return SOURCES_DU_RENDU.filter((relatif) => {
    try {
      return fs.statSync(path.join(__dirname, relatif)).mtimeMs > DEMARRAGE;
    } catch {
      return false;
    }
  }).map((relatif) => path.basename(relatif));
}

function creerApp({ securise = false } = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.urlencoded({ extended: false, limit: '2mb' }));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Journal minimal : sans trace, impossible de savoir si un enregistrement a
  // abouti ou s'est heurté à une session expirée.
  app.use((req, res, suite) => {
    if (req.method === 'GET') return suite();
    const debut = Date.now();
    res.on('finish', () => {
      console.log(`[admin] ${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - debut} ms)`);
    });
    suite();
  });

  // L'administration ne doit jamais être indexée ni encadrée.
  app.use((req, res, suite) => {
    res.set('X-Robots-Tag', 'noindex, nofollow');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'same-origin');
    suite();
  });

  /* ─── Connexion ─────────────────────────────────────────────── */

  app.get('/connexion', (req, res) => {
    if (auth.session(req)) return res.redirect('/');
    if (!auth.motDePasseDefini()) {
      return res.status(503).send('Aucun mot de passe défini. Lancez : npm run admin:password');
    }
    res.send(pageConnexion({}));
  });

  app.post('/connexion', (req, res) => {
    const adresse = req.ip;

    if (auth.bloque(adresse)) {
      return res.status(429).send(pageConnexion({ erreur: 'Trop de tentatives. Réessayez dans un quart d’heure.' }));
    }
    if (!auth.verifierMotDePasse(String(req.body.motdepasse || ''))) {
      auth.noterEchec(adresse);
      return res.status(401).send(pageConnexion({ erreur: 'Mot de passe incorrect.' }));
    }

    auth.oublierEchecs(adresse);
    auth.ouvrirSession(res, securise);
    res.redirect('/');
  });

  app.post('/deconnexion', auth.exigerSession, auth.verifierJeton, (req, res) => {
    if (req.jetonInvalide) return res.redirect('/');
    auth.fermerSession(req, res);
    res.redirect('/connexion');
  });

  /**
   * Jeton expiré sur une écriture : plutôt qu'une page d'erreur qui perdrait
   * le texte, on le réaffiche dans un formulaire prêt à être renvoyé.
   */
  const recupererSiJetonExpire = (req, res, suite) => {
    if (!req.jetonInvalide) return suite();
    console.warn(`[admin] jeton expiré sur ${req.originalUrl} — saisie proposée à la confirmation`);
    res.status(409).send(
      pageJetonExpire({ session: req.session, action: req.originalUrl, valeurs: req.body })
    );
  };

  /* ─── Pages ─────────────────────────────────────────────────── */

  app.get('/', auth.exigerSession, (req, res) => {
    res.send(
      pageListe({
        pages: listerPages(),
        session: req.session,
        message: req.query.message,
        perimees: sourcesPerimees(),
      })
    );
  });

  app.get('/page/:slug', auth.exigerSession, (req, res, suite) => {
    try {
      const page = lirePage(req.params.slug);
      res.send(
        pageEdition({
          page,
          session: req.session,
          message: req.query.message,
          versions: versions(req.params.slug),
          libelle: libelleDePage(page.url),
        })
      );
    } catch (erreur) {
      suite(erreur);
    }
  });

  app.post('/page/:slug', auth.exigerSession, auth.verifierJeton, recupererSiJetonExpire, (req, res, suite) => {
    try {
      const { slug } = req.params;
      const page = lirePage(slug);

      // Seuls les chemins que le formulaire propose sont acceptés : une clé
      // forgée depuis le navigateur ne peut pas atteindre la structure.
      const champs = champsDeLaPage(page);
      const typeDuChamp = new Map(champs.map((c) => [c.cle, c.type]));
      let modifies = 0;

      for (const [cle, brut] of Object.entries(req.body)) {
        if (cle === 'csrf' || !typeDuChamp.has(cle)) continue;

        // Le contenu est filtré ici, et non dans le navigateur : c'est la
        // seule barrière qu'une requête forgée ne puisse pas contourner.
        const valeur = epurer(cle, String(brut), typeDuChamp.get(cle), lireChemin(page, cle));
        if (ecrireChemin(page, cle, valeur)) modifies += 1;
      }

      enregistrerPage(slug, page);

      // Tout le site est reconstruit, pas seulement la page modifiée : les
      // menus, le pied de page et les liens de rendez-vous sont partagés, et
      // une régénération partielle laisserait le reste du site en retard.
      // Vingt-sept pages prennent moins d'une seconde.
      const debut = Date.now();
      const { pages, fichiersDeSortie } = regenererTout();
      const { ecarts } = regenerer(slug);
      const duree = Date.now() - debut;

      res.send(
        pageEdition({
          page: lirePage(slug),
          session: req.session,
          libelle: libelleDePage(page.url),
          message:
            `Enregistré — ${modifies} champs mis à jour, ${pages} pages régénérées` +
            `${fichiersDeSortie ? ' et sitemap mis à jour' : ''} (${duree} ms).`,
          ecarts,
          versions: versions(slug),
        })
      );
    } catch (erreur) {
      suite(erreur);
    }
  });

  app.post('/page/:slug/restaurer', auth.exigerSession, auth.verifierJeton, recupererSiJetonExpire, (req, res, suite) => {
    try {
      const { slug } = req.params;
      restaurer(slug, String(req.body.fichier || ''));
      const { pages } = regenererTout();
      res.redirect(
        `/page/${slug}?message=${encodeURIComponent(`Version restaurée — ${pages} pages régénérées.`)}`
      );
    } catch (erreur) {
      suite(erreur);
    }
  });

  /* ─── Galerie avant/après ──────────────────────────────────── */

  app.get('/galerie', auth.exigerSession, (req, res) => {
    res.send(
      pageGalerie({
        entrees: avantApres.lire(),
        session: req.session,
        message: req.query.message,
      })
    );
  });

  app.post('/galerie', auth.exigerSession, (req, res, suite) => {
    avantApres.reception(req, res, (erreurReception) => {
      if (erreurReception) {
        return res.status(400).send(
          pageGalerie({ entrees: avantApres.lire(), session: req.session, erreurs: [erreurReception.message] })
        );
      }

      if (!req.session || req.body.csrf !== req.session.csrf) {
        return res.status(409).send(
          pageGalerie({
            entrees: avantApres.lire(),
            session: req.session,
            erreurs: ['Session expirée : rechargez la page et recommencez.'],
          })
        );
      }

      try {
        const fichiers = req.files || {};
        const { erreurs } = avantApres.ajouter({
          avant: fichiers.avant && fichiers.avant[0],
          apres: fichiers.apres && fichiers.apres[0],
          legende: req.body.legende,
        });
        if (erreurs.length) {
          return res.status(400).send(pageGalerie({ entrees: avantApres.lire(), session: req.session, erreurs }));
        }

        const { pages } = regenererTout();
        res.redirect(`/galerie?message=${encodeURIComponent(`Cas ajouté — ${pages} pages régénérées.`)}`);
      } catch (erreur) {
        suite(erreur);
      }
    });
  });

  app.post('/galerie/:id/supprimer', auth.exigerSession, auth.verifierJeton, recupererSiJetonExpire, (req, res, suite) => {
    try {
      avantApres.supprimer(req.params.id);
      const { pages } = regenererTout();
      res.redirect(`/galerie?message=${encodeURIComponent(`Cas supprimé — ${pages} pages régénérées.`)}`);
    } catch (erreur) {
      suite(erreur);
    }
  });

  app.post('/galerie/:id/legende', auth.exigerSession, auth.verifierJeton, recupererSiJetonExpire, (req, res, suite) => {
    try {
      const { erreurs, id } = avantApres.modifier(req.params.id, { legende: req.body.legende });
      if (erreurs.length || !id) {
        return res.status(400).send(
          pageGalerie({ entrees: avantApres.lire(), session: req.session, erreurs })
        );
      }
      const { pages } = regenererTout();
      res.redirect(`/galerie?message=${encodeURIComponent(`Texte enregistré — ${pages} pages régénérées.`)}`);
    } catch (erreur) {
      suite(erreur);
    }
  });

  /* ─── Réglages ──────────────────────────────────────────────── */

  app.get('/parametres', auth.exigerSession, (req, res) => {
    res.send(
      pageParametres({
        liens: parametres.lire(),
        photo: photo.lire(),
        session: req.session,
        message: req.query.message,
      })
    );
  });

  // Les médias sont servis à l'administration pour l'aperçu.
  app.use('/medias', auth.exigerSession, express.static(path.join(__dirname, '..', '..', 'medias')));

  app.post('/parametres/photo', auth.exigerSession, (req, res, suite) => {
    photo.reception(req, res, (erreurReception) => {
      if (erreurReception) {
        return res.status(400).send(
          pageParametres({
            liens: parametres.lire(),
            photo: photo.lire(),
            session: req.session,
            erreurs: [erreurReception.message],
          })
        );
      }

      if (!req.session || req.body.csrf !== req.session.csrf) {
        return res.status(409).send(
          pageParametres({
            liens: parametres.lire(),
            photo: photo.lire(),
            session: req.session,
            erreurs: ['Session expirée : rechargez la page et recommencez.'],
          })
        );
      }

      try {
        const { erreurs } = photo.enregistrer({
          fichier: req.file,
          alt: req.body.alt,
          taille: req.body.taille,
        });
        if (erreurs.length) {
          return res.status(400).send(
            pageParametres({ liens: parametres.lire(), photo: photo.lire(), session: req.session, erreurs })
          );
        }

        const { pages } = regenererTout();
        res.redirect(
          `/parametres?message=${encodeURIComponent(`Photo enregistrée — ${pages} pages régénérées.`)}`
        );
      } catch (erreur) {
        suite(erreur);
      }
    });
  });

  app.post('/parametres', auth.exigerSession, auth.verifierJeton, recupererSiJetonExpire, (req, res, suite) => {
    try {
      const villes = {};
      for (const [cle, valeur] of Object.entries(req.body)) {
        if (cle.startsWith('ville_')) villes[cle.slice('ville_'.length)] = valeur;
      }

      const { erreurs } = parametres.enregistrer({ fiche: req.body.fiche, villes });
      if (erreurs.length) {
        return res.status(400).send(
          pageParametres({ liens: parametres.lire(), session: req.session, erreurs })
        );
      }

      // Un réglage global touche toutes les pages : on les reconstruit toutes.
      const { pages } = regenererTout();
      res.redirect(`/parametres?message=${encodeURIComponent(`Enregistré — ${pages} pages régénérées.`)}`);
    } catch (erreur) {
      suite(erreur);
    }
  });

  /* ─── Aperçu ────────────────────────────────────────────────── */

  app.get('/apercu/:slug', auth.exigerSession, (req, res, suite) => {
    try {
      const { slug } = req.params;
      const fichier = path.join(DIST, `${path.basename(slug)}.html`);
      if (!fs.existsSync(fichier)) regenerer(slug);
      res.redirect('/apercu-site/' + path.basename(fichier));
    } catch (erreur) {
      suite(erreur);
    }
  });

  // L'aperçu conserve une vraie base d'URL pour les liens et les ressources.
  app.use('/apercu-site', auth.exigerSession, express.static(DIST, {dotfiles:'ignore'}));

  // Les fichiers régénérés, pour que l'aperçu affiche styles et images.
  app.use('/assets', express.static(path.join(DIST, 'assets')));

  app.use((req, res) => res.status(404).send('Page inconnue'));

  app.use((erreur, req, res, suite) => {
    console.error(`[admin] ${req.method} ${req.originalUrl}`, erreur);
    res.status(500).send(`Erreur : ${erreur.message}`);
  });

  return app;
}

module.exports = { creerApp };
