"""Accurate software z-buffer GLB previews: no GPU, no screenshots invented from prompts."""
import json,math
from pathlib import Path
import numpy as np,trimesh
from PIL import Image,ImageDraw,ImageFont
from numba import njit
ROOT=Path(__file__).resolve().parents[1]
CAT=json.loads((ROOT/'manifest.json').read_text())['assets']
ITEMS={a['id']:a for a in CAT}
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
regular=ImageFont.truetype(FONT,15);small=ImageFont.truetype(FONT,11)
bold=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',28)

@njit
def raster(tri,dep,col,out,zbuf):
 h,w=out.shape[:2]
 for f in range(len(tri)):
  p=tri[f];d=dep[f];c=col[f]
  xmin=max(0,int(math.floor(min(p[0,0],p[1,0],p[2,0]))));xmax=min(w-1,int(math.ceil(max(p[0,0],p[1,0],p[2,0]))))
  ymin=max(0,int(math.floor(min(p[0,1],p[1,1],p[2,1]))));ymax=min(h-1,int(math.ceil(max(p[0,1],p[1,1],p[2,1]))))
  x0,y0=p[0];x1,y1=p[1];x2,y2=p[2]
  denom=(y1-y2)*(x0-x2)+(x2-x1)*(y0-y2)
  if abs(denom)<.00001:continue
  for py in range(ymin,ymax+1):
   for px in range(xmin,xmax+1):
    x=px+.5;y=py+.5
    a=((y1-y2)*(x-x2)+(x2-x1)*(y-y2))/denom
    b=((y2-y0)*(x-x2)+(x0-x2)*(y-y2))/denom
    cc=1-a-b
    if a<-.0001 or b<-.0001 or cc<-.0001:continue
    z=a*d[0]+b*d[1]+cc*d[2]
    if z>zbuf[py,px]:
     zbuf[py,px]=z
     out[py,px,0]=c[0];out[py,px,1]=c[1];out[py,px,2]=c[2]

CAM=np.array([6.,8.,10.]);CAM/=np.linalg.norm(CAM)
RIGHT=np.cross([0,1,0],CAM);RIGHT/=np.linalg.norm(RIGHT)
UP=np.cross(CAM,RIGHT);UP/=np.linalg.norm(UP)
LIGHT=np.array([-1.,1.9,2.2]);LIGHT/=np.linalg.norm(LIGHT)

def picture(items,width=320,height=220,zoom=.93,camera=None):
 cam=CAM if camera is None else camera
 right=np.cross([0,1,0],cam);right/=np.linalg.norm(right)
 up=np.cross(cam,right);up/=np.linalg.norm(up)
 meshes=[]
 for id,dx,dz in items:
  model=trimesh.load(ROOT/ITEMS[id]['file'],force='scene')
  for m in model.dump():
   v=m.vertices.copy();v[:,0]+=dx;v[:,2]+=dz
   faces=m.faces
   if len(faces)==0:continue
   a=v[faces]
   col=np.array(m.visual.material.baseColorFactor[:3],dtype=np.float64)
   normals=np.cross(a[:,1]-a[:,0],a[:,2]-a[:,0]);normals/=np.maximum(np.linalg.norm(normals,axis=1)[:,None],1e-8)
   ambient=np.maximum(.53,.65+.33*(normals@LIGHT))[:,None]
   tint=np.minimum(255,np.maximum(0,col*ambient+13)).astype(np.uint8)
   meshes.append((a,tint))
 if not meshes:return Image.new('RGB',(width,height),'#121b1d')
 a=np.concatenate([q[0] for q in meshes],axis=0)
 cols=np.concatenate([q[1] for q in meshes],axis=0)
 uvx=a@right;uvy=a@up; depths=a@cam
 uv=np.stack([uvx,-uvy],axis=-1)
 mn=uv.min(axis=(0,1));mx=uv.max(axis=(0,1));size=np.maximum(mx-mn,1e-3)
 scale=min((width-26)/size[0],(height-22)/size[1])*zoom
 centered=(uv-(mn+mx)/2)*scale+np.array([width/2,height/2])
 out=np.zeros((height,width,3),dtype=np.uint8);out[:]=[20,29,31]
 depth=np.full((height,width),-1e9,dtype=np.float64)
 raster(np.ascontiguousarray(centered.astype(np.float64)),np.ascontiguousarray(depths.astype(np.float64)),np.ascontiguousarray(cols.astype(np.uint8)),out,depth)
 return Image.fromarray(out,'RGB')

