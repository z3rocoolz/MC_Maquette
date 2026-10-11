#!/usr/bin/env node
'use strict';

const { creerApp } = require('./src/app');
const { motDePasseDefini } = require('./src/auth');

const port = Number.parseInt(process.env.ADMIN_PORT, 10) || 4000;
const hote = process.env.ADMIN_HOST || '127.0.0.1';
const securise = process.env.ADMIN_SECURE === 'true';

const app = creerApp({ securise });

const serveur = app.listen(port, hote, () => {
  console.log(`Administration — http://${hote}:${port}`);
  if (!motDePasseDefini()) {
    console.log('Aucun mot de passe défini. Lancez : npm run admin:password');
  }
  if (hote !== '127.0.0.1') {
    console.log('Attention : écoute ouverte. À ne faire que derrière HTTPS, avec ADMIN_SECURE=true.');
  }
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => serveur.close(() => process.exit(0)));
}
