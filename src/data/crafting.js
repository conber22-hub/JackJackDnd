/* Includes material from the System Reference Document 5.2.1 by Wizards of the
   Coast LLC, https://www.dndbeyond.com/srd, licensed under CC BY 4.0:
   https://creativecommons.org/licenses/by/4.0/legalcode.
   Changes: catalogue frames composed with original modular crafting rules.
   All other prices, labour and wagon statistics are original table rules. */
import { SRD_WEAPONS, ARMOR_ITEMS } from './srd-items.js';
export const SLOTS = {weapon:['frame','head','grip','material','finish','rune'],armor:['frame','lining','plates','material','finish','rune'],shield:['frame','lining','plates','material','finish','rune'],trinket:['vessel','material','rune'],wagon:['frame','wheels','axle','team','cover','armour','fittings']};
const gear=['weapon','armor','shield','trinket'];
const slug=n=>n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
const part=(id,n,slot,kinds,cost,weight,hours,mods={},extra={})=>({id,n,slot,kinds,cost,weight,hours,needs:{tool:"Smith's Tools",skill:'Str',dc:12,materials:[{id:'stock',qty:1}]},mods,flavour:`${n}, made for hard use in the valley.`,...extra});
export const PARTS = [
 ...SRD_WEAPONS.map(i=>part(`weapon-${slug(i.n)}`,i.n,'frame',['weapon'],i.cost,i.weight,8,{base:i})),
 ...ARMOR_ITEMS.map(i=>part(`armor-${slug(i.n)}`,i.n,'frame',[i.t==='shield'?'shield':'armor'],i.cost,i.weight,16,{base:i})),
 ...['ring','amulet','lantern','charm','flask'].map(n=>part(n,n,'vessel',['trinket'],2,1,2)),
 ...[['iron','Iron',0],['steel','Steel',10],['silvered','Silvered',100],['cold-iron','Cold Iron',20],['bone','Bone',2],['blackwood','Blackwood',10],['adamantine','Adamantine',500]].map(([id,n,c])=>part(id,n,'material',gear,c,0,c>=500?80:4,{material:id})),
 part('blade','Blade','head',['weapon'],5,0,2,{ty:'slashing'}),
 part('hammer','Hammer Head','head',['weapon'],5,1,2,{ty:'bludgeoning'}),
 part('long-haft','Long Haft','head',['weapon'],15,2,6,{property:'R'}),
 part('versatile-grip','Versatile Grip','grip',['weapon'],15,1,4,{property:'V'}),
 part('plain-grip','Plain Grip','grip',['weapon'],1,0,1),
 part('shield-grip','Shield Grip','grip',['weapon'],5,0,2,{shieldGrip:true}),
 part('padded','Padded Lining','lining',['armor','shield'],5,1,2),
 part('riveted','Riveted Plates','plates',['armor','shield'],10,2,4),
 part('polished','Polished','finish',['weapon','armor','shield'],2,0,1),
 ...[1,2,3].map(n=>part(`rune-${n}`,`+${n}`,'rune',['weapon','armor','shield'],[0,1000,5000,20000][n],0,n*80,{bonus:n,rarity:['','rare','very rare','legendary'][n]},{needs:{tool:"Smith's Tools",skill:'Int',dc:15+n*3,materials:[{id:'rune-dust',qty:n}]}})),
 part('embers','of Embers','rune',gear,50,0,8,{light:{bright:20,dim:20},rarity:'common'}),
 part('rustless','of Keeping','rune',gear,50,0,8,{rustless:true,rarity:'common'}),
 ...[['handcart',100,10,15,1,0,1],['cart',300,12,25,2,0,2],['wagon',1000,12,40,4,0,4],['covered-wagon',900,12,45,4,2,5],['vardo',800,13,50,4,4,6]].map(([id,capacity,ac,hp,seats,bunks,slots],i)=>part(id,id.replaceAll('-',' '),'frame',['wagon'],20+i*40,100+i*100,24+i*8,{capacity,ac,hp,seats,bunks,slots,speed:8})),
 ...[['wood-wheels','wheels',10,20,{speed:2}],['iron-wheels','wheels',30,40,{hp:10}],['wood-axle','axle',5,10,{}],['iron-axle','axle',20,20,{capacity:200}],['no-team','team',0,0,{speed:0}],['pony','team',30,0,{speed:10}],['draft-horse','team',50,0,{speed:16}],['oxen','team',60,0,{speed:12,capacity:200}],['no-cover','cover',0,0,{}],['canvas','cover',10,10,{hp:5}],['no-armour','armour',0,0,{}],['planking','armour',20,50,{hp:15,ac:1}],['iron-bands','armour',50,100,{hp:25,ac:2}]].map(([id,slot,c,w,m])=>part(id,id.replaceAll('-',' '),slot,['wagon'],c,w,4,m)),
 ...['lockbox','lantern-hooks','spare-wheel','bunks','smithy-box','salt-barrels','hidden-compartment','ward-runes'].map(id=>part(id,id.replaceAll('-',' '),'fittings',['wagon'],20,10,4,id==='bunks'?{bunks:2}:{})),
].map(p=>p.kinds.includes('wagon')?{...p,needs:{...p.needs,tool:"Carpenter's Tools",skill:'Dex'}}:p);
export const PART_BY_ID=Object.fromEntries(PARTS.map(p=>[p.id,p]));
