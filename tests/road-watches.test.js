import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {VALLEY_ROADS} from '../src/data/barovia-map.js';
import {newRoadExploration,branchingJourneySpecs,discoverTrailhead,trailOptions,trailLegSpecs,completeTrailLeg} from '../src/engine/road-exploration.js';
import {layoutFloor} from '../src/engine/generator.js';
import {planRoadWatches,roadWatchesForPlayers,assetCells,roadReservations} from '../src/engine/road-watches.js';
const manifest=JSON.parse(readFileSync(new URL('../public/assets/road-watches/manifest.json',import.meta.url)));
const key=([x,y])=>`${x},${y}`;
test('36 original GLBs have distinct content, six per family and measured metadata',()=>{
 assert.equal(manifest.assets.length,36);const hashes=new Set(),families={};for(const a of manifest.assets){families[a.family]=(families[a.family] || 0)+1;const bytes=readFileSync(new URL('../public'+a.file,import.meta.url));assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);assert.equal(bytes.length,a.fileSize);assert.ok(a.triangles>0 && a.triangles<4000);assert.ok(a.pivot.every(v=>v===0));assert.ok(Math.abs(a.bounds.min[1])<.0001);hashes.add(createHash('sha256').update(bytes).digest('hex'));}
 assert.equal(hashes.size,36);assert.ok(Object.values(families).every(n=>n===6));assert.equal(readdirSync(new URL('../public/assets/road-watches',import.meta.url)).filter(n=>n.endsWith('.glb')).length,36);
});
let layouts=0,placed=0;
function verify(spec,seed){const f=layoutFloor(0,40,40,spec,null,true),before=JSON.stringify(f),a=planRoadWatches(f,spec,manifest,{seed,discovered:true}),b=planRoadWatches(f,spec,manifest,{seed,discovered:true});assert.deepEqual(a,b);assert.equal(JSON.stringify(f),before);const {blocked,wet}=roadReservations(f,spec),seen=new Set();
 for(const p of a.placements){const asset=manifest.assets.find(a=>a.id===p.asset);assert.deepEqual(p.cells,assetCells(asset,p.x,p.y,p.rot));for(const [x,y] of p.cells){assert.ok(!blocked.has(`${x},${y}`));assert.ok(!wet.has(`${x},${y}`));assert.ok(!seen.has(`${x},${y}`));seen.add(`${x},${y}`);}for(const [x,y]of p.collision)assert.equal(f.grid[y*40+x],0,`${p.asset} blocks native movement`);if(asset.opening)assert.equal(p.asset,'root-opening');}
 const player=roadWatchesForPlayers(a,{explored:[...seen],discovered:false});assert.ok(player.every(p=>!manifest.assets.find(a=>a.id===p.asset).opening));assert.deepEqual(roadWatchesForPlayers(a,{explored:[],discovered:true}),[]);layouts++;placed+=a.placements.length;
}
test('all eligible roads in both native directions preserve every reserved lane across seeds',()=>{
 for(const road of VALLEY_ROADS.filter(r=>!r.mist && r.a!=='castle' && r.b!=='castle'))for(const seed of ['road-watches-01','wet-road-02','cold-road-03'])for(const [from,to]of [[road.a,road.b],[road.b,road.a]])for(const spec of branchingJourneySpecs(newRoadExploration(seed),{from,to,seed,n:1,gaze:3,bloom:false}))verify(spec,seed);
 assert.ok(layouts>100);assert.ok(placed>1000);console.log(`Placement audit: ${layouts} native maps, ${placed} placements.`);
});
test('side-leg layouts retain their actual spine in either direction; unknown openings stay absent',()=>{
 const seed='road-watches-01',book=discoverTrailhead(newRoadExploration(seed),'r-winery'),from='trail:r-winery:junction',edge=trailOptions(book,from).find(e=>e.sign);const leg=trailLegSpecs(book,{from,edgeId:edge.id});for(const spec of leg.specs)verify(spec,seed);const next=completeTrailLeg(book,{from,edgeId:edge.id});const reverse=trailLegSpecs(next.book,{from:next.at,edgeId:edge.id});assert.equal(reverse.to,from);for(const spec of reverse.specs)verify(spec,seed);
 const spec=branchingJourneySpecs(newRoadExploration(seed),{from:'vallaki',to:'winery',seed,n:1})[0],f=layoutFloor(0,40,40,spec,null,true),p=planRoadWatches(f,spec,manifest,{seed,discovered:false});assert.ok(!p.placements.some(p=>manifest.assets.find(a=>a.id===p.asset).opening));
});
