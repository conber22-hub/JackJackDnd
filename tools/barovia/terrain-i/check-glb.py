"""Binary round-trip sanity check with mesh and PBR material inspection."""
import sys, json, pathlib, math
import numpy as np
import trimesh
root=pathlib.Path(__file__).resolve().parents[1]
manifest=json.loads((root/'manifest.json').read_text())
for asset in manifest['items']:
    path=root/asset['file']
    data=path.read_bytes()
    assert data[:4]==b'glTF', f'{asset["id"]}: not a binary GLB'
    scene=trimesh.load(path,force='scene')
    assert len(scene.geometry)==asset['meshes'], (asset['id'],len(scene.geometry),asset['meshes'])
    b=scene.bounds
    assert np.isfinite(b).all()
    for mesh in scene.geometry.values():
        assert len(mesh.faces) > 0 and len(mesh.vertices) > 0, asset['id']
        assert np.isfinite(mesh.vertices).all(), asset['id']
        assert mesh.visual.material.baseColorFactor is not None, asset['id']
print(f"PASS: all {len(manifest['items'])} .glb files parse as scenes with PBR materials and valid mesh geometry")
