'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {overlaysForPages, applyPageOverlay} = require('../cms-content');
const cheerio = require('cheerio');
const ROOT = path.resolve(__dirname, '../../..');
const config = () => {
  const c = JSON.parse(fs.readFileSync(path.join(ROOT, 'custom/refonte.json'), 'utf8'));
  const links = JSON.parse(fs.readFileSync(path.join(ROOT, 'custom/liens.json'), 'utf8'));
  if (links.doctolib?.fiche) c.doctolib = links.doctolib.fiche;
  c.byCity = links.doctolib?.parVille || {};
  return c;
};
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = s => cheerio.load(String(s || ''), null, false).text().replace(/\s+/g, ' ').trim();
const arrow = '<span aria-hidden="true">↗</span>';
const fileFor = p => p.url === '/' ? 'index.html' : /^[a-z0-9-]+\.html$/.test(p.output || '') ? p.output : p.slug === 'rhinoplastie_v3' ? 'rhinoplastie.html' : p.slug + '.html';
const allPages = () => {
  const overlays = overlaysForPages();
  return fs.readdirSync(path.join(ROOT, 'content'))
    .filter(n => n.endsWith('.json') && !n.startsWith('_'))
    .map(n => applyPageOverlay(JSON.parse(fs.readFileSync(path.join(ROOT, 'content', n), 'utf8')), overlays));
};
let routeCache = null;
function localLink(href) {
  if (!href) return '#';
  const c = config();
  if (/^https?:\/\/(www\.)?doctolib\.fr\/?$/.test(href)) return c.doctolib;
  href = href.replace(/^https?:\/\/(www\.)?drmattiacoda\.fr/, '');
  if (href.startsWith('/assets/')) return href.slice(1);
  const legacyCity = href.match(/^(?:\/)?rhinoplastie-(marseille|nice|draguignan)\.html(#.*)?$/);
  if (legacyCity) return 'consultation-' + legacyCity[1] + '.html' + (legacyCity[2] || '');
  if (!href.startsWith('/')) return href;
  const [url, hash] = href.split('#');
  if (!routeCache) routeCache = new Map(allPages().map(p => [p.url, p]));
  const p = routeCache.get(url) || routeCache.get(url + '/');
  return (p ? fileFor(p) : url === '/' ? 'index.html' : url.replace(/^\/|\/$/g, '') + '.html') + (hash ? '#' + hash : '');
}
function clean(html) {
  const $ = cheerio.load(String(html || ''), null, false);
  $('script,style,iframe,object,embed,form,noscript,svg,math,base,link,meta').remove();
  $('*').each((i, el) => {
    for (const a of Object.keys(el.attribs || {})) {
      if (a === 'style' || a === 'srcset' || a === 'formaction' || a.startsWith('on') || a === 'aria-hidden') $(el).removeAttr(a);
      if (a === 'class') {
        const allowed = new Set(['practical-links','button','button-outline','text-link','comparison-links']);
        const classes = String(el.attribs[a]).split(/\s+/).filter(name => allowed.has(name));
        if (classes.length) $(el).attr(a, classes.join(' '));
        else $(el).removeAttr(a);
      }
    }
    if (el.tagName === 'h1') el.tagName = 'h2';
    if (['h4','h5','h6'].includes(el.tagName)) el.tagName = 'h3';
  });
  $('a').each((i, el) => {
    const a = $(el);
    const href = String(a.attr('href') || '').trim();
    if (/^(?:javascript|data|vbscript|file):/i.test(href) || href.startsWith('//')) a.removeAttr('href');
    else a.attr('href', localLink(href));
    if (!a.text().trim() && !a.find('img').length) a.remove();
    if (a.attr('target') === '_blank') a.attr('rel', 'noopener noreferrer');
  });
  $('img').each((i, el) => {
    const a = $(el);
    const src = String(a.attr('src') || '').trim();
    if (/^(?:javascript|data|vbscript|file):/i.test(src) || src.startsWith('//')) { a.remove(); return; }
    a.attr('src', localLink(src)).attr('loading', 'lazy');
    if (a.attr('alt') === undefined) a.attr('alt', '');
  });
  $('button').each((i, el) => { $(el).replaceWith('<span>' + esc($(el).text()) + '</span>'); });
  $('table').wrap('<div class="table-scroll" role="region" aria-label="Tableau défilant" tabindex="0"></div>');
  $('th').each((i, el) => { if (!$(el).attr('scope')) $(el).attr('scope', 'col'); });
  return $.html();
}
function block(b) {
  const items = b.items || [];
  switch (b.type) {
    case 'text': case 'html': return clean(b.html);
    case 'heading': return '<h3>' + clean(b.html) + '</h3>';
    case 'group': return '<div class="content-group">' + (b.blocks || []).map(block).join('') + '</div>';
    case 'note': return '<aside class="reading-note">' + (b.title ? '<strong>' + clean(b.title) + '</strong>' : '') + clean(b.html) + '</aside>';
    case 'list': return '<' + (b.ordered ? 'ol' : 'ul') + '>' + items.map(i => '<li>' + clean(i) + '</li>').join('') + '</' + (b.ordered ? 'ol' : 'ul') + '>';
    case 'faq': return '<div class="faq-list">' + items.map(i => '<details><summary>' + plain(i.question) + '</summary><div class="answer">' + clean(i.answer) + '</div></details>').join('') + '</div>';
    case 'cards': return '<div class="reading-cards">' + items.map(i => '<div>' + (plain(i.title)?'<h3>' + clean(i.title) + '</h3>':'') + clean(i.html) + (i.link && !(i.html || '').includes('href=') ? '<a class="text-link" href="' + esc(localLink(i.link)) + '">Découvrir ' + plain(i.title).toLowerCase() + ' ' + arrow + '</a>' : '') + '</div>').join('') + '</div>';
    case 'buttons': return '<div class="button-row">' + items.map(i => '<a class="button button-outline" href="' + esc(localLink(i.href)) + '">' + esc(i.label || 'Prendre rendez-vous') + ' ' + arrow + '</a>').join('') + '</div>';
    case 'chrono': return '<ol class="reading-steps">' + items.map(i => '<li><strong>' + esc(i.badge || '') + '</strong>' + clean(i.html) + '</li>').join('') + '</ol>';
    case 'table': return '<div class="table-scroll" role="region" aria-label="Tableau défilant" tabindex="0"><table>' + (b.head?.length ? '<thead><tr>' + b.head.map(c => '<th scope="col">' + clean(c) + '</th>').join('') + '</tr></thead>' : '') + '<tbody>' + (b.rows || []).map(r => '<tr>' + r.map(c => '<td>' + clean(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
    case 'villes': return cityCards();
    case 'diaporama': return '<div class="reading-note"><h2>Comprendre les résultats</h2><p>Des photographies de cas cliniques peuvent être commentées lors de la consultation. Leur lecture tient compte de la morphologie initiale, de l’intervention réalisée et du délai de cicatrisation.</p><p>Un résultat individuel ne préjuge pas de celui d’une autre personne.</p><a class="text-link" href="consultation.html">Préparer votre consultation ' + arrow + '</a></div>';
    default: throw new Error('Bloc inconnu : ' + b.type);
  }
}
function cityCards() {
  return '<div class="city-grid">' + [
    ['Marseille','Hôpital privé Beauregard','23 rue des Linots','rhinoplastie-marseille.html'],
    ['Nice','Consultation','4 avenue Georges Clemenceau','rhinoplastie-nice.html'],
    ['Draguignan','Consultation','64 avenue Lazare Carnot','rhinoplastie-draguignan.html']
  ].map((c,i) => '<article class="city"><span class="city-number">0' + (i+1) + '</span><h3>' + c[0] + '</h3><p>' + c[1] + '<br>' + c[2] + '</p><a class="text-link" href="' + c[3] + '">Consulter à ' + c[0] + ' ' + arrow + '</a></article>').join('') + '</div>';
}
function header(p) {
  const file = fileFor(p);
  return '<a class="skip-link" href="#contenu">Aller au contenu</a>' +
    '<div class="topline"><div class="container"><span>Chirurgie du nez, du visage &amp; des mâchoires</span><span>Marseille · Nice · Draguignan</span></div></div>' +
    '<header class="site-header"><div class="container header-inner"><a class="brand" href="index.html" aria-label="Dr Mattia Coda — Accueil"><span class="brand-symbol" aria-hidden="true"><img src="assets/img/logo-coda.webp" width="1254" height="1254" alt=""></span><span><span class="brand-name">Dr Mattia Coda</span><span class="brand-caption">Chirurgien maxillo-facial</span></span></a>' +
    '<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="navigation-principale" hidden><span>Menu</span><span class="menu-lines" aria-hidden="true"></span></button>' +
    '<nav id="navigation-principale" aria-label="Navigation principale"><ul>' + [
      ['rhinoplastie.html','Rhinoplastie'], ['competences.html','Interventions'], ['actualites.html','Articles'], ['dr-mattia-coda.html','Dr Coda'], ['informations-pratiques.html','Infos pratiques']
    ].map(i => '<li><a href="' + i[0] + '"' + (file===i[0] ? ' aria-current="page"' : '') + '>' + i[1] + '</a></li>').join('') +
    '<li><a class="button button-small" href="' + esc(config().doctolib) + '">Prendre rendez-vous ' + arrow + '</a></li></ul></nav></div></header>';
}
function footer() {
  return '<footer class="site-footer"><div class="container footer-compact"><a class="footer-logo" href="index.html" aria-label="Dr Mattia Coda — Accueil"><img src="assets/img/logo-coda.webp" width="1254" height="1254" alt="Logo du Dr Mattia Coda" loading="lazy"></a><div class="footer-information"><p class="footer-signature">Une rencontre. Un projet personnel.</p><p>Dr Mattia Coda · Chirurgien maxillo-facial et stomatologue</p><p class="footer-fine"><a href="consultation-marseille.html">Marseille</a> · <a href="consultation-nice.html">Nice</a> · <a href="consultation-draguignan.html">Draguignan</a> · RPPS : 10100805174</p><nav class="footer-links" aria-label="Informations complémentaires"><a href="parcours-patient.html">Votre parcours</a><a href="sources-et-engagements.html">Références</a><a href="mentions-legales.html">Mentions légales</a><a href="confidentialite.html">Confidentialité</a><a href="accessibilite.html">Accessibilité</a><a href="informations.html">À propos du site</a></nav><p class="footer-version">© 2026 Mattia Coda' + (config().prototype ? ' · Version de travail privée' : '') + '</p></div></div></footer>';
}
function cta() {
  return '<div class="consultation-bar"><div class="container"><p>Une question sur votre projet ?</p><a href="consultation.html">Préparer une consultation ' + arrow + '</a><a class="button button-small" href="' + esc(config().doctolib) + '">Prendre rendez-vous ' + arrow + '</a></div></div>';
}
function hero(p) {
  const h=p.hero || {}, home=p.url==='/';
  if(home) return '<section class="home-hero" aria-labelledby="titre-page"><div class="container"><div class="home-hero-grid"><div class="hero-copy"><p class="eyebrow">' + esc(h.eyebrow || 'Chirurgie du nez & du visage') + '</p><h1 id="titre-page">' + clean(h.title) + '</h1><p class="hero-lead">' + esc(h.lead) + '</p><div class="button-row"><a class="button" href="rhinoplastie.html">Explorer la rhinoplastie ' + arrow + '</a><a class="text-link" href="consultation.html">Votre consultation <span aria-hidden="true">→</span></a></div><p class="hero-location"><span aria-hidden="true">◦</span> Marseille · Nice · Draguignan</p></div><figure class="hero-art"><picture><img src="assets/img/portrait-sauge.webp" srcset="assets/img/portrait-sauge-640.webp 640w, assets/img/portrait-sauge.webp 1122w" sizes="(max-width: 760px) 90vw, 42vw" width="1122" height="1402" alt="" fetchpriority="high"></picture><span class="hero-image-note" aria-hidden="true">Chaque visage<br><em>a son histoire.</em></span><figcaption>Photographie d’illustration</figcaption></figure></div><nav class="home-shortcuts" aria-label="Les autres compétences du Dr Coda"><a href="competences.html#visage"><span>01</span><div><strong>Visage &amp; regard</strong><small>Paupières, lifting</small></div><b aria-hidden="true">↗</b></a><a href="competences.html#machoires"><span>02</span><div><strong>Mâchoires &amp; profil</strong><small>Équilibre du visage</small></div><b aria-hidden="true">↗</b></a><a href="medecine-esthetique.html"><span>03</span><div><strong>Médecine esthétique</strong><small>Traitements du visage</small></div><b aria-hidden="true">↗</b></a><a href="dents-de-sagesse.html"><span>04</span><div><strong>Stomatologie</strong><small>Dents de sagesse</small></div><b aria-hidden="true">↗</b></a></nav></div></section>';
  const doctor=p.slug==='dr-mattia-coda';
  return '<section class="page-hero' + (doctor?' page-hero-doctor':'') + '"><div class="container page-hero-grid"><div><nav class="breadcrumb" aria-label="Fil d’Ariane"><a href="index.html">Accueil</a><span aria-hidden="true">/</span><span aria-current="page">' + esc(plain(h.title||p.seo.title)) + '</span></nav><p class="eyebrow">' + esc(h.eyebrow||'Mattia Coda · Chirurgien maxillo-facial') + '</p><h1 id="titre-page">' + clean(h.title || p.seo.title) + '</h1>' + (h.lead?'<p class="page-lead">'+esc(plain(h.lead))+'</p>':'') + '</div>' + (doctor?'<figure class="page-hero-photo"><img src="assets/img/mattia-coda.webp" width="880" height="1173" alt="Mattia Coda au bloc opératoire"><figcaption>Dr Mattia Coda</figcaption></figure>':'') + '</div></section>';
}
function article(p) {
  const sections=(p.sections||[]).filter(s=>s.variant!=='cta');
  const ids=new Set();
  const uid=(s,i)=>{let id=s.id||'section-'+(i+1); while(ids.has(id))id+='-suite';ids.add(id);return id;};
  const sl=sections.map((s,i)=>({s,id:uid(s,i)}));
  const compact=p.url!=='/' && p.slug!=='competences' && p.slug!=='consultation';
  const preparation=p.slug==='preparer-consultation' ? require('./preparation')() : '';
  const technical=require('./technical').renderTechnical(p,{block,esc,plain,allPages,fileFor});
  const levels=technical?'<nav class="reading-levels" aria-label="Choisir le niveau de détail"><a href="#'+esc(sl[0]?.id||'contenu')+'">L’essentiel</a><a href="#details-techniques">Détails techniques <span aria-hidden="true">↗</span></a></nav>':'';
  let first=true;
  const content=sl.map(({s,id})=>{
    if(s.variant==='composition')return (s.blocks||[]).map(b=>b.html||'').join('');
    if(compact && s.title){
      const open=first;first=false;
      return '<details class="reading-section reading-disclosure" data-reading-section id="'+esc(id)+'"'+(open?' open':'')+'><summary><h2>'+clean(s.title)+'</h2></summary><div class="reading-content">'+(s.eyebrow?'<p class="eyebrow">'+esc(plain(s.eyebrow))+'</p>':'')+(s.blocks||[]).map(block).join('')+'</div></details>';
    }
    return '<div class="reading-section" id="'+esc(id)+'">'+(s.blocks||[]).map(block).join('')+'</div>';
  }).join('\n');
  if(!compact)return content;
  const targets=[...sl.filter(x=>x.s.title && x.s.variant!=='composition').map(x=>x.id),...(technical?['details-techniques']:[])].join(' ');
  return '<div class="container reading-layout"><article class="reading-body" aria-label="Informations sur ' + esc(plain(p.hero?.title||p.seo.title)) + '">' + preparation + levels + (targets?'<div class="reading-tools"><p>Ouvrez les rubriques qui vous intéressent.</p><button type="button" class="reading-toggle" data-reading-toggle aria-controls="'+esc(targets)+'" aria-expanded="false" hidden>Tout afficher</button></div>':'') + content + technical + (p.medical ? '<p class="medical-note">Information générale · Ces repères ne remplacent pas une consultation.'+(config().prototype?' Version de travail : validation médicale à réaliser avant publication publique.':'')+'</p>' : '') + '</article><aside class="reading-sidebar"><details class="page-toc"><summary>Dans cette page</summary><nav aria-label="Sommaire de la page"><ol>' + sl.filter(x=>x.s.title).map(x=>'<li><a href="#'+esc(x.id)+'">'+esc(plain(x.s.title))+'</a></li>').join('') + (technical?'<li><a href="#details-techniques">Détails techniques</a></li>':'') + '</ol></nav></details><div class="sidebar-appointment"><p class="eyebrow">Votre projet</p><h2>Parlons-en.</h2><p>Un temps d’échange pour répondre à vos questions.</p><a class="button button-small" href="'+esc(config().doctolib)+'">Prendre rendez-vous '+arrow+'</a><a class="text-link" href="preparer-consultation.html">Préparer ma visite →</a></div></aside></div>';
}
function rendrePage(p, options = {}) {
  routeCache = null;
  const c=config(), home=p.url==='/', file=fileFor(p);
  const title=plain(p.seo?.title||p.hero?.title)+'';
  const description=plain(p.seo?.description||p.hero?.lead||'Mattia Coda, chirurgien maxillo-facial et stomatologue. Informations sur les interventions et les consultations.');
  const canonical=c.origin.replace(/\/$/,'')+'/'+(home?'':file);
  const structured={
    '@context':'https://schema.org',
    '@graph':[
      {'@type':'WebSite','@id':c.origin+'/#website',url:c.origin+'/',name:'Mattia Coda',inLanguage:'fr-FR'},
      {'@type':'Person','@id':c.origin+'/#chirurgien',name:'Mattia Coda',jobTitle:'Chirurgien maxillo-facial et stomatologue',url:c.origin+'/dr-mattia-coda.html',image:c.origin+'/assets/img/mattia-coda.webp',sameAs:[c.doctolib]},
      {'@type':p.medical?'MedicalWebPage':p.slug==='dr-mattia-coda'?'AboutPage':'WebPage',name:title,description:description,url:canonical,inLanguage:'fr-FR',isPartOf:{'@id':c.origin+'/#website'}}
    ]
  };
  if(!home) structured['@graph'].push({'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Accueil',item:c.origin+'/'},{'@type':'ListItem',position:2,name:plain(p.hero?.title||title),item:canonical}]});
  let html='<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+'</title><meta name="description" content="'+esc(description)+'"><meta name="robots" content="'+(c.prototype?'noindex, nofollow':'index, follow')+'"><meta name="theme-color" content="#174d4b"><link rel="canonical" href="'+esc(canonical)+'"><meta property="og:type" content="website"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(description)+'"><meta property="og:url" content="'+esc(canonical)+'"><meta property="og:image" content="'+esc(c.origin)+'/assets/img/horizon.webp"><meta property="og:locale" content="fr_FR"><link rel="icon" href="assets/img/monogramme.svg" type="image/svg+xml"><link rel="preload" href="assets/fonts/manrope.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="assets/css/coda.css"><script src="assets/js/coda.js" defer></script><script src="assets/js/patient.js" defer></script><script src="assets/js/reading.js" defer></script><script type="application/ld+json">'+JSON.stringify(structured).replace(/</g,'\\u003c')+'</script></head><body class="'+(home?'home':'inner-page')+'">'+header(p)+'<main id="contenu" tabindex="-1">'+hero(p)+article(p)+(home || p.slug==='consultation'?'':cta())+'</main>'+footer()+'</body></html>';
  const $=cheerio.load(html);
  const theme=options.theme || c.theme || 'horizon';
  if(theme==='signature'){
    $('link[rel="stylesheet"]').attr('href','assets/css/coda-signature.css');
    $('meta[name="theme-color"]').attr('content','#0a0a0a');
    $('link[rel="icon"]').attr('href','assets/img/monogramme-signature.svg');
    if(home){
      $('.hero-picture source').attr({srcset:'assets/img/portrait-640.webp 640w',sizes:'90vw'});
      $('.hero-picture img').attr({src:'assets/img/portrait.webp',srcset:'assets/img/portrait-640.webp 640w, assets/img/portrait.webp 1100w',sizes:'(max-width: 760px) 90vw, 42vw',width:'1100',height:'1375'});
    }
  }
  if(home && c.prototype && c.compareThemes){
    $('main').prepend('<nav class="style-compare" aria-label="Comparer les ambiances"><div class="container"><span>Comparer les ambiances</span><a href="index.html"'+(theme==='signature'?' aria-current="page"':'')+'>Signature Coda · Noir &amp; champagne</a><a href="horizon.html"'+(theme==='horizon'?' aria-current="page"':'')+'>Horizon · Vert &amp; ivoire</a></div></nav>');
  }
  if(home && theme==='horizon'){
    $('meta[name="robots"]').attr('content','noindex, nofollow');
  }
  $('head').append('<link rel="stylesheet" href="assets/css/patient.css">');
  if(theme==='serenite'){
    $('link[rel="stylesheet"]').first().remove();
    $('head').append('<link rel="stylesheet" href="assets/css/coda-serenite.css">');
    $('meta[name="theme-color"]').attr('content','#F8F6F2');
    $('meta[property="og:image"]').attr('content',c.origin+'/assets/img/portrait-sauge.webp');
    $('link[rel="icon"]').attr({href:'assets/img/logo-coda.webp',type:'image/webp'});
  }
  const photo = JSON.parse(fs.readFileSync(path.join(ROOT,'custom/menu.json'),'utf8')).accueil?.photo;
  if (photo?.fichier && photo.fichier !== 'portrait-b65baa3ddb.jpg') {
    $('img[src*="mattia-coda.webp"],img[src*="mattia-coda-small.webp"]').each((i,el)=>{
      $(el).attr('src','assets/medias/'+path.basename(photo.fichier)).removeAttr('srcset').removeAttr('sizes');
      if ($(el).attr('alt')) $(el).attr('alt',photo.alt || 'Mattia Coda');
    });
  }
  if(p.slug==='404') $('meta[name="robots"]').attr('content','noindex, nofollow');
  const city = Object.keys(c.byCity).find(name => p.slug.endsWith('-' + name.toLowerCase()));
  if(city && c.byCity[city]) $('a[href]').each((i,el)=>{if($(el).attr('href')===c.doctolib) $(el).attr('href', c.byCity[city]);});
  const seen=new Set();
  $('[id]').each((i,el)=>{const id=$(el).attr('id');if(seen.has(id))$(el).removeAttr('id');else seen.add(id);});
  $('a[href]').each((i,el)=>{const a=$(el);a.attr('href',localLink(a.attr('href')));});
  return $.html();
}
module.exports={rendrePage,fileFor,cityCards,allPages};
