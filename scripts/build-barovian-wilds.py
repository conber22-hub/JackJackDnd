#!/usr/bin/env python3
"""Export six Barovian woodland subjects in healthy and Bloom forms."""
import argparse
import math
import runpy
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / 'public/assets'
MOSS, DARK_MOSS, LICHEN = '#637657', '#344c3e', '#a5ad71'
PLUM, ROSE, BONE = '#5e354f', '#b26f7d', '#dcc29b'
VOID, EYE = '#241f29', '#d1d292'
BARK, GREY, WOOD = '#66534a', '#87817a', '#644735'


def chain(m, points, radii, colour, sides=5):
    for a, b, r0, r1 in zip(points, points[1:], radii, radii[1:]):
        m.taper(a, b, r0, r1, sides, colour)


def ellipsoid(m, centre, dims, colours, sides=8):
    """Faceted oval with distinct lower and upper colours."""
    x, y, z = centre
    rx, ry, rz = (d/2 for d in dims)
    levels = [-.96, -.69, -.20, .35, .77, .97]
    rings = []
    for h in levels:
        radius = math.sqrt(1-h*h)
        rings.append([(x+rx*radius*math.cos(i*math.tau/sides), y+ry*h,
                       z+rz*radius*math.sin(i*math.tau/sides)) for i in range(sides)])
    m.face(rings[0], colours[0], (0, -1, 0))
    m.face(rings[-1], colours[-1], (0, 1, 0))
    for n, (a, b) in enumerate(zip(rings, rings[1:])):
        for i in range(sides):
            j = (i+1)%sides
            t = (i+.5)*math.tau/sides
            m.face([a[i], a[j], b[j], b[i]], colours[min(n,len(colours)-1)],
                   (math.cos(t), 0, math.sin(t)))


def roots(m, spread, colour):
    for i in range(6):
        t = i*math.tau/6+.19
        c, s = math.cos(t), math.sin(t)
        reach = spread*(.85+.06*(i%4))
        chain(m, [(c*.059, .262, s*.059), (c*reach*.63, .095, s*reach*.63),
                  (c*reach, .039, s*reach)], [.098, .060, .008], colour)


def clusters(m, shapes, colours, seed):
    m.rng.seed(seed)
    for i, (x, y, z, w, h, d) in enumerate(shapes):
        m.rock(x, y, z, w, h, d, colours[i%len(colours)], 7)


def pods(m, shapes):
    for i, (x,y,z,w) in enumerate(shapes):
        m.rock(x, y, z, w, w*1.33, w*.90, ROSE if i%3 else LICHEN, 5)


def thorn(m, a, b, c, w, colour=BONE):
    chain(m, [a,b,c], [w,w*.62,.004], colour, 4)


def eye(m, x, y, z, size, colour):
    m.taper((x,y,z), (x,y,z+.023), size, size*.84, 7, colour)
    m.taper((x,y,z+.023), (x,y,z+.029), size*.43, size*.32, 5, VOID)


def beech(Mesh, taken):
    m = Mesh('Copper beech · '+('bloomed' if taken else 'healthy'), 801)
    m.taper((0,0,0), (0,.37,0), .175, .142, 8, DARK_MOSS if taken else GREY)
    roots(m, .47, DARK_MOSS if taken else BARK)
    bark = DARK_MOSS if taken else GREY
    for points, radii in [
        ([(0,.31,0),(-.072,.94,.028),(-.17,1.64,.013),(-.09,2.30,-.09),(.02,2.72,-.19)],
         [.143,.129,.101,.052,.009]),
        ([(-.11,1.18,.026),(.22,1.68,.052),(.47,2.08,.09),(.57,2.41,.01)],
         [.103,.084,.053,.012]),
        ([(-.16,1.51,.02),(-.49,1.89,.21),(-.71,2.14,.26),(-.78,2.41,.12)],
         [.086,.064,.040,.009]),
        ([(-.14,1.84,-.02),(-.32,2.21,-.36),(-.45,2.54,-.51)],[.073,.052,.011]),
        ([(.26,1.72,.058),(.53,1.95,.37),(.73,2.27,.55)],[.058,.039,.009]),
    ]:
        chain(m, points, radii, bark, 7)
    for x,y,z,w in [(-.02,.49,.139,.091),(-.095,.89,.149,.068),
                    (-.142,1.35,.14,.068),(.241,1.72,.124,.054)]:
        m.rock(x, y, z, w, .027, .031, BARK if not taken else PLUM, 4)
    if taken:
        clusters(m, [(-.14,2.36,-.19,.93,.63,.79),(-.72,2.04,.18,.77,.57,.63),
                     (.49,2.06,.17,.89,.55,.73),(.63,2.01,.53,.57,.42,.49)],
                 [MOSS,PLUM,DARK_MOSS], 811)
        pods(m, [(.044,.37,.135,.16),(-.12,.77,.132,.19),(-.153,1.31,.128,.15),
                 (.36,1.77,.139,.15),(-.55,1.83,.251,.16),(.27,2.09,.41,.21)])
        for side in [-1,1]:
            thorn(m, (side*.60,2.09,.078), (side*.87,2.33,.144), (side*.93,2.73,.11), .081)
        chain(m, [(.26,.069,.25),(.17,.39,.21),(-.01,.81,.15),(-.13,1.19,.144)],
              [.083,.067,.041,.008], PLUM)
    else:
        clusters(m, [(-.06,2.31,-.17,1.21,.77,1.09),(-.64,2.01,.24,1.02,.71,.89),
                     (.47,2.06,.12,1.14,.64,.94),(.62,1.99,.54,.81,.59,.72),
                     (-.43,2.30,-.48,.89,.65,.76),(-.30,2.49,.19,.79,.61,.71)],
                 ['#946c4b','#86694b','#aa7f55','#77794c'], 813)
    return m


def hanging_leaf(m, top, tip, width, colour):
    x, y, z = top
    tx, ty, tz = tip
    mid = ((x+tx)/2+.046,(y+ty)/2,(z+tz)/2+.042)
    left = (mid[0]-width,mid[1],mid[2]-.022)
    right = (mid[0]+width,mid[1]+.07,mid[2]-.015)
    for edge in [left,right]:
        tri = [top,edge,mid]
        m.face(tri,colour)
        m.face(tri[::-1],colour)
        tri = [mid,edge,tip]
        m.face(tri,colour)
        m.face(tri[::-1],colour)


def willow(Mesh, taken):
    m = Mesh('Marsh willow · '+('bloomed' if taken else 'healthy'), 827)
    bark = '#3e5145' if taken else BARK
    m.taper((0,.047,0),(.055,.49,-.021),.18,.146,8,bark)
    # A vertical pad on the underside keeps the off-axis roots above the origin.
    m.taper((0,0,0),(0,.093,0),.176,.168,8,bark)
    roots(m,.55,bark)
    chain(m, [(.044,.35,-.018),(.081,.91,-.021),(.13,1.39,.01),(.03,1.89,-.09)],
          [.155,.124,.098,.035],bark,7)
    curtains = []
    for i in range(7):
        a = i*math.tau/7+.16
        c, s = math.cos(a),math.sin(a)
        h = 1.92+.087*(i%3)
        shoulder = (c*.45,h,s*.44)
        branch = (c*(.78+i%2*.07),h+.15,s*.72)
        end = (c*.99,h-.20,s*.90)
        chain(m,[(.083,1.27+i%2*.21,-.035),shoulder,branch,end],
              [.087,.061,.045,.009],bark,6)
        curtains.append((branch,end))
    for i, (branch,end) in enumerate(curtains):
        x,y,z=end
        if not taken:
            m.rock(branch[0],branch[1]-.10,branch[2],.62,.37,.61,
                   ['#6b8255','#7e8c55','#65774b'][i%3],6)
            for j in range(5):
                dx=(j-2)*.085
                top=(x*.91+dx,y+.19-.022*j,z*.89+.062*(j%2))
                tip=(x+dx*1.32-.065,y-.52-.11*((i+j)%4),z+.065*(j%3))
                hanging_leaf(m,top,tip,.074,['#7c8c56','#9da36a','#63794d'][(i+j)%3])
        else:
            for j in range(3):
                dx=(j-1)*.119
                top=(x*.90+dx,y+.21,z*.92)
                knot=(x+dx+.034,y-.18-.06*(i%3),z+.076)
                tip=(x+dx*1.13-.059,y-.63-.087*((i+j)%4),z+.115)
                chain(m,[top,knot,tip],[.048,.035,.005],MOSS if j==1 else PLUM,5)
                if j!=1:
                    pods(m,[(knot[0],knot[1]-.072,knot[2]+.019,.114+.027*(i%2))])
            m.rock(branch[0],branch[1]-.12,branch[2],.45,.30,.42,DARK_MOSS,6)
    if taken:
        pods(m,[(.123,.46,.131,.18),(-.01,.81,.143,.13),(.079,1.14,.13,.16)])
    return m


def apple(Mesh,taken):
    m=Mesh('Orchard apple · '+('bloomed' if taken else 'healthy'),839)
    bark=DARK_MOSS if taken else WOOD
    m.taper((0,0,0),(0,.247,0),.179,.158,8,bark)
    roots(m,.39,bark)
    chain(m,[(0,.23,0),(-.086,.59,.063),(-.145,.93,.023),(-.076,1.23,-.052)],
          [.158,.141,.097,.041],bark,7)
    branches=[
        ([(-.101,.66,.056),(-.43,.93,.143),(-.63,1.25,.17),(-.75,1.48,.13)],[.115,.083,.042,.011]),
        ([(-.135,.87,.026),(.23,1.04,.12),(.52,1.23,.33),(.76,1.47,.39)],[.108,.080,.052,.012]),
        ([(-.13,.91,.022),(-.11,1.27,-.40),(.09,1.52,-.61)],[.091,.065,.010]),
        ([(-.10,1.09,-.014),(.06,1.47,-.04),(.32,1.79,-.025)],[.084,.048,.010]),
        ([(.26,1.07,.13),(.56,1.28,-.23),(.71,1.49,-.42)],[.067,.049,.009]),
    ]
    for points,radii in branches:
        chain(m,points,radii,bark,6)
    canopy=[(-.57,1.16,.16,1.01,.52,.74),(.56,1.16,.31,.97,.57,.73),
            (.06,1.39,-.06,1.11,.66,.82),(-.11,1.23,-.52,.83,.55,.71),
            (.60,1.24,-.36,.76,.47,.64)]
    clusters(m,canopy if not taken else [(x,y,z,w*.82,h*.73,d*.86) for x,y,z,w,h,d in canopy],
             ['#74844c','#62754d','#839354'] if not taken else [MOSS,PLUM,DARK_MOSS], 841)
    fruit=[(-.64,1.25,.409,.119),(-.35,1.24,.359,.094),(.43,1.25,.619,.124),
           (.69,1.22,.545,.113),(.05,1.49,.326,.137),(-.09,1.34,-.652,.105),
           (.73,1.37,-.09,.117)]
    if taken:
        pods(m,[(x,y-.083,z,r*1.52) for x,y,z,r in fruit])
        for i,(x,y,z,w) in enumerate(fruit[::2]):
            thorn(m,(x,y+.063,z),(x-.055,y+.122,z+.062),(x-.087,y+.056,z+.103),w*.27)
        eye(m,-.098,.81,.173,.078,EYE)
    else:
        for x,y,z,w in fruit:
            m.rock(x,y,z,w,w*.97,w,'#a44b44',6)
            m.taper((x,y+w*.88,z),(x+.012,y+w*1.17,z),.012,.005,4,WOOD)
    return m


def hoof(m, x, z, size, colour):
    m.rock(x,0,z,size,.086,size*1.13,colour,6)


def stag(Mesh,taken):
    m=Mesh('Svalich stag · '+('bloomed' if taken else 'healthy'),853)
    fur='#8d664c' if not taken else '#686459'
    chest='#b58b65' if not taken else MOSS
    for side in [-1,1]:
        for front in [False,True]:
            z = .186 if front else -.275
            x = side*(.126 if front else .151)
            offset = (.025 if side>0 else -.018)
            hoof(m,x,z+offset,.096,VOID)
            points=[(x,.059,z+offset),(x,.227,z-.072 if not front else z+.011),
                    (x*.88,.434,z+.006),(x*.86,.596,z)]
            chain(m,points,[.034,.043,.056,.077],fur,6)
    ellipsoid(m,(0,.603,-.073),(.416,.320,.691),
              [chest,fur,fur,'#795541' if not taken else DARK_MOSS],10)
    chain(m,[(0,.614,.158),(0,.779,.214),(0,1.001,.269)],[.143,.115,.084],chest,8)
    ellipsoid(m,(0,1.018,.316),(.232,.223,.236),[chest,fur,fur,chest],8)
    m.taper((0,.997,.353),(0,.931,.497),.082,.054,7,fur)
    m.rock(0,.908,.483,.116,.074,.114,VOID,6)
    m.taper((0,.649,-.396),(0,.582,-.498),.059,.012,5,chest)
    for side in [-1,1]:
        x=side*.085
        m.taper((x,1.035,.271),(side*.212,1.132,.207),.054,.008,5,fur)
        eye(m,side*.079,1.041,.39,.022,EYE if taken else '#644b39')
        beam=[(side*.062,1.099,.267),(side*.128,1.241,.244),
              (side*.204,1.369,.183),(side*.218,1.544,.116)]
        chain(m,beam,[.036,.032,.022,.004],BONE if not taken else '#b8a681',6)
        thorn(m,beam[1],(side*.158,1.329,.323),(side*.179,1.415,.341),.023)
        thorn(m,beam[2],(side*.286,1.431,.222),(side*.319,1.525,.204),.022)
        if taken:
            thorn(m,(side*.107,.626,.02),(side*.234,.731,.074),(side*.272,.822,.119),.047)
    if taken:
        pods(m,[(-.124,.69,-.28,.116),(.109,.68,-.216,.137),(.02,.71,-.125,.112),
                (-.121,1.214,.253,.082),(.207,1.319,.195,.105)])
        chain(m,[(.064,.705,-.28),(.025,.742,-.09),(-.04,.823,.083),(-.047,.914,.211)],
              [.051,.042,.031,.006],PLUM)
    return m


def boar(Mesh,taken):
    m=Mesh('Rootwood boar · '+('bloomed' if taken else 'healthy'),863)
    fur='#69544c' if not taken else '#4b534c'
    ridge='#423939' if not taken else DARK_MOSS
    for side in [-1,1]:
        for front in [False,True]:
            x=side*(.174 if front else .153)
            z=.184 if front else -.282
            hoof(m,x,z,.115,VOID)
            chain(m,[(x,.055,z),(x,.195,z-.032),(x*.87,.403,z)],
                  [.042,.067,.092],fur,6)
    ellipsoid(m,(0,.437,-.099),(.507,.418,.714),[fur,fur,'#78645b',ridge],10)
    ellipsoid(m,(0,.458,.124),(.443,.446,.383),[fur,fur,ridge,ridge],8)
    chain(m,[(0,.447,.223),(0,.367,.366),(0,.325,.512)],[.163,.121,.086],fur,7)
    m.rock(0,.263,.512,.188,.137,.096,VOID,7)
    m.taper((0,.465,-.419),(-.061,.568,-.471),.032,.010,5,fur)
    for side in [-1,1]:
        m.taper((side*.132,.489,.253),(side*.206,.638,.239),.074,.008,5,ridge)
        eye(m,side*.097,.431,.365,.027,EYE if taken else '#725541')
        thorn(m,(side*.074,.30,.411),(side*.151,.332,.442),(side*.177,.439,.428),.034)
        if taken:
            thorn(m,(side*.105,.312,.321),(side*.206,.388,.399),(side*.238,.486,.378),.045)
    for i,z in enumerate([-.325,-.246,-.167,-.088,-.009,.07,.149]):
        y=.593+(.049*math.sin(i*math.pi/7))
        m.taper((0,y,z),(0,y+.093+.026*(i%2),z-.052),.052,.006,5,
                PLUM if taken and i%2 else ridge)
    if taken:
        pods(m,[(-.165,.514,-.264,.138),(.178,.515,-.236,.129),(.171,.556,-.076,.158),
                (-.154,.542,.066,.112),(.13,.412,.321,.100)])
        for side in [-1,1]:
            chain(m,[(side*.14,.42,-.34),(side*.243,.47,-.17),(side*.218,.40,.013),
                     (side*.17,.337,.204)],[.052,.049,.035,.007],MOSS)
    return m


def vane(m, shoulder, outline, colour):
    """Make a ridged feather or membrane from its perimeter and a central ridge."""
    for a,b in zip(outline,outline[1:]+outline[:1]):
        points=[shoulder,a,b]
        m.face(points,colour)
        m.face(points[::-1],colour)


def raven(Mesh,taken):
    m=Mesh('Marsh raven · '+('bloomed' if taken else 'healthy'),877)
    ink='#343946'
    flight='#494e60'
    m.rock(0,0,0,.528,.153,.267,'#67574d',7)
    chain(m,[(-.246,.08,-.039),(-.041,.139,-.022),(.18,.145,-.037),(.297,.093,-.115)],
          [.047,.058,.047,.010],WOOD,6)
    for side in [-1,1]:
        x=side*.079
        chain(m,[(x,.146,.03),(x,.222,.012),(x*.96,.304,-.024)],[.021,.019,.031],
              '#917b65',5)
        for offset in [-.024,0,.024]:
            m.taper((x+offset,.166,.038),(x+offset,.153,.097),.012,.004,4,'#917b65')
    ellipsoid(m,(0,.389,-.042),(.234,.315,.380),[ink,ink,flight,ink],8)
    ellipsoid(m,(.013,.559,.102),(.174,.184,.185),[ink,ink,flight,ink],8)
    m.taper((.015,.564,.155),(.022,.529,.291),.055,.009,5,'#5f5860')
    for side in [-1,1]:
        eye(m,side*.048+.013,.579,.174,.020,EYE if taken else '#7f7772')
        elbow=(side*.269,.507,-.032)
        chain(m,[(side*.081,.449,-.024),elbow,(side*.429,.436,-.152)],
              [.052,.037,.011],flight,6)
        if taken:
            vane(m,(side*.241,.489,-.142),[(side*.10,.421,-.01),elbow,
                 (side*.449,.449,-.125),(side*.48,.361,-.251),(side*.339,.346,-.254),
                 (side*.230,.358,-.287),(side*.116,.390,-.214)],PLUM)
        for i in range(5):
            x=side*(.166+i*.053)
            tip=(x+side*(.083 if i>1 else .036),.332+i*.012,-.297-i*.012)
            if taken and i%2==0:
                thorn(m,(x,.471,.002-i*.018),(x+side*.061,.441,-.16),tip,.033)
            else:
                vane(m,(x,.461,-.119),[(x-side*.026,.466,-.052),(x+side*.026,.445,-.061),
                     (tip[0]+side*.019,tip[1]+.008,tip[2]+.026),tip],
                     '#56596a' if i%2 else flight)
    for i in [-1,0,1]:
        vane(m,(i*.045,.321,-.238),[(i*.032-.026,.36,-.161),(i*.032+.026,.36,-.161),
             (i*.065+.021,.268,-.394),(i*.065-.023,.258,-.407)],ink)
    if taken:
        pods(m,[(.013,.419,.103,.110),(-.132,.40,-.039,.071),(.172,.462,-.102,.083)])
        thorn(m,(.038,.612,.08),(.088,.666,.014),(.146,.650,-.019),.028)
    return m


def models(Mesh):
    families=[
        ('terrain','copper-beech',beech),('terrain','marsh-willow',willow),
        ('terrain','orchard-apple',apple),('creatures','svalich-stag',stag),
        ('creatures','rootwood-boar',boar),('creatures','marsh-raven',raven),
    ]
    return {(group, name+('-bloomed' if taken else '-healthy')):make(Mesh,taken)
            for group,name,make in families for taken in [False,True]}


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--builder',type=Path,default=HERE/'build-barovian-props.py')
    args=parser.parse_args()
    if not args.builder.is_file():
        parser.error('Pass --builder with the mesh helper from Barovia prop set 01.')
    for (group,name),mesh in models(runpy.run_path(str(args.builder))['Mesh']).items():
        path=OUT/group/'barovian-wilds'/f'{name}.glb'
        path.parent.mkdir(parents=True,exist_ok=True)
        triangles,bounds=mesh.export(path)
        print(f'{name:25s} {triangles:4d} triangles · {path.stat().st_size:6d} bytes · {bounds}')
