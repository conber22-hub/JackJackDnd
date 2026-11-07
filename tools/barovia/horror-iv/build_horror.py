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



# BAROVIA IV: ORIGINAL ROADSIDE HORROR SCENERY
# Model convention is identical to Packs I-III: +Y up, center origin, 1 world unit = 5 ft.
PAL.update({'wound':'#82352e','oldblood':'#4b2327','rust':'#765044','ivory':'#cbc6b2',
 'paper':'#b5a78d','linen':'#777071','faint':'#e4be78','witch':'#a3bd75','hush':'#1b2525',
 'roof':'#31353a','roof2':'#4d5050','wall':'#605a54','frame':'#3d2e27',
 'ember':'#de7850','bramble':'#3a4130','glass':'#bbb0a2','soil2':'#48433e'})

# Helpers: all solid surfaces, no external textures or mesh downloads.
def lean(m,x,z,h=1.3,c='wood',a=.10):
 m.tube((x,0,z),(x+a,h,z+.045),.095,.067,c,7)
def sphere(m,x,y,z,size,c):m.ell(x,y,z,size,size,size,c,1)
def roof(m,x,z,w,d,y,hs=1.,color='roof',ridge='x'):
 # A steep, triangular roof with overhang; broad timber eaves visible from top down.
 if ridge=='x':
  v=[(x-w/2,y,z-d/2),(x-w/2,y,z+d/2),(x-w/2,y+hs,z),
     (x+w/2,y,z-d/2),(x+w/2,y,z+d/2),(x+w/2,y+hs,z)]
  faces=[[0,1,2],[3,5,4],[0,2,5],[0,5,3],[1,4,5],[1,5,2],[0,3,4],[0,4,1]]
 else:
  v=[(x-w/2,y,z-d/2),(x+w/2,y,z-d/2),(x,y+hs,z-d/2),
     (x-w/2,y,z+d/2),(x+w/2,y,z+d/2),(x,y+hs,z+d/2)]
  faces=[[0,2,1],[3,4,5],[0,3,5],[0,5,2],[1,2,5],[1,5,4],[0,1,4],[0,4,3]]
 m.add(trimesh.Trimesh(vertices=v,faces=faces,process=False),color)
 for _ in range(14):
  xx=x+m.r.uniform(-w*.45,w*.45); zz=z+m.r.choice([-1,1])*d*.47
  m.tube((xx,y-.025,zz),(xx+m.r.uniform(-.09,.09),y+.05,zz),.028,.013,'stone3',5)
def shutter(m,x,z,y=1.05,w=.34):
 m.box(x,y,z,.42,.55,.09,'hush');m.box(x-w*.62,y,z,.14,.63,.12,'wood2');m.box(x+w*.62,y,z,.14,.63,.12,'wood2')
 for sy in [-.20,.0,.20]:m.box(x,y+sy,z-.065,.48,.023,.02,'frame')
def house(m,style='inn'):
 r=m.r
 spec={
  'inn':(3.6,2.9,1.75,'wall','roof2'),
  'toll':(2.5,2.2,1.5,'stone','roof'),
  'farm':(3.3,2.7,1.55,'wood2','roof2'),
  'chapel':(2.7,3.3,2.12,'stone2','roof'),
  'stable':(4.2,2.6,1.34,'wood','roof'),
  'hideout':(2.3,2.2,1.05,'wood','roof2'),
  'hut':(2.0,1.85,1.15,'wood2','roof'),
  'granary':(2.8,2.0,2.2,'wood2','roof2'),
  'guard':(2.1,2.0,1.25,'stone3','roof'),
  'crypt':(2.2,2.2,1.28,'stone2','roof'),
  'cottage':(3.1,2.6,1.35,'wall','roof2')
 }[style]
 w,d,h,wallC,roofC=spec
 # No square terrain base: rests cleanly on ground mesh.
 m.box(0,h*.5,0,w,h,d,wallC)
 for sx in [-1,1]:
  for sz in [-1,1]:m.box(sx*(w/2-.10),h*.52,sz*(d/2-.09),.17,h+.08,.15,'frame')
 m.box(0,.55,d/2+.025,.66,1.08,.06,'hush')
 m.box(-.30,.52,d/2+.067,.045,.99,.04,'iron');m.ell(.20,.56,d/2+.089,.045,.045,.05,'rust',0)
 if style not in ('crypt','hideout'):
  for x in [-w*.32,w*.32]:shutter(m,x,-d/2-.035,.95)
 roof(m,0,0,w+.48,d+.52,h,.72 if style not in ('chapel','granary') else 1.2,roofC)
 # Gutter scars, shifted slates and splintered shingles. These are visible at tabletop height.
 rh=.72 if style not in ('chapel','granary') else 1.2
 for side in [-1,1]:
  for k in range(7):
   zz=side*(d*.10 + .12*(k%3));xx=-w*.37+k*(w*.74)/6
   yy=h+rh*(1-abs(2*zz/(d+.52)))+.033
   m.tube((xx-.17,yy,zz),(xx+.17,yy+.025,zz+.02*side),.024,.016,
     r.choice(['slate','stone3','roof2']),5)
 for k in range(3):
  x=r.uniform(-w*.32,w*.32);z=r.choice([-1,1])*d*.31
  y=h+rh*(1-abs(2*z/(d+.52)))+.044
  m.box(x,y,z,.12,.025,.26,'oldblood' if style in ('inn','farm','cottage') else 'stone3')
 for sx in [-1,1]:m.tube((sx*(w/2+.19),h-.07,-d/2-.26),(sx*(w/2+.19),h-.25,-d/2-.26),.037,.026,'wood',5)
 if style not in ('crypt','stable'):
  m.box(-w*.27,h+.30,-d*.23,.38,.88,.38,'stone3')
  m.box(-w*.27,h+.78,-d*.23,.54,.15,.54,'stone2')
 if style in ('chapel','crypt'):
  m.box(0,h+.75,0,.095,.85,.10,'stone2');m.box(0,h+.94,0,.46,.10,.11,'stone2')
 if style=='stable':
  for i in range(4):m.box(-1.25+i*.84,.40,d/2+.08,.055,.8,.045,'wood2')
  m.tube((-.68,.1,d/2+.13),(.70,1.,d/2+.13),.04,.03,'iron')
 if style=='inn':
  # Crooked sign, one dark window, one impossible warm one.
  m.tube((w*.50,1.41,d*.24),(w*.71,1.26,d*.24),.038,.024,'frame')
  m.box(w*.72,1.17,d*.24,.37,.40,.12,'oldblood',ry=-.18)
  m.box(w*.41,h*.85,0,.15,.8,d*.75,'wood')
  for z in [-.68,.68]:m.box(w*.51,1.04,z,.13,.42,.65,'iron')
  # Single warm window, nothing friendly behind it.
  m.box(-w*.38,1.11,d/2+.05,.36,.48,.035,'faint')
  m.box(-w*.38,1.11,d/2+.08,.20,.35,.04,'oldblood')
 if style=='chapel':
  m.ell(.1,.015,d*.58,1.35,.035,.55,'hush',1)
  for ii in range(5):
   m.ell(-.65+ii*.35,.025,d*.60,.15,.025,.12,'water2',0)
 if style=='toll':
  for k in range(3):m.tube((-w*.4+k*.27,.15,d/2+.08),(-w*.28+k*.27,.79,d/2+.09),.02,.012,'oldblood')
 if style=='farm':
  for i in range(5):m.tube((-.9+i*.44,0,d/2+.31),(-.9+i*.44,.63,d/2+.31),.035,.021,'wood',5)
 if style=='toll':
  m.box(w*.57,1.6,-.5,.38,2.,.4,'stone2');m.cone(w*.57,2.55,-.5,.42,.55,'slate',7)
 if style=='hut':
  m.tube((-.9,1.75,0),(.9,1.75,0),.07,.06,'wood')
 if style=='granary':
  for x in [-1.0,1.0]:m.box(x,.35,0,.15,.7,.15,'wood')
  for j in range(3):m.box(0,.52+j*.22,d/2+.10,.57,.05,.07,'wood2')
 if style=='guard':
  m.box(0,1.05,d/2+.09,.86,.2,.11,'iron')
 if style=='crypt':
  for xx in [-.63,.63]:m.box(xx,1.03,d/2+.10,.32,.47,.14,'stone3')
 if style=='cottage':
  for i in range(8):
   a=i*math.pi/4;m.tube((math.cos(a)*.6,-.02,math.sin(a)*.5),(math.cos(a)*1.85,.23,math.sin(a)*1.45),.12,.02,'hunger_dark')
  for _ in range(15):
   x=r.uniform(-w*.44,w*.44);z=r.uniform(-d*.43,d*.43)
   m.ell(x,h+.33+r.random()*.3,z,.08,.13,.10,r.choice(['hunger','hunger_dark','glow']),0)

def tower(m):
 m.box(0,1.26,0,1.75,2.52,1.75,'wood2')
 for x in [-.74,.74]:
  for z in [-.74,.74]:lean(m,x,z,3.1,'wood')
 m.box(0,2.47,0,2.46,.16,2.46,'wood')
 for x in [-1.15,1.15]:
  for z in [-1.15,1.15]:m.box(x,3.02,z,.12,1.08,.13,'wood')
 roof(m,0,0,2.7,2.7,3.54,1.4,'roof')
 for yy in [.55,1.03,1.51]:m.box(.90,yy,0,.05,.035,.78,'wood')
 for k in range(2):m.tube((-.9,2.10+k*.37,-.8),(.95,2.18+k*.29,-.84),.03,.025,'iron')

def effigy(m):
 m.tube((0,0,0),(.08,1.45,.03),.095,.058,'wood',7)
 m.tube((-.56,1.05,.03),(.60,1.14,.0),.065,.065,'wood',7)
 m.ell(.06,1.52,0,.20,.25,.14,'linen',0)
 m.cone(.08,.57,0,.39,.66,'cloth',7)
 for sx in [-1,1]:
  m.tube((sx*.49,1.12,0),(sx*.59,.55,.08),.035,.012,'hay',6)
 for y in [1.1,1.3]:m.tube((-.34,y,-.05),(.35,y+.10,-.05),.014,.014,'oldblood',4)
 m.ell(.03,1.54,.135,.032,.026,.024,'wound',0)

def scaffold(m,ropes=3):
 m.box(0,.13,0,3.1,.26,1.6,'wood')
 for x in [-1.35,1.35]:
  m.box(x,1.28,-.17,.18,2.5,.18,'frame')
  m.tube((x,1.15,-.17),(x*.62,2.37,-.17),.06,.04,'wood')
 m.box(0,2.55,-.17,3.45,.20,.24,'wood2')
 for i in range(ropes):
  x=(i-(ropes-1)/2)*.82
  m.tube((x,2.48,-.17),(x,1.64,-.15),.017,.016,'hay',5)
  m.cyl(x,1.57,-.15,.135,.135,.025,'hay',12)
 # Hollow platform with broken trapdoor, no body/human meshes.
 m.box(.15,.278,.15,.6,.026,.66,'hush')

def cross(m,x=0,z=0,h=1.2,color='wood'):
 m.box(x,.56*h,z,.11,h,.12,color)
 m.box(x,.78*h,z,.58,.09,.13,color)

def hanging_oak(m):
 m.oak(0,0,h=3.5)
 for x,z in [(-.6,-.65),(.67,.54)]:
  m.tube((x,2.53,z),(x,1.30,z),.027,.021,'hay',5)
  m.cyl(x,1.31,z,.15,.15,.036,'hay',10)
 for i in range(10):
  a=m.r.random()*6.28;m.tube((0,.17,0),(math.cos(a)*1.25,.00,math.sin(a)*1.05),.07,.005,'bark')

def gravemark(m,x,z,s=1):
 m.gravestone(x,z,s);m.ell(x-.08,.0,z+.15,.17,.035,.21,'soil2',0)

def wagon(m,funeral=False,corrupt=False):
 m.box(0,.61,0,2.65,.24,1.45,'wood')
 m.box(0,.92,-.85,2.4,.38,.19,'wood2')
 m.box(0,.91,.85,2.4,.41,.18,'wood2')
 for x in [-1.03,1.03]:
  for z in [-.66,.66]:
   m.cyl(x,.56,z,.41,.41,.1,'frame',12)
   m.cyl(x,.56,z,.19,.19,.11,'iron',12)
 for x in [-1,1]:m.tube((x*.6,.60,-.82),(x*.67,.22,-1.85),.09,.07,'wood')
 if funeral:
  m.box(0,1.07,0,1.66,.49,.61,'hush')
  m.box(0,1.33,0,1.80,.10,.72,'wood')
  cross(m,-.14,.0,.62,'rust')
  for z in [-.73,.73]:m.box(0,1.14,z,1.82,.22,.05,'cloth')
 if corrupt:
  for i in range(14):
   x=m.r.uniform(-1.0,1.1);z=m.r.uniform(-.6,.6)
   m.ell(x,1.13+m.r.random()*.52,z,.15,.23,.14,m.r.choice(['hunger_dark','hunger','glow']),0)
  for i in range(5):
   x=m.r.uniform(-.7,.7);z=m.r.uniform(-.5,.5)
   m.tube((x,1.05,z),(x+m.r.uniform(-.3,.3),2.20,z+m.r.uniform(-.3,.3)),.065,.008,'hunger',6)

def cage(m):
 m.box(0,.07,0,1.60,.14,1.60,'stone3');m.box(0,1.75,0,1.55,.12,1.55,'iron')
 for x in [-.71,.71]:
  for z in [-.71,-.37,0,.37,.71]:m.box(x,.92,z,.035,1.68,.037,'iron')
 for z in [-.71,.71]:
  for x in [-.34,0,.34]:m.box(x,.92,z,.036,1.68,.034,'iron')
 m.box(0,.8,.79,.35,1.0,.10,'rust')
 for i in range(2):m.tube((-.2,1.0,.82),(.3,.45,.83),.022,.016,'oldblood',5)

def well(m,blood=False):
 for k in range(12):
  a=k*math.tau/12
  m.box(math.cos(a)*.72,.41,math.sin(a)*.72,.51,.36,.31,m.r.choice(['stone','stone2','stone3']),ry=-a)
 m.cyl(0,.22,0,.61,.61,.03,'wound' if blood else 'hush',16)
 for x in [-.87,.87]:m.box(x,1.30,0,.12,2.1,.10,'wood2')
 m.box(0,2.33,0,2.00,.14,.14,'frame')
 m.tube((.14,2.3,0),(.14,.42,0),.016,.016,'hay',5)
 m.box(.14,.56,0,.32,.26,.34,'wood')
 if blood:
  for a in range(7):
   angle=a*math.tau/7
   m.ell(.53*math.cos(angle),.43,.53*math.sin(angle),.10,.02,.08,'oldblood',0)

def sign(m,glow=False):
 m.box(0,.87,0,.16,1.72,.14,'frame')
 m.box(.23,1.43,0,.93,.30,.13,'wood2')
 m.box(.19,1.38,.079,.47,.032,.019,'hush')
 m.box(-.18,1.08,.01,.77,.24,.12,'wood2')
 if glow:
  m.cyl(.03,1.06,.14,.11,.12,.19,'iron',7);m.ell(.03,1.09,.14,.079,.07,.06,'faint',0)
  m.cone(-.45,.11,.11,.24,.36,'stone3',6)

def bell(m):
 m.box(0,1.14,0,.13,2.26,.12,'frame');m.box(0,2.16,.04,1.3,.12,.13,'wood')
 m.cyl(-.39,1.76,.05,.27,.36,.35,'rust',10)
 m.ell(-.39,1.62,.05,.30,.11,.29,'iron',0)
 m.tube((-.39,1.5,.05),(-.39,1.38,.05),.03,.03,'iron')
 m.tube((-.47,1.76,.19),(.4,.23,.21),.015,.008,'hay')

def stone_angel(m):
 m.box(0,.14,0,1.5,.28,1.0,'stone3')
 m.ell(0,.54,0,.26,.37,.19,'stone2',1)
 for s in [-1,1]:
  m.tube((s*.13,.67,0),(s*.66,.98,.10),.20,.05,'stone',6)
  m.cone(s*.50,.94,.01,.33,.56,'stone3',5)
 m.ell(.05,1.00,-.08,.19,.21,.19,'chalk',0)
 m.ell(.04,.96,.109,.07,.07,.03,'hush',0)
 m.box(.45,.24,.12,.62,.20,.22,'stone2',ry=.3)

def root_arch(m,glow=False):
 for s in [-1,1]:
  for offset in [0,.27]:
   x=s*(1.20+offset*.4)
   m.tube((x,0,offset),(x*.85,.88,offset-.12),.23,.17,'bark')
   m.tube((x*.85,.88,offset-.12),(s*.58,1.75,offset-.08),.17,.12,'hunger_dark' if glow else 'bark')
   m.tube((s*.58,1.75,offset-.08),(0,2.02,offset),.12,.06,'hunger' if glow else 'wood')
 for k in range(8):
  a=m.r.random()*math.tau
  m.ell(math.cos(a)*1.08,.1+m.r.random()*1.45,math.sin(a)*.40,.09,.16,.09,'glow' if glow else 'bramble',0)

def spore(m,large=False):
 m.ell(0,.08,0,.92,.15,.86,'hunger_dark',1)
 for i in range(11 if large else 7):
  a=math.tau*i/(11 if large else 7)+m.r.uniform(-.19,.19)
  rr=.23 + m.r.random()*.53; x=math.cos(a)*rr;z=math.sin(a)*rr
  h=m.r.uniform(.38,1.37 if large else .90)
  m.tube((x,.10,z),(x+m.r.uniform(-.13,.13),h,z+m.r.uniform(-.10,.10)),.075,.015,'hunger',6)
  m.ell(x,h,z,.11,.15,.12,'glow',0)
 for i in range(5):m.mushroom(m.r.uniform(-.8,.8),m.r.uniform(-.7,.7),s=.16,evil=True)

def skeletal_hands(m):
 for i in range(8):
  x=m.r.uniform(-1,1);z=m.r.uniform(-.80,.80);s=m.r.uniform(.2,.6)
  m.tube((x,.01,z),(x+s*.1,s*.7,z),.08,.045,'bone',6)
  for k in range(4):
   xx=x+(k-1.5)*.065
   m.tube((xx,s*.61,z),(xx+(k-1.5)*.035,s,z+.03),.017,.007,'bone',4)
 m.ell(0,-.018,0,1.13,.025,.88,'bog',1)

def monolith(m):
 for x,z in [(-.7,-.45),(.65,-.1),(.0,.80)]:
  m.box(x,.82,z,.48,1.62,.38,'stone3',ry=m.r.uniform(-.19,.19))
  m.cone(x,1.59,z,.28,.25,'stone2',5)
  for i in range(3):m.box(x,.52+i*.26,z+.207,.12,.024,.018,'wound' if i==2 else 'stone2')
 m.ell(0,.05,0,1.45,.08,1.2,'soil2',1)

def cairn(m):
 for j in range(3):
  for i in range(6-j):
   a=math.tau*i/(6-j)+j*.48
   m.stone(math.cos(a)*(.68-j*.19),math.sin(a)*(.68-j*.19),.24-j*.03,'stone3',y=.06+j*.17)
 for i in range(5):
  a=m.r.random()*math.tau
  m.tube((0,.42,0),(math.cos(a)*.54,.59,math.sin(a)*.52),.045,.012,'bone',5)
 m.ell(0,.67,0,.16,.12,.13,'ivory',0)

def pond(m):
 m.ell(0,-.08,0,1.4,.08,1.2,'hush',1)
 for i in range(10):
  a=math.tau*i/10;rr=.9+m.r.uniform(-.1,.27)
  m.stone(math.cos(a)*rr,math.sin(a)*rr,s=m.r.uniform(.1,.27),c='bog')
 for i in range(4):
  a=m.r.random()*math.tau;m.ell(math.cos(a)*.7,-.035,math.sin(a)*.6,.24,.012,.15,'water2',0)

def thorns(m):
 for s in [-1,1]:
  for i in range(5):
   z=-1.1+i*.56
   m.tube((s*1.13,0,z),(s*(.68 if i%2==0 else 1.45),1.22,z+m.r.uniform(-.13,.13)),.12,.035,'bramble')
   for k in range(4):
    y=.38+k*.21
    m.cone(s*(.95+(.25 if i%2 else -.15)),y,z,.11,.28,'bark',5)
 for i in range(4):
  z=-.95+i*.63
  m.tube((-1.0,1.32,z),(0,1.55,z+.12),.10,.055,'bramble')
  m.tube((0,1.55,z+.12),(1,1.27,z),.055,.03,'bramble')

def culvert(m):
 # Side-road water culvert, center arch remains visibly clear for discovery.
 for s in [-1,1]:
  m.box(s*1.1,.72,0,.48,1.42,2.45,'stone3')
 for i in range(7):
  angle=math.pi*i/6;x=math.cos(angle)*1.11;y=1.32+math.sin(angle)*.92
  m.box(x,y,0,.45,.26,2.45,'stone2',ry=-angle*.15)
 m.box(0,-.04,0,1.82,.07,2.50,'water')
 for x in [-.45,.5]:m.ell(x,.005,.4,.34,.02,.27,'water2',0)

def hatch(m):
 m.box(0,.07,0,1.55,.14,1.43,'wood')
 for i in range(6):m.box(-.58+i*.23,.145,0,.045,.02,1.36,'wood2')
 m.box(.23,.18,.2,.13,.04,.16,'rust');m.cyl(.17,.18,.2,.08,.08,.035,'iron',8)
 for i in range(5):
  a=math.tau*i/5;m.stone(math.cos(a)*1.02,math.sin(a)*1.06,.18,'stone3')

def cave(m):
 for s in [-1,1]:
  for i in range(5):
   x=s*(1.32-m.r.random()*.26); z=-1+i*.47
   m.ell(x,.72,z,.38,.84,.42,m.r.choice(['stone3','stone','slate']),0)
 for i in range(8):
  x=-1.4+i*.4;m.ell(x,1.35+(.3 if abs(x)<.8 else 0),0,.27,.25,.42,'slate',0)
 m.box(0,.02,.02,1.60,.06,2.0,'hush')


def model_for(key):
 m=Model(key)
 if key=='last_light_inn':house(m,'inn')
 elif key=='plague_tollhouse':house(m,'toll')
 elif key=='shuttered_farmhouse':house(m,'farm')
 elif key=='drowned_waychapel':house(m,'chapel')
 elif key=='wolves_watchtower':tower(m)
 elif key=='burned_coach_stable':house(m,'stable')
 elif key=='hunter_hideout':house(m,'hideout')
 elif key=='bellkeeper_hut':house(m,'hut')
 elif key=='hollow_granary':house(m,'granary')
 elif key=='abandoned_guard_post':house(m,'guard')
 elif key=='forgotten_crypt_entry':house(m,'crypt')
 elif key=='root_swallowed_cottage':house(m,'cottage')
 elif key=='gallows_three_nooses':scaffold(m)
 elif key=='noose_oak':hanging_oak(m)
 elif key=='blood_well':well(m,True)
 elif key=='last_lantern_sign':sign(m,True)
 elif key=='wrong_way_signpost':sign(m,False)
 elif key=='sealed_coffin_stack':
  for x,y,z in [(-.45,.19,-.25),(.36,.19,-.36),(-.05,.60,.43)]:
   m.box(x,y,z,1.35,.34,.62,'wood');m.box(x,y+.2,z,1.40,.07,.66,'frame')
   for sx in [-.48,.48]:m.box(x+sx,y+.16,z,.13,.12,.65,'rust')
 elif key=='bone_chime_tree':
  m.oak(0,0,h=2.7)
  for x,z in [(-.68,-.4),(.65,-.45),(.5,.67),(-.28,.76)]:
   m.tube((x,2.25,z),(x,1.27,z),.017,.016,'hay');m.ell(x,1.27,z,.08,.18,.065,'bone',0)
 elif key=='rusted_prison_cage':cage(m)
 elif key=='mourning_effigy':effigy(m)
 elif key=='false_scarecrow':effigy(m);m.ell(.04,1.52,.14,.08,.07,.04,'hush',0)
 elif key=='candled_memorial':
  m.box(0,.16,0,1.64,.30,1.3,'stone3');cross(m,0,0,1.36,'stone2')
  for i in range(9):
   a=math.tau*i/9;x=math.cos(a)*.61;z=math.sin(a)*.48
   m.cyl(x,.32,z,.035,.035,.20,'ivory',6);m.cone(x,.50,z,.025,.08,'faint',5)
 elif key=='wicker_doll_shrine':
  m.cyl(0,0,0,.73,.70,.19,'bark',9)
  for i in range(11):
   a=math.tau*i/11;m.tube((math.cos(a)*.65,.12,math.sin(a)*.63), (math.cos(a)*.28,1.17,math.sin(a)*.33),.032,.013,'hay')
  m.ell(0,1.15,0,.18,.21,.16,'ivory',0);m.box(0,.69,0,.28,.57,.2,'linen')
  for x in [-.3,.3]:m.tube((x*.5,.6,0),(x,.23,0),.037,.013,'hay')
 elif key=='handprint_shutter':
  m.box(0,.83,0,.90,1.67,.17,'frame')
  for i in range(5):
   x=-.28+i*.14;y=.68+(i%2)*.19
   m.ell(x,y,.11,.08,.105,.012,'wound',0)
   for j in range(3):m.tube((x+(j-1)*.017,y+.09,.11),(x+(j-1)*.044,y+.24,.11),.012,.005,'oldblood',4)
 elif key=='unmarked_grave_row':
  for x,z in [(-.8,-.6),(.25,-.55),(-.4,.61),(.72,.65)]:gravemark(m,x,z,m.r.uniform(.65,1.14))
 elif key=='abandoned_funeral_cart':wagon(m,funeral=True)
 elif key=='broken_stone_angel':stone_angel(m)
 elif key=='hunger_root_arch':root_arch(m,glow=True)
 elif key=='hunger_spore_vent':spore(m,False)
 elif key=='hunger_stalking_stalks':spore(m,True)
 elif key=='hunger_taken_wagon':wagon(m,corrupt=True)
 elif key=='hunger_heart_tree':
  m.oak(0,0,h=3.2)
  for i in range(8):
   a=math.tau*i/8;m.tube((0,.15,0),(math.cos(a)*1.3,.08,math.sin(a)*1.25),.15,.022,'hunger_dark')
  m.ell(0,1.2,.32,.43,.48,.34,'hunger',1)
  for i in range(8):
   a=math.tau*i/8;m.ell(math.cos(a)*.34,1.2+math.sin(a)*.35,.53,.06,.08,.05,'glow',0)
 elif key=='red_mist_stones':monolith(m)
 elif key=='bog_sunken_hands':skeletal_hands(m)
 elif key=='eyeless_stump':
  m.cyl(0,0,0,.48,.61,.77,'bark',10)
  m.ell(0,.79,0,.46,.035,.45,'hush',0)
  for x in [-.17,.17]:m.ell(x,.41,.50,.08,.1,.012,'oldblood',0)
  m.branch_roots(0,0,1.1,7)
 elif key=='wolf_bone_cairn':cairn(m)
 elif key=='blackwater_sinkhole':pond(m)
 elif key=='shadow_tunnel_roots':root_arch(m,glow=False)
 elif key=='thorns_arcade':thorns(m)
 elif key=='bridge_beneath_culvert':culvert(m)
 elif key=='hidden_cellar_hatch':hatch(m)
 elif key=='dripping_cave_door':cave(m)
 else:raise KeyError(key)
 return m

ASSET_SPECS={
'last_light_inn':('structure','roadside', [5,4],'The lone warm window is occupied by a silhouette that never shifts.'),
'plague_tollhouse':('structure','roadside',[4,4],'The tax ledger lists yesterday in a hand that died decades ago.'),
'shuttered_farmhouse':('structure','roadside',[4,4],'Every window is boarded from the inside, except one.'),
'drowned_waychapel':('structure','marsh',[4,5],'Candles burn in water that reaches the pews.'),
'wolves_watchtower':('structure','forest',[3,3],'The watch platform creaks under footsteps no one can see.'),
'burned_coach_stable':('structure','roadside',[5,4],'Every stall has a name. No horse is left.'),
'hunter_hideout':('structure','forest',[3,3],'A blind made of branches overlooks the road. Its keeper is missing.'),
'bellkeeper_hut':('structure','village',[3,3],'The little bell rings when every other bell is silent.'),
'hollow_granary':('structure','farmland',[4,3],'The grain is all gone, but the floor still shifts.'),
'abandoned_guard_post':('structure','roadside',[3,3],'The last sentry scratched warnings where visitors could not see.'),
'forgotten_crypt_entry':('structure','graveyard',[3,3],'Scratches run up the *outside* of the crypt door.'),
'root_swallowed_cottage':('structure','corruption',[4,4],'Roots have learned the shapes of the people who lived here.'),
'gallows_three_nooses':('horror_prop','roadside',[3,2],'Three nooses sway though no wind reaches the clearing.'),
'noose_oak':('horror_prop','forest',[3,3],'The tree carries empty ropes, swaying to the rhythm of breathing.'),
'blood_well':('horror_prop','village',[2,2],'Every bucket brings up black water with a red ring.'),
'last_lantern_sign':('horror_prop','roadside',[1,1],'The last lamp before the mist is warm to the touch.'),
'wrong_way_signpost':('horror_prop','roadside',[1,1],'The sign points to a settlement that should be miles behind you.'),
'sealed_coffin_stack':('horror_prop','graveyard',[2,2],'One lid knocks once when the party stops speaking.'),
'bone_chime_tree':('horror_prop','forest',[3,3],'Windless bone chimes ring in a staggered pattern.'),
'rusted_prison_cage':('horror_prop','roadside',[2,2],'Iron bars and fresh scratches. The lock faces inward.'),
'mourning_effigy':('horror_prop','farmland',[1,1],'A figure of twine with a face made from someone’s clothes.'),
'false_scarecrow':('horror_prop','farmland',[1,1],'At dusk it faces the road. By dawn it faces the camp.'),
'candled_memorial':('horror_prop','village',[2,2],'Nine flames stay upright in rain and snow.'),
'wicker_doll_shrine':('horror_prop','forest',[2,2],'Someone has offered a child-sized doll to the woods.'),
'handprint_shutter':('horror_prop','village',[1,1],'Small marks appear in red, one by one, on the locked door.'),
'unmarked_grave_row':('horror_prop','graveyard',[3,2],'Each marker has a different date. The last is tomorrow.'),
'abandoned_funeral_cart':('horror_prop','roadside',[3,2],'The cart has no driver. Its single coffin is lighter than it should be.'),
'broken_stone_angel':('horror_prop','graveyard',[2,2],'The statue’s face was chipped off. A new one lies beneath it.'),
'hunger_root_arch':('corruption','corruption',[3,2],'The arch bends lower every time someone passes through.'),
'hunger_spore_vent':('corruption','corruption',[2,2],'A pale blister opens and releases glittering threads.'),
'hunger_stalking_stalks':('corruption','corruption',[2,2],'The stalks lean toward voices before they lean toward light.'),
'hunger_taken_wagon':('corruption','corruption',[3,2],'Something has rooted itself in the wagon’s floorboards.'),
'hunger_heart_tree':('corruption','corruption',[3,3],'The trunk contracts slowly, as though it has a heart.'),
'red_mist_stones':('terrain_horror','mountain',[3,2],'A thin scarlet haze clings to stones older than the road.'),
'bog_sunken_hands':('terrain_horror','marsh',[2,2],'White fingers rest just below the black surface.'),
'eyeless_stump':('terrain_horror','forest',[2,2],'Its knots resemble sockets with no eyes.'),
'wolf_bone_cairn':('terrain_horror','forest',[2,2],'Antlers, jaws, and smooth stones mark the old hunting ground.'),
'blackwater_sinkhole':('terrain_horror','marsh',[3,3],'The water reflects no one standing beside it.'),
'shadow_tunnel_roots':('discovery','forest',[3,3],'A gap in the roots is taller on the inside.'),
'thorns_arcade':('discovery','forest',[3,3],'Black thorns grow into a covered passage toward the hills.'),
'bridge_beneath_culvert':('discovery','marsh',[4,3],'The road passes overhead. Under it, a tunnel opens into darkness.'),
'hidden_cellar_hatch':('discovery','roadside',[2,2],'A hatch beneath a drowned roadside marker leads underground.'),
'dripping_cave_door':('discovery','mountain',[3,3],'It is warmer inside the cave than outside. That is not comforting.'),
}

TAGS={
 'village':['village','vallaki','krezk','gates'], 'marsh':['berez','tser','tower'],
 'farmland':['winery','krezk','vallaki'], 'mountain':['krezk','argyn','yester','castle'],
 'forest':['crossroads','bonegrinder','coffin','tser','lake','yester'],
 'graveyard':['village','crossroads','argyn','castle'], 'corruption':['coffin','berez','yester','bonegrinder'],
 'roadside':['crossroads','village','vallaki','bonegrinder','winery','gates'],
}

def emit(k):
 m=model_for(k)
 groups={}
 for mesh in m.scene.dump():
  col=tuple(int(round(v)) for v in mesh.visual.material.baseColorFactor[:3]);groups.setdefault(col,[]).append(mesh)
 compact=trimesh.Scene()
 for i,(col,meshes) in enumerate(groups.items()):
  geom=trimesh.util.concatenate(meshes)
  geom.visual=TextureVisuals(material=PBRMaterial(baseColorFactor=list(col)+[255],metallicFactor=0,roughnessFactor=.91,doubleSided=True, name=f'{k}_material_{i:02d}'))
  compact.add_geometry(geom,node_name=f'{k}_material_{i:02d}',geom_name=f'{k}_material_{i:02d}')
 data=compact.export(file_type='glb');(ASSETS/(k+'.glb')).write_bytes(data)
 cat,biome,footprint,read=ASSET_SPECS[k]
 bound=compact.bounds
 return {'id':k,'file':f'assets/{k}.glb','category':cat,'biome':biome,'near':TAGS.get(biome,[]),
    'footprint':footprint,'height':round(float(bound[1][1]),3),
    'bounds':[[round(float(a),3) for a in b] for b in bound],
    'parts':m.count,'drawCalls':len(groups),'bytes':len(data),
    'placement':'side_only' if cat in ('structure','horror_prop','terrain_horror','corruption') else 'clearing_entry',
    'passable':False,'collision':'visual_only','dmWhisper':read}

if __name__=='__main__':
 items=[emit(k) for k in ASSET_SPECS]
 (ROOT/'manifest.json').write_text(json.dumps({'pack':'Barovia IV — The Road Watches','version':'4.0','coordinates':'1 unit = 5 feet; +Y up; N=-Z','assetCount':len(items),'integration':'visual_only; use existing Dread Delve road/grid data for passability','assets':items},indent=2,ensure_ascii=False))
 print(f'Exported {len(items)} GLB models; {sum(x["drawCalls"] for x in items)} optimized material draw calls; {sum(x["bytes"] for x in items):,} bytes')
