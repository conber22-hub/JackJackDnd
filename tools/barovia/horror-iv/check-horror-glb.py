"""Binary integrity and size limits. Source GLBs, no generated preview screenshots as substitutes."""
from pathlib import Path
import json,math
import numpy as np,trimesh
ROOT=Path(__file__).resolve().parents[1]
items=json.loads((ROOT/'manifest.json').read_text())['assets'];assert len(items)==43
seen=set();tris=0;meshes=0
for a in items:
 assert a['id'] not in seen;seen.add(a['id'])
 p=ROOT/a['file'];assert p.is_file() and p.stat().st_size>700,(a['id'],'missing')
 scene=trimesh.load(p,force='scene');assert scene.geometry
 b=scene.bounds;assert np.isfinite(b).all(),a['id']
 assert abs(b[0][1])<.26 and b[1][1]>=.14,(a['id'],b)
 assert b[0][0]>-4 and b[1][0]<4 and b[0][2]>-4 and b[1][2]<4,(a['id'],'too wide',b)
 # Decorative objects need not exactly occupy full declared footprint, but must not extend beyond it.
 w,h=a['footprint'];assert (b[1][0]-b[0][0]) <= w+1.5 and (b[1][2]-b[0][2]) <= h+1.5,(a['id'],'footprint',b,w,h)
 assert len(scene.geometry)<=16,(a['id'],'draw calls',len(scene.geometry))
 for mesh in scene.geometry.values():
  assert len(mesh.vertices)>=3 and len(mesh.faces)>=1
  assert np.isfinite(mesh.vertices).all()
  tris+=len(mesh.faces)
 meshes+=len(scene.geometry)
print(f'OK: {len(items)} original GLBs, {meshes} optimized meshes, {tris:,} triangles')
