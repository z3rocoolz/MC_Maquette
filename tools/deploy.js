#!/usr/bin/env node
'use strict';

/**
 * Publication du site sur l'hébergement.
 *
 * L'administration tourne sur le poste de travail, jamais sur le serveur :
 * seules les pages statiques partent en ligne. Rien de ce qui édite le site
 * n'est exposé, et le serveur n'a besoin ni de Node, ni de base de données.
 *
 *   npm run deploy            publie
 *   npm run deploy -- --essai  montre ce qui serait envoyé, sans rien envoyer
 *
 * Configuration dans .env :
 *   DEPLOY_HOTE, DEPLOY_UTILISATEUR, DEPLOY_CHEMIN, DEPLOY_PORT (défaut 22)
 */

const { execFileSync, execFileSync: exec } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

require('dotenv').config();

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const essai = process.argv.includes('--essai') || process.argv.includes('--dry-run');
const config = {
  hote: process.env.DEPLOY_HOTE,
  utilisateur: process.env.DEPLOY_UTILISATEUR,
  chemin: process.env.DEPLOY_CHEMIN,
  port: process.env.DEPLOY_PORT || '22',
  site: (process.env.SITE_URL || 'https://www.drmattiacoda.fr').replace(/\/+$/, ''),
};

function verifierConfiguration() {
  const manquants = ['hote', 'utilisateur', 'chemin'].filter((c) => !config[c]);
  if (!manquants.length) return;

  console.error('Configuration de publication incomplète.');
  console.error(`Manque : ${manquants.map((m) => `DEPLOY_${m.toUpperCase()}`).join(', ')}`);
  console.error('');
  console.error('Renseignez-les dans newrelease/.env — voir .env.example.');
  process.exit(1);
}

/** Les contrôles d'avant mise en ligne doivent passer : on ne publie rien de douteux. */
function controler() {
  console.log('Contrôles avant publication…');
  try {
    execFileSync('node', [path.join(__dirname, 'preflight.js')], { stdio: 'inherit', cwd: ROOT });
  } catch {
    console.error('');
    console.error('Publication annulée : les contrôles ont échoué.');
    process.exit(1);
  }
}

function publier() {
  const cible = `${config.utilisateur}@${config.hote}:${config.chemin.replace(/\/*$/, '/')}`;

  const options = [
    '-rlptz',
    '--delete',
    // Ce qui appartient au serveur et ne doit jamais être écrasé.
    '--exclude=.well-known/',
    '--exclude=cgi-bin/',
    '--exclude=.htpasswd',
    '--itemize-changes',
    '--human-readable',
    '-e',
    `ssh -p ${config.port}`,
    `${DIST}/`,
    cible,
  ];
  if (essai) options.unshift('--dry-run');

  console.log('');
  console.log(`${essai ? 'Simulation' : 'Envoi'} vers ${cible}`);
  console.log('');

  try {
    execFileSync('rsync', options, { stdio: 'inherit' });
  } catch (erreur) {
    console.error('');
    console.error(`Échec de la synchronisation (code ${erreur.status}).`);
    console.error('Vérifiez l’accès SSH : ssh -p ' + config.port + ' ' + config.utilisateur + '@' + config.hote);
    process.exit(1);
  }
}

/** Après publication, on vérifie que le site répond réellement. */
function verifierEnLigne() {
  const adresses = ['/', '/rhinoplastie.html', '/rhinoplastie-nice.html', '/sitemap.xml'];
  console.log('');
  console.log('Vérification en ligne :');

  let echecs = 0;
  for (const adresse of adresses) {
    const url = `${config.site}${adresse}`;
    try {
      const code = execFileSync('curl', ['-s', '-o', '/dev/null', '-m', '15', '-w', '%{http_code}', url], {
        encoding: 'utf8',
      }).trim();
      const ok = code === '200';
      if (!ok) echecs += 1;
      console.log(`  ${ok ? 'ok  ' : '    '}${adresse.padEnd(24)} ${code}`);
    } catch {
      echecs += 1;
      console.log(`      ${adresse.padEnd(24)} injoignable`);
    }
  }

  if (echecs) {
    console.log('');
    console.log(`  ${echecs} adresses ne répondent pas encore. Le certificat HTTPS est-il actif ?`);
    process.exitCode = 1;
  }
}

function main() {
  if (!fs.existsSync(DIST)) {
    console.error('dist/ est absent. Lancez : npm run release');
    process.exit(1);
  }
  verifierConfiguration();
  controler();
  publier();

  if (essai) {
    console.log('');
    console.log('Simulation terminée — rien n’a été envoyé.');
    return;
  }
  verifierEnLigne();

  console.log('');
  console.log(`Site publié : ${config.site}`);
}

main();
