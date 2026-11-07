/* Tiny class-level Three.js API mock for ownership/lifecycle logic tests.
   Not a graphics renderer and not included in production integration. */
export class Vector3 {
  constructor(x=0,y=0,z=0){this.set(x,y,z);}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
  setScalar(s){return this.set(s,s,s);}
}
export class Color {
  constructor(color='#ffffff'){this.value=color;}
  set(c){this.value=c;return this;}
  lerp(c,t){this.value=`${this.value}|${c.value}|${t}`;return this;}
  setHSL(h,s,l){this.value=`hsl(${h},${s},${l})`;return this;}
}
export class Object3D {
  constructor(){this.children=[];this.position=new Vector3();this.rotation=new Vector3();this.scale=new Vector3(1,1,1);
    this.name='';this.userData={};this.isMesh=false;this.parent=null;this.matrix={};}
  add(...objects){for(const obj of objects){if(obj.parent)obj.parent.remove(obj);this.children.push(obj);obj.parent=this;}return this;}
  remove(obj){this.children=this.children.filter(x=>x!==obj);if(obj.parent===this)obj.parent=null;}
  traverse(cb){cb(this);for(const child of this.children)child.traverse(cb);}
  updateMatrix(){this.matrix={position:{...this.position},rotation:{...this.rotation},scale:{...this.scale}};}
  clear(){for(const child of this.children)child.parent=null;this.children=[];}
}
export class Group extends Object3D{}
export class BufferGeometry{
  constructor(){this.attributes={};this.disposeCount=0;}
  setAttribute(key,v){this.attributes[key]=v;return this;}
  setIndex(a){this.index=a;return this;}
  computeBoundingSphere(){}
  dispose(){this.disposeCount++;}
}
export class Float32BufferAttribute{constructor(array,itemSize){this.array=array;this.itemSize=itemSize;}}
export class PlaneGeometry extends BufferGeometry{constructor(w,h){super();this.w=w;this.h=h;}}
export class IcosahedronGeometry extends BufferGeometry{constructor(radius,detail){super();this.radius=radius;this.detail=detail;}}
export class ShaderMaterial{
  constructor(opts={}){Object.assign(this,opts);this.disposeCount=0;}
  clone(){return new ShaderMaterial({...this});}
  dispose(){this.disposeCount++;}
}
export class MeshStandardMaterial extends ShaderMaterial{}
export class Mesh extends Object3D{
  constructor(geometry,material){super();this.geometry=geometry;this.material=material;this.isMesh=true;}
}
export class Points extends Mesh{}
export class InstancedMesh extends Mesh{
  constructor(g,m,count){super(g,m);this.count=count;this.matrices=[];this.colors=[];this.instanceMatrix={needsUpdate:false};this.instanceColor={needsUpdate:false};}
  setMatrixAt(k,matrix){this.matrices[k]=matrix;}
  setColorAt(k,color){this.colors[k]=color;}
}
export const DoubleSide=2;
export const NormalBlending=1;
