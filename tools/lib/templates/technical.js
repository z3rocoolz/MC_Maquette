'use strict';
const fs=require('node:fs');
const path=require('node:path');
const cheerio=require('cheerio');
const ROOT=path.resolve(__dirname,'../../..');
const SOURCE=path.join(ROOT,'sources-originales');
function manifest(){return JSON.parse(fs.readFileSync(path.join(SOURCE,'manifest.json'),'utf8'));}
function renderTechnical(page, api){
  const selections=manifest().technicalPages;
  const selection=selections[page.slug];
  if(!selection)return '';
  if(!/^[a-z0-9_-]+\.json$/.test(selection.file))throw Error('Nom de source technique invalide');
  const source=JSON.parse(fs.readFileSync(path.join(SOURCE,'content',selection.file),'utf8'));
  // Les coordonnées et commandes de navigation sont conservées dans l’archive,
  // mais ne font pas partie du texte clinique présenté ici.
  const renderBlock=b=>{
    if(['villes','buttons'].includes(b.type))return '';
    if(b.type==='group')return '<div class="content-group">'+(b.blocks||[]).map(renderBlock).join('')+'</div>';
    return api.block(b);
  };
  const pages=api.allPages();
  const selectionsByFile=new Map(pages.filter(p=>selections[p.slug]).flatMap(p=>[[api.fileFor(p),selections[p.slug]],[p.slug+'.html',selections[p.slug]]]));
  const ownFile=api.fileFor(page);
  const body=selection.sections.map(id=>{
    const section=source.sections.find(s=>s.id===id);
    if(!section)throw Error('Rubrique technique introuvable : '+page.slug+' / '+id);
    const $=cheerio.load((section.blocks||[]).map(renderBlock).join(''),null,false);
    $('h2,h3').each((i,e)=>{e.tagName='h4';});
    const internalIds=new Map();
    $('[id]').each((i,e)=>{const old=$(e).attr('id'),scoped='tech-'+id+'-'+old;internalIds.set(old,scoped);$(e).attr('id',scoped);});
    $('a[href]').each((i,e)=>{
      const a=$(e),href=a.attr('href');
      if(/^(?:https?:|mailto:|tel:)/.test(href)||!href.includes('#'))return;
      const [file,anchor]=href.split('#');
      if(!file && internalIds.has(anchor)){a.attr('href','#'+internalIds.get(anchor));return;}
      const selected=selectionsByFile.get(file||ownFile);
      if(selected?.sections.includes(anchor))a.attr('href',file+'#tech-'+anchor);
      else if(file && !selected)a.attr('href',file); // Anciennes ancres locales devenues des pages de consultation.
    });
    return '<details class="technical-section" id="tech-'+api.esc(id)+'" data-technical-section><summary><h3>'+api.esc(api.plain(section.title))+'</h3></summary><div class="technical-section-body">'+(section.eyebrow?'<p class="eyebrow">'+api.esc(api.plain(section.eyebrow))+'</p>':'')+$.html().replace(/[ \t]+$/gm,'')+'</div></details>';
  }).join('');
  return '<details class="reading-section reading-disclosure technical-details" id="details-techniques" data-reading-section><summary><h2>Détails techniques de l’intervention</h2></summary><div class="reading-content technical-content"><p class="technical-attribution">Textes d’origine du Dr Mattia Coda</p><p class="technical-intro">'+api.esc(api.plain(source.hero?.lead||''))+'</p><p class="technical-help">Choisissez une rubrique pour approfondir.</p>'+body+'</div></details>';
}
module.exports={renderTechnical};
