#!/usr/bin/env python3
"""Sculpt miniature map landmarks for the Dread Delve overworld."""
import argparse
import math
import runpy
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / 'public/assets/overworld/landmarks'
STONE, LIMESTONE, DARK = '#736d67', '#a29882', '#393b3c'
SLATE, RED, AMBER = '#4e5b60', '#713d44', '#e3ad67'
TIMBER, EDGE = '#664b3b', '#a17c56'
EARTH, MOSS, PINE = '#464842', '#5d6b52', '#3f5850'
WATER, RIPPLE = '#3d6169', '#87a8a0'


def ground(m, colour=EARTH, w=2.28, d=1.90):
    m.rock(0, 0, 0, w, .20, d, colour, 11)


def gable(m, x, y, z, width, depth, rise, colour):
    a, b = x-width/2, x+width/2
    u, v = z-depth/2, z+depth/2
    m.face([(a,y,u),(x,y+rise,u),(b,y,u)], colour, (0,0,-1))
    m.face([(a,y,v),(x,y+rise,v),(b,y,v)], colour, (0,0,1))
    m.face([(a,y,u),(x,y+rise,u),(x,y+rise,v),(a,y,v)], colour, (-1,1,0))
    m.face([(b,y,u),(x,y+rise,u),(x,y+rise,v),(b,y,v)], colour, (1,1,0))


def house(m, x, y, z, width, depth, height, roof=RED, walls=STONE):
    m.block((x,y+height/2,z),(width,height,depth),walls)
    gable(m,x,y+height-.006,z,width+.057,depth+.060,width*.34,roof)
    m.block((x,y+height*.27,z+depth/2+.008),(.077,height*.55,.019),DARK)
    m.block((x-width*.28,y+height*.56,z+depth/2+.009),(.048,.060,.019),AMBER)


def pine(m, x, y, z, height):
    m.taper((x,y,z),(x,y+height*.40,z),.024,.022,5,TIMBER)
    for frac, radius in [(.20,.29),(.42,.22),(.63,.16)]:
        m.taper((x,y+height*frac,z),(x,y+height*(frac+.39),z),
                height*radius,.008,6,PINE)


def tower(m, x, y, z, radius, height, roof, walls=STONE):
    m.taper((x,y,z),(x,y+height,z),radius,radius*.91,8,walls)
    m.taper((x,y+height-.028,z),(x,y+height+.028,z),
            radius*1.14,radius*1.10,8,LIMESTONE)
    m.taper((x,y+height+.021,z),(x,y+height+roof,z),
            radius*1.10,.012,8,SLATE)
    m.block((x,y+height*.77,z+radius*.94),(.048,.096,.021),AMBER)


def castle(Mesh):
    m=Mesh('Castle Ravenloft · atlas landmark',901)
    ground(m)
    m.rock(-.13,.13,-.10,1.85,.47,1.44,DARK,9)
    m.block((-.13,.63,-.095),(1.24,.16,.97),STONE)
    m.block((-.16,.96,-.13),(.91,.58,.68),STONE)
    gable(m,-.16,1.24,-.13,.95,.72,.31,SLATE)
    for x,z,r,h,roof in [(-.67,.29,.188,.72,.32),(.43,.26,.173,.61,.30),
                         (-.53,-.48,.183,.91,.34),(.28,-.46,.21,1.09,.48),
                         (-.19,-.16,.156,1.34,.49)]:
        tower(m,x,.61,z,r,h,roof)
    m.block((-.08,1.74,.002),(.045,.078,.018),'#e07767')
    m.block((.30,.36,.60),(.58,.095,.23),STONE,-.55)
    m.block((.49,.24,.72),(.45,.098,.22),STONE,-.55)
    for x,y in [(-.41,.93),(-.19,.98),(.06,.95)]:
        m.block((x,y,.217),(.055,.105,.015),AMBER)
    return m


def mill(Mesh):
    m=Mesh('Old Bonegrinder · atlas landmark',911)
    ground(m,MOSS)
    m.rock(-.05,.13,-.02,1.46,.23,1.26,MOSS,8)
    m.taper((-.06,.34,-.08),(.035,1.45,-.09),.37,.265,9,STONE)
    m.taper((.033,1.43,-.09),(.10,1.91,-.12),.319,.018,9,SLATE)
    m.block((-.063,.53,.258),(.135,.275,.063),DARK)
    m.block((-.14,1.19,.178),(.090,.114,.034),AMBER)
    centre=(.02,1.30,.281)
    for i in range(4):
        a=.46+i*math.pi/2
        c,s=math.cos(a),math.sin(a)
        x,y,z=centre
        end=(x+c*.76,y+s*.76,z)
        m.taper(centre,end,.035,.024,5,TIMBER)
        for j in range(4):
            u=.43+j*.073
            m.block((x+c*u-s*.043,y+s*u+c*.043,z+.015),(.060,.18,.032),EDGE)
        p0=(x+c*.41,y+s*.41,z+.034)
        p1=(x+c*.71,y+s*.71,z+.034)
        p2=(p1[0]-s*.125,p1[1]+c*.125,z+.034)
        p3=(p0[0]-s*.125,p0[1]+c*.125,z+.034)
        m.face([p0,p1,p2,p3],'#b39a78',(0,0,1))
        m.face([p0,p1,p2,p3],'#b39a78',(0,0,-1))
    m.taper((.02,1.30,.263),(.02,1.30,.35),.075,.053,7,DARK)
    pine(m,-.70,.161,-.38,.48)
    return m


def town(Mesh):
    m=Mesh('Vallaki · atlas landmark',919)
    ground(m,MOSS)
    for z in [-.56,.56]:
        for i in range(13):
            x=-.81+.135*i
            if z>0 and abs(x)<.25:
                continue
            m.taper((x,.16,z),(x,.49+(i%3)*.024,z),.060,.049,5,TIMBER)
            m.taper((x,.47+(i%3)*.024,z),(x,.56+(i%3)*.024,z),.047,.009,5,EDGE)
    for x in [-.81,.81]:
        for i in range(8):
            z=-.47+i*.135
            m.taper((x,.145,z),(x,.527+(i%2)*.026,z),.063,.041,5,TIMBER)
    for x in [-.312,.312]:
        m.block((x,.54,.58),(.21,.75,.27),TIMBER)
        gable(m,x,.913,.58,.27,.33,.16,SLATE)
        m.block((x,.733,.721),(.077,.088,.024),AMBER)
    m.block((0,.58,.585),(.46,.110,.159),EDGE)
    for x,z,w,d,h,roof in [(-.47,-.24,.38,.34,.34,RED),(.48,-.25,.42,.32,.39,SLATE),
                            (-.49,.13,.35,.29,.35,SLATE),(.50,.19,.35,.33,.32,RED)]:
        house(m,x,.18,z,w,d,h,roof)
    house(m,.008,.17,-.18,.40,.45,.49,SLATE,LIMESTONE)
    tower(m,.008,.53,.015,.099,.39,.28,SLATE)
    return m


def abbey(Mesh):
    m=Mesh('Krezk and the abbey · atlas landmark',929)
    ground(m)
    for x,y,z,w,h,d in [(-.36,.13,-.29,1.49,.52,1.26),(-.37,.44,-.30,1.06,.39,.87),
                         (-.35,.74,-.34,.74,.25,.62),(.30,.14,.28,1.15,.17,.89)]:
        m.rock(x,y,z,w,h,d,STONE if y>.1 else DARK,7)
    house(m,-.35,.93,-.33,.68,.57,.46,SLATE,LIMESTONE)
    tower(m,-.42,.94,-.08,.144,.62,.32,LIMESTONE)
    for x,z,h in [(.20,.38,.31),(.65,.29,.37),(.48,-.06,.32)]:
        house(m,x,.28,z,.29,.30,h)
    for i in range(6):
        m.block((.58-i*.142,.284+i*.099,.50-i*.082),(.222,.078,.134),LIMESTONE,-.48)
    pine(m,-.70,.23,.44,.51)
    return m


def camp(Mesh):
    m=Mesh('Tser Pool · atlas landmark',937)
    ground(m,MOSS)
    m.rock(-.46,.154,-.10,1.18,.065,1.31,STONE,9)
    m.taper((-.46,.212,-.10),(-.46,.228,-.10),.515,.525,11,WATER)
    for z, w in [(-.37,.29),(-.12,.48),(.14,.37)]:
        m.block((-.46,.23,z),(w,.006,.014),RIPPLE,-.30)
    for x,z,roof in [(.25,-.32,RED),(.57,.05,'#527467'),(.30,.48,'#9c6d51')]:
        gable(m,x,.205,z,.41,.38,.32,roof)
        m.block((x,.273,z+.184),(.090,.135,.023),DARK)
        m.taper((x,.198,z+.202),(x,.525,z+.202),.015,.010,5,EDGE)
    for a in range(6):
        theta=a*math.tau/6
        m.rock(.04+math.cos(theta)*.11,.183,.25+math.sin(theta)*.11,.081,.059,.085,STONE,5)
    m.taper((.04,.193,.25),(.07,.426,.25),.084,.011,7,'#e19c54')
    pine(m,.46,.16,-.58,.52)
    return m


def coffin(Mesh):
    m=Mesh('The Iron Coffin · atlas landmark',947)
    ground(m,'#3e403c')
    m.rock(-.04,.14,.06,1.92,.10,1.15,DARK,9)
    m.rock(.21,.20,-.11,1.42,.38,.79,'#53585b',8)
    m.block((.20,.443,-.06),(1.11,.24,.57),'#616b6c',-.19)
    m.block((.39,.585,-.027),(.58,.083,.47),'#939185',-.19)
    for x in [-.24,.08,.41,.65]:
        m.block((x,.457,.239+(x-.21)*.19),(.036,.179,.057),'#303d43')
    m.block((.67,.495,.231),(.114,.056,.039),'#9fc5a7',-.19)
    m.block((-.35,.231,.262),(.336,.062,.23),'#4c595b',-.52)
    m.block((.67,.224,-.37),(.29,.074,.135),'#5e6262',.74)
    for x,z,h in [(-.69,.39,.43),(-.75,-.43,.54),(.68,-.48,.43),(-.28,-.55,.37)]:
        m.taper((x,.177,z),(x+.041,.177+h,z+.025),.035,.012,5,'#413732')
        m.taper((x,.25+h*.40,z),(x-.125,.25+h*.73,z+.043),.020,.005,5,'#4e4037')
    for x,z,w in [(-.54,.25,.24),(-.36,.40,.28),(.68,.43,.22),(.66,-.37,.28)]:
        m.rock(x,.14,z,w,.096,.13,DARK,6)
    return m



def boulder_rim(m, colour=WATER):
    ground(m,EARTH)
    m.taper((0,.130,0),(0,.213,0),.89,.85,11,colour)


def boat(m,x,y,z):
    m.rock(x,y,z,.39,.075,.20,TIMBER,7)
    m.block((x,y+.072,z),(.049,.021,.142),EDGE)
    m.block((x+.017,y+.082,z+.033),(.047,.016,.34),EDGE,-.58)


def mists(Mesh):
    m=Mesh('The Mist Wall · atlas landmark',953)
    ground(m,'#555b56')
    for i,(x,y,z,w,h,d) in enumerate([
        (-.59,.38,-.32,.88,.42,.66),(-.23,.57,-.41,.98,.48,.63),
        (.21,.50,-.41,1.03,.55,.62),(.59,.36,-.27,.82,.37,.58),
        (.05,.31,-.03,1.83,.28,.60),(-.30,.232,.19,1.51,.141,.43),
        (.19,.226,.33,1.55,.115,.31),
    ]):
        colour=['#929c9f','#a4aaa8','#b1b6ae'][i%3]
        levels=[-.92,-.55,0,.56,.92]
        rings=[]
        for level in levels:
            r=math.sqrt(1-level*level)
            rings.append([(x+w*.5*r*math.cos(a*math.tau/9),y+h*.5*level,
                           z+d*.5*r*math.sin(a*math.tau/9)) for a in range(9)])
        m.face(rings[0],colour,(0,-1,0))
        m.face(rings[-1],colour,(0,1,0))
        for low,high in zip(rings,rings[1:]):
            for j in range(9):
                k=(j+1)%9
                a=(j+.5)*math.tau/9
                m.face([low[j],low[k],high[k],high[j]],colour,(math.cos(a),0,math.sin(a)))
    m.block((.02,.185,.54),(.31,.052,.55),'#787666',.17)
    for x in [-.067,.110]:
        m.block((x,.215,.51),(.022,.009,.46),'#aba088',.17)
    m.taper((.40,.17,.56),(.40,.54,.56),.021,.017,5,TIMBER)
    m.block((.40,.482,.56),(.075,.105,.073),AMBER)
    m.taper((.40,.53,.56),(.40,.58,.56),.057,.009,5,DARK)
    return m


def gates(Mesh):
    m=Mesh('The Gates of Barovia · atlas landmark',959)
    ground(m,DARK)
    m.block((0,.195,.19),(1.76,.066,.76),STONE)
    for side in [-1,1]:
        x=side*.62
        m.block((x,.24,0),(.52,.16,.54),DARK)
        for i in range(5):
            m.block((x,.389+i*.15,0),(.37,.142,.40),LIMESTONE if i%2 else STONE)
        m.block((x,1.083,0),(.45,.13,.44),DARK)
        m.block((x,1.181,0),(.31,.088,.32),LIMESTONE)
        m.taper((x,1.215,0),(x,1.70,0),.114,.098,7,STONE)
        m.block((x,1.572,.058),(.294,.13,.14),LIMESTONE)
        m.block((x+side*.125,1.46,.137),(.079,.28,.084),STONE)
        m.block((x,1.735,-.015),(.10,.079,.105),DARK)
    for i in range(7):
        x=(i-3)*.112
        y=1.10-abs(x)*.42
        m.block((x,.26+(y-.26)/2,.047),(.046,y-.26,.044),DARK)
        m.taper((x,y-.01,.047),(x,y+.09,.047),.042,.004,5,STONE)
    for y in [.47,.83]:
        m.block((0,y,.071),(.816,.073,.067),DARK)
    m.block((0,.62,.114),(.10,.123,.039),AMBER)
    return m


def village(Mesh):
    m=Mesh('Village of Barovia · atlas landmark',967)
    ground(m,'#57574c')
    m.rock(-.46,.14,-.35,1.04,.22,.87,EARTH,8)
    m.block((.019,.197,.18),(.24,.029,1.19),'#83735e',-.16)
    for x,z,w,d,h,roof in [(-.52,.41,.37,.33,.31,SLATE),(.45,.44,.46,.31,.34,RED),
                            (.61,-.36,.31,.34,.39,SLATE),(.32,-.12,.26,.27,.54,RED)]:
        house(m,x,.19,z,w,d,h,roof)
    house(m,-.43,.34,-.35,.52,.46,.41,SLATE,LIMESTONE)
    tower(m,-.47,.63,-.13,.112,.32,.36,STONE)
    m.block((.49,.41,.618),(.133,.123,.024),AMBER)
    for x,z in [(-.71,.15),(.54,-.62),(.77,.13)]:
        pine(m,x,.17,z,.37)
    return m


def crossroads(Mesh):
    m=Mesh('The Gallows Crossroads · atlas landmark',971)
    ground(m,'#635d50')
    m.block((0,.185,.05),(.32,.044,1.44),'#a08a6e',-.54)
    m.block((.25,.185,.23),(.26,.046,1.05),'#98886c',.94)
    m.block((-.30,.235,-.19),(.75,.13,.52),TIMBER)
    m.block((-.56,.62,-.30),(.095,.77,.103),TIMBER)
    m.block((-.28,1.05,-.30),(.69,.12,.108),EDGE)
    m.taper((-.56,.73,-.30),(-.31,1.01,-.30),.032,.034,5,TIMBER)
    m.taper((-.10,1.01,-.30),(-.10,.733,-.30),.012,.012,5,'#b99e74')
    for i in range(8):
        a=i*math.tau/8
        b=(i+1)*math.tau/8
        m.taper((-.10+.049*math.cos(a),.686+.063*math.sin(a),-.30),
                (-.10+.049*math.cos(b),.686+.063*math.sin(b),-.30),.012,.012,4,'#b99e74')
    m.taper((.60,.17,.28),(.60,.58,.28),.032,.024,5,TIMBER)
    m.block((.60,.50,.31),(.27,.081,.060),EDGE,.20)
    for x,z,w in [(-.54,.49,.18),(.47,-.55,.21),(-.64,-.45,.20)]:
        m.rock(x,.156,z,w,.096,w*.84,STONE,5)
    return m


def lake(Mesh):
    m=Mesh('Lake Zarovich · atlas landmark',977)
    boulder_rim(m)
    for x,z,w in [(-.35,-.28,.44),(.29,-.12,.39),(-.32,.26,.27),(.19,.44,.51)]:
        m.block((x,.219,z),(w,.008,.020),RIPPLE,-.23)
    for i in range(7):
        m.block((.38,.243,.27+i*.080),(.252,.052,.070),EDGE)
    for x in [.272,.485]:
        for z in [.23,.77]:
            m.taper((x,.153,z),(x,.342,z),.028,.023,5,TIMBER)
    boat(m,-.32,.224,.10)
    pine(m,-.73,.151,.39,.45)
    return m


def ruin(Mesh):
    m=Mesh('Argynvostholt · atlas landmark',983)
    ground(m,DARK)
    m.rock(-.17,.14,-.08,1.77,.28,1.34,STONE,8)
    m.block((-.08,.433,-.11),(1.28,.13,.85),LIMESTONE)
    for x,z,w,d,h in [(-.61,-.09,.20,.94,.76),(.49,-.35,.21,.52,.41),
                      (-.14,-.47,.80,.19,.70),(.38,.17,.33,.18,.44)]:
        m.block((x,.49+h/2,z),(w,h,d),STONE)
        for i in range(3):
            m.block((x+(i-1)*w*.29,.51+h+(i%2)*.065,z),(.21*w,.138,d*.89),LIMESTONE)
    m.block((-.51,1.12,-.40),(.31,.71,.32),DARK)
    for i in range(4):
        m.block((-.632+i*.079,1.465,-.405),(.043,.089+(i%2)*.027,.276),LIMESTONE)
    m.block((-.51,1.27,-.226),(.079,.123,.035),DARK)
    for x,z,w in [(-.40,.30,.32),(-.17,.22,.28),(.19,.32,.35),(.43,.44,.28)]:
        m.rock(x,.31,z,w,.14,w*.8,STONE,6)
    return m


def berez(Mesh):
    m=Mesh('Berez · atlas landmark',991)
    ground(m,MOSS)
    m.rock(-.15,.14,.08,1.58,.069,1.40,WATER,10)
    for x,z,h in [(-.49,-.12,.40),(.44,.31,.22),(.35,-.47,.25)]:
        for xx in [-.135,.135]:
            for zz in [-.112,.112]:
                m.taper((x+xx,.161,z+zz),(x+xx,.32,z+zz),.022,.022,5,TIMBER)
        house(m,x,.30,z,.35,.32,h,EDGE,TIMBER)
    for i in range(6):
        x=-.67+i*.14
        m.block((x,.246,.32-i*.025),(.121,.035,.184),TIMBER,-.12)
    for x,z in [(-.69,.48),(-.51,.47),(-.22,.52),(.24,.67),(.69,-.24)]:
        for i in range(3):
            m.taper((x+i*.037,.184,z),(x+i*.028,.33+i*.016,z-.031),.016,.005,4,MOSS)
    return m


def winery(Mesh):
    m=Mesh('The Wizard of Wines · atlas landmark',997)
    ground(m,'#5e5b47')
    m.rock(.04,.14,-.03,1.79,.16,1.41,MOSS,9)
    house(m,.04,.28,-.48,.88,.49,.41,RED,LIMESTONE)
    house(m,.62,.25,-.19,.39,.44,.31,SLATE)
    for row,z in enumerate([-.13,.12,.37,.62]):
        length=1.38-.095*row
        m.block((-.06,.24,z),(length,.077,.135),'#725948',-.075)
        for i in range(6):
            x=-length*.44+i*length*.176
            m.rock(x-.057,.26,z+.047*(i%2),.173,.107,.12,MOSS,5)
            if i%2==0:
                m.rock(x-.054,.276,z+.092,.072,.081,.070,'#71465a',5)
        for x in [-length*.45,length*.42]:
            m.taper((x,.207,z),(x,.439,z),.022,.017,5,TIMBER)
    return m


def yester(Mesh):
    m=Mesh('Yester Hill · atlas landmark',1009)
    ground(m,'#565149')
    m.rock(-.03,.13,-.05,1.78,.29,1.46,EARTH,9)
    for i in range(9):
        a=i*math.tau/9
        x,z=math.cos(a)*.68,math.sin(a)*.53
        m.rock(x,.32,z,.158,.202+.084*(i%3),.149,STONE,5)
    m.taper((0,.31,0),(-.075,.81,-.06),.109,.082,7,TIMBER)
    m.taper((-.075,.76,-.06),(.04,1.16,-.05),.078,.057,6,DARK)
    for a,b,c in [
        ((-.035,.71,-.02),(-.33,.96,.04),(-.47,1.32,.10)),
        ((-.01,.89,-.06),(.27,1.14,-.09),(.31,1.36,-.14)),
        ((.03,1.12,-.05),(-.06,1.33,.01),(.01,1.49,.05)),
    ]:
        m.taper(a,b,.057,.036,5,DARK)
        m.taper(b,c,.036,.006,5,DARK)
    m.rock(.07,.39,.087,.143,.17,.134,'#798265',6)
    return m


def lonely_tower(Mesh):
    m=Mesh('The Lonely Tower · atlas landmark',1013)
    boulder_rim(m)
    m.rock(-.16,.17,-.14,1.02,.18,.80,STONE,8)
    tower(m,-.19,.31,-.17,.244,.94,.39,STONE)
    m.block((-.19,.539,.081),(.091,.204,.059),DARK)
    for y in [.74,1.03]:
        m.block((-.19,y,.071),(.061,.089,.032),DARK)
    for i in range(5):
        m.rock(-.12+i*.13,.19,.24+i*.088,.186,.071,.136,STONE,5)
    for x,z,w in [(-.47,.30,.28),(.32,-.30,.40),(.15,.59,.29)]:
        m.block((x,.217,z),(w,.008,.020),RIPPLE,-.23)
    return m


def models(Mesh):
    return {name:make(Mesh) for name,make in [
        ('mists',mists),('gates',gates),('village',village),('crossroads',crossroads),
        ('castle',castle),('coffin',coffin),('tser',camp),('bonegrinder',mill),
        ('vallaki',town),('lake',lake),('argyn',ruin),('berez',berez),
        ('winery',winery),('krezk',abbey),('yester',yester),('tower',lonely_tower),
    ]}


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--builder',type=Path,default=HERE/'build-barovian-props.py')
    args=parser.parse_args()
    if not args.builder.is_file():
        parser.error('Pass --builder with the original mesh helper from Barovia prop set 01.')
    OUT.mkdir(parents=True,exist_ok=True)
    for name,mesh in models(runpy.run_path(str(args.builder))['Mesh']).items():
        path=OUT/f'{name}.glb'
        triangles,bounds=mesh.export(path)
        print(f'{name:15s} {triangles:4d} triangles · {path.stat().st_size:6d} bytes · {bounds}')
