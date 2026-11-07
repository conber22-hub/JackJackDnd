// Run after: npm run dev -- --host 0.0.0.0
// BROWSER_PATH may select another official Chromium installation.
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const base=process.env.ROAD_WATCHES_URL || 'http://localhost:5173',out=new URL('../docs/road-watches/evidence/',import.meta.url);mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto(base+'/previews/road-watches/?quality=low');await page.waitForFunction(()=>window.ready,null,{timeout:60000});
const report=await page.evaluate(()=>({models:validation.loaded,shortcut:RoadWatches.shortcutProof(),nativeRenderer:true,threeRevision:'169'}));
if(report.models.length!==36 || report.shortcut.before!==8 || report.shortcut.after!==6)throw Error('Loader or shortcut proof failed.');
report.views=[];
for(const [width,height,label] of [[1280,900,'desktop'],[390,844,'mobile']]){
 await page.setViewportSize({width,height});
 for(const mode of ['fork','woods','berez'])for(const view of ['forward','reverse']){
  await page.evaluate(({mode,view})=>RoadWatches.set({mode,view,discovered:false,quality:'low',stage:mode==='woods'?'established':'early',treatment:mode==='berez'?'wet':'dry'}),{mode,view});
  if(mode==='fork'){
   const before=await page.evaluate(()=>current.visible.some(p=>p.asset==='root-opening'));if(before)throw Error('Unreached opening leaked.');
   const walked=await page.evaluate(()=>RoadWatches.walkToFork());if(!walked)throw Error('Native route to fork is blocked.');
   const after=await page.evaluate(()=>current.visible.some(p=>p.asset==='root-opening'));if(!after)throw Error('Showcase root frame absent after discovery.');
  }
  await page.waitForTimeout(200);const name=`${mode}-${view}-${label}.jpg`;await page.screenshot({path:new URL(name,out).pathname,type:'jpeg',quality:83});
  report.views.push(await page.evaluate(({mode,view,width})=>({mode,view,width,seed:current.plan.seed,assets:current.visible.length,opening:current.visible.some(p=>p.asset==='root-opening'),weather:document.querySelector('#status').textContent}),{mode,view,width}));
 }
}
// Clear all exploration data: no record of any unseen landmark is in player output.
report.unknownBook=await page.evaluate(async()=>{const m=await import('/src/engine/road-exploration.js');return m.trailsForPlayers(m.newRoadExploration('road-watches-01'),['vallaki']);});
if(report.unknownBook.places.length || report.unknownBook.roads.length)throw Error('Unknown topology leaked.');
// Medium/high/ultra smoke renders use native quality controls and renderer.
for(const quality of ['medium','high','ultra']){await page.evaluate(q=>RoadWatches.set({quality:q,mode:'fork',stage:'advanced',treatment:'infected'}),quality);await page.waitForTimeout(200);}
// Labeled contact-sheet inputs from the actual Three.js loader, not mock renders.
await page.setViewportSize({width:320,height:280});await page.addStyleTag({content:'header{display:none}'});
const ids=report.models.map(m=>m.id);
for(const id of ids){await page.evaluate(id=>RoadWatches.gallery(id),id);await page.waitForTimeout(50);await page.screenshot({path:`/tmp/road-watches-${id}.jpg`,type:'jpeg',quality:90});}
report.errors=errors;report.physicalDevice=false;report.deviceNote='390×844 Chromium viewport; no physical phone tested.';report.renderer=await page.evaluate(()=>document.querySelector('canvas').getContext('webgl2')?.getParameter(0x1f01));
writeFileSync(new URL('browser-validation.json',out),JSON.stringify(report,null,2)+'\n');await browser.close();if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({loaded:report.models.length,views:report.views.length,errors:errors.length}));
