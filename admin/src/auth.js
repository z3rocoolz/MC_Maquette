'use strict';

/**
 * Authentification à compte unique.
 *
 * Pas de base de données ni de dépendance externe : le mot de passe est dérivé
 * avec scrypt (module natif) et rangé dans un fichier hors du dépôt.
 *
 * Les sessions sont écrites sur disque. En mémoire, le moindre redémarrage —
 * une mise à jour, un plantage — invalidait le formulaire ouvert dans le
 * navigateur : l'enregistrement était refusé et la saisie perdue.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const FICHIER_AUTH = path.join(__dirname, '..', '.auth.json');
const FICHIER_SESSIONS = path.join(__dirname, '..', '.sessions.json');
const DUREE_SESSION = 8 * 60 * 60 * 1000; // 8 heures
const COOKIE = 'drmc_admin';

/** Retards imposés après des échecs répétés, par adresse. */
const TENTATIVES = new Map();
const MAX_TENTATIVES = 5;
const BLOCAGE = 15 * 60 * 1000;

const sessions = chargerSessions();

function chargerSessions() {
  try {
    const donnees = JSON.parse(fs.readFileSync(FICHIER_SESSIONS, 'utf8'));
    const vivantes = Object.entries(donnees).filter(([, s]) => s.expire > Date.now());
    return new Map(vivantes);
  } catch {
    return new Map();
  }
}

function sauverSessions() {
  try {
    fs.writeFileSync(FICHIER_SESSIONS, JSON.stringify(Object.fromEntries(sessions)), { mode: 0o600 });
  } catch (erreur) {
    console.error('[admin] sessions non sauvegardées :', erreur.message);
  }
}

/* ─── Mot de passe ──────────────────────────────────────────────── */

function derive(motDePasse, sel) {
  return crypto.scryptSync(motDePasse, sel, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
}

function definirMotDePasse(motDePasse) {
  const sel = crypto.randomBytes(16).toString('hex');
  const donnees = { sel, hash: derive(motDePasse, sel), modifie: new Date().toISOString() };
  fs.writeFileSync(FICHIER_AUTH, `${JSON.stringify(donnees, null, 2)}\n`, { mode: 0o600 });
}

function motDePasseDefini() {
  return fs.existsSync(FICHIER_AUTH);
}

function verifierMotDePasse(motDePasse) {
  if (!motDePasseDefini()) return false;
  const { sel, hash } = JSON.parse(fs.readFileSync(FICHIER_AUTH, 'utf8'));
  const candidat = derive(motDePasse, sel);
  // Comparaison à durée constante : une comparaison naïve laisse fuiter le hash.
  return crypto.timingSafeEqual(Buffer.from(candidat, 'hex'), Buffer.from(hash, 'hex'));
}

/* ─── Limitation des tentatives ─────────────────────────────────── */

function bloque(adresse) {
  const suivi = TENTATIVES.get(adresse);
  if (!suivi) return false;
  if (Date.now() - suivi.dernier > BLOCAGE) {
    TENTATIVES.delete(adresse);
    return false;
  }
  return suivi.echecs >= MAX_TENTATIVES;
}

function noterEchec(adresse) {
  const suivi = TENTATIVES.get(adresse) || { echecs: 0, dernier: 0 };
  suivi.echecs += 1;
  suivi.dernier = Date.now();
  TENTATIVES.set(adresse, suivi);
}

const oublierEchecs = (adresse) => TENTATIVES.delete(adresse);

/* ─── Sessions ──────────────────────────────────────────────────── */

function ouvrirSession(res, securise) {
  const id = crypto.randomBytes(32).toString('hex');
  sessions.set(id, { expire: Date.now() + DUREE_SESSION, csrf: crypto.randomBytes(24).toString('hex') });
  sauverSessions();

  const morceaux = [
    `${COOKIE}=${id}`,
    'HttpOnly',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${Math.floor(DUREE_SESSION / 1000)}`,
  ];
  if (securise) morceaux.push('Secure');
  res.setHeader('Set-Cookie', morceaux.join('; '));
  return id;
}

function fermerSession(req, res) {
  const id = lireCookie(req);
  if (id) {
    sessions.delete(id);
    sauverSessions();
  }
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
}

function lireCookie(req) {
  const brut = req.headers.cookie;
  if (!brut) return null;
  for (const morceau of brut.split(';')) {
    const [nom, valeur] = morceau.trim().split('=');
    if (nom === COOKIE) return valeur;
  }
  return null;
}

function session(req) {
  const id = lireCookie(req);
  if (!id) return null;
  const donnees = sessions.get(id);
  if (!donnees) return null;
  if (donnees.expire < Date.now()) {
    sessions.delete(id);
    sauverSessions();
    return null;
  }
  return donnees;
}

/* ─── Intergiciels ──────────────────────────────────────────────── */

/** Refuse l'accès aux visiteurs non authentifiés. */
function exigerSession(req, res, suite) {
  const courante = session(req);
  if (!courante) return res.redirect('/connexion');
  req.session = courante;
  suite();
}

/**
 * Rejette les requêtes d'écriture sans jeton valide.
 * Le cookie est en SameSite=Strict, le jeton ajoute une seconde barrière.
 *
 * Le refus ne doit jamais faire perdre le texte saisi : la requête est
 * marquée, et la route la renvoie à l'auteur pour qu'il la rejoue.
 */
function verifierJeton(req, res, suite) {
  if (!req.session || req.body.csrf !== req.session.csrf) {
    req.jetonInvalide = true;
  }
  suite();
}

module.exports = {
  COOKIE,
  bloque,
  definirMotDePasse,
  exigerSession,
  fermerSession,
  motDePasseDefini,
  noterEchec,
  oublierEchecs,
  ouvrirSession,
  session,
  verifierJeton,
  verifierMotDePasse,
};
