'use strict';

/**
 * Photo d'accueil : réception du fichier et enregistrement du réglage.
 *
 * Le fichier atterrit dans `medias/`, le réglage dans `custom/menu.json`.
 * Aucun des deux n'est écrasé par une réextraction.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const multer = require('multer');

const RACINE = path.resolve(__dirname, '..', '..');
const MEDIAS = path.join(RACINE, 'medias');
const FICHIER_REGLAGES = path.join(RACINE, 'custom', 'menu.json');

/** Formats acceptés : ceux que tout navigateur sait afficher. */
const TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const TAILLE_MAX = 6 * 1024 * 1024;

const reception = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAILLE_MAX, files: 1 },
  fileFilter: (req, fichier, suite) => {
    if (!TYPES[fichier.mimetype]) {
      suite(new Error('Format non accepté : une image JPEG, PNG ou WebP est attendue.'));
      return;
    }
    suite(null, true);
  },
}).single('photo');

function lireReglages() {
  return JSON.parse(fs.readFileSync(FICHIER_REGLAGES, 'utf8'));
}

function lire() {
  const accueil = lireReglages().accueil || {};
  return accueil.photo || { fichier: null, alt: '', taille: 200 };
}

/**
 * Enregistre une nouvelle photo et le texte qui l'accompagne.
 *
 * Le nom du fichier porte une empreinte de son contenu : deux versions
 * successives ne peuvent pas se confondre dans le cache des navigateurs.
 *
 * @returns {{erreurs: string[], fichier: string|null}}
 */
function enregistrer({ fichier, alt, taille }) {
  const erreurs = [];
  const reglages = lireReglages();
  reglages.accueil = reglages.accueil || {};
  const photo = { ...(reglages.accueil.photo || {}) };

  if (fichier) {
    const extension = TYPES[fichier.mimetype];
    if (!extension) {
      erreurs.push('Format non accepté : une image JPEG, PNG ou WebP est attendue.');
    } else {
      const empreinte = crypto.createHash('sha1').update(fichier.buffer).digest('hex').slice(0, 10);
      const nom = `portrait-${empreinte}.${extension}`;

      fs.mkdirSync(MEDIAS, { recursive: true });
      fs.writeFileSync(path.join(MEDIAS, nom), fichier.buffer);

      // L'ancienne photo est retirée si plus rien ne s'y réfère.
      if (photo.fichier && photo.fichier !== nom) {
        const ancienne = path.join(MEDIAS, photo.fichier);
        if (fs.existsSync(ancienne)) fs.unlinkSync(ancienne);
      }
      photo.fichier = nom;
    }
  }

  if (typeof alt === 'string') photo.alt = alt.replace(/<[^>]*>/g, '').trim().slice(0, 200);

  const n = Number.parseInt(taille, 10);
  if (Number.isFinite(n)) {
    if (n < 80 || n > 400) erreurs.push('La taille doit être comprise entre 80 et 400 pixels.');
    else photo.taille = n;
  }

  if (erreurs.length) return { erreurs, fichier: photo.fichier || null };

  reglages.accueil.photo = photo;
  fs.writeFileSync(FICHIER_REGLAGES, `${JSON.stringify(reglages, null, 2)}\n`);
  return { erreurs: [], fichier: photo.fichier || null };
}

module.exports = { TAILLE_MAX, enregistrer, lire, reception };
