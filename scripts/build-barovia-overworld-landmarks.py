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


def models(Mesh):
    return {name:make(Mesh) for name,make in [
        ('castle',castle),('bonegrinder',mill),('vallaki',town),('krezk',abbey),('tser',camp),('coffin',coffin)
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
