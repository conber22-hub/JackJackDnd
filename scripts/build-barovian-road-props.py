#!/usr/bin/env python3
"""Build Roadside prop set 02 with the original Barovia prop builder."""
import argparse
import math
import runpy
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / 'public/assets/props/barovian-roads'
WOOD, DARK, WORN = '#674834', '#3f3228', '#93724e'
IRON, STEEL, BRASS = '#44494a', '#858985', '#b88d4d'
STONE, MOSS, CLOTH = '#71776d', '#67784d', '#973e33'


def shell(m, points, z0, z1, colour):
    """Extrude a convex front silhouette along local Z."""
    near = [(x, y, z1) for x, y in points]
    far = [(x, y, z0) for x, y in points]
    cx = sum(x for x, _ in points) / len(points)
    cy = sum(y for _, y in points) / len(points)
    m.face(near, colour, (0, 0, 1))
    m.face(far, colour, (0, 0, -1))
    for i in range(len(points)):
        j = (i+1) % len(points)
        x = (points[i][0]+points[j][0])/2-cx
        y = (points[i][1]+points[j][1])/2-cy
        m.face([far[i], far[j], near[j], near[i]], colour, (x, y, 0))


def nail(m, x, y, z, colour=IRON):
    m.taper((x,y,z),(x,y,z+.012),.017,.014,5,colour)


def crates(m, x, y, z, scale=1):
    w, h, d = .48*scale,.39*scale,.43*scale
    m.block((x,y+h/2,z),(w,h,d),WOOD)
    for j in range(3):
        m.block((x,y+(j+.5)*h/3,z+d*.51),(w*.95,h*.30,.022*scale),[WORN,'#805e40','#785437'][j])
    for i in [-1,1]:
        m.block((x+i*w*.38,y+h/2,z+d*.54),(.056*scale,h,.03*scale),DARK)
        m.block((x+i*w*.37,y+h+.009*scale,z),(.055*scale,.029*scale,d),WORN)
    shell(m, [(x,y+h*.76),(x+w*.18,y+h*.5),(x,y+h*.24),(x-w*.18,y+h*.5)],
          z+d*.56,z+d*.58,'#c7bd9b')


def fork(Mesh):
    m = Mesh('Old Svalich fork sign', 107)
    m.rock(0,0,0,.47,.12,.38,'#56584e')
    m.block((0,.57,-.025),(.12,1.10,.13),DARK,-.12)
    m.rock(0,1.10,-.025,.14,.08,.15,WOOD,5)
    shell(m,[(-.36,.86),(.23,.86),(.41,.94),(.23,1.02),(-.36,1.02)],.025,.107,WORN)
    shell(m,[(-.42,.73),(-.28,.81),(.31,.80),(.31,.66),(-.28,.65)],.025,.098,'#78543d')
    for y in [.91,.98,.70,.76]:
        m.block((-.061,y,.110),(.24,.012,.007),DARK)
    for y in [.94,.73]:
        nail(m,.05,y,.108,BRASS)
    for x,z in [(-.17,.13),(.16,.11),(.12,-.11)]:
        m.rock(x,.045,z,.15,.091,.12,MOSS,5)
    return m


def raven(Mesh):
    m = Mesh('Raven milestone', 119)
    m.rock(0,0,0,.60,.19,.51,'#53574e')
    shell(m,[(-.25,.13),(.23,.13),(.24,.58),(.12,.73),(-.15,.71),(-.25,.58)],-.18,.14,STONE)
    m.block((-.015,.42,.145),(.35,.22,.024),'#60645e')
    for x,y,w,h in [(-.11,.43,.022,.15),(-.067,.44,.019,.13),(.025,.49,.11,.018),(.025,.44,.079,.018),(.025,.39,.11,.019)]:
        m.block((x,y,.159),(w,h,.007),'#343a36')
    # One dark silhouette with a light-catching beak and eyes.
    m.taper((0,.74,.075),(0,.93,.04),.078,.112,7,'#30373a')
    m.taper((0,.92,.04),(0,1.06,.086),.105,.068,7,'#323a3c')
    m.rock(0,1.024,.11,.164,.15,.17,'#353d40',6)
    m.taper((0,1.095,.18),(0,1.075,.28),.038,.010,5,'#77746a')
    m.taper((0,.91,-.03),(0,.76,-.26),.066,.039,5,'#22292c')
    for side in [-1,1]:
        m.taper((side*.073,.94,.035),(side*.092,.83,-.10),.063,.036,5,'#252c31')
        m.rock(side*.060,1.09,.151,.031,.026,.029,BRASS,5)
    m.rock(.13,.61,.10,.13,.085,.11,MOSS,5)
    return m


def bridge(Mesh):
    m = Mesh('One-square timber bridge deck', 123)
    # Exactly one square, with continuous runners so neighbours can meet flush.
    for x in [-.397,.397]:
        m.block((x,.061,0),(.105,.122,1),DARK)
        m.block((x,.133,0),(.082,.024,1),'#876445')
    for i in range(7):
        z = -.5 + (i+.5)/7
        c = ['#89694b','#997552','#78583e'][i%3]
        m.block((0,.098,z),(1,.061,1/7-.009),c)
        for x in [-.29,.29]:
            m.taper((x,.1285,z),(x,.136,z),.016,.014,5,IRON)
    return m


def barrier(Mesh):
    m = Mesh('Checkpoint timber barrier', 138)
    for x in [-.67,.67]:
        m.block((x,.044,0),(.31,.088,.65),DARK)
        for a,b in [((x,.075,-.29),(x,.66,.22)),((x,.075,.29),(x,.66,-.22))]:
            m.taper(a,b,.065,.052,5,WOOD)
        m.taper((x,.39,.0),(x,.39,.065),.04,.039,5,STEEL)
    m.block((0,.405,0),(1.72,.154,.165),WORN)
    for i in range(6):
        x=-.67+i*.27
        m.block((x,.407,.092),(.165,.121,.022),CLOTH if i%2==0 else '#b9a37c')
    for x in [-.67,.67]:
        nail(m,x,.412,.110)
    return m


def freight(Mesh):
    m = Mesh('Salt and supply cargo', 151)
    m.block((0,.037,0),(.94,.074,.85),DARK)
    crates(m,-.21,.075,.13,1)
    crates(m,.22,.075,-.10,.72)
    crates(m,-.21,.472,.13,.59)
    m.rock(.26,.078,.29,.27,.28,.24,'#a39775',6)
    m.taper((.26,.325,.29),(.26,.36,.29),.048,.04,5,'#877756')
    m.block((.22,.12,.393),(.10,.032,.011),'#dbd0ac')
    return m


def wagon(Mesh):
    m = Mesh('Broken supply wagon', 179)
    for x,z in [(0,-.61),(.31,.57),(-.19,.44)]:
        m.rock(x,0,z,.31,.079,.26,'#575246',6)
    for x,y,z in [(-.43,.26,-.55),(.43,.26,-.55),(-.43,.26,.47)]:
        for i in range(12):
            a,b=i*math.tau/12,(i+1)*math.tau/12
            p=lambda t:(x,y+.251*math.cos(t),z+.251*math.sin(t))
            m.taper(p(a),p(b),.028,.028,5,IRON)
        for i in range(0,12,2):
            a=i*math.tau/12
            m.taper((x,y,z),(x,y+.239*math.cos(a),z+.239*math.sin(a)),.031,.021,5,WORN)
        m.taper((x-.046,y,z),(x+.046,y,z),.065,.065,7,DARK)
    for z in [-.55,.47]:
        m.taper((-.49,.26,z),(.48,.26,z),.033,.029,5,IRON)
    angle=-.17
    m.transform=lambda p:(p[0]*math.cos(angle)-p[1]*math.sin(angle),
                          .10+p[0]*math.sin(angle)+p[1]*math.cos(angle),p[2])
    m.block((0,.31,-.03),(.76,.13,1.30),DARK)
    for x in [-.36,.36]:
        for z,length in [(-.34,.59),(.38,.38)]:
            m.block((x,.44,z),(.084,.23,length),WOOD)
    m.block((0,.45,-.65),(.74,.24,.079),WORN)
    m.block((-.12,.40,.62),(.41,.13,.088),WOOD,.17)
    crates(m,-.09,.378,-.32,.78)
    m.block((.12,.392,.17),(.35,.043,.33),CLOTH,-.2)
    for x in [-.23,.21]:
        m.taper((x,.29,.57),(x,.19,.93),.034,.027,5,WORN)
    return m


def hoist(Mesh):
    m = Mesh('Washout rescue hoist', 193)
    for x,z in [(-.39,.24),(.39,.24),(0,-.33)]:
        m.block((x,.038,z),(.20,.076,.17),STONE)
        m.taper((x,.074,z),(x*.16,1.16,.015),.054,.038,6,WOOD)
    for h in [1.05,1.09,1.13]:
        m.taper((0,h,.018),(0,h+.025,.018),.082,.078,7,'#a68b56')
    m.taper((-.28,.35,.185),(.28,.35,.185),.06,.06,7,IRON)
    m.taper((-.105,.35,.185),(.105,.35,.185),.092,.092,8,'#a68b56')
    for x in [-.126,.125]:
        m.taper((x-.018,.35,.185),(x+.018,.35,.185),.104,.104,7,DARK)
    m.taper((.17,.35,.185),(.31,.44,.185),.025,.019,6,IRON)
    m.taper((.31,.44,.185),(.39,.44,.185),.021,.022,6,WORN)
    m.taper((0,1.06,.04),(0,.46,.17),.013,.013,5,'#af9463')
    m.taper((0,.97,.047),(.02,.67,.036),.015,.015,5,'#b19a6d')
    m.rock(.02,.62,.036,.10,.075,.089,IRON,5)
    return m


def signal(Mesh):
    m = Mesh('Red flag signal cairn', 217)
    m.rock(0,0,0,.76,.20,.69,'#565c54')
    for x,y,z,w,h,d in [(-.13,.12,.04,.39,.23,.38),(.19,.13,-.03,.41,.20,.37),
                         (.024,.27,.01,.49,.22,.39),(-.04,.43,.027,.35,.17,.32)]:
        m.rock(x,y,z,w,h,d,STONE)
    m.taper((.08,.29,-.03),(.14,1.12,-.06),.031,.024,6,DARK)
    flag = [(.13,1.10,-.035),(.42,1.00,-.025),(.52,1.05,-.015),
            (.43,.87,.006),(.13,.91,-.031)]
    m.face(flag,CLOTH,(0,0,1))
    m.face(flag,CLOTH,(0,0,-1))
    m.taper((-.18,.55,.11),(-.18,.78,.11),.078,.066,6,'#d3a85e')
    for y in [.55,.76]:
        m.taper((-.18,y,.11),(-.18,y+.034,.11),.089,.082,6,IRON)
    m.taper((-.18,.785,.11),(-.18,.85,.11),.085,.024,6,IRON)
    return m


def models(builder):
    Mesh=builder['Mesh']
    meshes={ 'fork-sign':fork(Mesh), 'raven-milestone':raven(Mesh), 'timber-deck':bridge(Mesh),
             'checkpoint-barrier':barrier(Mesh), 'salt-cargo':freight(Mesh), 'broken-wagon':wagon(Mesh),
             'rescue-hoist':hoist(Mesh), 'signal-cairn':signal(Mesh) }
    for mesh in meshes.values():
        bottom=min(p[1] for points, _, _ in mesh.faces for p in points)
        mesh.faces=[(tuple((x,y-bottom,z) for x,y,z in points), normal, colour)
                    for points,normal,colour in mesh.faces]
    return meshes


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--builder',type=Path,default=HERE/'build-barovian-props.py')
    args=parser.parse_args()
    if not args.builder.is_file():
        parser.error('The original Barovia prop builder from PR #63 is required to regenerate these GLBs.')
    OUT.mkdir(parents=True,exist_ok=True)
    for name,mesh in models(runpy.run_path(str(args.builder))).items():
        path=OUT/(name+'.glb')
        triangles,bounds=mesh.export(path)
        print(f'{name:20s} {triangles:4d} triangles · {path.stat().st_size:6d} bytes · {bounds}')
