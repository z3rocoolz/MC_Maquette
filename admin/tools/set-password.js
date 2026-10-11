#!/usr/bin/env node
'use strict';

/** Définit le mot de passe d'accès à l'administration. */

const readline = require('node:readline');
const { definirMotDePasse } = require('../src/auth');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const demander = (question) =>
  new Promise((resoudre) => {
    // Masque la saisie.
    const sortie = process.stdout;
    rl.question(question, (reponse) => resoudre(reponse));
    rl._writeToOutput = function (chaine) {
      if (chaine.includes(question)) sortie.write(chaine);
      else sortie.write('*');
    };
  });

(async () => {
  const motDePasse = (await demander('Nouveau mot de passe : ')).trim();
  console.log('');

  if (motDePasse.length < 10) {
    console.error('Trop court : 10 caractères au minimum.');
    process.exit(1);
  }

  definirMotDePasse(motDePasse);
  console.log('Mot de passe enregistré dans admin/.auth.json (non versionné).');
  rl.close();
})();
