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


# ------------------------ ROAD CONNECTION KIT III ------------------------
# Tile contract: one 8x8 tile (1 unit = 5 feet), centered at origin, +Y up.
# Every open side has a centered lane with exact width 3 (road/cobble), 2 (path/trail).
# Rotation is handled at runtime, not baked into the model files.

SHAPES={
 'straight_ns':'NS','straight_ew':'EW',
 'bend_ne':'NE','bend_es':'ES','bend_sw':'SW','bend_wn':'WN',
 'tee_nes':'NES','tee_esw':'ESW','tee_nsw':'NSW','tee_new':'NEW',
 'cross':'NESW',
 'cap_n':'N','cap_e':'E','cap_s':'S','cap_w':'W',
}
WIDTH={'road':3.0,'cobble':3.0,'path':2.0,'trail':2.0}
COLOR={'road':'road','cobble':'cobble','path':'dirt','trail':'gravel'}
SPECIAL={
 'bridge_timber_ew':('road', 'EW', 'timber'),
 'bridge_stone_ew':('road', 'EW', 'stonebridge'),
 'bridge_foot_ew':('path', 'EW', 'footbridge'),
 'bridge_marsh_ew':('path', 'EW', 'boardwalk'),
 'bridge_rope_ew':('trail', 'EW', 'rope'),
 'bridge_timber_ns':('road', 'NS', 'timber'),
 'gate_barovia_ew':('road', 'EW', 'gate'),
 'gate_vallaki_ew':('cobble', 'EW', 'palisade'),
 'gate_krezk_ew':('road', 'EW', 'krezk'),
 'approach_vineyard_ew':('road', 'EW', 'vineyard'),
 'approach_bonegrinder_ew':('road', 'EW', 'bonegrinder'),
 'approach_tser_ew':('path', 'EW', 'landing'),
 'mountain_switchback_ew':('trail', 'EW', 'mountain'),
 'hunger_road_ew':('road', 'EW', 'hunger'),
 'hunger_path_tee_new':('path','NEW','hunger'),
 'hunger_trail_ew':('trail','EW','hunger'),
 'burned_cut_trail_ew':('trail','EW','mountain'),
}
TRANSITIONS={
 'transition_road_path_ns':('N','road','S','path'),
 'transition_path_trail_ns':('N','path','S','trail'),
 'transition_road_cobble_ns':('N','road','S','cobble'),
 'transition_cobble_road_ns':('N','cobble','S','road'),
}
items=[]

def lane_width(style):return WIDTH[style]

def lane_cut(x,z,sockets,width):
 if max(abs(x),abs(z)) < width*.62:return True
 return any((d=='N' and z<=0 and abs(x)<width*.62) or
            (d=='S' and z>=0 and abs(x)<width*.62) or
            (d=='E' and x>=0 and abs(z)<width*.62) or
            (d=='W' and x<=0 and abs(z)<width*.62) for d in sockets)

def base(m,style):
 m.box(0,-.14,0,8,.22,8, 'bog' if style=='path' else 'peat' if style=='trail' else 'soil')
 # A 1-square grid physically meets the next tile at x,z = ±4 exactly, with no boundary props.

def lane(m,sockets,style,transition=None):
 width=lane_width(style)
 # The junction's central square and four half-strips meet exactly at identical Y.
 m.box(0,-.002,0,width,.045,width,COLOR[style])
 for d in sockets:
  astyle=transition.get(d,style) if transition else style
  w=lane_width(astyle)
  if d=='N':m.box(0,-.002,-2,w,.045,4,COLOR[astyle])
  if d=='S':m.box(0,-.002,2,w,.045,4,COLOR[astyle])
  if d=='E':m.box(2,-.002,0,4,.045,w,COLOR[astyle])
  if d=='W':m.box(-2,-.002,0,4,.045,w,COLOR[astyle])
 if transition:
  # nested center is more natural than a hard-edged discontinuity; shoulders widen on the road side.
  maxw=max(lane_width(s) for s in transition.values())
  m.box(0,-.003,0,maxw,.044,maxw,COLOR[style])

def ferns(m,x,z,style):
 r=m.r
 for k in range(3):
  xx=x+r.uniform(-.1,.1);zz=z+r.uniform(-.1,.1)
  m.tube((xx,-.018,zz),(xx+r.uniform(-.11,.11),r.uniform(.10,.29),zz+r.uniform(-.12,.12)),.014,.002,
    r.choice(['reed','reed2'] if style=='path' else ['moss','needle','leaf2']),5)

def rock(m,x,z,size=.15):
 m.ell(x,.024,z,size*.85,size*.42,size, m.r.choice(['stone','stone2','stone3']),sub=0)

def add_decoration(m,style,sockets,special=None,transition=None):
 r=m.r; width=max([lane_width(style)] + [lane_width(s) for s in (transition or {}).values()])
 for _ in range(36 if style!='cobble' else 19):
  x=r.uniform(-3.53,3.53);z=r.uniform(-3.53,3.53)
  if lane_cut(x,z,sockets,width) or (abs(x)>3.35 and abs(z)>3.35 and r.random()<.35):continue
  p=r.random()
  if special in ('mountain','bonegrinder') or style=='trail':
   if p<.74:rock(m,x,z,r.uniform(.11,.30))
   else:ferns(m,x,z,style)
  elif special=='hunger':
   if p<.44: m.ell(x,.023,z,.20,.06,.17,'hunger_dark',0)
   elif p<.77: m.ell(x,.03,z,.11,.05,.15,'hunger',0)
   else: m.ell(x,.11,z,.055,.1,.06,'glow',0)
  elif style=='path':
   if p<.58:ferns(m,x,z,style)
   else:rock(m,x,z,r.uniform(.08,.16))
  else:
   if p<.50:ferns(m,x,z,style)
   else:rock(m,x,z,r.uniform(.06,.17))
 # road markings, chipped pavement or wheel ruts lie below the playable deck surface.
 if style in ('road','path'):
  for side in (-.52,.52) if style=='road' else (0,):
   for d in sockets:
    for i in range(5):
     k=.24+i*.67; f=1 if d in ('S','E') else -1
     x=(side if d in 'NS' else k*f);z=(k*f if d in 'NS' else side)
     if abs(x)>3.38 or abs(z)>3.38:continue
     m.ell(x,.027,z,.13 if d in 'NS' else .22,.011,.22 if d in 'NS' else .13,'rut',0)
 if style=='cobble':
  for j in range(11):
   for i in range(11):
    x=-3.35+i*.67+((j%2)*.26);z=-3.35+j*.67
    if abs(x)>3.55 or not lane_cut(x,z,sockets,3):continue
    m.box(x,.03,z,r.uniform(.38,.55),.035,r.uniform(.38,.55),r.choice(['stone','cobble','cobble2','stone3']))
 if style=='trail':
  for _ in range(24):
   x=r.uniform(-3.4,3.4);z=r.uniform(-3.4,3.4)
   if lane_cut(x,z,sockets,2):rock(m,x,z,r.uniform(.045,.13))

def bridge(m,sockets,style,special):
 ew = sockets=='EW'
 water={'footbridge':'water2','boardwalk':'water','stonebridge':'water2','rope':'water','timber':'water'}[special]
 m.box(0,-.065,0,8,.08,8,water)
 # Banks: a deep river runs perpendicular to the traversable deck.
 w=lane_width(style)
 for s in [-1,1]:
  for t in [-1,1]:
   offset=t*(4+w/2)/2; extent=4-w/2
   if ew: m.box(s*3.45,-.09,offset,1.0,.10,extent,'bog')
   else: m.box(offset,-.09,s*3.45,extent,.10,1.0,'bog')
 if special=='stonebridge':
  if ew:m.box(0,-.10,0,8,.24,w,'stone2')
  else:m.box(0,-.10,0,w,.24,8,'stone2')
  for i in range(-7,8):
   t=i*.52
   if ew:
    for s in [-1,1]:m.box(t,.23,s*(w/2+.17),.40,.36,.35,'stone')
   else:
    for s in [-1,1]:m.box(s*(w/2+.17),.23,t,.35,.36,.40,'stone')
 else:
  plankcolor='wood' if special in ('timber','boardwalk') else 'wood2'
  if ew:m.box(0,-.09,0,8,.20,max(1.7,w-.15),'wood2')
  else:m.box(0,-.09,0,max(1.7,w-.15),.20,8,'wood2')
  for k in range(16):
   t=-3.75+k*.50
   if ew:m.box(t,.035,0,.43,.035,w*.95,plankcolor)
   else:m.box(0,.035,t,w*.95,.035,.43,plankcolor)
  # Safe, solid visual guard rails: all geometry stays outside the passage width.
  for s in [-1,1]:
   if ew:
    for t in [-3.5,-1.6,.1,1.9,3.5]:m.box(t,.60,s*(w/2+.18),.14,.75,.15,'wood')
    m.box(0,.95,s*(w/2+.18),7.9,.12,.12,'wood2')
   else:
    for t in [-3.5,-1.6,.1,1.9,3.5]:m.box(s*(w/2+.18),.60,t,.15,.75,.14,'wood')
    m.box(s*(w/2+.18),.95,0,.12,.12,7.9,'wood2')
  if special=='rope':
   for s in [-1,1]:
    for t in range(-3,4):
     c=.87+.08*math.cos(t/3*math.pi)
     if ew:m.tube((t,c,s*(w/2+.25)),(t+1,c,s*(w/2+.25)),.023,.023,'hay')
     else:m.tube((s*(w/2+.25),c,t),(s*(w/2+.25),c,t+1),.023,.023,'hay')

def arch(m,color='stone'):
 for x in [-2.28,2.28]:
  m.box(0,.02,x,.1,.1,.1,'road') # inert small threshold marker
  m.box(0,1.15,x,.8,2.3,.9,color)
 m.box(0,2.46,0,.90,.55,5.3,color)
 for z in [-2.55,2.55]:m.cone(0,2.75,z,.29,.85,'slate',8)

def special_detail(m,style,sockets,special):
 r=m.r
 if special in ('gate','palisade','krezk'):
  color={'gate':'stone2','palisade':'wood','krezk':'stone'}[special]
  # An overhead arch spans the E-W path without closing the center.
  for z in (-2.12,2.12):
   m.box(0,.82,z,.46,1.65,.53,color)
   m.box(0,1.74,z,.62,.22,.60,'stone3')
  m.box(0,1.87,0,.75,.24,4.65,color)
  if special=='palisade':
   for z in (-3.6,-3.0,3.0,3.6):m.cone(0,1.0,z,.29,1.30,'wood',6)
  elif special=='krezk':
   for z in (-3.1,3.1):m.box(0,.5,z,.9,.95,.65,'stone3')
  else:
   for z in (-2.45,2.45):m.ell(0,2.15,z,.26,.28,.26,'stone3',0)
 if special=='vineyard':
  for z in (-2.9,2.9):
   for x in (-3,-1,1,3):
    m.box(x,.44,z,.08,.84,.08,'wood')
    for dz in (-.15,.15):m.ell(x,.8,z+dz,.31,.16,.25,'leaf2',0)
    m.ell(x,.59,z,.09,.12,.10,'red',0)
 if special=='bonegrinder':
  # Bone-white flour spills at the edges; the road remains clear.
  for z in (-3.0,3.0):
   m.ell(-1.9,.02,z,.51,.07,.60,'chalk',0)
   m.box(1.9,.34,z,.23,.66,.20,'wood')
   m.cone(1.9,.75,z,.16,.36,'iron',6)
 if special=='landing':
  for z in [-3,3]:
   m.box(-2.3,.24,z,.3,.55,.3,'wood')
   m.box(2.3,.24,z,.3,.55,.3,'wood')
  for z in [-3.55,3.55]:m.ell(0,.03,z,.5,.04,.25,'reed',0)
 if special=='mountain':
  for z in [-3.12,3.12]:
   m.stone(-2.6,z,.5,c='stone3');m.stone(2.6,z,.37,c='stone')
   for x in [-2.9,-2.5,-2.1]:m.ell(x,.08,z,.15,.06,.18,'snow2',0)
 if special=='hunger':
  for z in [-2.3,2.3]:
   for x in [-3,-2.6,2.6,3]:
    m.ell(x,.17,z,.14,.17,.16,r.choice(['hunger','hunger_dark','glow']),0)

def make_tile(id, style, sockets, special=None, transition=None):
 m=Model(id)
 if special in ('timber','stonebridge','footbridge','boardwalk','rope'):
  base(m,style); bridge(m,sockets,style,special)
 else:
  base(m,style)
  lane(m,sockets,style,transition=transition)
  add_decoration(m,style,sockets,special=special,transition=transition)
  if special:special_detail(m,style,sockets,special)
 return m

def export_tile(id,category,style,ports,special=None,transition=None):
 m=make_tile(id,style,''.join(ports),special,transition)
 groups={}
 for mesh in m.scene.dump():
  keycolor=tuple(mesh.visual.material.baseColorFactor[:3]);groups.setdefault(keycolor,[]).append(mesh)
 compact=trimesh.Scene()
 for i,(color,meshes) in enumerate(groups.items()):
  geom=trimesh.util.concatenate(meshes)
  geom.visual=TextureVisuals(material=PBRMaterial(baseColorFactor=list(color)+[255],metallicFactor=0,roughnessFactor=.96,doubleSided=True))
  compact.add_geometry(geom,node_name=f'road_material_{i:02d}',geom_name=f'road_material_{i:02d}')
 data=compact.export(file_type='glb');(ASSETS/(id+'.glb')).write_bytes(data)
 bounds=compact.bounds
 items.append({'id':id,'file':f'assets/{id}.glb','category':category,'style':style,'sockets':ports,
               'tileSize':[8,8], 'edgeWidth':{d:WIDTH[transition.get(d,style)] if transition else WIDTH[style] for d in ports},
               'special':special or '', 'transitional':bool(transition), 'parts':m.count,'drawCalls':len(groups),
               'bytes':len(data),'bounds':[[round(float(n),3) for n in line] for line in bounds],
               'collision':'surface','nav':'visual_only'})

# 15 Dirt road connectors, 11 footpaths, 11 mountain trail connectors, 7 cobbled street pieces.
for style,shapes in [('road',list(SHAPES)),('path',[k for k in SHAPES if k!='cross' and k!='bend_wn' and k!='bend_sw' and k!='tee_nsw']),('trail',[k for k in SHAPES if k!='cross' and k!='bend_ne' and k!='bend_es' and k!='tee_nes']),
                     ('cobble',['straight_ns','straight_ew','bend_ne','bend_sw','tee_new','tee_esw','cross'])]:
 for name in shapes:export_tile(f'{style}_{name}',f'{style.title()} connector',style,{d:style for d in SHAPES[name]})
for id,(sockets,styleA,other,styleB) in TRANSITIONS.items():
 transition={sockets:styleA,other:styleB};export_tile(id,'Surface transition',styleA,transition,transition=transition)
for id,(style,sockets,special) in SPECIAL.items():
 export_tile(id,'Landmark / bridge',style,{d:style for d in sockets},special)

manifest={'pack':'Barovia Roads & Connections III','version':'3.0','worldScale':'1 world unit = 5 feet',
 'tileDimension':8,'assetCount':len(items),'orientation':'N = -Z, E = +X, S = +Z, W = -X; rot=1 means 90 degrees clockwise viewed from above',
 'collision':'Visual surface only. Host VTT owns the walkable grid, terrain and pathfinding. Do not alter T.ROCK or T.HALL.',
 'assets':items}
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2))
print(f'Exported {len(items)} GLBs with {sum(i["drawCalls"] for i in items)} material meshes and {sum(i["bytes"] for i in items):,} total bytes.')
