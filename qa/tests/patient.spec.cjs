const {test,expect}=require('@playwright/test');
const AxeBuilder=require('@axe-core/playwright').default;
const fs=require('node:fs'),path=require('node:path');
// Les fichiers canoniques sont déduits des contenus, sans importer le moteur du site.
const pages=fs.readdirSync(path.resolve(__dirname,'../../content')).filter(f=>f.endsWith('.json')&&!f.startsWith('_')).map(f=>{
 const p=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../content',f),'utf8'));
 return p.url==='/'?'index.html':p.output|| (p.slug==='rhinoplastie_v3'?'rhinoplastie.html':p.slug+'.html');
});
for(const file of pages){
 test(file+' : axe et absence de débordement à 320 px',async({page})=>{
  await page.setViewportSize({width:320,height:800});await page.goto('/'+file);await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
  expect(scan.violations).toEqual([]);
 });
}
test('Menu : clavier, Échap et focus',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 const menu=page.getByRole('button',{name:'Menu',exact:true});
 await menu.focus();await page.keyboard.press('Enter');await expect(menu).toHaveAttribute('aria-expanded','true');
 await page.keyboard.press('Escape');await expect(menu).toBeFocused();await expect(menu).toHaveAttribute('aria-expanded','false');
});
test('Fiche : cases natives, statut et styles d’impression',async({page})=>{
 await page.goto('/preparer-consultation.html');await page.locator('[data-consult-check]').first().check();
 await expect(page.getByRole('status')).toContainText('1 sur 9');
 await page.emulateMedia({media:'print'});await expect(page.locator('.consult-checklist')).toBeVisible();
 await expect(page.locator('.site-header')).toBeHidden();
});
test('Sans JavaScript : accès aux informations',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
 await page.goto('http://127.0.0.1:4173/');await expect(page.locator('.home-shortcuts a')).toHaveCount(4);
 await page.goto('http://127.0.0.1:4173/rhinoplastie.html');
 await page.locator('#risques > summary').click();
 await expect(page.locator('#risques .reading-content')).toBeVisible();
 await context.close();
});

test('Rubriques : ancre, clavier et ouverture globale',async({page})=>{
 await page.goto('/rhinoplastie.html#risques');
 await expect(page.locator('#risques')).toHaveAttribute('open','');
 const summary=page.locator('#risques > summary');await summary.focus();await page.keyboard.press('Enter');
 await expect(page.locator('#risques')).not.toHaveAttribute('open','');
 await page.getByRole('button',{name:'Tout afficher',exact:true}).click();
 await expect(page.locator('[data-reading-section]:not([open])')).toHaveCount(0);
 await page.getByRole('button',{name:'Tout replier',exact:true}).click();
 await expect(page.locator('[data-reading-section][open]')).toHaveCount(0);
});
test('Détails techniques : accès direct, deux niveaux et lecture sans réécriture',async({page})=>{
 await page.goto('/rhinoplastie.html');
 await expect(page.locator('#details-techniques')).not.toHaveAttribute('open','');
 await page.locator('.reading-levels a[href="#details-techniques"]').click();
 await expect(page.locator('#details-techniques')).toHaveAttribute('open','');
 const anatomy=page.locator('#tech-anatomie > summary');await anatomy.focus();await page.keyboard.press('Enter');
 await expect(page.locator('#tech-anatomie .technical-section-body')).toBeVisible();
 await page.goto('/blepharoplastie.html#tech-transconjonctivale');
 await expect(page.locator('#details-techniques')).toHaveAttribute('open','');
 await expect(page.locator('#tech-transconjonctivale .technical-section-body')).toBeVisible();
});
