'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const cheerio=require('cheerio');
const root=path.resolve(__dirname,'../..');
const {rendrePage}=require(path.join(root,'tools/lib/templates/refonte'));
const read=slug=>JSON.parse(fs.readFileSync(path.join(root,'content',slug+'.json'),'utf8'));
const normal=html=>cheerio.load(String(html||''),null,false).text().replace(/\s+/g,' ').trim();
function fragments(b){
 switch(b.type){
  case 'group':return (b.blocks||[]).flatMap(fragments);
  case 'text':case 'html':case 'heading':return [b.html];
  case 'note':return [b.title,b.html];
  case 'list':return b.items||[];
  case 'faq':return (b.items||[]).flatMap(i=>[i.question,i.answer]);
  case 'cards':return (b.items||[]).flatMap(i=>[i.title,i.html]);
  case 'chrono':return (b.items||[]).flatMap(i=>[i.badge,i.html]);
  case 'table':return [...(b.head||[]),...(b.rows||[]).flat()];
  case 'villes':case 'buttons':return []; // Modules de navigation, conservés dans l'original archivé.
  default:throw Error('Type original non couvert : '+b.type);
 }
}
test('Le guide propose deux lectures et garde les détails techniques fermés sans JavaScript',()=>{
 const {document}=parseHTML(rendrePage(read('rhinoplastie_v3')));
 const technical=document.querySelector('#details-techniques');assert(technical);
 assert(!technical.hasAttribute('open'));assert(document.querySelector('.reading-levels a[href="#details-techniques"]'));
 assert.equal(document.querySelectorAll('.technical-details details[open]').length,0);
 assert(document.querySelector('#tech-anatomie').textContent.includes('Cartilages alaires'));
 assert(document.querySelector('#tech-voies').textContent.includes('Voie ouverte'));
});
test('Les originaux des 28 pages restent byte à byte identiques aux empreintes du ZIP importé',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'sources-originales/manifest.json'),'utf8'));
 assert.equal(manifest.files.length,28);
 for(const record of manifest.files){
  const bytes=fs.readFileSync(path.join(root,'sources-originales/content',record.file));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),record.sha256,record.file);
 }
});
test('Les 18 pages de prise en charge reprennent chaque fragment technique sélectionné sans réécriture',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'sources-originales/manifest.json'),'utf8'));
 assert.equal(Object.keys(manifest.technicalPages).length,18);
 let count=0;let sections=0;
 for(const [slug,selection] of Object.entries(manifest.technicalPages)){
  const original=JSON.parse(fs.readFileSync(path.join(root,'sources-originales/content',selection.file),'utf8'));
  const $=cheerio.load(rendrePage(read(slug)));
  assert($('#details-techniques').length,slug);
  assert(normal($('#details-techniques .technical-intro').html()).includes(normal(original.hero.lead)),slug+' introduction');
  for(const id of selection.sections){
   sections++;const section=original.sections.find(s=>s.id===id);const target=$('#tech-'+id);assert(target.length,slug+' '+id);
   const rendered=normal(target.html());
   for(const fragment of [section.title,section.eyebrow,...section.blocks.flatMap(fragments)].filter(Boolean)){
    const expected=normal(fragment);assert(rendered.includes(expected),slug+' / '+id+' : '+expected.slice(0,90));count++;
   }
  }
 }
 assert(count>300,'Couverture des paragraphes, listes, questions et réponses');
 fs.writeFileSync(path.join(root,'docs/preuves/fidelite-technique.json'),JSON.stringify({date:new Date().toISOString(),pages:18,sections,fragments:count,allFragmentsPreserved:true,originalFiles:28,method:'Empreintes SHA-256 des JSON sources et présence de chaque fragment textuel normalisé dans sa rubrique rendue. Hors modules de navigation/coordonnées explicitement exclus du niveau technique.'},null,2)+'\n');
});
test('Une ancre technique ouvre ses deux niveaux et Tout afficher inclut les FAQ techniques',()=>{
 const {document,window}=parseHTML(rendrePage(read('rhinoplastie_v3')));const events={};let focused;
 window.HTMLElement.prototype.focus=function(){focused=this;};window.HTMLElement.prototype.scrollIntoView=function(){};
 const location={hash:'#tech-anatomie'};
 vm.runInNewContext(fs.readFileSync(path.join(root,'assets/js/reading.js'),'utf8'),{document,location,window:{addEventListener:(name,fn)=>events[name]=fn}});
 assert(document.querySelector('#details-techniques').hasAttribute('open'));
 assert(document.querySelector('#tech-anatomie').hasAttribute('open'));assert.equal(focused,undefined);
 location.hash='#tech-voies';events.hashchange();assert.equal(focused,document.querySelector('#tech-voies > summary'));
 const button=document.querySelector('[data-reading-toggle]');button.click();
 assert([...document.querySelectorAll('.technical-details details')].every(d=>d.hasAttribute('open')));
 button.click();assert.equal(document.querySelectorAll('.technical-details[open], .technical-details details[open]').length,0);
});
