// The same generated layout is viewed from two directions; never generate an
// attractive replacement road. Reverse native journeys are tested separately.
import {newRoadExploration,branchingJourneySpecs,discoverTrailhead,trailOptions,trailLegSpecs,completeTrailLeg,knownRoadRoute} from '../../src/engine/road-exploration.js';
import {TRAIL_SIGNS} from '../../src/data/road-exploration.js';
export const SEED='road-watches-01';
export function showcase(name,seed=SEED){
 let book=newRoadExploration(seed),spec,context={};
 if(name==='woods'){
  book=discoverTrailhead(book,'r-winery');const from='trail:r-winery:junction',edge=trailOptions(book,from).find(o=>o.sign===TRAIL_SIGNS.first);
  const leg=trailLegSpecs(book,{from,edgeId:edge.id,gaze:3,n:1,bloom:false});spec=leg.specs[0];context={from,edge:edge.id,start:leg.start,end:leg.end};
 }else{
  const trip={from:'vallaki',to:name==='berez'?'berez':'winery',seed,n:2,gaze:3,bloom:false},specs=branchingJourneySpecs(book,trip);
  spec=name==='berez'?specs.find(s=>s.layout.riverNote) || specs[0]:specs.find(s=>s.layout.events.some(e=>e.trailhead)) || specs[0];context.trip=trip;
 }
 return {spec,book,context,seed,name};
}
export function shortcutProof(seed=SEED){
 let book=discoverTrailhead(newRoadExploration(seed),'r-winery'),from='trail:r-winery:junction';const before=knownRoadRoute(book,'vallaki','krezk').hours;
 const legs=[];for(const sign of ['first','right','rejoin']){const edge=trailOptions(book,from).find(e=>e.sign===TRAIL_SIGNS[sign]);const leg=trailLegSpecs(book,{from,edgeId:edge.id});legs.push({from,edge:edge.id,to:leg.to,hours:leg.hours});const next=completeTrailLeg(book,{from,edgeId:edge.id});book=next.book;from=next.at;}
 return {before,after:knownRoadRoute(book,'vallaki','krezk').hours,legs};
}
