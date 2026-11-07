"""Independent geometry validation of exported GLBs, not just manifest text."""
from pathlib import Path
import json,trimesh,math,numpy as np
root=Path(__file__).resolve().parents[3]
m=json.loads((root/'docs/barovia/dead-villages-vi-manifest.json').read_text())
seen=set()
for item in m['models']:
 file=root/'public/assets/dead-villages'/item['file'];data=file.read_bytes()
 assert data[:4]==b'glTF' and len(data)==int.from_bytes(data[8:12],'little')
 scene=trimesh.load(file,force='scene');assert len(scene.geometry)>=1
 meshes=scene.dump();assert meshes and all(len(mesh.faces)>0 and np.isfinite(mesh.vertices).all() for mesh in meshes)
 w,h=item['footprint'];b=scene.bounds
 assert b[0,0]>=-w/2-.002 and b[1,0]<=w/2+.002
 assert b[0,2]>=-h/2-.002 and b[1,2]<=h/2+.002
 assert b[0,1]>-.03 and b[1,1]>1.5
 assert item['id'] not in seen;seen.add(item['id'])
 assert len(meshes)<=14
 assert all(math.isfinite(float(x)) for x in b.flatten())
 assert all(abs(float(a)-float(b))<.003 for v,u in zip(b,item['bounds']) for a,b in zip(v,u))
print(f'Validated {len(seen)} GLBs, grouped draw calls and bounds.')
