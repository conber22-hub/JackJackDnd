"""Original low-poly Barovian terrain kit generator. No third-party art assets."""
import math, random, json, os
from pathlib import Path
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets'; ASSETS.mkdir(exist_ok=True)
PAL={
'soil':'#383630','peat':'#292c29','road':'#49443a','rut':'#272724','dirt':'#655945',
'stone':'#686b66','stone2':'#858980','stone3':'#4a4e4b','slate':'#454b50','chalk':'#adb1a3',
'wood':'#554535','wood2':'#77634c','bark':'#342f2b','birch':'#b0aba0','birch_dark':'#494744',
'needle':'#28382f','needle2':'#405044','needle3':'#1e332e','pine_frost':'#7c8f87',
'leaf':'#3b493a','leaf2':'#53604b','reed':'#676e45','reed2':'#879065','hay':'#ad986b',
'water':'#20383b','water2':'#355960','ice':'#789aa0','snow':'#c9ced1','snow2':'#a9b9bd',
'moss':'#556b4c','moss2':'#809063','bone':'#b6ad96','iron':'#292c30',
'cloth':'#4b4147','red':'#785146','fungus':'#c8cbb3','hunger':'#718c49',
'hunger_dark':'#303e2d','glow':'#b3dc6b','ash':'#2c3031','lantern':'#d3a75b','brick':'#4d4948','cobble':'#686058','cobble2':'#827a6e','gravel':'#5a5954','bog':'#323a32','carrion':'#5e463d','tarn':'#263d42','copper':'#93714c'}

def rgb(v):
 v=PAL.get(v,v)
 return tuple(int(v[i:i+2],16) for i in (1,3,5))
def mat(key):
 r,g,b=rgb(key)
 return PBRMaterial(baseColorFactor=[r,g,b,255],metallicFactor=0,roughnessFactor=.95,doubleSided=True)
def uvmat(mesh,c):
 mesh.visual=TextureVisuals(material=mat(c))
 return mesh

class Model:
 def __init__(self,name,seed=0):
  self.name=name;self.r=random.Random(f'{name}:{seed}');self.scene=trimesh.Scene();self.count=0
 def add(self,obj,c):
  obj=uvmat(obj,c); self.scene.add_geometry(obj,node_name=f'n_{self.count:03d}',geom_name=f'g_{self.count:03d}');self.count+=1
 def box(self,x,y,z,w,h,d,c,ry=0):
  m=trimesh.creation.box(extents=[w,h,d]);
  if ry:m.apply_transform(trimesh.transformations.rotation_matrix(ry,[0,1,0]))
  m.apply_translation([x,y,z]);self.add(m,c)
 def ell(self,x,y,z,rx,ry,rz,c,sub=1):
  m=trimesh.creation.icosphere(subdivisions=sub,radius=1)
  m.apply_scale([rx,ry,rz]);m.apply_translation([x,y,z]);self.add(m,c)
 def cyl(self,x,y,z,rt,rb,h,c,n=8):
  # Frustum is built with uneven bottom/top radii for organic trunks and fluting.
  vs=[]; fs=[]
  for yy,rad in ((0,rb),(h,rt)):
   for k in range(n):
    a=2*math.pi*k/n;vs.append((x+math.cos(a)*rad,y+yy,z+math.sin(a)*rad))
  for k in range(n):
   j=(k+1)%n;fs += [[k,j,n+j],[k,n+j,n+k]]
  fs += [[0,k+1,k] for k in range(1,n-1)] + [[n,n+k,n+k+1] for k in range(1,n-1)]
  self.add(trimesh.Trimesh(vertices=vs,faces=fs,process=False),c)
 def tube(self,a,b,r0,r1,c,n=7):
  a=np.array(a,float);b=np.array(b,float);v=b-a;h=np.linalg.norm(v)
  if h<1e-5:return
  direction=v/h;ref=np.array([0,0,1]) if abs(direction[2])<.85 else np.array([1,0,0]);u=np.cross(direction,ref);u/=np.linalg.norm(u);z=np.cross(direction,u)
  vs=[]
  for p,rad in ((a,r0),(b,r1)):
   for k in range(n):
    t=2*math.pi*k/n;vs.append(p+rad*(u*math.cos(t)+z*math.sin(t)))
  fs=[]
  for k in range(n):
   j=(k+1)%n;fs += [[k,j,n+j],[k,n+j,n+k]]
  fs += [[0,k+1,k] for k in range(1,n-1)] + [[n,n+k,n+k+1] for k in range(1,n-1)]
  self.add(trimesh.Trimesh(vertices=np.array(vs),faces=fs,process=False),c)
 def cone(self,x,y,z,rad,h,c,n=7,angle=0):
  # Irregular low-poly pine cone with slight bough deflections.
  vs=[]
  for k in range(n):
   a=2*math.pi*k/n+angle;f=1+.1*math.sin(13*a+2);vs.append((x+math.cos(a)*rad*f,y,z+math.sin(a)*rad*f))
  vs.append((x+.07*rad,y+h,z+.03*rad));tip=n
  fs=[[k,(k+1)%n,tip] for k in range(n)]+[[0,k+1,k] for k in range(1,n-1)]
  self.add(trimesh.Trimesh(vertices=vs,faces=fs,process=False),c)
 def flat_patch(self,w,d,base=-.07,noise=.035,c='soil',steps=7):
  # No giant square slab: ragged edge follows each tile boundary.
  r=self.r;vs=[];fs=[]
  for zi in range(steps+1):
   for xi in range(steps+1):
    x=(xi/steps-.5)*w;z=(zi/steps-.5)*d
    edge=xi in (0,steps) or zi in (0,steps)
    y=base+(r.random()-.5)*noise*(.45 if edge else 1)
    vs.append((x,y,z))
  for z in range(steps):
   for x in range(steps):
    a=z*(steps+1)+x;b=a+1;cc=a+(steps+1);dd=cc+1
    fs.extend(([a,cc,b],[b,cc,dd]))
  mesh=trimesh.Trimesh(vertices=vs,faces=fs,process=False)
  self.add(mesh,c)
 def stone(self,x,z,s=.22,c=None,y=0):
  r=self.r;self.ell(x,y+s*.42,z,s*(.8+.5*r.random()),s*(.55+r.random()*.35),s*(.75+.45*r.random()),c or r.choice(['stone','stone2','stone3']),sub=0)
 def tufts(self,x,z,n=5,radius=.5,wet=False):
  r=self.r
  for _ in range(n):
   a=r.random()*2*math.pi;d=radius*math.sqrt(r.random());xx=x+math.cos(a)*d;zz=z+math.sin(a)*d
   for j in range(r.randint(2,4)):
    base=(xx,0.0,zz);end=(xx+r.uniform(-.10,.10),r.uniform(.12,.4 if wet else .23),zz+r.uniform(-.10,.10))
    self.tube(base,end,.012,.002,r.choice(['reed','reed2','moss','leaf2']) if wet else r.choice(['moss','needle','reed']),n=4)
 def mushroom(self,x,z,s=.13,evil=False):
  self.cyl(x,0,z,.012*s/.13,.022*s/.13,s*1.2,'bone',6)
  self.cone(x,s*.65,z,s*.7,s*.35,'glow' if evil else 'fungus',6)
 def fir(self,x,z,height=2.5,snow=False,corrupt=False,bent=0):
  r=self.r; self.tube((x,0,z),(x+bent,height*.92,z+.06),.115,.026,'bark',8)
  for k in range(5):
   t=k/5;cy=.26+height*t*.76;dx=bent*t;rad=(.72-t*.43)*(height/2.6)
   color=r.choice(['hunger','hunger_dark'] if corrupt else ['needle','needle2','needle3'])
   self.cone(x+dx,cy,z,rad,.8*(height/2.5),color,8,angle=k*.29)
   if snow:
    self.cone(x+dx,cy+.22*(height/2.5),z,rad*.55,.35*(height/2.5),'snow2',7,angle=k*.15)
  if corrupt:
   for i in range(9):
    a=r.random()*2*math.pi;rad=r.uniform(.12,.32)
    self.ell(x+math.cos(a)*rad,.4+r.random()*height*.6,z+math.sin(a)*rad,.045,.06,.045,'glow',0)
 def leaf_cluster(self,x,y,z,rx,ry,rz):
  self.ell(x,y,z,rx,ry,rz,self.r.choice(['leaf','leaf2','needle2']),sub=1)
 def oak(self,x,z,leafless=True,h=2.55):
  r=self.r;ps=[(x,0,z),(x-.12,.55,z+.08),(x-.07,1.2,z-.08),(x+.1,1.65,z-.12)]
  for i in range(len(ps)-1):self.tube(ps[i],ps[i+1],.20-i*.038,.16-i*.035,'bark',8)
  for i,(dx,dz) in enumerate(((-1,-.35),(.8,-.5),(-.4,.85),(.65,.65))):
   a=ps[2 if i<2 else 3];b=(x+dx*.72,2.12+(i%2)*.26,z+dz*.7);c=(x+dx,2.22+(i%2)*.37,z+dz)
   self.tube(a,b,.088,.053,'bark');self.tube(b,c,.053,.007,'wood',5)
   for _ in range(2):
    tx=c[0]+r.uniform(-.25,.25);tz=c[2]+r.uniform(-.24,.24)
    self.tube(b,(tx,c[1]+r.uniform(.07,.36),tz),.025,.006,'bark',5)
   if not leafless:self.leaf_cluster(c[0],c[1],c[2],.32,.19,.36)
 def gravestone(self,x,z,s=1):
  r=self.r
  self.box(x,.17*s,z,.22*s,.34*s,.095*s,'stone2',ry=r.uniform(-.15,.15))
  self.ell(x,.34*s,z,.11*s,.075*s,.053*s,'stone2',sub=1)
  self.box(x,.095*s,z+.053*s,.07*s,.11*s,.012*s,'stone3')
 def stone_wall(self,x,z,l=2.5,h=.45,broken=False,axis='x'):
  r=self.r
  for layer in range(3):
   yy=.065+layer*.14
   for i in range(max(2,int(l/.30))):
    t=(i+.5+(.5 if layer%2 else 0))*l/max(2,int(l/.30))-l/2
    if broken and layer>=2 and abs(t)<.65:continue
    scale=r.uniform(.84,1.07)
    xx=x+t if axis=='x' else x+r.uniform(-.025,.025);zz=z+t if axis=='z' else z+r.uniform(-.025,.025)
    self.box(xx,yy,zz,.32*scale if axis=='x' else .28,.12*scale,.32*scale if axis=='z' else .28,r.choice(['stone','stone2','stone3']),ry=r.uniform(-.13,.13))
 def ground_stones(self,n,radius=1):
  for _ in range(n):
   a=self.r.random()*2*math.pi;rr=self.r.random()*radius
   self.stone(math.cos(a)*rr,math.sin(a)*rr,self.r.uniform(.05,.20))
 def snow_lump(self,x,z,w,d,h):
  self.ell(x,h*.44,z,w/2,h*.55,d/2,self.r.choice(['snow','snow2']),sub=1)
 def branch_roots(self,x,z,rad=.8,n=6):
  r=self.r
  for i in range(n):
   a=2*math.pi*(i+r.uniform(-.1,.1))/n
   self.tube((x,.16,z),(x+math.cos(a)*rad,.02,z+math.sin(a)*rad),.07,.009,'bark',6)




