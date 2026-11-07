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
'hunger_dark':'#303e2d','glow':'#b3dc6b','ash':'#2c3031','lantern':'#d3a75b'}

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

# Catalog, all occupancy measured in 5-foot squares.
items=[]
def build(key,title,category,footprint,f,notes='',collision='decor',tags=()):
 m=Model(key);f(m)
 # GPU optimisation: combine primitive meshes by shared PBR color into only a handful of draw calls.
 groups={}
 for mesh in m.scene.dump():
  keycolor=tuple(mesh.visual.material.baseColorFactor[:3])
  groups.setdefault(keycolor,[]).append(mesh)
 compact=trimesh.Scene()
 for i,(color,meshes) in enumerate(groups.items()):
  combo=trimesh.util.concatenate(meshes)
  combo.visual=TextureVisuals(material=PBRMaterial(baseColorFactor=list(color)+[255],metallicFactor=0,roughnessFactor=.95,doubleSided=True))
  compact.add_geometry(combo,node_name=f'material_{i:02d}',geom_name=f'material_{i:02d}')
 path=ASSETS/(key+'.glb')
 data=compact.export(file_type='glb');path.write_bytes(data)
 # Coordinate extents are aligned to a true y-up flat ground and centered at x,z origin.
 bounds=compact.bounds
 items.append({'id':key,'name':title,'category':category,'file':f'assets/{key}.glb',
 'size':[int(footprint[0]),int(footprint[1])],'geometryBounds':[[round(float(v),3) for v in bounds[0]],[round(float(v),3) for v in bounds[1]]],
 'pieces':m.count,'meshes':len(groups),'bytes':len(data),'placement':collision,'tags':list(tags),
 'notes':notes or 'Original hand-authored procedural low-poly terrain mesh.'})

# WOODS
build('svalich_black_fir','Svalich Black Fir','Svalich Woods',(1,1),lambda m:(m.fir(0,0,2.65),m.branch_roots(0,0,.38,5),m.tufts(.2,.2,4,.25)),collision='obstacle',tags=['evergreen','forest'])
build('windworn_fir','Windworn Fir','Svalich Woods',(1,1),lambda m:(m.fir(-.10,0,2.25,bent=.48),m.branch_roots(-.1,0,.3,5)),collision='obstacle',tags=['forest','windswept'])
build('snow_crowned_fir','Snow-Crowned Fir','Svalich Woods',(1,1),lambda m:(m.fir(0,0,2.4,snow=True),m.snow_lump(.23,-.2,.5,.6,.12)),collision='obstacle',tags=['forest','winter'])
build('hunger_taken_fir','Hunger-Taken Fir','Bloom / Hunger Moss',(1,1),lambda m:(m.fir(0,0,2.45,corrupt=True),m.branch_roots(0,0,.38,6)),collision='obstacle',tags=['infected','forest','glow'])
build('crooked_oak','Crooked Black Oak','Svalich Woods',(2,2),lambda m:(m.oak(0,0,True),m.branch_roots(0,0,.83,8),m.mushroom(-.24,.2,.12)),collision='obstacle',tags=['forest','dead_tree'])
def birches(m):
 r=m.r
 for x,z,h in [(-.42,-.36,2.0),(.43,-.12,2.45),(-.14,.48,1.75)]:
  m.tube((x,0,z),(x+.11,h,z-.04),.09,.034,'birch',9)
  for i in range(4):
   yy=.2+i*.39;m.box(x+.065,yy,z,.13,.024,.14,'birch_dark',ry=i*.3)
  for dx,dz in [(-.24,.15),(.2,-.13)]:m.tube((x,h*.6,z),(x+dx,h*.92,z+dz),.029,.005,'birch_dark',5)
 m.tufts(0,0,10,.85)
build('pale_birch_thicket','Pale Birch Thicket','Svalich Woods',(2,2),birches,collision='obstacle',tags=['forest','birch'])
def fallen(m):
 m.tube((-.85,.20,0),(.85,.27,.15),.24,.20,'wood',12)
 m.ell(-.87,.2,0,.02,.15,.15,'ash',0)
 m.ell(.86,.27,.15,.025,.15,.15,'bark',0)
 for x,z,s in [(-.4,-.16,.13),(.1,.18,.11),(.5,-.07,.08)]:m.mushroom(x,z,s)
 m.tufts(-.6,.4,4,.2)
build('hollow_fallen_log','Hollow Fallen Log','Svalich Woods',(2,1),fallen,collision='obstacle',tags=['fallen','mushrooms'])
def brambles(m):
 r=m.r
 for i in range(16):
  a=r.uniform(0,2*math.pi);d=r.uniform(.2,.85);x=math.sin(a)*d;z=math.cos(a)*d
  a0=(x,0,z);a1=(x+r.uniform(-.17,.17),r.uniform(.18,.56),z+r.uniform(-.2,.2));a2=(a1[0]+r.uniform(-.25,.25),r.uniform(.10,.32),a1[2]+r.uniform(-.23,.23))
  m.tube(a0,a1,.025,.014,'bark',5);m.tube(a1,a2,.014,.002,'bark',4)
  if i%3==0:m.ell(a1[0],a1[1],a1[2],.06,.06,.06,'red',0)
  for j in range(2):m.cone(a1[0]+r.uniform(-.05,.05),a1[1],a1[2]+r.uniform(-.05,.05),.05,.13,'leaf2',5)
build('thorn_choked_brambles','Thorn-Choked Brambles','Svalich Woods',(2,2),brambles,collision='difficult',tags=['undergrowth','brambles'])
def stump(m):
 m.cyl(0,0,0,.31,.35,.52,'wood',9)
 m.ell(0,.52,0,.29,.035,.28,'bark',sub=0);m.ell(0,.55,0,.16,.023,.16,'ash',sub=0)
 m.branch_roots(0,0,.53,7)
 for x,z in ((-.24,.25),(.27,.15),(.34,-.27)):m.mushroom(x,z,.12)
build('mushroom_stump','Mushroom-Crowned Stump','Svalich Woods',(1,1),stump,collision='obstacle',tags=['mushrooms','stump'])
def hollow_tree(m):
 m.cyl(0,0,0,.38,.44,1.25,'bark',9)
 m.ell(.05,.72,.34,.19,.37,.05,'ash',1)
 for x,z in [(-.3,.26),(.32,-.21)]:m.tube((0,.8,0),(x,1.8,z),.14,.045,'wood',7)
 m.branch_roots(0,0,.85,8)
 for i in range(5):m.mushroom(-.3+i*.12,.4+i*.1,.11)
build('hollow_witch_tree','Hollow Witch Tree','Svalich Woods',(2,2),hollow_tree,collision='obstacle',tags=['tree','witch'])

# ROADS & ROADSIDES
def road(m,bend=False,blight=False,farm=False):
 m.flat_patch(3,3,-.085,.06,'road',11)
 r=m.r
 for i in range(13):
  z=-1.38+i*.22
  drift=.34*math.sin((z+1.3)*1.05) if bend else .11*math.sin(z*1.3)
  xoff=.20 if bend else 0
  for dx in (-.45,.45):
   xx=xoff+dx+drift
   m.ell(xx,-.018,z,.13,.018,.21,'hunger_dark' if blight else 'rut',sub=0)
  if i%2==0:
   for j in range(2):
    x=r.choice([-1,1])*r.uniform(.75,1.2)
    m.stone(x,z+r.uniform(-.13,.13),r.uniform(.06,.14),c='stone3')
 if blight:
  for i in range(20):
   x=r.uniform(-1.3,1.3);z=r.uniform(-1.35,1.35)
   m.ell(x,-.007,z,r.uniform(.06,.18),.015,r.uniform(.08,.22),r.choice(['hunger','hunger_dark']),0)
  for i in range(4):m.ell(r.uniform(-1,1),.08,r.uniform(-1,1),.075,.12,.09,'glow',0)
 if farm:
  for i in range(10):m.tufts(r.choice([-1,1])*r.uniform(1.04,1.37),r.uniform(-1.35,1.35),2,.1)
build('svalich_rutted_road','Rutted Svalich Road','Roads & Villages',(3,3),lambda m:road(m),collision='surface',tags=['road','mud'])
build('svalich_winding_road','Svalich Road Bend','Roads & Villages',(3,3),lambda m:road(m,bend=True),collision='surface',tags=['road','bend'])
build('abandoned_farm_track','Abandoned Farm Track','Roads & Villages',(3,3),lambda m:road(m,farm=True),collision='surface',tags=['road','farm'])
build('hunger_claimed_road','Hunger-Claimed Road','Bloom / Hunger Moss',(3,3),lambda m:road(m,blight=True),collision='surface',tags=['road','infected'])
def cobbles(m):
 m.flat_patch(3,3,-.09,.07,'peat',10)
 r=m.r
 for zi in range(7):
  for xi in range(7):
   if (zi*3+xi*5)%11 in (0,1):continue
   x=-1.27+xi*.42+(.18 if zi%2 else 0)+r.uniform(-.06,.06)
   z=-1.25+zi*.4+r.uniform(-.06,.06)
   m.box(x,.004,z,.34,r.uniform(.055,.10),.30,r.choice(['stone','stone2','stone3']),ry=r.uniform(-.2,.2))
 for _ in range(18):
  x=r.uniform(-1.4,1.4);z=r.uniform(-1.4,1.4)
  m.ell(x,.035,z,.08,.015,.07,'moss',0)
build('vallaki_cracked_cobbles','Cracked Vallaki Cobbles','Roads & Villages',(3,3),cobbles,collision='surface',tags=['urban','cobblestone'])
def milestone(m):
 m.stone(.1,-.2,.28,'stone')
 m.box(0,.42,0,.35,.84,.26,'stone2',ry=-.12)
 m.cone(0,.78,0,.25,.16,'stone',5)
 for y in (.39,.55):m.box(.06,y,.145,.19,.023,.012,'stone3')
 m.tufts(.25,.29,5,.2)
build('lost_svalich_milestone','Lost Svalich Milestone','Roads & Villages',(1,1),milestone,collision='obstacle',tags=['wayfinding','roadside'])
def fieldwall(m):
 m.stone_wall(0,0,2.6,.49,True)
 for x,z in [(-.38,.45),(.03,.5),(.4,-.4)]:m.stone(x,z,.23)
 m.tufts(.8,.35,5,.27)
build('collapsed_fieldwall','Collapsed Fieldstone Wall','Roads & Villages',(3,1),fieldwall,collision='obstacle',tags=['cover','stone'])
def fence(m):
 for x,lean in [(-1.20,.02),(0,.17),(1.18,-.18)]:
  m.tube((x,0,0),(x+lean,.9,0),.066,.045,'wood',5)
 for h in (.34,.72):
  for x in (-.6,.6):m.box(x,h,.04,1.15,.10,.07,'wood2',ry=.0)
 m.box(.43,.12,.21,.90,.07,.11,'wood',ry=.38)
build('leaning_splitrail_fence','Leaning Split-Rail Fence','Roads & Villages',(3,1),fence,collision='obstacle',tags=['farm','fence'])
def bridge(m):
 # 4 x 2 span: worn planks over invisible ditch, gaps can be traversed if game allows.
 for i in range(12):
  if i in (3,8):continue
  z=-.9+i*.17
  m.box(0,.18,z,3.9,.11,.145,m.r.choice(['wood','wood2']),ry=m.r.uniform(-.025,.025))
 for z in (-.78,.75):
  for x in (-1.8,0,1.8):m.cyl(x,.06,z,.07,.10,.65,'bark')
  m.box(0,.62,z,4,.10,.10,'wood2')
 for x in (-1.4,1.5):m.stone(x,.96,.22,'stone3')
build('svalich_splintered_bridge','Splintered Timber Bridge','Roads & Villages',(4,2),bridge,collision='surface',tags=['bridge','hazard'])

# WETLANDS
def blackpool(m):
 m.flat_patch(3,3,-.10,.04,'peat',8)
 m.ell(0,-.035,0,1.22,.022,1.01,'water',sub=2)
 m.ell(-.13,-.01,-.15,.83,.013,.61,'water2',sub=1)
 for i in range(17):
  a=m.r.uniform(0,2*math.pi);d=m.r.uniform(1.05,1.42);x=math.sin(a)*d;z=math.cos(a)*d
  if i%3==0:m.stone(x,z,.13,'stone3')
  else:m.tufts(x,z,3,.14,True)
build('tser_blackwater_pool','Tser Blackwater Pool','Tser Pool & Bog',(3,3),blackpool,collision='water',tags=['pool','marsh'])
def cattails(m):
 m.flat_patch(2,2,-.095,.018,'peat',6)
 r=m.r
 for i in range(27):
  x=r.uniform(-.86,.86);z=r.uniform(-.88,.88)
  h=r.uniform(.35,.85);m.tube((x,0,z),(x+r.uniform(-.07,.07),h,z+r.uniform(-.08,.08)),.019,.007,r.choice(['reed','reed2']),5)
  if i%3==0:m.ell(x,h-.11,z,.038,.13,.04,'bark',0)
 for x,z in [(-.55,.18),(.22,-.43)]:m.ell(x,.001,z,.36,.02,.31,'water',1)
build('tser_cattail_reeds','Tser Cattail Reeds','Tser Pool & Bog',(2,2),cattails,collision='difficult',tags=['reeds','marsh'])
def boardwalk(m):
 m.flat_patch(3,1,-.10,.018,'peat',6)
 m.ell(0,-.06,0,1.4,.013,.42,'water',2)
 for x in [i*.27-1.35 for i in range(11)]:
  m.box(x,.14,0,.23,.08,.79,m.r.choice(['wood','wood2']),ry=m.r.uniform(-.03,.03))
 for x in [-1.32,1.32]:
  for z in (-.40,.40):m.cyl(x,0,z,.05,.06,.48,'wood')
build('tser_sodden_boardwalk','Sodden Tser Boardwalk','Tser Pool & Bog',(3,1),boardwalk,collision='surface',tags=['bridge','marsh'])
def hummock(m):
 m.flat_patch(3,3,-.11,.09,'peat',9)
 m.ell(-.3,-.002,.06,.97,.18,.77,'soil',1)
 m.ell(.5,-.018,-.4,.5,.15,.51,'moss',1)
 for i in range(9):m.tufts(m.r.uniform(-1.2,1.2),m.r.uniform(-1.2,1.2),3,.22,True)
 for x,z in ((-.3,.2),(.2,.48),(-.6,-.32)):m.mushroom(x,z,.09)
build('tser_sodden_hummock','Sodden Bog Hummock','Tser Pool & Bog',(3,3),hummock,collision='difficult',tags=['marsh','mushrooms'])

# THE BALINOKS

def cliff(m):
 m.flat_patch(3,2,-.12,.06,'stone3',8)
 # vertical fractured wall in the northern half: width 3, depth 1.3, height 1.6
 for i in range(8):
  x=-1.31+i*.37;h=m.r.uniform(1.35,1.95)
  m.box(x,h/2-.07,-.38,.38,h,1.12,m.r.choice(['stone','stone2','slate','stone3']),ry=m.r.uniform(-.09,.09))
  if i%2==0:m.stone(x,.33,.22,'stone3')
 for i in range(8):m.stone(m.r.uniform(-1.4,1.4),m.r.uniform(.22,.89),m.r.uniform(.10,.27))
 m.tufts(-1.1,.55,7,.26)
build('balinok_shale_cliff','Balinok Shale Cliff','Balinok Mountains',(3,2),cliff,collision='obstacle',tags=['cliff','mountain'])
def scree(m):
 m.flat_patch(3,3,-.11,.065,'slate',9)
 for i in range(32):
  x=m.r.uniform(-1.35,1.35);z=m.r.uniform(-1.35,1.35)
  m.stone(x,z,m.r.uniform(.08,.31),m.r.choice(['stone','stone2','stone3','slate']))
 for i in range(6):m.tufts(m.r.uniform(-1.3,1.3),m.r.uniform(-1.3,1.3),2,.16)
build('balinok_loose_scree','Loose Balinok Scree','Balinok Mountains',(3,3),scree,collision='difficult',tags=['rocks','mountain'])
def snowfield(m):
 m.flat_patch(3,3,-.1,.04,'slate',9)
 for x,z,w,d,h in [(-.4,-.3,1.8,1.3,.34),(.7,.4,1.5,1.4,.37),(-.75,.84,1.3,.9,.17)]:m.snow_lump(x,z,w,d,h)
 for i in range(14):
  x=m.r.uniform(-1.4,1.4);z=m.r.uniform(-1.4,1.4)
  m.stone(x,z,.08,'stone3')
build('balinok_windblown_snow','Windblown Snowdrift','Balinok Mountains',(3,3),snowfield,collision='difficult',tags=['snow','winter'])
def frozen(m):
 m.flat_patch(3,2,-.10,.02,'soil',8)
 for i in range(12):
  x=-1.35+i*.245
  z=.22*math.sin(x*2)
  m.ell(x,-.029,z,.20,.012,.40,'ice',1)
  for s in (-1,1):m.stone(x,z+s*.53,.12,'stone3')
 for i in range(5):m.snow_lump(m.r.uniform(-1.3,1.3),m.r.choice([-.8,.8]),.34,.18,.09)
build('balinok_frozen_brook','Frozen Mountain Brook','Balinok Mountains',(3,2),frozen,collision='water',tags=['ice','stream'])
def cave(m):
 # Open centre is truly empty dark space, framed by natural rock wedges.
 for i in range(7):
  x=-1.7+i*.57
  h=.5+1.55*min(1,abs(x)/1.35)
  if abs(x)<.7:continue
  m.box(x,h/2-.08,-.4,.57,h,1.9,m.r.choice(['slate','stone3','stone']),ry=m.r.uniform(-.08,.08))
 for i in range(8):
  a=math.pi*i/9;xx=-1.6*math.cos(a);yy=.3+2.0*math.sin(a)
  if yy<.5:continue
  m.ell(xx,yy,-.44,.38,.24,.7,m.r.choice(['stone','stone3','slate']),0)
 for i in range(10):
  x=m.r.uniform(-1.8,1.8);z=m.r.uniform(.2,1.4)
  m.stone(x,z,m.r.uniform(.12,.24),'stone3')
build('balinok_cave_mouth','Balinok Cave Mouth','Balinok Mountains',(4,3),cave,collision='portal',tags=['cave','entrance'])

# RAVAGED VALLEY
def shrine(m):
 m.box(0,.11,-.15,1.5,.2,.9,'stone3')
 m.box(0,.37,-.33,1.1,.38,.45,'stone2')
 m.box(0,.86,-.5,.8,.6,.25,'stone')
 m.cone(0,1.17,-.5,.34,.28,'slate',6)
 m.box(0,.84,-.26,.14,.34,.04,'chalk')
 for x in (-.38,.38):
  m.cyl(x,.46,.05,.04,.04,.19,'bone')
  m.cone(x,.66,.05,.032,.11,'lantern',6)
 for x,z in [(-.72,.31),(.72,.25)]:m.tufts(x,z,4,.15)
build('forsaken_road_shrine','Forsaken Wayside Shrine','Ruins & Omens',(2,2),shrine,collision='obstacle',tags=['holy','roadside'])
def graves(m):
 m.flat_patch(3,3,-.1,.035,'soil',8)
 for x,z,angle in [(-.85,-.85,-.15),(.65,-.73,.12),(-.2,.32,-.26),(.83,.90,.13),(-1.06,.78,.27)]:
  m.gravestone(x,z,m.r.uniform(.82,1.12))
  m.ell(x,-.03,z+.20,.46,.1,.28,'dirt',1)
 for i in range(7):m.tufts(m.r.uniform(-1.3,1.3),m.r.uniform(-1.3,1.3),3,.18)
build('forgotten_graves','Forgotten Roadside Graves','Ruins & Omens',(3,3),graves,collision='difficult',tags=['cemetery','grave'])
def arch(m):
 for x in (-1.15,1.15):
  for y in (0.25,.73,1.21):m.box(x,y,0,.44,.45,.6,m.r.choice(['stone','stone2','stone3']))
 for x,y in [(-.85,1.76),(-.40,1.94),(.1,1.99),(.57,1.86),(.99,1.67)]:
  m.box(x,y,0,.55,.33,.56,m.r.choice(['stone','stone2','slate']),ry=m.r.uniform(-.08,.08))
 for x,z in ((.4,.35),(-1.35,-.31)):
  for i in range(3):m.stone(x+i*.2,z,.16,'stone3')
build('ruined_vallaki_arch','Ruined Stone Arch','Ruins & Omens',(3,1),arch,collision='portal',tags=['ruins','arch'])
def camp(m):
 m.flat_patch(2,2,-.1,.05,'soil',7)
 for i in range(8):
  a=i*math.pi/4
  m.stone(math.sin(a)*.4,math.cos(a)*.4,.12,'stone3')
 for a in (-.8,0,.75):
  m.tube((-.12,.03,a*.25),(.10,.19,a*.25+.12),.055,.034,'wood',5)
 for i in range(6):m.ell(m.r.uniform(-.20,.2),.065,m.r.uniform(-.26,.26),.08,.03,.08,'ash',0)
 m.box(-.55,.12,.70,.90,.24,.25,'wood2',ry=.28)
 m.box(.57,.06,-.78,.56,.12,.44,'cloth',ry=-.2)
build('abandoned_watchfire','Abandoned Watchfire','Ruins & Omens',(2,2),camp,collision='decor',tags=['camp','ruins'])
def gallows(m):
 m.flat_patch(2,2,-.11,.06,'soil',7)
 for x in (-.65,.64):m.tube((x,0,-.3),(x,1.86,-.30),.11,.10,'bark',7)
 m.box(0,1.9,-.3,1.6,.17,.17,'wood2')
 m.tube((.30,1.80,-.30),(.30,1.20,-.30),.018,.017,'bone',6)
 m.ell(.30,1.18,-.30,.14,.03,.11,'bone',0)
 m.box(-.3,.10,.32,.82,.15,.34,'wood',ry=.16)
 m.tufts(-.65,.55,5,.22)
build('empty_gallows','Empty Crossroads Gallows','Ruins & Omens',(2,2),gallows,collision='obstacle',tags=['gallows','ominous'])

# HUNGER MOSS

def fungus(m):
 m.flat_patch(3,3,-.11,.05,'soil',8)
 r=m.r
 for i in range(37):
  x=r.uniform(-1.4,1.4);z=r.uniform(-1.4,1.4)
  s=r.uniform(.11,.43)
  m.ell(x,.02,z,s,.05,s*.8,r.choice(['hunger','hunger_dark','moss2']),0)
 for i in range(12):
  x=r.uniform(-1.2,1.2);z=r.uniform(-1.2,1.2)
  m.cyl(x,0,z,.048,.10,r.uniform(.19,.36),'hunger_dark',6)
  m.ell(x,.30,z,.09,.075,.085,r.choice(['glow','hunger']),0)
build('hunger_moss_colony','Hunger Moss Colony','Bloom / Hunger Moss',(3,3),fungus,collision='difficult',tags=['infected','glow','floor'])
def spires(m):
 m.flat_patch(2,2,-.11,.04,'soil',7)
 for x,z,h in [(-.4,-.23,1.4),(.3,.21,1.95),(.53,-.54,.97),(-.56,.47,.75)]:
  m.cyl(x,0,z,.045,.19,h,'hunger_dark',6)
  for i in range(3):
   y=h*(.27+i*.24)
   m.ell(x,y,z,.16+i*.025,.1,.17,'hunger',0)
  m.ell(x,h,z,.11,.13,.11,'glow',1)
 for i in range(10):m.mushroom(m.r.uniform(-.8,.8),m.r.uniform(-.8,.8),.08,True)
build('hunger_moss_spires','Hunger Moss Spires','Bloom / Hunger Moss',(2,2),spires,collision='obstacle',tags=['infected','glow','hazard'])

# An extra 'story' piece that works as a memorable landmark.
def sentry_stones(m):
 m.flat_patch(3,3,-.12,.03,'soil',7)
 for x,z,ang in ((-.85,-.57,-.08),(.72,-.83,.11),(.83,.74,-.12),(-.71,.77,.05)):
  m.box(x,.66,z,.48,1.32,.36,'stone3',ry=ang)
  m.cone(x,1.31,z,.31,.31,'stone2',5)
 for i in range(14):m.ell(m.r.uniform(-1.2,1.2),-.04,m.r.uniform(-1.2,1.2),.09,.015,.07,'moss',0)
build('forgotten_sentry_stones','Forgotten Sentry Stones','Ruins & Omens',(3,3),sentry_stones,collision='difficult',tags=['standing_stones','landmark'])

manifest={'pack':'The Living Valley: Barovia Terrain','version':'1.0.0','license':'CC0-1.0 (original generated geometry)',
 'authoring':'Original custom geometry constructed from primitive and hand-authored organic meshes; no third-party art assets.',
 'axes':'+Y up, north -Z, center pivot at (0,0,0), ground at Y=0',
 'unit':'1 Three.js world unit = 1 Dread Delve square = 5 feet',
 'usage':'Place at tile center: mesh.position.set(wx(x), floorY(level), wz(y)); rotate in 90-degree increments when useful.',
 'placementTypes':{'surface':'covers or replaces ground art; use only where the map should have this terrain',
 'obstacle':'solid scenery; keep off playable corridors and exits',
 'difficult':'optional move-penalty zone; use game terrain rules',
 'water':'water or ice decoration; handle passability from map semantics',
 'portal':'structural feature with a passable opening; integrate entry/exit semantics explicitly',
 'decor':'visual dressing; do not assume it blocks movement'},'items':items}
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print('Built',len(items),'assets; total GLB KiB',round(sum(i['bytes'] for i in items)/1024,1), 'largest',max((i['bytes'],i['id']) for i in items))
