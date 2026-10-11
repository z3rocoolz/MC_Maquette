'use strict';
/**
 * Données éditées par Pages CMS. Le site de production reste statique.
 * Ce module n'ajoute aucune dépendance au build Node existant.
 */
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '../..');
const PAGE_DIR = path.join(ROOT, 'content', 'cms-pages');
const ARTICLE_DIR = path.join(ROOT, 'content', 'articles');
const escapeHtml = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const safeSlug = s => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
const slugify = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { throw new Error(`Contenu CMS incorrect (${path.relative(ROOT, file)}): ${error.message}`); }
}
function validUrl(value, image = false) {
  const url = String(value || '').trim();
  if (!url || /[\u0000-\u001f\\]/.test(url)) return '';
  if (/^https:\/\/[^\s]+$/i.test(url)) return url;
  if (!image && (/^mailto:[^\s]+$/i.test(url) || /^tel:[+\d.()\s-]+$/i.test(url) || /^#[a-z0-9_-]+$/i.test(url))) return url;
  // Empêche javascript:, data:, //domain et les traversées de répertoires.
  if (/^(\/)?assets\/uploads\/[a-z0-9_./-]+$/i.test(url) && !url.includes('..') && /\.(png|jpe?g|webp|gif|avif)$/i.test(url)) {
    return url.startsWith('/') ? url.slice(1) : url;
  }
  if (!image && /^(?:[a-z0-9-]+\.html)(?:#[a-z0-9_-]+)?$/i.test(url)) return url;
  return '';
}
function inlineMarkdown(value) {
  let input = String(value ?? '');
  const saved = [];
  const token = html => { const i = saved.push(html) - 1; return `\u0002${i}\u0003`; };
  // Capturer les fragments reconnus avant d'échapper le reste (pas de HTML arbitraire).
  input = input.replace(/!\[([^\]\n]*)\]\(([^)\n]+)\)/g, (_all, alt, src) => {
    const safe = validUrl(src, true);
    return safe ? token(`<img src="${escapeHtml(safe)}" alt="${escapeHtml(alt)}" loading="lazy">`) : escapeHtml(alt);
  });
  input = input.replace(/\[([^\]\n]+)\]\(([^)\n]+)\)/g, (_all, label, href) => {
    const safe = validUrl(href);
    return safe ? token(`<a href="${escapeHtml(safe)}">${escapeHtml(label)}</a>`) : escapeHtml(label);
  });
  input = input.replace(/`([^`\n]+)`/g, (_all, code) => token(`<code>${escapeHtml(code)}</code>`));
  input = escapeHtml(input);
  input = input.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  input = input.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  return input.replace(/\u0002(\d+)\u0003/g, (_all, i) => saved[Number(i)] || '');
}
function markdownToHtml(markdown) {
  const lines = String(markdown ?? '').replace(/\r\n?/g, '\n').split('\n');
  let out = [], paragraph = [], list = '';
  const flush = () => { if (paragraph.length) { out.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`); paragraph=[]; } };
  const closeList = () => { if (list) { out.push(`</${list}>`); list=''; } };
  for (const original of lines) {
    const line = original.trim();
    if (!line) { flush(); closeList(); continue; }
    const heading = line.match(/^(#{1,5})\s+(.+)$/);
    if (heading) { flush(); closeList(); out.push(`<h${Math.min(heading[1].length+1,6)}>${inlineMarkdown(heading[2])}</h${Math.min(heading[1].length+1,6)}>`); continue; }
    const item = line.match(/^([-*]|\d+\.)\s+(.+)$/);
    if (item) {
      flush(); const tag = /\d/.test(item[1]) ? 'ol' : 'ul';
      if (list !== tag) { closeList(); out.push(`<${tag}>`); list=tag; }
      out.push(`<li>${inlineMarkdown(item[2])}</li>`); continue;
    }
    closeList(); paragraph.push(line);
  }
  flush(); closeList();
  return out.join('\n');
}
function richTextToHtml(value) {
  const str=String(value ?? '');
  // Certains éditeurs enregistrent leur riche texte comme du HTML ; le
  // sanitizer Cheerio du moteur s'appliquera ensuite au moment du rendu.
  return /^\s*<(?:p|h[1-6]|ul|ol|blockquote|figure|div|table|img)\b/i.test(str) ? str : markdownToHtml(str);
}
function overlaysForPages() {
  const overlays = new Map();
  if (!fs.existsSync(PAGE_DIR)) return overlays;
  for (const name of fs.readdirSync(PAGE_DIR).filter(s => s.endsWith('.json'))) {
    const slug = name.slice(0, -5);
    if (!safeSlug(slug) && !/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(slug)) throw new Error(`Nom de page CMS invalide: ${name}`);
    const data = readJson(path.join(PAGE_DIR, name));
    overlays.set(slug, data);
  }
  return overlays;
}
function applyPageOverlay(page, overlays) {
  const edited = overlays.get(page.slug);
  if (!edited) return page;
  const p = { ...page, seo: {...page.seo}, hero: {...page.hero}, sections: [...(page.sections || [])] };
  const changes = [
    ['titre', p.hero, 'title'], ['surtitre', p.hero, 'eyebrow'],
    ['accroche', p.hero, 'lead'], ['titre_seo', p.seo, 'title'],
    ['description_seo', p.seo, 'description']
  ];
  for (const [field, target, key] of changes) if (typeof edited[field] === 'string' && edited[field].trim()) target[key] = edited[field];
  if (typeof edited.introduction === 'string' && edited.introduction.trim()) {
    p.sections.unshift({id:'introduction-cms',title:'À découvrir',blocks:[{type:'html',html:richTextToHtml(edited.introduction)}]});
  }
  return p;
}
function articles() {
  if (!fs.existsSync(ARTICLE_DIR)) return [];
  const entries=[];
  const used = new Set();
  for (const name of fs.readdirSync(ARTICLE_DIR).filter(s=>s.endsWith('.json'))) {
    const basename=name.slice(0,-5);
    const slug=slugify(basename);
    if(!safeSlug(slug)) throw new Error(`Nom d'article incorrect: ${name}`);
    const d=readJson(path.join(ARTICLE_DIR,name));
    if(d.publie !== true) continue; // Toute publication nécessite une action explicite.
    if(used.has(slug)) throw new Error(`URL d'article en double : ${slug}`);
    used.add(slug);
    if(typeof d.titre!=='string' || !d.titre.trim()) throw new Error(`Titre manquant dans ${name}`);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(d.date||'') || !Number.isFinite(Date.parse(d.date+'T00:00:00Z')) || new Date(d.date+'T00:00:00Z').toISOString().slice(0,10)!==d.date) throw new Error(`Date ISO invalide dans ${name}`);
    const cover=d.image ? validUrl(d.image, true) : '';
    if(d.image && !cover) throw new Error(`Chemin d'image interdit dans ${name}`);
    entries.push({slug, title:d.titre.trim(), date:d.date, summary:String(d.resume||''), seoTitle:String(d.titre_seo||d.titre).trim(), seoDescription:String(d.description_seo||d.resume||d.titre).trim(), cover, alt:String(d.alt_image||d.titre), html:richTextToHtml(d.contenu||'')});
  }
  return entries.sort((a,b)=>b.date.localeCompare(a.date)||a.slug.localeCompare(b.slug));
}
function articleFile(article) {return `actualite-${article.slug}.html`;}
module.exports={ROOT, overlaysForPages, applyPageOverlay, articles, articleFile, markdownToHtml, richTextToHtml, inlineMarkdown, validUrl, escapeHtml};
