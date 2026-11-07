from pathlib import Path
import json,trimesh,math
here=Path(__file__).resolve(); staged=here.parent.name=='hidden-v' and here.parent.parent.name=='barovia';root=here.parents[3] if staged else here.parents[1]; source=root/'public/assets/hidden-sites' if staged else root
manifest=json.loads((source/'manifest.json').read_text())
assert manifest['modelCount']==24
for entry in manifest['assets']:
 data=(source/entry['file']).read_bytes()
 assert data[:4]==b'glTF' and len(data)==entry['bytes']
 scene=trimesh.load(source/entry['file'],force='scene')
 assert len(scene.geometry)==entry['drawCalls']
 for mesh in scene.dump():
  assert len(mesh.faces)>0 and len(mesh.vertices)>0
  assert all(math.isfinite(float(n)) for n in mesh.bounds.ravel())
 print(entry['id'],len(data),'bytes /',len(scene.geometry),'meshes')
print('24/24 GLB geometry checks passed')
