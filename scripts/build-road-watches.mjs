/* Original procedural geometry. No downloaded meshes, textures or generated images.
   Deterministic GLB 2.0 writer; per-material primitives merge all baked geometry. */
import * as T from 'three';
import {mkdirSync,writeFileSync} from 'node:fs';
import {ROAD_WATCHES_ASSETS as ASSETS,ROAD_WATCHES_PALETTE as PALETTE} from '../src/data/road-watches-assets.js';
const OUT=new URL('../public/assets/road-watches/',import.meta.url);mkdirSync(OUT,{recursive:true});
const materials=Object.entries(PALETTE).map(([name,v])=>({name,pbrMetallicRoughness:{baseColorFactor:[...new T.Color(v.color).toArray(),1],metallicFactor:v.metalness || 0,roughnessFactor:v.roughness},...(v.emissive?{emissiveFactor:new T.Color(v.emissive).toArray()}:{}),doubleSided:false}));
const materialNames=Object.keys(PALETTE);
let parts=[];
function add(g,m,x=0,y=0,z=0,rx=0,ry=0,rz=0){g.applyMatrix4(new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(1,1,1)));parts.push({g:g.index?g.toNonIndexed():g,m});}
const box=(x,y,z,w,h,d,m='wood',ry=0,rz=0)=>add(new T.BoxGeometry(w,h,d),m,x,y,z,0,ry,rz);
const rock=(x,y,z,w,h,d,m='stone',turn=0)=>{const g=new T.IcosahedronGeometry(1,0);g.scale(w/2,h/2,d/2);add(g,m,x,y+h/2,z,.08,turn,.1);};
function beam(a,b,r=.075,m='wood',r2=r){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av),g=new T.CylinderGeometry(r2,r,v.length(),6,1);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize()));add(g,m,...av.add(bv).multiplyScalar(.5));}
function lantern(x,y,z,blue=false){box(x,y,z,.23,.3,.23,'iron');box(x,y,z,.17,.2,.17,blue?'blue':'amber');add(new T.ConeGeometry(.2,.14,4),'iron',x,y+.22,z,0,Math.PI/4);beam([x,y+.25,z],[x,y+.44,z],.025,'iron');}
function fence(x,z,w=1.8,cut=false){for(const a of [-w/2,w/2]){box(x+a,.45,z,.13,.9,.14,'wood',0,.08*a);add(new T.ConeGeometry(.11,.15,4),'cut',x+a,.96,z,0,Math.PI/4);}
 for(const y of [.35,.7]){if(cut){beam([x-w/2,y,z],[x-.3,y-.08,z],.05);beam([x+.35,y+.07,z],[x+w/2,y,z],.05);box(x-.24,y-.07,z,.12,.08,.12,'cut',0,.3);}else beam([x-w/2,y,z],[x+w/2,y,z],.05);}}
function slabRing(x,z,r=1){for(let k=0;k<7;k++){const a=k/7*Math.PI*2;rock(x+Math.cos(a)*r,0,z+Math.sin(a)*r,.32,.2,.3,'stone',a);}}
function growth(x,z,height=.8,count=7){for(let k=0;k<count;k++){const a=k*2.399,r=.2+(k%3)*.18,h=height*(.55+(k%4)*.17),xx=x+Math.cos(a)*r,zz=z+Math.sin(a)*r;
 beam([xx,0,zz],[xx+Math.cos(a)*.16,h,zz+Math.sin(a)*.16],.055,'rot',.025);
 add(new T.ConeGeometry(.22+(k%2)*.1,.12,7),'moss',xx+Math.cos(a)*.16,h,zz+Math.sin(a)*.16,.2*Math.sin(a),a,.3);
 if(k%3===0)add(new T.IcosahedronGeometry(.09,0),'pale',xx,h*.7,zz);}}
function rootArch(w=2.7,h=2.6){for(const side of [-1,1]){const x=side*w/2;beam([x,0,0],[x*.95,h*.6,.08],.2,'wood',.15);beam([x*.95,h*.6,.08],[side*.4,h,0],.15,'wood',.08);beam([side*.4,h,0],[0,h+.12,.05],.09,'wood');for(let i=0;i<3;i++)beam([x,0,0],[x+side*(.35+i*.1),.08,(i-1)*.3],.1,'wood',.025);}}
function build(a){const i=a.variant;
 switch(a.id){
 case 'rut-shoulder':for(let k=0;k<9;k++){rock((k%3-.8)*.3,0,(k/3|0)*.5-.6,.45,.1+(k%2)*.05,.7,'earth',k);}for(const x of [-.28,.24])beam([x,.035,-.9],[x,.035,.9],.022,'cut');break;
 case 'eroded-verge':for(let k=0;k<6;k++)rock((k%2)*.36-.2,0,(k/2|0)*.65-.6,.6,.18+k%2*.15,.8,'earth',k*.5);beam([-.42,.2,-.6],[.26,.15,.5],.035,'wood');break;
 case 'split-path':for(const side of [-1,1]){beam([0,.04,-.8],[side*.7,.04,.8],.1,'earth');for(let k=0;k<4;k++)rock(side*(.15+k*.2),0,-.6+k*.4,.18,.08,.22,'chalk',k);}break;
 case 'road-footpath':for(let k=0;k<5;k++)for(let j=0;j<3;j++)if(k<2 || j===1)rock((j-1)*(.36-k*.04),0,(k-2)*.35,.3,.09,.3,'earth',k+j);break;
 case 'ditch-cut':for(const s of [-1,1])for(let k=0;k<5;k++)rock(s*.35,0,(k-2)*.35,.4,.22,.5,'earth',k);box(0,.025,0,.14,.05,1.7,'rot');break;
 case 'cobble-fade':for(let k=0;k<12;k++){const row=k/3|0;rock((k%3-1)*.3,0,(row-1.5)*.38,.25,.08+row*.012,.3,k%5?'stone':'earth',k);}break;
 case 'chipped-mile':rock(0,0,0,.65,1.3,.4,'stone',.15);box(0,.65,.21,.23,.42,.025,'chalk',0,.15);for(let k=0;k<3;k++)box(0,.52+k*.11,.23,.16,.025,.02,'iron');rock(.4,0,.14,.25,.2,.25);break;
 case 'cairn':for(let k=0;k<6;k++)rock(Math.sin(k)*.08,k*.15,0,.9-k*.11,.22,.65-k*.07,'stone',k*.6);box(.12,.78,.13,.09,.32,.03,'cloth',.1,.2);break;
 case 'blazed-snag':beam([0,0,0],[.15,1.6,.1],.22,'wood',.13);beam([.08,1.15,0],[.52,1.5,0],.1,'wood',.03);box(.03,.92,.2,.2,.4,.025,'cut',0,.1);box(.03,.92,.22,.08,.22,.015,'chalk');break;
 case 'crooked-sign':beam([0,0,0],[.15,1.65,0],.09);box(.1,1.36,0,1.1,.23,.12,'cut',0,.14);box(.18,1.06,0,.9,.2,.1,'wood',0,-.2);for(let k=0;k<3;k++)box(-.2+k*.22,1.35,.07,.08,.025,.02,'iron',0,.2);break;
 case 'moved-marker':box(-.25,.02,0,.5,.04,.55,'earth');rock(.3,0,.14,.6,.95,.5,'stone',.4);beam([-.25,.04,0],[.3,.04,.14],.03,'cut');rock(.7,0,-.2,.2,.2,.2);break;
 case 'lantern-crook':beam([0,0,0],[0,1.9,0],.065);beam([0,1.9,0],[.55,1.9,0],.06);beam([.55,1.9,0],[.55,1.65,0],.025,'iron');lantern(.55,1.39,0,true);break;
 case 'bridge-wing':for(const x of [-.55,.55])beam([x,0,-.8],[x,.35,.8],.12);for(let k=0;k<4;k++)box(0,.12+k*.055,-.65+k*.4,1.25,.09,.3,'wood',.02*k);for(const x of [-.65,.65])beam([x,.15,-.8],[x,.9,.8],.04,'iron');break;
 case 'ford-stones':for(let k=0;k<5;k++)rock(Math.sin(k*2)*.2,0,(k-2)*.4,.65,.15+k%2*.08,.5,'stone',k);break;
 case 'raised-planks':for(let k=0;k<6;k++)box(0,.3,(k-2.5)*.3,1.1,.1,.24,'cut',0,.015*(k%2));for(const z of [-.7,.7])for(const x of [-.4,.4])beam([x,0,z],[x,.35,z],.09);break;
 case 'culvert-mouth':for(let k=0;k<9;k++){const angle=k/8*Math.PI;box(Math.cos(angle)*.67,.18+Math.sin(angle)*.67,0,.3,.33,.5,'stone',0,angle-Math.PI/2);}for(const s of [-1,1])rock(s*.95,0,.15,.5,.4,.7,'earth',s);box(0,.03,.1,.8,.06,.6,'rot');break;
 case 'washed-bank':for(let k=0;k<7;k++)rock(Math.sin(k*2)*.3,0,(k-3)*.25,.65,.3+Math.cos(k)*.1,.5,'earth',k);for(let k=0;k<4;k++)beam([-.2,.23,(k-1.5)*.25],[.65,.05,(k-1.5)*.25],.035,'wood');break;
 case 'flood-gauge':beam([0,0,0],[.1,1.5,0],.08);for(let k=0;k<7;k++)box(.08,.25+k*.15,.09,.16,.025,.025,k%2?'chalk':'cloth');beam([-.5,.12,-.6],[.4,.12,.6],.12);break;
 case 'wayside-shrine':box(0,.12,0,1.5,.24,1.2,'stone');box(0,.68,0,1.1,.9,.75,'stone');for(const x of [-.48,.48])box(x,1.4,0,.17,.7,.8,'stone');box(0,1.75,0,1.2,.18,.9,'stone');add(new T.ConeGeometry(.9,.55,4),'stone',0,2.1,0,0,Math.PI/4);box(0,1.4,.41,.45,.5,.06,'iron');for(const x of [-.3,.3]){box(x,1.24,.45,.07,.18,.07,'pale');add(new T.ConeGeometry(.045,.11,5),'amber',x,1.39,.45);}break;
 case 'abandoned-camp':slabRing(0,0,.5);for(const a of [-.5,.5])beam([a,.08,-.2],[-a,.08,.2],.08);box(-1,.05,.1,.5,.1,1.1,'cloth',.1);lantern(.8,.25,.5);beam([.7,0,-.7],[.7,.5,-.7],.04);break;
 case 'wagon-pullout':fence(0,-.5,2.4);for(const x of [-.65,.65]){rock(x,0,.15,.35,.25,.45);beam([x,.04,.1],[x,.04,1],.04,'earth');}box(.9,.15,.6,.45,.3,.4,'wood');break;
 case 'charcoal-shelter':for(const x of [-.85,.85])beam([x,0,-.4],[x,1.6,-.4],.08);beam([0,1.9,-.5],[0,.1,.8],.07);for(let k=0;k<7;k++)beam([-.95+k*.3,1.65,-.5],[-.95+k*.3,.15,.9],.13,'wood');for(let k=0;k<4;k++)rock(-.5+k*.3,0,.2,.45,.5,.5,'iron',k);break;
 case 'roadside-ruin':for(let y=0;y<3;y++)for(let k=0;k<4-y;k++)box(-.8+k*.43,.15+y*.3,-.45,.4,.28,.4,'stone',.03*k);box(.45,.4,.2,.6,.8,.6,'stone');box(.45,.12,.7,.8,.24,.5,'iron');rock(-.7,0,.7,.55,.2,.5);break;
 case 'toll-remnant':for(const x of [-.9,.9])beam([x,0,0],[x,1.7,0],.12);beam([-.9,1.7,0],[.5,1.9,0],.13);box(.5,.6,0,.45,1.2,.2,'wood',0,-.12);lantern(-.9,1.2,.1);box(.45,.9,.14,.2,.22,.02,'chalk');break;
 case 'root-opening':rootArch();growth(-1.4,.05,.6,4);break;
 case 'overgrown-steps':for(let k=0;k<5;k++)box(0,.07+k*.08,(k-2)*.3,1.25,.14+k*.16,.28,'stone');growth(-.8,.3,.5,5);break;
 case 'broken-wall':for(const s of [-1,1])for(let y=0;y<3;y++)for(let j=0;j<2;j++)box(s*(.85+j*.4),.15+y*.3,0,.38,.28,.45,'stone',.02*j);rock(-.4,0,.4,.4,.15,.35);break;
 case 'cut-fence':fence(0,0,2.3,true);box(.45,.04,.45,.6,.08,.1,'cut',.4);break;
 case 'cloth-marker':beam([0,0,0],[.07,1.3,0],.065);box(.12,1.12,0,.4,.12,.04,'cloth',0,.1);box(.28,.89,0,.12,.4,.03,'cloth',0,.15);rock(-.2,0,.1,.25,.2,.25);break;
 case 'lantern-recess':rock(-.45,0,0,.4,1.1,.65);rock(.45,0,0,.4,1.3,.65);beam([-.45,1.1,0],[.45,1.3,0],.15);lantern(0,.65,.05,true);break;
 case 'moss-scout':growth(0,0,.35,4);for(let k=0;k<4;k++)rock((k-1.5)*.25,0,.25,.35,.1,.3,'moss',k);break;
 case 'moss-stump':beam([0,0,0],[.1,.7,0],.32,'wood',.22);growth(.1,0,.65,5);break;
 case 'moss-cradle':for(const s of [-1,1])beam([s*.6,0,0],[s*.3,1.1,.05],.15,'rot',.04);growth(0,0,1.1,9);break;
 case 'moss-fan':growth(0,0,1.45,12);for(let k=0;k<5;k++)rock(Math.sin(k)*.5,0,Math.cos(k)*.5,.5,.2,.4,'moss',k);break;
 case 'moss-crown':rootArch(1.7,2.2);growth(0,0,2.1,14);for(let k=0;k<7;k++){let a=k/7*6.28;beam([Math.sin(a)*.5,1.2,Math.cos(a)*.5],[Math.sin(a),2.5,Math.cos(a)],.08,'rot',.015);}break;
 case 'moss-husk':box(0,.45,0,1,.9,.6,'rot',0,.12);beam([-.6,0,-.1],[.5,1.9,.05],.15,'wood',.07);growth(0,0,1.6,13);box(.45,.8,.35,.13,.2,.02,'cloth');break;
 default:throw Error(a.id);
 }
}
function encode(asset){
 const bounds=new T.Box3();for(const {g} of parts){g.computeBoundingBox();bounds.union(g.boundingBox);}const offset=new T.Vector3(-(bounds.max.x+bounds.min.x)/2,-bounds.min.y,-(bounds.max.z+bounds.min.z)/2);for(const {g} of parts)g.translate(...offset.toArray());bounds.translate(offset);
 const views=[],accessors=[],chunks=[];let bytes=0;const primitives=[];
 function array(a,type,componentType){let buf=Buffer.from(a.buffer,a.byteOffset,a.byteLength);while(bytes%4){chunks.push(Buffer.alloc(1));bytes++;}const view=views.length;views.push({buffer:0,byteOffset:bytes,byteLength:buf.length});chunks.push(buf);bytes+=buf.length;const acc={bufferView:view,componentType,count:a.length/(type==='VEC3'?3:1),type};if(type==='VEC3'){acc.min=[Infinity,Infinity,Infinity];acc.max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<a.length;i++) {const j=i%3;acc.min[j]=Math.min(acc.min[j],a[i]);acc.max[j]=Math.max(acc.max[j],a[i]);}}accessors.push(acc);return accessors.length-1;}
 let triangles=0;
 for(const mat of materialNames){const geos=parts.filter(p=>p.m===mat).map(p=>p.g);if(!geos.length)continue;const n=geos.reduce((s,g)=>s+g.attributes.position.array.length,0),pos=new Float32Array(n),normal=new Float32Array(n);let at=0;for(const g of geos){pos.set(g.attributes.position.array,at);normal.set(g.attributes.normal.array,at);at+=g.attributes.position.array.length;}triangles+=n/9;primitives.push({attributes:{POSITION:array(pos,'VEC3',5126),NORMAL:array(normal,'VEC3',5126)},material:materialNames.indexOf(mat),mode:4});}
 const binary=Buffer.concat(chunks),binPad=Buffer.alloc((4-binary.length%4)%4),doc={asset:{version:'2.0',generator:'Dread Delve • The Road Watches original source'},scene:0,scenes:[{nodes:[0]}],nodes:[{name:asset.id,mesh:0}],meshes:[{name:asset.id,primitives}],materials,buffers:[{byteLength:binary.length}],bufferViews:views,accessors};
 let json=Buffer.from(JSON.stringify(doc));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);const header=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(12+8+json.length+8+binary.length+binPad.length,8);jh.writeUInt32LE(json.length);jh.writeUInt32LE(0x4e4f534a,4);bh.writeUInt32LE(binary.length+binPad.length);bh.writeUInt32LE(0x004e4942,4);const glb=Buffer.concat([header,jh,json,bh,binary,binPad]);writeFileSync(new URL(`${asset.id}.glb`,OUT),glb);
 return {...asset,footprint:{w:Math.ceil(bounds.max.x-bounds.min.x),h:Math.ceil(bounds.max.z-bounds.min.z)},pivot:[0,0,0],bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},triangles,fileSize:glb.length,drawCalls:primitives.length,restrictions:['No automatic collision or discovery changes','Never cover entrances, exits, event tiles or bridge decks',asset.opening?'Requires existing revealed route or explicit DM reveal':'Keep full bounds off playable/mount lanes']};
}
const assets=ASSETS.map(a=>{parts=[];build(a);return encode(a);});
writeFileSync(new URL('manifest.json',OUT),JSON.stringify({name:'The Road Watches',version:1,units:'1 unit = one five-foot grid square',axis:'Y up; ground-centred pivot; local +Z is approach',license:'CC0-1.0',materials:Object.fromEntries(Object.entries(PALETTE).map(([k,v])=>[k,v])),treatments:{wet:{roughnessMultiplier:.65,colorMultiplier:.78},cold:{blend:'#b6c4c6',amount:.28},infected:{blend:'#596b48',amount:.25}},assets},null,2)+'\n');
writeFileSync(new URL('LICENSE.txt',OUT),'The Road Watches — original geometry and materials generated for Dread Delve.\nDedicated to the public domain under CC0 1.0 Universal.\nhttps://creativecommons.org/publicdomain/zero/1.0/\nNo third-party meshes or textures are included in this pack.\n');
console.log(JSON.stringify({models:assets.length,triangles:assets.reduce((s,a)=>s+a.triangles,0),bytes:assets.reduce((s,a)=>s+a.fileSize,0),largest:Math.max(...assets.map(a=>a.fileSize))}));
