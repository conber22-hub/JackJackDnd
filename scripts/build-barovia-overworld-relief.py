#!/usr/bin/env python3
"""Build a geography-only 3D atlas board in native Valley coordinates."""
import argparse
import math
import runpy
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / 'public/assets/overworld/barovia-relief.glb'
WIDTH, DEPTH, STEP = 100, 64, 2
LAKES = [(29, 20, 6.5, 3.6), (26.5, 56.5, 3.5, 2)]
# Stylised ridges and water from the overworld artwork. These do not encode travel links.
PEAKS = [
    (3,7,5.6,5,4.5),(13,5,6.4,7,4.4),(23,7,4.3,5.5,5.5),
    (36,5,5.0,6,4),(47,6,5.3,5.4,4),(57,4,5.5,4,4),
    (70,6,5.1,6,4.8),(81,4,6.4,5.3,4),(93,10,5.4,6,6),
    (4,38,4.3,4.9,7),(7,57,4.6,5,5),(19,59,4.4,6,4.2),
    (37,61,6.4,7,4.4),(49,57,5.3,6,4.2),(61,61,6.6,6,3.9),
    (75,60,5.3,6,4.1),(86,55,4.7,5.8,4.6),(98,55,6.6,5.1,5.0),
    (17,15,1.30,8,4),(43,12,1.40,6,4),(69,45,1.65,5,5),(91,28,1.22,6,7),
]
RIVERS = [
    [(94,42),(84,39.4),(76,37.1),(69,35),(62,34.4),(56,37),(49,41),(44,43),
     (40,43.2),(37,45.0),(37,48),(34.5,50.6),(30,52),(26,53.7),(26,56)],
    [(77,23),(74.2,28.1),(73.71,33.15),(73.9,36.46)],
    [(61.1,22.8),(60.4,26.9),(61.95,30.86),(62.1,33),(61.2,34.38)],
]


def elevation(x,z):
    y = .63+.15*math.sin(x*.22+z*.17)+.12*math.cos(x*.33-z*.16)
    for px,pz,h,rx,rz in PEAKS:
        distance=((x-px)/rx)**2+((z-pz)/rz)**2
        y += h*math.exp(-distance)*(.88+.12*math.cos(x*.79+z*.67))
    for cx,cz,rx,rz in LAKES:
        weight=max(0,1-(((x-cx)/(rx+1.3))**2+((z-cz)/(rz+1.3))**2))**.6
        y += (.53-y)*weight
    return y


GRID = [[elevation(x,z) for x in range(0,WIDTH+1,STEP)] for z in range(0,DEPTH+1,STEP)]


def height_at(x,z):
    """Interpolate the same triangles used by the mesh, including at the outer edge."""
    x,z=max(0,min(WIDTH,x)),max(0,min(DEPTH,z))
    col=min(int(x/STEP),WIDTH//STEP-1)
    row=min(int(z/STEP),DEPTH//STEP-1)
    u,v=x/STEP-col,z/STEP-row
    nw,ne=GRID[row][col:col+2]
    sw,se=GRID[row+1][col:col+2]
    if u>=v:
        return nw+(ne-nw)*u+(se-ne)*v
    return nw+(sw-nw)*v+(se-sw)*u


def colour(x,z,y):
    grain=math.sin(x*.78+z*1.14)+math.cos(x*.36-z*.92)
    if y>4.5:
        base=(112,111,101)
    elif y>2.6:
        base=(86,88,79)
    elif y>1.4:
        base=(74,82,69)
    else:
        base=(61,74,62)
    return '#'+''.join(f'{round(c+grain*2.5):02x}' for c in base)


def water(m):
    for cx,cz,rx,rz in LAKES:
        rings=[]
        for i in range(1,6):
            ring=[]
            for j in range(24):
                a=j*math.tau/24
                r=(i/5)*(1+.05*math.cos(a*5)+.035*math.sin(a*3))
                x,z=cx+rx*r*math.cos(a),cz+rz*r*math.sin(a)
                ring.append((x,height_at(x,z)+.055,z))
            rings.append(ring)
        centre=(cx,height_at(cx,cz)+.055,cz)
        for j in range(24):
            k=(j+1)%24
            m.face([centre,rings[0][j],rings[0][k]],'#3c6068',(0,1,0))
            for low,high in zip(rings,rings[1:]):
                m.face([low[j],high[j],high[k],low[k]],
                       '#4b6e70' if high is rings[-1] else '#41636a',(0,1,0))
    for river_index,course in enumerate(RIVERS):
        radius=.46 if river_index==0 else .25
        for (x,z),(nx,nz) in zip(course,course[1:]):
            length=math.hypot(nx-x,nz-z)
            sx,sz=-(nz-z)*radius/length,(nx-x)*radius/length
            steps=math.ceil(length/.55)
            edge=[]
            for i in range(steps+1):
                a,b=x+(nx-x)*i/steps,z+(nz-z)*i/steps
                edge.append([(u,height_at(u,v)+.062,v)
                             for u,v in [(a+sx,b+sz),(a-sx,b-sz)]])
            for a,b in zip(edge,edge[1:]):
                m.face([a[0],a[1],b[1],b[0]],'#456970',(0,1,0))
        # Fill bend joints so adjacent ribbons meet with no split.
        for x,z in course[1:-1]:
            top=height_at(x,z)+.071
            m.taper((x,top-.028,z),(x,top,z),radius,radius,8,'#456970')


def board(Mesh):
    m=Mesh('Barovia · overworld terrain relief',1093)
    for z in range(0,DEPTH,STEP):
        for x in range(0,WIDTH,STEP):
            nw,ne,sw,se=[(u,height_at(u,v),v)
                         for u,v in [(x,z),(x+STEP,z),(x,z+STEP),(x+STEP,z+STEP)]]
            for tri in [(nw,ne,se),(nw,se,sw)]:
                mid=tuple(sum(values)/3 for values in zip(*tri))
                m.face(list(tri),colour(mid[0],mid[2],mid[1]),(0,1,0))
    for side in [([(x,0) for x in range(0,WIDTH+1,STEP)],(0,0,-1)),
                 ([(x,DEPTH) for x in range(0,WIDTH+1,STEP)],(0,0,1)),
                 ([(0,z) for z in range(0,DEPTH+1,STEP)],(-1,0,0)),
                 ([(WIDTH,z) for z in range(0,DEPTH+1,STEP)],(1,0,0))]:
        edge,normal=side
        for (x,z),(nx,nz) in zip(edge,edge[1:]):
            m.face([(x,0,z),(nx,0,nz),(nx,height_at(nx,nz),nz),(x,height_at(x,z),z)],
                   '#363b37',normal)
    m.face([(0,0,0),(WIDTH,0,0),(WIDTH,0,DEPTH),(0,0,DEPTH)],'#282d29',(0,-1,0))
    water(m)
    return m


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--builder',type=Path,default=HERE/'build-barovian-props.py')
    args=parser.parse_args()
    if not args.builder.is_file():
        parser.error('Pass --builder with the original mesh helper from Barovia prop set 01.')
    mesh=board(runpy.run_path(str(args.builder))['Mesh'])
    OUT.parent.mkdir(parents=True,exist_ok=True)
    triangles,bounds=mesh.export(OUT)
    print(f'{OUT.name} · {triangles} triangles · {OUT.stat().st_size} bytes · {bounds}')
