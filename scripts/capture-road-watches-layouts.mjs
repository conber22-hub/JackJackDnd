// Review fixtures use exactly the browser showcase function and native layout builder.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {showcase,shortcutProof,SEED} from '../previews/road-watches/showcases.js';
import {layoutFloor} from '../src/engine/generator.js';
import {planRoadWatches} from '../src/engine/road-watches.js';
const manifest=JSON.parse(readFileSync(new URL('../public/assets/road-watches/manifest.json',import.meta.url)));
const examples=['fork','woods','berez'].map(name=>{const s=showcase(name),f=layoutFloor(0,40,40,s.spec,null,true),plan=planRoadWatches(f,s.spec,manifest,{seed:SEED,discovered:name==='fork',stage:name==='woods'?'established':'early'});return {name,seed:SEED,context:s.context,layoutSha256:createHash('sha256').update(JSON.stringify(s.spec.layout)).digest('hex'),spec:s.spec,plan};});
writeFileSync(new URL('../docs/road-watches/showcases.json',import.meta.url),JSON.stringify({note:'DM/review fixtures; never a player payload',shortcut:shortcutProof(),examples},null,2)+'\n');
