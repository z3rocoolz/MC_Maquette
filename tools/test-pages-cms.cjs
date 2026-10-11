#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {articles,articleFile,markdownToHtml,richTextToHtml,validUrl,overlaysForPages,applyPageOverlay} = require('./lib/cms-content');
const root=path.resolve(__dirname,'..');
const folder=path.join(root,'content','articles');
const candidate=path.join(folder,'coda-test-temporaire.json');
assert.equal(articles().length,0,'Le brouillon livré ne doit pas être publié');
assert.equal(overlaysForPages().size,38,'38 contenus éditoriaux préparés');
const p=JSON.parse(fs.readFileSync(path.join(root,'content','rhinoplastie-primaire.json'),'utf8'));
const before=JSON.stringify(p.sections);
const changed=applyPageOverlay(p,overlaysForPages());
assert.equal(changed.hero.title,p.hero.title,'Titres conservés');
assert.equal(JSON.stringify(changed.sections),before,'Textes techniques conservés');
assert.equal(validUrl('javascript:alert(1)'), '');
assert.equal(validUrl('//fake.example','image'), '');
assert.equal(validUrl('/assets/uploads/photo.webp',true),'assets/uploads/photo.webp');
const output=markdownToHtml('## Sujet\n\nTexte **important** avec [lien](https://example.org).\n\n- point 1\n- point 2\n\n![photo](/assets/uploads/photo.webp)');
assert.match(output,/<h3>Sujet<\/h3>/);
assert.match(output,/<strong>important<\/strong>/);
assert.match(output,/<ul>.*<li>point 1<\/li>/s);
assert.match(output,/<img src="assets\/uploads\/photo.webp"/);
assert.doesNotMatch(markdownToHtml('[x](javascript:alert)'),/href="javascript:/);
assert.equal(richTextToHtml('<p><strong>Édité</strong></p>'),'<p><strong>Édité</strong></p>');
try {
 fs.writeFileSync(candidate,JSON.stringify({titre:'Exemple',date:'2026-10-11',resume:'Un essai',publie:true,contenu:'## Présentation\n\nTexte.'}));
 const published=articles();
 assert.equal(published.length,1);
 assert.equal(articleFile(published[0]),'actualite-coda-test-temporaire.html');
 fs.writeFileSync(candidate,JSON.stringify({titre:'Exemple',date:'2026-10-11',publie:false}));
 assert.equal(articles().length,0,'Un article non publié doit disparaître du build');
} finally { if(fs.existsSync(candidate)) fs.unlinkSync(candidate); }
console.log('Tests Pages CMS OK : articles brouillon/publié, titre, SEO, images, Markdown, 38 overlays.');
