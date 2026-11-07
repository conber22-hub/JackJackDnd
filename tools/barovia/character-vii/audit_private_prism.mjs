/* Usage: node tools/barovia/character-vii/audit_private_prism.mjs /local/private/export.prism
   Only prints counts and original class names. Does not write files or transmit data. */
import { readFile } from 'node:fs/promises';
import { inspectPrism, proposePrismClass } from '../../../src/engine/barovia-prism-bridge.js';
const path=process.argv[2];if(!path){console.error('Usage: node audit_private_prism.mjs path/to/private.prism');process.exitCode=2;}
else try{
 const raw=await readFile(path,'utf8'),data=JSON.parse(raw),audit=inspectPrism(data);
 console.log(JSON.stringify({counts:audit.counts,selectableFeats:audit.selectableFeats,featTypes:audit.featTypes,
  additionalClasses:audit.additionalClasses.map(x=>({name:x.name,kind:x.kind,hitDie:x.hitDie,spellTable:x.spellTable})),
  candidateWarnings:audit.additionalClasses.map(x=>proposePrismClass(data.classes.find(c=>c.name===x.name)).warning),
  note:'No source text copied or exported. These extra classes are NOT battle-automated.'},null,2));
}catch(e){console.error('Audit failed:',e.message);process.exitCode=1;}
