'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict');
const {test}=require('node:test');
const {parseHTML}=require('linkedom');
const root=path.resolve(__dirname,'../..');
const {rendrePage,fileFor}=require(path.join(root,'tools/lib/templates/refonte'));
test('La fiche de préparation reste utilisable sans JavaScript, puis annonce les cases cochées et imprime',()=>{
 const html=rendrePage({slug:'preparer-consultation',url:'/preparer-consultation/',seo:{title:'Préparer la consultation'},hero:{title:'Préparer la consultation'},sections:[]});
 const {document,window}=parseHTML(html);
 const boxes=[...document.querySelectorAll('[data-consult-check]')];
 assert(boxes.length>=6,'La fiche doit contenir les cases natives de préparation');
 for(const box of boxes){assert.equal(box.type,'checkbox');assert(document.querySelector('label[for="'+box.id+'"]'));}
 assert(!document.querySelector('form'),'Aucune transmission de données');
 assert(document.querySelector('[data-print-checklist]').hidden,'Sans JS : ne pas proposer de bouton inactif');
 let prints=0;
 vm.runInNewContext(fs.readFileSync(path.join(root,'assets/js/patient.js'),'utf8'),{document,window:{print:()=>prints++}});
 assert.equal(document.querySelector('[data-print-checklist]').hidden,false);
 boxes[0].checked=true;boxes[0].dispatchEvent(new window.Event('change',{bubbles:true}));
 assert.match(document.querySelector('[data-checklist-status]').textContent,/^1\s/);
 document.querySelector('[data-print-checklist]').click();assert.equal(prints,1);
 boxes[0].checked=false;boxes[0].dispatchEvent(new window.Event('change',{bubbles:true}));
 assert.match(document.querySelector('[data-checklist-status]').textContent,/^0\s/);
});
test('Les nouvelles pages de lieu utilisent leur adresse de consultation canonique',()=>{
 const p={slug:'rhinoplastie-marseille',output:'consultation-marseille.html',url:'/rhinoplastie-marseille/',seo:{title:'Consultation à Marseille'},sections:[]};
 assert.equal(fileFor(p),'consultation-marseille.html');
 const doc=parseHTML(rendrePage(p)).document;
 assert(doc.querySelector('link[rel="canonical"]').href.endsWith('/consultation-marseille.html'));
 assert(doc.querySelector('a[href="consultation-marseille.html"]'));
});
test('Les liens pratiques conservent leur regroupement et les boutons leur présentation',()=>{
 const p=JSON.parse(fs.readFileSync(path.join(root,'content/informations-pratiques.json'),'utf8'));
 const doc=parseHTML(rendrePage(p)).document;
 assert.equal(doc.querySelectorAll('.practical-links a').length,3);
 assert(doc.querySelector('#rendez-vous a.button'));
});
test('Une adresse de lieu conserve sa sémantique après enregistrement administratif',()=>{
 const {assainir}=require(path.join(root,'admin/src/assainir'));
 assert(assainir('<address>23 rue des Linots</address>','structure').includes('<address>'));
 const editor=parseHTML('<html><body></body></html>');
 const context=vm.createContext({document:editor.document});
 vm.runInContext(fs.readFileSync(path.join(root,'admin/public/admin.js'),'utf8'),context);
 const clean=vm.runInContext('nettoyer',context);
 const zone=editor.document.createElement('div');zone.innerHTML='<address>23 rue des Linots</address>';
 assert(clean(zone).includes('<address>'));
});
