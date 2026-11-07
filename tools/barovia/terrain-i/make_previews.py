"""Draw isometric software renders of the original GLBs without OpenGL or external image assets."""
import json, math
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np
import trimesh
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'manifest.json').read_text())
T=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
S=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
cam=np.array([6.,6.,9.]);cam/=np.linalg.norm(cam)
right=np.cross([0,1,0],cam);right/=np.linalg.norm(right)
up=np.cross(cam,right);up/=np.linalg.norm(up)
light=np.array([-1.,1.4,2.]);light/=np.linalg.norm(light)

def render(item,wt=300,ht=240):
 scene=trimesh.load(ROOT/item['file'],force='scene')
 geometries=scene.dump()
 triangles=[]
 for m in geometries:
  if len(m.faces)==0:continue
  verts=m.vertices
  pts=verts[m.faces]
  try:color=tuple(m.visual.material.baseColorFactor[:3])
  except Exception:color=(128,130,126)
  norms=np.cross(pts[:,1]-pts[:,0],pts[:,2]-pts[:,0]); lens=np.linalg.norm(norms,axis=1)
  norms=norms/np.maximum(lens[:,None],1e-9)
  for tri,norm in zip(pts,norms):
   # Face normals can be inconsistent on imperfect organic rocks, so use diffuse from either side.
   intensity=.56+.40*max(0,np.dot(norm,light))
   # Keep black trees legible in small previews.
   intensity=max(.6,intensity)
   rgb=tuple(max(0,min(255,int(c*intensity+13))) for c in color)
   x=tri@right;y=tri@up; depth=tri@cam
   triangles.append((float(np.mean(depth)),list(zip(x,y)),rgb))
 if not triangles:return Image.new('RGB',(wt,ht),'#171d20')
 allxy=np.array([p for _,v,_ in triangles for p in v]); mn=allxy.min(axis=0);mx=allxy.max(axis=0)
 width=max(.1,mx[0]-mn[0]);height=max(.1,mx[1]-mn[1]);scale=min((wt-26)/width,(ht-28)/height)*.83
 # origin anchored to tile, center model vertically; shadows give a ground cue.
 cx=(mn[0]+mx[0])/2;cy=(mn[1]+mx[1])/2
 im=Image.new('RGB',(wt,ht),'#1b2326');d=ImageDraw.Draw(im)
 d.ellipse((wt*.2,ht*.81,wt*.8,ht*.95),fill='#141a1c')
 for _,vs,color in sorted(triangles,key=lambda p:p[0]):
  pix=[(int(wt/2+(x-cx)*scale),int(ht/2-(y-cy)*scale)) for x,y in vs]
  d.polygon(pix,fill=color)
 return im

bycat={}
for item in manifest['items']:
 bycat.setdefault(item['category'],[]).append(item)

all_cards=[]
for category,items in bycat.items():
 cols=3;cellw=345;cellh=296;rows=math.ceil(len(items)/cols)
 atlas=Image.new('RGB',(cellw*cols,rows*cellh+72),'#111619');d=ImageDraw.Draw(atlas)
 d.text((24,22),category,fill='#e2e6dc',font=T)
 for i,item in enumerate(items):
  c=i%cols;r=i//cols;x=c*cellw;y=72+r*cellh
  img=render(item,wt=323,ht=226)
  atlas.paste(img,(x+11,y+6))
  d.text((x+16,y+238),item['name'],fill='#f1efe5',font=T)
  d.text((x+16,y+263),f"{item['size'][0]}x{item['size'][1]} squares  ·  {item['meshes']} pieces  ·  {item['bytes']//1024} KB",fill='#a1acaa',font=S)
  all_cards.append((item,img))
 out=ROOT/'previews'/('barovia_'+category.lower().replace(' ','_').replace('&','and').replace('/','_')+'.png')
 atlas.save(out)
 print('rendered',out.name,atlas.size)

cols=4;cw=306;ch=252;rows=math.ceil(len(all_cards)/cols)
atlas=Image.new('RGB',(cols*cw,rows*ch+90),'#111619');d=ImageDraw.Draw(atlas)
d.text((25,19),'BAROVIA  /  THE LIVING VALLEY',font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',24),fill='#eff0e9')
d.text((26,53),f'{len(all_cards)} original game-ready GLB terrain assets  ·  5-foot square scale',font=S,fill='#9eaaa6')
for i,(item,img) in enumerate(all_cards):
 x=(i%cols)*cw;y=90+(i//cols)*ch
 resized=img.resize((290,196),Image.Resampling.LANCZOS)
 atlas.paste(resized,(x+8,y+4))
 d.text((x+14,y+207),item['name'],fill='#e5e5db',font=S)
 d.text((x+14,y+230),item['category'],fill='#90a39d',font=S)
atlas.save(ROOT/'previews/barovia-terrain-contact-sheet.png')
print('contact sheet',atlas.size)
