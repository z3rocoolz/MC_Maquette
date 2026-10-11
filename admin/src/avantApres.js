'use strict';

/**
 * Galerie avant/après : une liste de paires de photos, gérée depuis
 * l'administration (ajout, suppression). Les fichiers atterrissent dans
 * `medias/`, comme la photo d'accueil, et la liste dans
 * `medias/avant-apres.json` — ni l'un ni l'autre n'est écrasé par une
 * réextraction.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const multer = require('multer');

const RACINE = path.resolve(__dirname, '..', '..');
const MEDIAS = path.join(RACINE, 'medias');
const FICHIER = path.join(MEDIAS, '.avant-apres.json');

/** Formats acceptés : ceux que tout navigateur sait afficher. */
const TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const TAILLE_MAX = 8 * 1024 * 1024;

/** Longueur maximale du texte explicatif affiché sous chaque couple de photos. */
const LEGENDE_MAX = 600;

const reception = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAILLE_MAX, files: 2 },
  fileFilter: (req, fichier, suite) => {
    if (!TYPES[fichier.mimetype]) {
      suite(new Error('Format non accepté : une image JPEG, PNG ou WebP est attendue.'));
      return;
    }
    suite(null, true);
  },
}).fields([
  { name: 'avant', maxCount: 1 },
  { name: 'apres', maxCount: 1 },
]);

function lire() {
  if (!fs.existsSync(FICHIER)) return [];
  try {
    const donnees = JSON.parse(fs.readFileSync(FICHIER, 'utf8'));
    return Array.isArray(donnees.entrees) ? donnees.entrees : [];
  } catch {
    return [];
  }
}

function ecrire(entrees) {
  fs.mkdirSync(MEDIAS, { recursive: true });
  fs.writeFileSync(FICHIER, `${JSON.stringify({ entrees }, null, 2)}\n`);
}

/** Enregistre un fichier reçu dans `medias/`, sous un nom qui ne collisionne jamais. */
function enregistrerFichier(fichier, prefixe) {
  const extension = TYPES[fichier.mimetype];
  const empreinte = crypto.createHash('sha1').update(fichier.buffer).digest('hex').slice(0, 10);
  const nom = `avant-apres-${prefixe}-${empreinte}.${extension}`;
  fs.mkdirSync(MEDIAS, { recursive: true });
  fs.writeFileSync(path.join(MEDIAS, nom), fichier.buffer);
  return nom;
}

/**
 * Ajoute une entrée : deux photos obligatoires, une légende facultative.
 *
 * @returns {{erreurs: string[], id: string|null}}
 */
function ajouter({ avant, apres, legende }) {
  const erreurs = [];
  if (!avant) erreurs.push('La photo « avant » est obligatoire.');
  if (!apres) erreurs.push('La photo « après » est obligatoire.');
  if (erreurs.length) return { erreurs, id: null };

  const id = crypto.randomUUID();
  const nomAvant = enregistrerFichier(avant, `${id}-avant`);
  const nomApres = enregistrerFichier(apres, `${id}-apres`);

  const entrees = lire();
  entrees.push({
    id,
    avant: nomAvant,
    apres: nomApres,
    legende: typeof legende === 'string' ? legende.replace(/<[^>]*>/g, '').trim().slice(0, LEGENDE_MAX) : '',
  });
  ecrire(entrees);

  return { erreurs: [], id };
}

/**
 * Met à jour le texte explicatif d'un cas existant : les photos ne changent
 * pas, seule la légende peut être ajoutée ou corrigée après coup, sans
 * repasser par un ajout complet.
 *
 * @returns {{erreurs: string[], id: string|null}}
 */
function modifier(id, { legende }) {
  const entrees = lire();
  const entree = entrees.find((e) => e.id === id);
  if (!entree) return { erreurs: ['Ce cas n\'existe plus — la page a peut-être été rechargée entre-temps.'], id: null };

  entree.legende = typeof legende === 'string' ? legende.replace(/<[^>]*>/g, '').trim().slice(0, LEGENDE_MAX) : '';
  ecrire(entrees);

  return { erreurs: [], id };
}

/**
 * Retire une entrée et ses deux fichiers.
 *
 * @returns {boolean} vrai si l'entrée existait
 */
function supprimer(id) {
  const entrees = lire();
  const entree = entrees.find((e) => e.id === id);
  if (!entree) return false;

  for (const nom of [entree.avant, entree.apres]) {
    if (!nom) continue;
    const chemin = path.join(MEDIAS, nom);
    if (fs.existsSync(chemin)) fs.unlinkSync(chemin);
  }

  ecrire(entrees.filter((e) => e.id !== id));
  return true;
}

module.exports = { LEGENDE_MAX, TAILLE_MAX, ajouter, lire, modifier, reception, supprimer };
