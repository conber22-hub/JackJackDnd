#!/usr/bin/env python3
"""Build original low-poly Dread Delve props. Run with Python 3, no dependencies."""
import json
import math
import random
import struct
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / 'public/assets/props/barovian'
WOOD = '#644432'
DARK_WOOD = '#423126'
WORN_WOOD = '#92704d'
IRON = '#444b4c'
STEEL = '#889090'
BRASS = '#b18547'
STONE = '#696d68'
MOSS = '#657451'
VOID = '#181b1c'
STRAW = '#c3a362'
ROPE = '#b09260'
RED = '#9b4639'


def sub(a, b):
    return tuple(x-y for x, y in zip(a, b))


def add(a, b):
    return tuple(x+y for x, y in zip(a, b))


def mul(a, scale):
    return tuple(x*scale for x in a)


def dot(a, b):
    return sum(x*y for x, y in zip(a, b))


def cross(a, b):
    x, y, z = a
    X, Y, Z = b
    return y*Z-z*Y, z*X-x*Z, x*Y-y*X


def unit(v):
    return mul(v, 1/math.sqrt(dot(v, v)))


def rgb(colour):
    return tuple(int(colour[i:i+2], 16) for i in (1, 3, 5))


def shade(colour, k):
    return '#' + ''.join(f'{min(255, round(channel*k)):02x}' for channel in rgb(colour))


def linear_byte(channel):
    s = channel/255
    return round(255*(s/12.92 if s <= .04045 else ((s+.055)/1.055)**2.4))


class Mesh:
    def __init__(self, label, seed):
        self.label = label
        self.rng = random.Random(seed)
        self.faces = []
        self.transform = lambda v: v

    def face(self, points, colour, away=None):
        if away is not None and dot(cross(sub(points[1], points[0]), sub(points[2], points[0])), away) < 0:
            points = points[::-1]
        corners = [self.transform(p) for p in points]
        for i in range(1, len(corners)-1):
            triangle = (corners[0], corners[i], corners[i+1])
            normal = unit(cross(sub(triangle[1], triangle[0]), sub(triangle[2], triangle[0])))
            self.faces.append((triangle, normal, rgb(colour)))

    def block(self, centre, dims, colour, yaw=0):
        x, y, z = (d/2 for d in dims)
        c, s = math.cos(yaw), math.sin(yaw)
        corners = [add(centre, (i*c+k*s, j, -i*s+k*c))
                   for i, j, k in [(-x,-y,-z),(x,-y,-z),(x,-y,z),(-x,-y,z),
                                   (-x,y,-z),(x,y,-z),(x,y,z),(-x,y,z)]]
        for ids in [(0,1,2,3),(4,5,6,7),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]:
            points = [corners[i] for i in ids]
            mid = mul(tuple(map(sum, zip(*points))), .25)
            self.face(points, colour, sub(mid, centre))

    def taper(self, a, b, r1, r2, sides, colour):
        axis = unit(sub(b, a))
        u = unit(cross(axis, (0, 1, 0) if abs(axis[1]) < .9 else (1, 0, 0)))
        v = cross(axis, u)
        radial = [add(mul(u, math.cos(i*math.tau/sides)), mul(v, math.sin(i*math.tau/sides))) for i in range(sides)]
        lower = [add(a, mul(p, r1)) for p in radial]
        upper = [add(b, mul(p, r2)) for p in radial]
        self.face(lower, shade(colour, .85), mul(axis, -1))
        self.face(upper, shade(colour, 1.1), axis)
        for i in range(sides):
            j = (i+1) % sides
            self.face([lower[i], lower[j], upper[j], upper[i]], shade(colour, .89 + .04*(i % 5)), add(radial[i], radial[j]))

    def rock(self, x, y, z, w, h, d, colour, sides=6):
        ring = [((math.cos(i*math.tau/sides)*w/2)*self.rng.uniform(.83,1),
                 (math.sin(i*math.tau/sides)*d/2)*self.rng.uniform(.83,1)) for i in range(sides)]
        rings = [[(x+dx*k, y+h*e, z+dz*k) for dx,dz in ring] for k,e in [(.82,0),(1,.30),(.70,1)]]
        self.face(rings[0], shade(colour, .82), (0,-1,0))
        self.face(rings[-1], shade(colour, 1.1), (0,1,0))
        for low, high in zip(rings, rings[1:]):
            for i in range(sides):
                j = (i+1) % sides
                self.face([low[i], low[j], high[j], high[i]],
                          shade(colour, self.rng.uniform(.86,1.05)), (ring[i][0]+ring[j][0],0,ring[i][1]+ring[j][1]))

    def export(self, path):
        # Weld coplanar vertices. One mesh primitive and one material keep draw calls low.
        indices, vertices, lookup = [], [], {}
        for triangle, normal, colour in self.faces:
            c = tuple(linear_byte(channel) for channel in colour) + (255,)
            for p in triangle:
                vertex = (*[round(x,6) for x in (*p, *normal)], *c)
                if vertex not in lookup:
                    lookup[vertex] = len(vertices)
                    vertices.append(vertex)
                indices.append(lookup[vertex])
        mesh_bytes = b''.join(struct.pack('<6f4B', *v) for v in vertices)
        index_bytes = struct.pack('<'+'H'*len(indices), *indices)
        binary = mesh_bytes + index_bytes
        low = [min(v[i] for v in vertices) for i in range(3)]
        high = [max(v[i] for v in vertices) for i in range(3)]
        gltf = {
            'asset': {'version':'2.0', 'generator':'Dread Delve Barovian prop builder'},
            'scene':0, 'scenes':[{'nodes':[0]}], 'nodes':[{'name':self.label,'mesh':0}],
            'meshes':[{'primitives':[{'attributes':{'POSITION':0,'NORMAL':1,'COLOR_0':2},
                                      'indices':3,'material':0}]}],
            'materials':[{'name':'Painted wood, iron and stone',
                          'pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'metallicFactor':0,'roughnessFactor':.92}}],
            'buffers':[{'byteLength':len(binary)}],
            'bufferViews':[{'buffer':0,'byteLength':len(mesh_bytes),'byteStride':28,'target':34962},
                           {'buffer':0,'byteOffset':len(mesh_bytes),'byteLength':len(index_bytes),'target':34963}],
            'accessors':[{'bufferView':0,'componentType':5126,'count':len(vertices),'type':'VEC3','min':low,'max':high},
                         {'bufferView':0,'byteOffset':12,'componentType':5126,'count':len(vertices),'type':'VEC3'},
                         {'bufferView':0,'byteOffset':24,'componentType':5121,'count':len(vertices),'type':'VEC4','normalized':True},
                         {'bufferView':1,'componentType':5123,'count':len(indices),'type':'SCALAR'}],
        }
        manifest = json.dumps(gltf,separators=(',',':')).encode()
        manifest += b' '*(-len(manifest)%4)
        binary += b'\0'*(-len(binary)%4)
        chunks = struct.pack('<I4s',len(manifest),b'JSON')+manifest+struct.pack('<I4s',len(binary),b'BIN\0')+binary
        path.write_bytes(struct.pack('<4sII',b'glTF',2,12+len(chunks))+chunks)
        return len(indices)//3, tuple(round(b-a, 2) for a,b in zip(low,high))


def hatch(opened=False):
    m = Mesh('Roadside hatch · ' + ('open' if opened else 'closed'), 12)
    m.block((0,.026,0),(.98,.052,.98),DARK_WOOD)
    m.block((0,.054,0),(.74,.014,.74),VOID)
    for i in range(4):
        t = -.34+i*.225
        for x,z,w,d in [(t,-.42,.25,.19),(t,.42,.25,.19),(-.42,t,.18,.25),(.42,t,.18,.25)]:
            m.rock(x,.025,z,w,.09,d,shade(STONE,m.rng.uniform(.82,1.14)),5)
    for x,z in [(-.37,.38),(.38,-.32),(.12,.44)]:
        m.rock(x,.11,z,.12,.016,.10,MOSS,5)
    if opened:
        for x in [-.23,.23]:
            m.block((x,.108,.08),(.045,.105,.49),WOOD)
        for z in [-.10,.10,.29]:
            m.block((0,.101,z),(.44,.035,.045),WORN_WOOD)
        angle = -1.23
        m.transform = lambda p: (p[0], .10+p[1]*math.cos(angle)-p[2]*math.sin(angle),
                                 -.34+p[1]*math.sin(angle)+p[2]*math.cos(angle))
    else:
        m.transform = lambda p: (p[0],p[1]+.10,p[2]-.34)
    for i in range(5):
        x = -.29+i*.145
        m.block((x,.035,.34),(.138,.07,.69),shade(WOOD,.79+.1*i))
        for n in range(2):
            z = .11 + n*.34 + .025*(i%3)
            m.block((x+.018,.071,z),(.009,.002,.12),shade(WORN_WOOD,.68))
    for z in [.12,.55]:
        m.block((0,.079,z),(.68,.02,.065),IRON)
        for x in [-.25,0,.25]:
            m.taper((x,.089,z),(x,.104,z),.016,.013,5,STEEL)
    m.block((0,.098,.47),(.125,.026,.027),BRASS)
    for x in [-.05,.05]:
        m.block((x,.09,.47),(.025,.026,.026),IRON)
    return m


def pantry():
    m = Mesh('The second pantry', 21)
    m.block((0,.05,0),(.96,.10,.53),STONE)
    m.block((-.1,.67,-.22),(.68,1.14,.04),VOID)
    for x in [-.46,.28]:
        m.block((x,.67,-.17),(.09,1.18,.15),DARK_WOOD)
        m.block((x,.62,-.085),(.027,1.02,.015),WORN_WOOD)
    m.block((-.08,1.24,-.17),(.85,.12,.17),WOOD)
    m.block((-.09,.115,-.02),(.65,.043,.27),STONE)
    yaw = -.91
    m.transform = lambda p: (.32+p[0]*math.cos(yaw)+p[2]*math.sin(yaw),p[1],
                             .05-p[0]*math.sin(yaw)+p[2]*math.cos(yaw))
    m.block((-.04,.66,0),(.43,1.11,.07),DARK_WOOD)
    for x in [-.27,.19]:
        m.block((x,.66,.055),(.047,1.17,.19),WOOD)
    for y in [.11,.41,.72,1.02,1.23]:
        m.block((-.04,y,.075),(.51,.045,.21),WORN_WOOD)
    for x,y,c in [(-.16,.44,'#82755d'),(.04,.44,'#8b5340'),(-.08,.75,'#b5a17a'),(.10,1.05,'#a78456')]:
        m.taper((x,y,.10),(x,y+.11,.10),.053,.038,6,c)
        m.taper((x,y+.11,.10),(x,y+.14,.10),.043,.043,6,shade(c,.83))
    m.block((.15,.59,.16),(.07,.035,.023),BRASS)
    return m


def roots():
    m = Mesh('The three-root screen', 38)
    m.rock(0,0,0,1.05,.13,.77,'#534b3a')
    m.face([(-.37,.085,-.11),(.40,.085,-.11),(.30,.63,-.17),(.10,.88,-.18),
            (-.15,.88,-.18),(-.31,.61,-.15)],VOID,(0,0,1))
    for points in [
        [(-.47,.10,.22),(-.35,.31,.06),(-.36,.67,-.11),(-.18,1.01,-.18),(.10,1.13,-.22)],
        [(.49,.10,.22),(.36,.35,.02),(.33,.65,-.09),(.19,.97,-.16),(.10,1.13,-.22)],
        [(-.13,.09,.34),(-.22,.18,.22),(-.35,.32,.07)],
        [(.22,.09,.31),(.28,.17,.21),(.37,.35,.02)],
    ]:
        for i,(a,b) in enumerate(zip(points,points[1:])):
            m.taper(a,b,.106-i*.012,.088-i*.012,6,shade(WOOD, .91+i*.06))
    for a,b,r in [((-.34,.68,-.07),(-.53,.89,-.07),.065),
                  ((.17,.96,-.15),(.32,1.11,-.12),.047),
                  ((-.25,.92,-.16),(-.35,1.16,-.20),.042)]:
        m.taper(a,b,r,.012,5,DARK_WOOD)
    m.rock(-.17,1.03,-.16,.18,.071,.17,MOSS,5)
    m.rock(.22,.87,-.09,.14,.064,.14,shade(MOSS,.87),5)
    # The wicker panel stands partly open beside the dark crawlway.
    for i in range(5):
        x = .02+i*.067
        m.taper((x,.14,.23+i*.035),(x-.055,.78,.19+i*.035),.020,.016,5,WORN_WOOD)
    for i in range(4):
        y = .25+i*.13
        m.taper((-.01,y,.20),(.30,y,.40),.016,.016,5,ROPE)
    for x,z in [(-.38,.24),(.34,.25),(-.24,-.15),(.11,.30)]:
        m.rock(x,.093,z,.16,.045,.10,MOSS,5)
    return m


def fissure():
    m = Mesh('The warm fissure', 52)
    m.rock(0,0,0,1.14,.13,.76,'#514e45')
    m.face([(-.30,.075,-.17),(.31,.075,-.17),(.31,.55,-.17),(.12,1.02,-.17),
            (-.13,1.18,-.17),(-.29,.65,-.17)],VOID,(0,0,1))
    stones = [(-.37,.02,.03,.43,.39,.58),(.38,.02,.02,.39,.43,.59),
              (-.35,.34,-.03,.34,.43,.49),(.34,.39,-.03,.35,.37,.51),
              (-.27,.73,-.10,.31,.40,.47),(.24,.72,-.10,.34,.36,.45),
              (-.04,1.03,-.12,.53,.30,.39)]
    for i,(x,y,z,w,h,d) in enumerate(stones):
        m.rock(x,y,z,w,h,d,shade('#777b74',.86+.04*i),6)
    m.rock(-.43,.02,.23,.35,.24,.37,shade(STONE,.82),6)
    m.rock(.40,.02,.22,.31,.27,.36,shade(STONE,.92),6)
    for z,y,w in [(.22,.09,.49),(.09,.13,.43),(-.045,.17,.37)]:
        m.rock(0,y,z,w,.046,.22,STONE,6)
    for x,y,z in [(-.38,.36,.12),(.30,.42,.14),(-.24,.78,.08),(.10,1.28,-.02)]:
        m.rock(x,y,z,.17,.045,.15,MOSS,5)
    return m


def dummy():
    m = Mesh('Lantern Yard straw guard', 64)
    m.block((0,.06,0),(.77,.12,.14),DARK_WOOD,.52)
    m.block((0,.065,0),(.14,.13,.72),WOOD,.52)
    m.taper((0,.07,0),(0,1.25,0),.066,.049,5,WORN_WOOD)
    m.taper((-.42,.97,0),(.39,1.04,0),.053,.048,6,WOOD)
    m.taper((0,.65,0),(0,1.04,0),.17,.23,7,STRAW)
    m.rock(0,1.06,.01,.34,.32,.32,STRAW,7)
    for x in [-.32,.30]:
        m.taper((x,.97,.01),(x,1.07,.01),.092,.075,6,STRAW)
        m.taper((x,1.015,.01),(x,1.043,.01),.094,.094,6,ROPE)
    m.block((.01,1.067,.085),(.29,.065,.12),RED,-.09)
    m.block((.19,1.009,.02),(.10,.084,.045),RED,-.22)
    # Front-facing scoring shield with iron rim and a painted bullseye.
    centre = (.05,.81)
    for z,r,c in [(.20,.29,IRON),(.234,.265,'#a88253'),(.245,.163,RED),(.254,.108,'#cdb289'),(.263,.057,RED)]:
        a = (*centre,z)
        m.taper(a,(*centre,z+.013),r,r,10,c)
    for x,y in [(-.173,.81),(.27,.81),(.05,1.03),(.05,.588)]:
        m.taper((x,y,.255),(x,y,.272),.018,.018,5,STEEL)
    return m


def plate():
    m = Mesh('Lantern Gate pressure plate', 78)
    m.taper((0,0,0),(0,.067,0),.49,.43,8,STONE)
    m.taper((0,.067,0),(0,.090,0),.43,.43,8,IRON)
    m.taper((0,.090,0),(0,.108,0),.366,.366,8,'#646d68')
    for x,z in [(-.26,-.22),(.26,-.22),(-.26,.22),(.26,.22)]:
        m.taper((x,.109,z),(x,.132,z),.037,.027,6,BRASS)
    for x in [-.105,.105]:
        m.block((x,.113,0),(.026,.018,.27),BRASS)
    for z,w in [(-.134,.255),(.135,.255),(-.179,.109)]:
        m.block((0,.114,z),(w,.018,.029),BRASS)
    m.taper((0,.109,.018),(0,.131,.018),.062,.034,5,'#dc9d53')
    return m


def models():
    return {
        'road-hatch-closed': hatch(), 'road-hatch-open': hatch(True),
        'pantry-passage': pantry(), 'root-screen': roots(), 'rock-fissure': fissure(),
        'straw-guard': dummy(), 'lantern-plate': plate(),
    }


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for name, mesh in models().items():
        path = OUT / (name + '.glb')
        triangles, bounds = mesh.export(path)
        print(f'{name:20s} {triangles:4d} triangles · {path.stat().st_size:6d} bytes · {bounds}')
