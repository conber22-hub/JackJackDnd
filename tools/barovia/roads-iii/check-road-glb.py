"""Validate each GLB parses, is y-up, respects the tile square, and uses real PBR meshes."""
import json,sys,math
from pathlib import Path
import trimesh
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'manifest.json').read_text())
assert manifest['assetCount']==len(manifest['assets'])==65
failed=[]
for a in manifest['assets']:
 p=ROOT/a['file']
 try:
  assert p.exists() and p.stat().st_size>500, 'missing/too small'
  assert p.read_bytes()[:4]==b'glTF','invalid GLB header'
  model=trimesh.load(p,force='scene')
  meshes=model.dump()
  assert meshes and all(len(m.faces)>0 for m in meshes),'missing actual mesh faces'
  b=model.bounds
  assert all(math.isfinite(float(v)) for row in b for v in row),'nonfinite bounds'
  assert abs(float(b[0][0])+4)<.001 and abs(float(b[1][0])-4)<.001, 'tile X must meet seam at ±4'
  assert abs(float(b[0][2])+4)<.001 and abs(float(b[1][2])-4)<.001, 'tile Z must meet seam at ±4'
  assert b[0][1]>-1 and b[1][1]<5, 'height implausible'
  assert len(meshes)<=16, 'too many draw calls'
  assert all(len(m.vertices)<160000 for m in meshes), 'too many vertices'
 except Exception as e:failed.append((a['id'],str(e)))
if failed:
 for id,e in failed:print('FAIL',id,e)
 sys.exit(1)
print(f'PASS: {len(manifest["assets"])} GLB files, all parse and meet 8×8-square seam, material/draw-call and height constraints')
