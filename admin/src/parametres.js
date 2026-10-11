'use strict';

/**
 * Réglages du site modifiables depuis l'administration.
 *
 * Ces valeurs ne décrivent pas le contenu d'une page mais le site entier :
 * les changer impose donc de régénérer toutes les pages, et non une seule.
 */

const fs = require('node:fs');
const path = require('node:path');

const RACINE = path.resolve(__dirname, '..', '..');
const FICHIER_LIENS = path.join(RACINE, 'custom', 'liens.json');

/** Une adresse de prise de rendez-vous doit mener chez Doctolib, et nulle part ailleurs. */
function adresseDoctolibValide(valeur) {
  const propre = String(valeur || '').trim();
  if (!propre) return true; // vide = non configuré, accepté

  let url;
  try {
    url = new URL(propre);
  } catch {
    return false;
  }
  return url.protocol === 'https:' && /(^|\.)doctolib\.(fr|de|it)$/i.test(url.hostname);
}

function lire() {
  if (!fs.existsSync(FICHIER_LIENS)) {
    return { doctolib: { fiche: null, parVille: { Marseille: null, Nice: null, Draguignan: null } } };
  }
  return JSON.parse(fs.readFileSync(FICHIER_LIENS, 'utf8'));
}

/**
 * @param {object} saisie  { fiche, villes: {Marseille, Nice, Draguignan} }
 * @returns {{erreurs: string[]}}
 */
function enregistrer(saisie) {
  const erreurs = [];
  const donnees = lire();
  donnees.doctolib = donnees.doctolib || {};

  const fiche = String(saisie.fiche || '').trim();
  if (!adresseDoctolibValide(fiche)) {
    erreurs.push('L’adresse de la fiche doit être une adresse https de doctolib.fr.');
  }

  const villes = {};
  for (const [ville, valeur] of Object.entries(saisie.villes || {})) {
    const propre = String(valeur || '').trim();
    if (!adresseDoctolibValide(propre)) {
      erreurs.push(`L’adresse pour ${ville} doit être une adresse https de doctolib.fr.`);
      continue;
    }
    villes[ville] = propre || null;
  }

  if (erreurs.length) return { erreurs };

  donnees.doctolib.fiche = fiche || null;
  donnees.doctolib.parVille = { ...(donnees.doctolib.parVille || {}), ...villes };

  fs.writeFileSync(FICHIER_LIENS, `${JSON.stringify(donnees, null, 2)}\n`);
  return { erreurs: [] };
}

module.exports = { adresseDoctolibValide, enregistrer, lire };
