#!/usr/bin/env node
'use strict';

/**
 * Prévisualisation locale du site régénéré.
 *
 * Sert `dist/` avec exactement les mêmes adresses qu'en production : URL
 * propres, redirections permanentes, page d'erreur. C'est le site tel que les
 * visiteurs le verront, à l'hébergement près.
 *
 *   node tools/serve.js [--port 5000]
 */

const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const {fileFor} = require('./lib/templates/refonte');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const CONTENT = path.join(ROOT, 'content');

const argPort = process.argv.indexOf('--port');

/**
 * 4173 par defaut, et non 5000 : sur macOS, le recepteur AirPlay du Centre de
 * controle ecoute deja sur 5000 et repond 403 a la place du serveur.
 */
const PORT_DEMANDE = Number.parseInt(argPort > -1 ? process.argv[argPort + 1] : process.env.PORT, 10) || 4173;

/** Table « URL publique -> fichier », lue dans le contenu extrait. */
function catalogue() {
  const table = new Map();
  for (const fichier of fs.readdirSync(CONTENT).filter((f) => f.endsWith('.json') && !f.startsWith('_') && !f.startsWith('.'))) {
    const page = JSON.parse(fs.readFileSync(path.join(CONTENT, fichier), 'utf8'));
    table.set(page.url, fileFor(page));
  }
  return table;
}

function main() {
  if (!fs.existsSync(DIST)) {
    console.error('dist/ est absent. Lancez d’abord : npm run build');
    process.exit(1);
  }

  const pages = catalogue();
  const app = express();

  app.disable('x-powered-by');
  app.set('etag', 'strong');

  app.get('*', (req, res, suite) => {
    let chemin;
    try {
      chemin = decodeURIComponent(req.path);
    } catch {
      return suite();
    }

    if (chemin === '/') return res.sendFile(path.join(DIST, 'index.html'));
    // Les pages HTML restent canoniques : leurs ressources sont relatives.
    const fichier = pages.get(chemin) || pages.get(chemin + '/');
    if (fichier) return res.redirect(301, '/' + fichier);
    if (chemin === '/index') return res.redirect(301, '/');

    suite();
  });

  app.use(express.static(DIST, { index: false, dotfiles: 'ignore' }));

  app.use((req, res) => {
    const erreur = path.join(DIST, '404.html');
    res.status(404);
    if (fs.existsSync(erreur)) return res.sendFile(erreur);
    res.type('text/plain').send('404 — Page introuvable');
  });

  ecouter(app, PORT_DEMANDE, pages.size);
}

/** Ecoute sur le premier port libre a partir de celui demande. */
function ecouter(app, port, nombrePages, essais = 0) {
  const serveur = app.listen(port, '127.0.0.1');

  serveur.on('listening', () => {
    console.log('');
    console.log(`  Site en previsualisation :  http://localhost:${port}`);
    console.log(`  ${nombrePages} pages servies depuis dist/`);
    if (port !== PORT_DEMANDE) console.log(`  (le port ${PORT_DEMANDE} etait occupe)`);
    console.log('');
    console.log('  Quelques adresses :');
    console.log(`    http://localhost:${port}/`);
    console.log(`    http://localhost:${port}/rhinoplastie/`);
    console.log(`    http://localhost:${port}/prix-rhinoplastie/`);
    console.log('');
    console.log('  Ctrl-C pour arreter.');
    console.log('');
  });

  serveur.on('error', (erreur) => {
    if (erreur.code === 'EADDRINUSE' && essais < 10) {
      ecouter(app, port + 1, nombrePages, essais + 1);
      return;
    }
    console.error(`Impossible d'ecouter sur le port ${port} : ${erreur.message}`);
    process.exit(1);
  });

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => serveur.close(() => process.exit(0)));
  }
}

main();
