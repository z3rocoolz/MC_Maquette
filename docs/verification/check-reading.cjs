'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const root=path.resolve(__dirname,'../..');
const {rendrePage}=require(path.join(root,'tools/lib/templates/refonte'));
const page=JSON.parse(fs.readFileSync(path.join(root,'content/rhinoplastie_v3.json'),'utf8'));
function setup(hash=''){
 const {document,window}=parseHTML(rendrePage(page));
 let focused,scrolled;const events={};
 window.HTMLElement.prototype.focus=function(){focused=this;};
 window.HTMLElement.prototype.scrollIntoView=function(){scrolled=this;};
 const location={hash};
 const start=()=>vm.runInNewContext(fs.readFileSync(path.join(root,'assets/js/reading.js'),'utf8'),{document,location,window:{addEventListener:(name,fn)=>events[name]=fn}});
 return {document,window,location,events,start,focused:()=>focused,scrolled:()=>scrolled};
}
test('Le guide garde tous ses textes dans des rubriques HTML natives, accessibles sans script',()=>{
 const s=setup();const details=[...s.document.querySelectorAll('details[data-reading-section]')];
 assert.equal(details.length,page.sections.length+1);assert(details[0].hasAttribute('open'));
 assert.equal(details.filter(d=>d.hasAttribute('open')).length,1);
 assert(details.every(d=>d.querySelector('summary h2')));
 assert(s.document.querySelector('#risques').textContent.includes('infection'));
 assert(s.document.querySelector('[data-reading-toggle]').hidden);
});
test('Une URL ciblant les risques ouvre la rubrique sans déplacer le focus initial',()=>{
 const s=setup('#risques');s.start();
 assert(s.document.getElementById('risques').hasAttribute('open'));
 assert.equal(s.focused(),undefined);assert.equal(s.scrolled().id,'risques');
});
test('Tout afficher, tout replier, puis retour à une ancre avec focus clavier',()=>{
 const s=setup();s.start();const button=s.document.querySelector('[data-reading-toggle]');
 assert(!button.hidden);button.click();
 assert([...s.document.querySelectorAll('[data-reading-section]')].every(d=>d.hasAttribute('open')));
 assert.equal(button.getAttribute('aria-expanded'),'true');button.click();
 assert.equal(s.document.querySelectorAll('[data-reading-section][open]').length,0);
 s.location.hash='#risques';s.events.hashchange();
 assert(s.document.getElementById('risques').hasAttribute('open'));
 assert.equal(s.focused(),s.document.querySelector('#risques > summary'));
});
test('Imprimer ouvre aussi les FAQ puis rétablit exactement la sélection de lecture',()=>{
 const s=setup();const extra=s.document.createElement('details');extra.innerHTML='<summary>Question</summary><p>Réponse</p>';s.document.body.append(extra);s.start();
 const all=[...s.document.querySelectorAll('details')],before=all.map(d=>d.hasAttribute('open'));
 s.events.beforeprint();assert(all.every(d=>d.hasAttribute('open')));
 s.events.afterprint();assert.deepEqual(all.map(d=>d.hasAttribute('open')),before);
});
test('Une ancre mal formée ne casse pas les commandes de lecture',()=>{
 const s=setup('#%E0%A4');s.start();assert(!s.document.querySelector('[data-reading-toggle]').hidden);
});
