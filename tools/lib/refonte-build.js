'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {rendrePage, fileFor, allPages} = require('./templates/refonte');
const {articles, articleFile, escapeHtml} = require('./cms-content');
const ROOT = path.resolve(__dirname, '../..');
const DIST = path.join(ROOT, 'dist');
function assets() {
  fs.mkdirSync(DIST, {recursive:true});
  const previous=path.join(ROOT,'maquettes-precedentes');
  if(fs.existsSync(previous))fs.cpSync(previous,path.join(DIST,'maquettes-precedentes'),{recursive:true});
  const files={
    css:['coda.css','coda-signature.css','patient.css','coda-serenite.css'],
    js:['coda.js','patient.js','reading.js'],
    img:['logo-coda.webp','portrait-sauge.webp','portrait-sauge-640.webp','horizon.webp','horizon-mobile.webp','portrait.webp','portrait-640.webp','mattia-coda.webp','mattia-coda-small.webp','cabinet.webp','consultation.webp','monogramme.svg','monogramme-signature.svg','img-79b1e66c8733.jpg','img-b65baa3ddbea.jpg','doctolib-logo.png'],
    fonts:['manrope.woff2','editorial-regular.woff2','editorial-italic.woff2','manrope-OFL.txt','cormorantgaramond-OFL.txt']
  };
  for(const [folder,names] of Object.entries(files)){
    fs.mkdirSync(path.join(DIST,'assets',folder), {recursive:true});
    for(const name of names){
      const source=path.join(ROOT,'assets',folder,name);
      if(fs.existsSync(source))fs.copyFileSync(source,path.join(DIST,'assets',folder,name));
    }
  }
  // Images ajoutées via Pages CMS : seules les images sont exposées dans dist/.
  const uploads = path.join(ROOT, 'assets', 'uploads');
  if (fs.existsSync(uploads)) {
    function copyUploads(from, to) {
      fs.mkdirSync(to, {recursive:true});
      for (const entry of fs.readdirSync(from, {withFileTypes:true})) {
        if (entry.isSymbolicLink()) continue;
        if (entry.isDirectory()) copyUploads(path.join(from,entry.name), path.join(to,entry.name));
        else if (entry.isFile() && /\.(jpe?g|png|gif|webp|avif)$/i.test(entry.name)) {
          fs.copyFileSync(path.join(from,entry.name),path.join(to,entry.name));
        }
      }
    }
    copyUploads(uploads,path.join(DIST,'assets','uploads'));
  }
  const photo=JSON.parse(fs.readFileSync(path.join(ROOT,'custom/menu.json'),'utf8')).accueil?.photo;
  if(photo?.fichier && photo.fichier!=='portrait-b65baa3ddb.jpg'){
    const filename=path.basename(photo.fichier);
    const source=path.join(ROOT,'medias',filename);
    if(fs.existsSync(source)){
      fs.mkdirSync(path.join(DIST,'assets/medias'),{recursive:true});
      fs.copyFileSync(source,path.join(DIST,'assets/medias',filename));
    }
  }
}
function writePage(page) {
  fs.mkdirSync(DIST, {recursive:true});
  const html=rendrePage(page);
  const filename=fileFor(page);
  fs.writeFileSync(path.join(DIST,filename),html);
  if(page.url==='/') fs.writeFileSync(path.join(DIST,'horizon.html'),rendrePage(page));
  if(filename!==page.slug+'.html')fs.writeFileSync(path.join(DIST,page.slug+'.html'),html);
  return {fichier:path.join(DIST,filename),octets:Buffer.byteLength(html),ecarts:[]};
}
function formatDate(value) {
  return new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z'));
}
function listHtml(items, limit) {
  const selected = typeof limit === 'number' ? items.slice(0,limit) : items;
  if (!selected.length) return '<p>Aucun article publié pour le moment. Retrouvez les guides sur les interventions dans la rubrique Rhinoplastie.</p>';
  return '<div class="cms-article-list">'+selected.map(a=>
    '<article class="cms-article-card">'+
      (a.cover?'<a href="'+articleFile(a)+'"><img src="'+escapeHtml(a.cover)+'" alt="'+escapeHtml(a.alt)+'" loading="lazy"></a>':'')+
      '<div><time datetime="'+a.date+'">'+formatDate(a.date)+'</time>'+
      '<h2><a href="'+articleFile(a)+'">'+escapeHtml(a.title)+'</a></h2>'+
      (a.summary?'<p>'+escapeHtml(a.summary)+'</p>':'')+
      '<a class="text-link" href="'+articleFile(a)+'">Lire l’article <span aria-hidden="true">↗</span></a></div></article>'
  ).join('')+'</div>';
}
function cmsPages() {
  const news = articles();
  const index = {
    slug:'actualites',url:'/actualites/',medical:false,
    seo:{title:'Articles et actualités | Dr Mattia Coda',description:'Actualités, informations et articles du Dr Mattia Coda. Contenus relus et validés par le praticien.'},
    hero:{title:'Articles & actualités',eyebrow:'Pour mieux comprendre',lead:'Des informations et des repères à consulter avant votre rendez-vous.'},
    sections:[{id:'articles',variant:'composition',blocks:[{html:listHtml(news)}]}]
  };
  const posts = news.map(a=>({
    slug:'actualite-'+a.slug,url:'/actualite-'+a.slug+'/',medical:true,
    seo:{title:a.seoTitle,description:a.seoDescription},
    hero:{title:escapeHtml(a.title),lead:a.summary,eyebrow:'Article · '+formatDate(a.date)},
    sections:[{id:'article',title:'Lire l’article',blocks:[
      ...(a.cover?[{type:'html',html:'<p><img class="cms-article-cover" src="'+escapeHtml(a.cover)+'" alt="'+escapeHtml(a.alt)+'" loading="lazy"></p>'}]:[]),
      {type:'html',html:a.html},
      {type:'html',html:'<p><a href="actualites.html">← Tous les articles</a></p>'}
    ]}]
  }));
  return {index, posts, news};
}
function packageSite() {
  const config=JSON.parse(fs.readFileSync(path.join(ROOT,'custom/refonte.json'),'utf8'));
  const {index,posts}=cmsPages();
  const pages=[...allPages(),index,...posts];
  const urls=pages.map(p=>config.origin.replace(/\/$/,'')+'/'+(p.url==='/'?'':fileFor(p)));
  fs.writeFileSync(path.join(DIST,'robots.txt'),config.prototype?'User-agent: *\nDisallow: /\n':'User-agent: *\nAllow: /\nSitemap: '+config.origin+'/sitemap.xml\n');
  fs.writeFileSync(path.join(DIST,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(url=>'<url><loc>'+url+'</loc></url>').join('')+'</urlset>');
  const rules=['Options -Indexes','DirectoryIndex index.html','ErrorDocument 404 /404.html','RewriteEngine On',...pages.filter(p=>p.output).map(p=>'RewriteRule ^'+p.slug+'\\.html$ /'+fileFor(p)+' [R=301,L]'),'RewriteCond %{REQUEST_FILENAME} -f [OR]','RewriteCond %{REQUEST_FILENAME} -d','RewriteRule ^ - [L]'];
  pages.filter(p=>p.url!=='/').forEach(p=>rules.push('RewriteRule ^'+p.url.replace(/^\/|\/$/g,'')+'/?$ /'+fileFor(p)+' [R=301,L]'));
  fs.writeFileSync(path.join(DIST,'.htaccess'),rules.join('\n')+'\n');
  // Cloudflare Pages utilise ces fichiers (et non .htaccess).
  fs.writeFileSync(path.join(DIST,'_headers'), '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n');
  fs.writeFileSync(path.join(DIST,'_redirects'), '/actualites/ /actualites.html 301\n');
  const notFound={slug:'404',url:'/404/',seo:{title:'Page introuvable | Mattia Coda',description:'Retrouver les informations et les pages du site de Mattia Coda.'},hero:{title:'Retrouvons votre chemin.',lead:'Cette page n’existe pas, ou son adresse a changé.'},sections:[{title:'Continuer votre visite',blocks:[{type:'html',html:'<p><a href="index.html">Revenir à l’accueil</a> ou <a href="competences.html">explorer les compétences de Mattia Coda</a>.</p>'}]}]};
  // Une erreur peut être servie à n'importe quelle profondeur d'URL.
  fs.writeFileSync(path.join(DIST,'404.html'),rendrePage(notFound).replace('<head>','<head><base href="/">'));
  return pages.length;
}
function build() {
  // Impératif pour qu'un article dépublié ne subsiste PAS en production.
  fs.rmSync(DIST, {recursive:true,force:true});
  assets();
  const pages = allPages();
  const {index, posts, news}=cmsPages();
  if(news.length) {
    const home=pages.find(p=>p.url==='/');
    if(home) home.sections=[...(home.sections||[]),{variant:'composition',blocks:[{html:'<section class="cms-home-news container" aria-labelledby="cms-news-title"><div class="cms-home-news-heading"><div><p class="eyebrow">Actualités</p><h2 id="cms-news-title">Les dernières publications</h2></div><a class="text-link" href="actualites.html">Tous les articles →</a></div>'+listHtml(news,3)+'</section>'}]}];
  }
  for(const page of [...pages,index,...posts])writePage(page);
  const count=packageSite();
  console.log(count+' pages de contenu, leurs alias et la page 404 générés dans dist/.');
  return count;
}
module.exports={ROOT,DIST,assets,writePage,packageSite,build};
