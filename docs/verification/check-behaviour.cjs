'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const root=path.resolve(process.env.CODA_SOURCE_ROOT || path.join(__dirname,'../..'));
const appCode=fs.readFileSync(path.join(root,'assets/js/coda.js'),'utf8');
const checks=[];
function check(name,condition){assert(condition,name);checks.push(name);}
function page(name,mobile=true){
 const {document,window}=parseHTML(fs.readFileSync(path.join(root,'dist',name),'utf8'));
 let focused=null;
 window.HTMLElement.prototype.focus=function(){focused=this;};
 window.HTMLElement.prototype.scrollIntoView=function(){};
 const media={matches:mobile,addEventListener(type,fn){this.change=fn;}};
 const context=vm.createContext({document,location:{hash:''},window:{matchMedia:q=>q.includes('1020px')?media:{matches:q.includes('reduced-motion')?true:mobile}}});
 return {document,window,media,focused:()=>focused,start:()=>vm.runInContext(appCode,context)};
}
const home=page('index.html');
check('Accueil compact : quatre accès directs aux autres compétences, sans JavaScript',home.document.querySelectorAll('.home-shortcuts a[href]').length===4);
check('La rhinoplastie conserve son accès principal dès l’accueil',home.document.querySelector('.hero-copy a[href="rhinoplastie.html"]')!==null);
home.start();
const menu=home.document.querySelector('.menu-toggle'),nav=home.document.querySelector('#navigation-principale');
check('Menu mobile fermé au départ',menu.getAttribute('aria-expanded')==='false' && nav.dataset.collapsed==='true');
menu.click();
check('Menu mobile ouvert au clic',menu.getAttribute('aria-expanded')==='true' && nav.dataset.collapsed==='false');
home.document.dispatchEvent(Object.assign(new home.window.Event('keydown'),{key:'Escape'}));
check('Échap ferme le menu et restitue le focus',menu.getAttribute('aria-expanded')==='false' && home.focused()===menu);
home.media.matches=false;home.media.change();
check('Passage au bureau : navigation ouverte, bouton masqué',menu.hidden && nav.dataset.collapsed==='false');
const skills=page('competences.html');
const total=skills.document.querySelectorAll('[data-specialty-category]').length;
check('Sans JavaScript : toutes les compétences sont affichées',skills.document.querySelectorAll('[data-specialty-category]:not([hidden])').length===total&&total>=4);
skills.start();
const filter=skills.document.querySelector('[data-specialty-filter]');
const choose=filter.querySelector('button:not([data-filter="all"])');choose.click();
const visible=[...skills.document.querySelectorAll('[data-specialty-category]:not([hidden])')];
check('Le filtre affiche la bonne compétence et annonce le total',visible.length>0&&visible.every(c=>c.dataset.specialtyCategory===choose.dataset.filter)&&choose.getAttribute('aria-pressed')==='true'&&skills.document.querySelector('[data-filter-status]').textContent.startsWith(String(visible.length)));
filter.querySelector('[data-filter="all"]').click();
check('Le filtre Toutes rétablit toutes les compétences',skills.document.querySelectorAll('[data-specialty-category]:not([hidden])').length===total);

// L'éditeur riche et le filtre serveur sont exercés sur les vraies compositions.
const {assainir}=require(path.join(root,'admin/src/assainir'));
const {champsDeLaPage,lireChemin,ecrireChemin}=require(path.join(root,'admin/src/formulaire'));
const {rendrePage}=require(path.join(root,'tools/lib/templates/refonte'));
const adminCode=fs.readFileSync(path.join(root,'admin/public/admin.js'),'utf8');
const editor=parseHTML('<html><body></body></html>');
const adminContext=vm.createContext({document:editor.document});
vm.runInContext(adminCode,adminContext);
const nettoyer=vm.runInContext('nettoyer',adminContext);
for(const slug of ['drmattiacoda_v8','competences','consultation','rhinoplastie_v3']){
 const original=JSON.parse(fs.readFileSync(path.join(root,'content',slug+'.json'),'utf8'));
 const edited=JSON.parse(JSON.stringify(original));
 for(const field of champsDeLaPage(edited)){
  const value=lireChemin(edited,field.cle);
  if(!['riche','code'].includes(field.type))continue;
  const zone=editor.document.createElement('div');zone.innerHTML=value||'';
  const client=field.type==='riche'?nettoyer(zone):value;
  const server=assainir(client,'structure');
  ecrireChemin(edited,field.cle,server);
 }
 const before=parseHTML(rendrePage(original)).document;
 const after=parseHTML(rendrePage(edited)).document;
 for(const selector of ['a[href]','img[src]','details','[data-technique-panel]','[data-specialty-category]','svg']){
  check('Administration '+slug+' : conservation de '+selector,before.querySelectorAll(selector).length===after.querySelectorAll(selector).length);
 }
}
check('Le filtre serveur bloque scripts, gestionnaires et protocoles actifs',!/script|onerror|javascript/i.test(assainir('<script>alert(1)</script><img src="javascript:alert(1)" onerror="alert(1)"><a href="java&#9;script:alert(1)">x</a>','structure')));

// Régénération réelle, puis restauration exacte du contenu initial.
const {regenerer}=require(path.join(root,'admin/src/build'));
const file=path.join(root,'content/drmattiacoda_v8.json'),originalBytes=fs.readFileSync(file);
try{
 const edited=JSON.parse(originalBytes);edited.hero.title='Vérification de la régénération';
 fs.writeFileSync(file,JSON.stringify(edited));regenerer(edited.slug);
 const output=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
 check('Une modification du titre dans le contenu est visible après régénération',output.includes('<h1 id="titre-page">Vérification de la régénération</h1>'));
}finally{fs.writeFileSync(file,originalBytes);regenerer('drmattiacoda_v8');}
fs.writeFileSync(path.join(root,'docs/preuves/interactions.json'),JSON.stringify({date:new Date().toISOString(),environment:'DOM simulé avec LinkeDOM, sans navigateur ni lecteur d’écran',checks:checks.length,passed:checks},null,2));
console.log(checks.length+' contrôles d’interactions et de régénération réussis.');
