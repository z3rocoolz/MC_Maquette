#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),cheerio=require('cheerio');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const config=JSON.parse(fs.readFileSync(path.join(root,'custom/refonte.json'),'utf8'));
const problems=[],results=[];
const files=fs.readdirSync(dist).filter(n=>n.endsWith('.html'));
const cache=new Map();
function parse(file){
 if(!cache.has(file)) cache.set(file,cheerio.load(fs.readFileSync(file,'utf8')));
 return cache.get(file);
}
for(const file of files){
 const full=path.join(dist,file),$=parse(full),errors=[];
 if($('html').attr('lang')!=='fr')errors.push('Langue absente');
 if($('h1').length!==1)errors.push('Nombre de h1 : '+$('h1').length);
 if(!$('title').text().trim())errors.push('Titre absent');
 if(!$('meta[name=description]').attr('content'))errors.push('Description absente');
 if(!$('link[rel=canonical]').attr('href')?.startsWith(config.origin))errors.push('Canonique incohérente');
 if(config.prototype&&!$('meta[name=robots]').attr('content')?.includes('noindex'))errors.push('Maquette indexable');
 const ids=new Set();
 $('[id]').each((i,e)=>{const id=$(e).attr('id');if(ids.has(id))errors.push('ID dupliqué : '+id);ids.add(id);});
 $('img').each((i,e)=>{if($(e).attr('alt')===undefined)errors.push('Alternative absente');});
 $('script[type="application/ld+json"]').each((i,e)=>{try{JSON.parse($(e).text());}catch{errors.push('JSON-LD invalide');}});
 $('a[href],img[src],source[srcset],script[src],link[href]').each((i,e)=>{
  const tag=e.tagName, attr=tag==='source'?'srcset':$(e).attr('href')!==undefined?'href':'src';
  const value=$(e).attr(attr);
  const values=attr==='srcset'?value.split(',').map(x=>x.trim().split(' ')[0]):[value];
  for(const value of values){
   if(!value || /^(?:https?:|mailto:|tel:|data:)/.test(value))continue;
   if(/^(javascript:|file:)/.test(value)){errors.push('Protocole incorrect : '+value);continue;}
   const [url,fragment]=value.split('#');
   const resolved=path.resolve(path.dirname(full),decodeURIComponent(url.split('?')[0]||file));
   if(!fs.existsSync(resolved)){errors.push('Fichier absent : '+value);continue;}
   if(fragment&&resolved.endsWith('.html')){
    const target=parse(resolved);
    if(!target('[id]').toArray().some(e=>target(e).attr('id')===decodeURIComponent(fragment)))errors.push('Ancre absente : '+value);
   }
  }
 });
 results.push({page:file,h1:$('h1').text().trim(),images:$('img').length,links:$('a[href]').length,errors});
 problems.push(...errors.map(e=>file+' : '+e));
}
const report={date:new Date().toISOString(),pages:files.length,errors:problems.length,results};
fs.mkdirSync(path.join(root,'docs/preuves'),{recursive:true});
fs.writeFileSync(path.join(root,'docs/preuves/structure.json'),JSON.stringify(report,null,2));
console.log(files.length+' pages contrôlées ; '+problems.length+' anomalies.');
for(const p of problems)console.log(p);
process.exitCode=problems.length?1:0;
