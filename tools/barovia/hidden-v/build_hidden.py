"""Original low-poly Barovian terrain kit generator. No third-party art assets."""
import math, random, json, os
from pathlib import Path
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

HERE=Path(__file__).resolve()
STAGED=HERE.parent.name=='hidden-v' and HERE.parent.parent.name=='barovia'
ROOT=HERE.parents[3] if STAGED else HERE.parents[1]
ASSETS=ROOT/'public/assets/hidden-sites' if STAGED else ROOT/'assets'
ASSETS.mkdir(parents=True,exist_ok=True)
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




# BAROVIA V — UNDER THE ROAD. Original sealed/revealed site pairs.
# Every geometry is a static GLB. Visual states NEVER modify game collision.
PAL.update({
 'char':'#1b2022','oak':'#40362e','sand':'#6e6555','darkstone':'#40494b',
 'straw2':'#857c57','mortar':'#8d8980','lichen':'#61745e','paper2':'#c8b79d',
 'amber':'#ad8c5c','tealglow':'#89ada3','crypt':'#686b70','bluegloom':'#2c454e',
 'bloodrust':'#703d34','lowiron':'#3b3b3a', 'grass2':'#465342'
})
SITES={
 'svalich_road_hatch':{'title':'The Stone That Rings Hollow','biomes':['roadside','forest'],'roads':['r-east','r-west','r-gates','r-vallaki'],'footprint':[3,3], 'approach':'A loose paving stone clicks twice beneath a boot.', 'reveal':'A narrow hatch reveals steps cut into a much older road.', 'return':'A wet handprint marks the underside of the stone.', 'kind':'entrance'},
 'blackroot_hollow_oak':{'title':'The Listening Oak','biomes':['forest','graveyard'],'roads':['r-cut','r-west','r-east','r-argyn','r-mist'],'footprint':[4,4], 'approach':'A hollow oak exhales warm air in a cold wood.', 'reveal':'A bark panel swings aside to a root-lined descending stair.', 'return':'The opening has grown a fresh ring of wood around its rim.', 'kind':'entrance'},
 'boulder_moss_curtain':{'title':'The Green Curtain','biomes':['mountain','corruption'],'roads':['r-argyn','r-krezk','r-yester','r-cut'],'footprint':[4,3], 'approach':'A sheet of moss ripples across a cliff without wind.', 'reveal':'Behind it is a dry, hewn threshold lit by spores.', 'return':'The spore light spells a name in the stone.', 'kind':'entrance'},
 'dry_well_ladder':{'title':'The Well Without Water','biomes':['village','farmland'],'roads':['r-vallaki','r-winery','r-gates','r-krezk'],'footprint':[3,3], 'approach':'An old well sounds hollow, even when a pebble hits the bottom.', 'reveal':'The wooden lid conceals a ladder carved into the stone shaft.', 'return':'A bucket hangs halfway up. It was not there before.', 'kind':'entrance'},
 'ossuary_gravestone':{'title':'The Wrong Burial','biomes':['graveyard','roadside'],'roads':['r-east','r-castle','r-argyn','r-gates'],'footprint':[3,3], 'approach':'A grave slab lies too level in soil softened by rain.', 'reveal':'Below the slab, cramped ossuary steps descend to a sealed passage.', 'return':'One more name has appeared on the stone.', 'kind':'crypt'},
 'bridge_floodgate':{'title':'The Weeping Culvert','biomes':['marsh','roadside'],'roads':['r-tser','r-berez','r-tower','r-east'],'footprint':[4,3], 'approach':'Water drains under the bridge, but the bars are warm.', 'reveal':'A hidden iron grille folds upward. Someone has used the tunnel recently.', 'return':'A fresh lantern glows beyond the waterline.', 'kind':'culvert'},
 'straw_barn_hatch':{'title':'The Hay That Breathes','biomes':['farmland','village'],'roads':['r-winery','r-krezk','r-vallaki'],'footprint':[4,3], 'approach':'Hay has been piled into a perfect square on the barn floor.', 'reveal':'A slatted hatch conceals a cellar beneath the stalls.', 'return':'The straw has been brushed into the shape of a sleeping person.', 'kind':'entrance'},
 'tser_reed_den':{'title':'The Reedbank Mouth','biomes':['marsh','forest'],'roads':['r-tser','r-berez','r-lake','r-tower'],'footprint':[4,4], 'approach':'Reeds bend in a ring around dry earth.', 'reveal':'A root-bound passage opens where the water should be.', 'return':'The reeds move toward the party, not the wind.', 'kind':'entrance'},
 'bonegrinder_ash_chute':{'title':'The Ash Below the Mill','biomes':['farmland','corruption'],'roads':['r-west','r-vallaki','r-cut'],'footprint':[3,3], 'approach':'The abandoned mill chute smells of warm flour and cold ash.', 'reveal':'The millstone rolls aside, uncovering steep stairs beneath the axle.', 'return':'Fresh flour dust falls upward from the opening.', 'kind':'entrance'},
 'hunter_cairn_cache':{'title':'The Hunters Who Never Came Back','biomes':['forest','mountain'],'roads':['r-cut','r-argyn','r-yester'],'footprint':[3,3], 'approach':'An arrowhead has been wedged into the highest stone.', 'reveal':'The cairn turns on a buried pivot, showing a narrow escape shaft.', 'return':'A new arrowhead points toward the party camp.', 'kind':'refuge'},
 'inn_floor_cellar':{'title':'The Cold Hearth','biomes':['village','roadside'],'roads':['r-gates','r-vallaki','r-krezk'],'footprint':[3,3], 'approach':'One floorboard below the hearth is warmer than the rest.', 'reveal':'The cellar latch lifts to reveal a dark room that should not fit below.', 'return':'A second latch has been fitted from inside.', 'kind':'entrance'},
 'raven_guardian_crypt':{'title':'The Vigil Below','biomes':['graveyard','mountain'],'roads':['r-castle','r-argyn','r-yester'],'footprint':[4,3], 'approach':'A headless sentinel guards a moss-covered plinth.', 'reveal':'The plinth slides to reveal a crypt door and a descending threshold.', 'return':'Stone wings have been scored into the sentinel back.', 'kind':'crypt'}
}

def ring(m,x,z,r=0.64,steps=10, color='stone',height=.28):
 for k in range(steps):
  a=2*math.pi*k/steps
  m.ell(x+math.cos(a)*r, height*.45, z+math.sin(a)*r, .22,height*.51,.22,color,0)

def steps_down(m,x,z,size=.85,n=4,axis='z'):
 # Recessed stairwell is cosmetic; it is never a physics opening or navmesh edit.
 m.box(x,-.015,z,size,.035,size,'char')
 for k in range(n):
  xx=x+(k/n-.4)*size if axis=='x' else x
  zz=z+(k/n-.4)*size if axis=='z' else z
  m.box(xx,-.045-.065*k,zz, size/n if axis=='x' else size*.84,.09,size/n if axis=='z' else size*.84,'stone2')
 for side in (-1,1):
  if axis=='z':m.box(x+side*size*.49,.10,z,.10,.22,size,'stone3')
  else:m.box(x,.1,z+side*size*.49,size,.22,.1,'stone3')

def wooden_lid(m,x,z,w=.95,d=.92,open=False):
 if not open:
  for j in range(5):m.box(x+(j-2)*w/5,.08,z,w/5*.96,.13,d, 'wood2' if j%2 else 'wood')
  for zz in (-d*.34,d*.34):m.box(x,.17,z+zz,w*.9,.045,.06,'wood')
  m.ell(x+w*.36,.19,z,.045,.03,.04,'iron',0)
 else:
  # Lifted lid sits to one side; stone aperture remains clearly visible.
  for j in range(5):m.box(x+w*.65,.13,z+(j-2)*d/5,w*.18,.13,d/5*.96,'wood2' if j%2 else 'wood')
  m.box(x+w*.65,.2,z,w*.2,.04,d*.85,'wood')

def roots(m,x,z,spread=1.0,n=5):
 for k in range(n):
  a=2*math.pi*k/n+.2
  m.tube((x,.24,z),(x+math.cos(a)*spread,.018,z+math.sin(a)*spread),.08,.008,'bark',6)

def build_site(key,revealed=False):
 # Same class name/seed across variants produces byte-identical stationary foundations.
 m=Model(key,seed=76542)
 fp=SITES[key]['footprint'];w,d=fp
 m.flat_patch(w-.07,d-.07,base=-.09,c='peat' if key in ('tser_reed_den','boulder_moss_curtain') else 'soil',steps=7)
 for i in range(12):
  a=2*math.pi*i/12+.12;rad=.41*min(w,d)+m.r.uniform(-.12,.1)
  m.stone(math.cos(a)*rad,math.sin(a)*rad,m.r.uniform(.055,.14),y=0)
 # Each site has unique permanent silhouette plus swapped concealed/revealed focal surface.
 if key=='svalich_road_hatch':
  for x in (-.93,-.51,.55,.91):
   m.box(x,.03,-.9,.38,.07,.34,'cobble')
   m.box(x,.03,.91,.38,.07,.33,'stone2')
  if revealed:steps_down(m,0,0,.95);wooden_lid(m,.72,.02,.83,1.0,True)
  else:wooden_lid(m,0,0,.98,1.03)
  for z in (-.75,.8):m.ell(-.7,.09,z,.08,.18,.07,'lichen',0)
 elif key=='blackroot_hollow_oak':
  roots(m,0,.12,1.4,8)
  m.tube((0,0,0),(.09,1.85,.1),.42,.27,'bark',11)
  for a in (-.5,.65):m.tube((.02,1.5,0),(a,2.4,.11+a*.2),.17,.055,'oak',7)
  m.ell(.01,.9,.365,.33,.69,.10,'char' if revealed else 'oak',1)
  if revealed:
   m.ell(0,.94,.45,.21,.49,.04,'char',0);steps_down(m,.1,.83,.68,n=3)
   for i in range(6):m.ell(m.r.uniform(-.2,.2),m.r.uniform(.4,1.5),.52,.035,.035,.03,'glow',0)
  else:m.ell(0,.98,.47,.27,.53,.07,'bark',1)
 elif key=='boulder_moss_curtain':
  for x,z,ss in [(-1,0,.87),(.88,-.2,.9),(.0,-.83,.75)]:m.ell(x,.44,z,ss,.65,ss,'stone2',1)
  if revealed:steps_down(m,0,.55,1.04);m.ell(0,.45,.48,.43,.5,.09,'char',1)
  else:m.ell(0,.49,.49,.57,.54,.13,'moss',1)
  for j in range(12):
   x=-.7+j*.125
   m.tube((x,.93,.66),(x+m.r.uniform(-.05,.05),.1,.72),.033,.005,'moss' if not revealed else 'hunger',5)
 elif key=='dry_well_ladder':
  ring(m,0,0,.77,11,'stone2',.51)
  m.cyl(0,-.19,0,.56,.56,.09,'char',13)
  if not revealed:m.box(0,.53,0,1.45,.14,1.47,'wood2')
  else:
   for y in (.0,-.18,-.36):m.box(.18,y,.0,.72,.07,.06,'wood2')
   m.tube((-.17,.56,.1),(-.17,-.39,.1),.032,.03,'wood',6)
   m.tube((.5,.56,.1),(.5,-.39,.1),.032,.03,'wood',6)
  m.tube((-.91,.0,-.75),(-.91,1.14,-.75),.065,.055,'wood',7)
  m.tube((.88,.0,-.75),(.88,1.14,-.75),.065,.055,'wood',7)
  m.tube((-.93,1.1,-.75),(.87,1.1,-.75),.06,.06,'wood2',7)
 elif key=='ossuary_gravestone':
  for x in (-1.0,1.04):m.gravestone(x,-.7,.75)
  for z in (-.83,.88):m.stone(-.83,z,.18)
  if revealed:
   steps_down(m,0,0,1.12);m.box(.69,.13,.1,.37,.24,1.18,'stone2',ry=.10)
  else:m.box(0,.095,0,1.15,.18,1.25,'stone2')
  m.ell(.17,.19,-.24,.16,.02,.12,'stone3',0)
 elif key=='bridge_floodgate':
  for xx in (-1.2,1.2):m.stone_wall(xx,0,2.35,.60,axis='z')
  m.box(0,-.01,0,.98,.025,1.5,'water')
  for z in (-1.1,1.07):m.box(0,.62,z,2.7,.14,.17,'stone2')
  if revealed:
   steps_down(m,0,.0,.82,axis='x')
   m.box(.87,.75,.0,.08,1.08,1.2,'iron')
  else:
   for k in range(5):m.box(-.4+k*.2,.26,0,.055,.52,1.2,'iron')
 elif key=='straw_barn_hatch':
  for x in (-1.75,1.75):m.box(x,.66,0,.12,1.30,2.5,'wood')
  for z in (-1.16,1.16):m.box(0,.38,z,3.6,.12,.10,'wood')
  for a,b in [(-1.25,-.68),(1.15,.77)]:m.ell(a,.15,b,.6,.26,.43,'hay',0)
  if revealed:steps_down(m,0,0,1.03);wooden_lid(m,.85,.2,.76,.9,True)
  else:wooden_lid(m,0,0,1.0,.91)
 elif key=='tser_reed_den':
  m.ell(-.56,.01,-.55,.88,.04,.69,'water',1)
  for i in range(28):
   a=2*math.pi*i/28; rr=m.r.uniform(.76,1.55);x=rr*math.cos(a);z=rr*math.sin(a)
   m.tube((x,.0,z),(x+.08,.68+m.r.random()*.5,z-.08),.018,.003,'reed',4)
  roots(m,0,0,.93,7)
  if revealed:steps_down(m,0,.20,1.0);m.ell(0,.02,.18,.51,.04,.55,'char',1)
  else:m.ell(0,.03,.17,.58,.08,.63,'peat',1)
 elif key=='bonegrinder_ash_chute':
  m.cyl(-.3,.06,0,.81,.81,.23,'stone2',12)
  m.cyl(-.3,.27,0,.25,.27,.09,'darkstone',12)
  for i in range(7):
   a=i*math.pi*2/7;m.stone(math.cos(a)*.96,math.sin(a)*.96,.12,'ash')
  if revealed:steps_down(m,.42,.34,.81);m.cyl(.75,.04,-.43,.65,.65,.22,'stone2',11)
  else:m.box(.25,.05,.48,1.10,.10,.85,'wood')
 elif key=='hunter_cairn_cache':
  for k in range(20):
   a=2*math.pi*k/20;r=.64+.23*m.r.random();m.stone(math.cos(a)*r,math.sin(a)*r,.20,'stone2')
  for k in range(5):m.stone(.0,-.1,.40-k*.055,'stone')
  if revealed:steps_down(m,0,.35,.8,3);m.box(.86,.16,0,.4,.23,.72,'stone3')
  else:m.ell(0,.27,0,.74,.31,.57,'stone2',1)
  m.tube((-.9,.3,.2),(-.9,.88,.3),.04,.015,'wood',5)
 elif key=='inn_floor_cellar':
  for j in range(11):m.box((j-5)*.23,-.02,0,.22,.10,2.75,'wood2' if j%3 else 'wood')
  for z in (-1.1,-.87):m.box(-.88,.28,z,.76,.55,.23,'stone')
  m.ell(-.82,.65,-1.,.08,.25,.15,'ash',0)
  if revealed:steps_down(m,.36,.24,.88);wooden_lid(m,.89,.2,.7,.92,True)
  else:wooden_lid(m,.36,.24,.89,.91)
 elif key=='raven_guardian_crypt':
  m.box(0,.45,-.76,2.8,.85,.37,'stone')
  m.box(-1.07,.95,-.68,.45,1.62,.41,'stone2')
  m.ell(-1.06,1.78,-.66,.3,.30,.27,'stone3',1)
  m.tube((-1.23,1.26,-.54),(-.75,1.12,-.34),.06,.03,'stone',6)
  m.tube((-.86,1.23,-.64),(-1.4,1.06,-.44),.06,.03,'stone',6)
  if revealed:steps_down(m,.35,.23,1.0);m.box(1.0,.16,.17,.42,.29,.96,'stone2')
  else:m.box(.35,.1,.23,1.15,.18,1.22,'stone2')
  for x in (.83,1.10):m.ell(x,.26,-.42,.065,.2,.075,'moss',0)
 return m

def export_asset(key,revealed):
 state='revealed' if revealed else 'sealed';id=f'{key}_{state}'
 m=build_site(key,revealed)
 groups={}
 for mesh in m.scene.dump():
  col=tuple(int(round(v)) for v in mesh.visual.material.baseColorFactor[:3]);groups.setdefault(col,[]).append(mesh)
 compact=trimesh.Scene()
 for i,(col,meshes) in enumerate(groups.items()):
  geom=trimesh.util.concatenate(meshes)
  geom.visual=TextureVisuals(material=PBRMaterial(baseColorFactor=list(col)+[255],metallicFactor=0,roughnessFactor=.92,doubleSided=True,name=f'{id}_color_{i:02d}'))
  compact.add_geometry(geom,node_name=f'{id}_color_{i:02d}',geom_name=f'{id}_color_{i:02d}')
 data=compact.export(file_type='glb');(ASSETS/f'{id}.glb').write_bytes(data)
 bounds=compact.bounds
 return {'id':id,'site':key,'state':state,'file':f'{id}.glb',
         'footprint':SITES[key]['footprint'],
         'bounds':[[round(float(x),4) for x in row] for row in bounds],
         'drawCalls':len(groups),'parts':m.count,'bytes':len(data), 'visualOnly':True}

if __name__=='__main__':
 assets=[export_asset(key,rev) for key in SITES for rev in (False,True)]
 manifest={'pack':'Barovia V: Under the Road','version':5,'scale':'1 world unit = 5 ft; +Y up, north -Z',
  'visualOnly':True,'modelCount':len(assets),'pairCount':len(SITES),
  'pairs':[{'id':k,**v,'sealed':f'{k}_sealed','revealed':f'{k}_revealed'} for k,v in SITES.items()],
  'assets':assets}
 (ASSETS/'manifest.json' if STAGED else ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False))
 print('Exported',len(assets),'GLBs;',sum(x['bytes'] for x in assets),'bytes; drawcalls',sum(x['drawCalls'] for x in assets))
