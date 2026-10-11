'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const DATA_URI = /data:image\/([a-z+]+);base64,([A-Za-z0-9+/=]+)/g;

const EXTENSIONS = {
  jpeg: 'jpg',
  jpg: 'jpg',
  png: 'png',
  'svg+xml': 'svg',
  webp: 'webp',
  gif: 'gif',
};

/**
 * Extrait les images encodées en base64 vers des fichiers et renvoie le HTML
 * avec les data-URI remplacées par un chemin. Les images identiques, répétées
 * d'une page à l'autre, sont dédupliquées par empreinte du contenu.
 *
 * @param {string} html
 * @param {string} outDir      dossier de destination des fichiers image
 * @param {string} publicPath  préfixe d'URL écrit dans le contenu
 * @param {Map<string,object>} registry  partagé entre les pages (dédup)
 * @returns {{html: string, used: string[]}}
 */
function extractImages(html, outDir, publicPath, registry) {
  const used = new Set();

  const rewritten = html.replace(DATA_URI, (match, mime, base64) => {
    const buffer = Buffer.from(base64, 'base64');
    const hash = crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 12);
    const ext = EXTENSIONS[mime] || 'bin';
    const name = `img-${hash}.${ext}`;

    if (!registry.has(name)) {
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, name), buffer);
      registry.set(name, { name, bytes: buffer.length, mime, pages: new Set() });
    }
    used.add(name);
    return `${publicPath}/${name}`;
  });

  return { html: rewritten, used: [...used] };
}

/**
 * Sort le bloc <style> d'une page vers un fichier CSS dédupliqué :
 * plusieurs pages partagent exactement la même feuille.
 *
 * @returns {{file: string, bytes: number, shared: boolean}|null}
 */
function extractStyle($, outDir, registry) {
  const styles = $('style')
    .map((i, el) => $(el).html())
    .get()
    .join('\n');

  if (!styles.trim()) return null;

  const hash = crypto.createHash('sha1').update(styles).digest('hex').slice(0, 12);
  const file = `style-${hash}.css`;
  const shared = registry.has(file);

  if (!shared) {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, file), `${styles.trim()}\n`);
    registry.set(file, { file, bytes: Buffer.byteLength(styles), pages: [] });
  }

  return { file, bytes: Buffer.byteLength(styles), shared };
}

/**
 * Sort les scripts inline (menu mobile, accordéons) vers des fichiers JS
 * dédupliqués. Sans eux, la page régénérée perdrait ses interactions.
 * Le JSON-LD est laissé de côté : il appartient aux métadonnées.
 *
 * @returns {string[]} fichiers référencés par la page, dans l'ordre
 */
function extractScripts($, outDir, registry) {
  const fichiers = [];

  $('script').each((i, el) => {
    const $el = $(el);
    if ($el.attr('type') === 'application/ld+json' || $el.attr('src')) return;

    const source = ($el.html() || '').trim();
    if (!source) return;

    const hash = crypto.createHash('sha1').update(source).digest('hex').slice(0, 12);
    const file = `script-${hash}.js`;

    if (!registry.has(file)) {
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, file), `${source}\n`);
      registry.set(file, { file, bytes: Buffer.byteLength(source), pages: [] });
    }
    fichiers.push(file);
  });

  return fichiers;
}

module.exports = { extractImages, extractStyle, extractScripts };
