#!/usr/bin/env python3
"""Build Crypts & Curses from the original Barovia mesh helpers."""
import argparse
import math
import runpy
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / 'public/assets/props/barovian-crypts'
STONE, PALE, DARK = '#66656a', '#848184', '#39373d'
IRON, STEEL, BRASS = '#45484e', '#89868b', '#b49156'
WINE, BONE, MOSS = '#792f3c', '#cdbb97', '#676b50'


def extrude(m, points, z0, z1, colour):
    front = [(x, y, z1) for x, y in points]
    back = [(x, y, z0) for x, y in points]
    cx, cy = (sum(row) / len(points) for row in zip(*points))
    m.face(front, colour, (0, 0, 1))
    m.face(back, colour, (0, 0, -1))
    for i, (x, y) in enumerate(points):
        j = (i + 1) % len(points)
        ax, ay = points[j]
        m.face([back[i], back[j], front[j], front[i]], colour, ((x + ax)/2 - cx, (y + ay)/2 - cy, 0))


def arch(m, half, spring, apex, depth):
    """A pointed arch with a genuinely empty centre and visible stone joints."""
    inside = [(-half, spring), (-half*.86, spring+(apex-spring)*.31),
              (-half*.52, spring+(apex-spring)*.66), (0, apex),
              (half*.52, spring+(apex-spring)*.66), (half*.86, spring+(apex-spring)*.31), (half, spring)]
    t = .20 if half > .5 else .10
    outside = [(x + t*x/half, y + t*(.45 + .55*(1-abs(x)/half))) for x,y in inside]
    for i in range(len(inside)-1):
        a, b = inside[i], inside[i+1]
        c, d = outside[i+1], outside[i]
        # Shorten each stone at its joins, exposing the darker stone core.
        mix = lambda p,q,k: tuple(v+(w-v)*k for v,w in zip(p,q))
        core = [mix(a,d,.04), mix(b,c,.04), mix(c,b,.04), mix(d,a,.04)]
        extrude(m, core, -depth, depth*.79, DARK)
        extrude(m, [mix(a,b,.028), mix(a,b,.972), mix(d,c,.972), mix(d,c,.028)],
                -depth*.80, depth, [STONE,PALE,'#75737b'][i%3])


def gate(Mesh, raised):
    m = Mesh('Crypt gate · ' + ('raised' if raised else 'shut'), 303)
    for side in [-1,1]:
        x = side*.78
        m.block((x,.085,0),(.35,.17,.65),DARK)
        m.block((x,.19,0),(.31,.075,.56),PALE)
        for i in range(4):
            y = .35+i*.205
            m.block((x,y,0),(.255,.193,.49),[STONE,'#76737a',STONE,PALE][i])
        m.block((x,1.092,0),(.31,.085,.54),PALE)
        m.block((x-side*.081,.63,.259),(.039,.64,.022),'#a09a91')
    arch(m,.646,1.075,1.69,.265)
    extrude(m,[(-.105,1.663),(.105,1.663),(.135,1.793),(0,1.914),(-.135,1.793)],
            -.22,.284,'#8b8583')
    for i in range(7):
        x = (i-3)*.178
        top = 1.59-abs(x)*.83
        length = .16 if raised else top-.20
        low = top-length
        m.block((x,low+length/2,-.02),(.054,length,.063),IRON)
        extrude(m,[(x-.027,low),(x+.027,low),(x,low-.059)],-.05,.012,STEEL)
    if raised:
        m.block((0,1.35,-.025),(.70,.052,.095),IRON)
    else:
        for y in [.43,.96]:
            m.block((0,y,-.006),(1.12,.075,.082),STEEL)
            for x in [-.43,0,.43]:
                m.taper((x,y,.039),(x,y,.053),.023,.02,5,IRON)
        m.block((0,.77,.065),(.18,.24,.053),DARK)
        m.block((0,.77,.095),(.105,.14,.012),BRASS)
        m.block((0,.752,.104),(.028,.061,.010),DARK)
    return m


def niche(Mesh):
    m = Mesh('Ossuary wall niche', 315)
    m.block((0,.07,0),(.93,.14,.67),DARK)
    m.block((0,.66,-.19),(.77,1.11,.19),'#28272c')
    for x in [-.386,.386]:
        for i in range(3):
            m.block((x,.29+i*.215,0),(.17,.205,.56),[STONE,PALE,STONE][i])
    arch(m,.303,.80,1.185,.28)
    for y in [.20,.53]:
        m.block((0,y,.075),(.67,.087,.49),PALE)
    for x,y,z in [(-.19,.25,.19),(.17,.25,.16),(-.06,.578,.175)]:
        m.rock(x,y+.027,z,.20,.164,.184,BONE,7)
        m.block((x,y+.030,z+.046),(.123,.060,.117),'#b8a785')
        for offset in [-.043,.043]:
            m.rock(x+offset,y+.087,z+.081,.053,.045,.027,'#403a36',5)
        m.block((x,y+.037,z+.108),(.081,.014,.011),'#5a5143')
    m.taper((.04,.567,.22),(.218,.567,.129),.022,.022,6,'#af9c77')
    m.rock(.37,.13,.26,.139,.047,.093,MOSS,5)
    return m


def altar(Mesh):
    m = Mesh('Crimson votive altar', 327)
    m.block((0,.052,0),(1.73,.104,.86),DARK)
    m.block((0,.139,0),(1.61,.071,.77),STONE)
    for x in [-.55,.55]:
        m.block((x,.371,0),(.26,.42,.55),STONE)
        m.block((x,.239,0),(.32,.086,.62),PALE)
        m.block((x,.513,0),(.32,.084,.62),PALE)
    m.block((0,.582,0),(1.69,.102,.82),STONE)
    m.block((0,.651,0),(1.78,.061,.87),PALE)
    m.block((0,.686,-.026),(.467,.018,.82),WINE)
    extrude(m,[(-.235,.675),(.235,.675),(.235,.455),(0,.367),(-.235,.455)],.402,.442,WINE)
    m.block((0,.632,.449),(.26,.024,.014),BRASS)
    for x,z,h in [(-.66,.28,.15),(-.51,.28,.108),(.57,.24,.19),(.70,.12,.14)]:
        m.taper((x,.683,z),(x,.69+h,z),.035,.030,6,BONE)
        m.taper((x,.69+h,z),(x,.715+h,z),.012,.005,5,IRON)
    m.block((0,.718,-.15),(.28,.045,.243),'#6a503c',-.09)
    m.block((0,.749,-.15),(.235,.024,.209),BONE,-.09)
    return m


def rune(Mesh):
    m = Mesh('Verdigris rune plinth', 342)
    for y0,y1,r0,r1,c in [(0,.103,.403,.374,DARK),(.103,.183,.33,.29,PALE),
                           (.183,.70,.24,.198,STONE),(.70,.77,.27,.32,PALE),(.77,.815,.32,.32,IRON)]:
        m.taper((0,y0,0),(0,y1,0),r0,r1,8,c)
    for i in range(8):
        a=i*math.tau/8
        x,z=.232*math.cos(a),.232*math.sin(a)
        m.taper((x,.252,z),(x*.87,.644,z*.87),.020,.012,5,'#82936f')
    m.taper((0,.815,0),(0,.836,0),.257,.257,8,'#9aa17a')
    for i in range(8):
        a=i*math.tau/8
        x,z=.23*math.cos(a),.23*math.sin(a)
        m.taper((x,.838,z),(x,.856,z),.018,.018,5,BRASS)
    m.taper((0,.836,0),(0,.895,0),.074,.114,6,'#526d63')
    m.taper((0,.895,0),(.012,1.119,.017),.114,.018,6,'#8ac7a7')
    return m


def brazier(Mesh):
    m = Mesh('Ember brazier', 353)
    m.taper((0,0,0),(0,.083,0),.34,.30,8,STONE)
    for i in range(3):
        a=i*math.tau/3
        x,z=.256*math.cos(a),.256*math.sin(a)
        m.taper((x,.074,z),(x*.52,.37,z*.52),.037,.031,5,IRON)
        m.taper((x*.52,.37,z*.52),(x*.96,.52,z*.96),.029,.036,5,IRON)
    m.taper((0,.411,0),(0,.54,0),.17,.35,9,IRON)
    m.taper((0,.537,0),(0,.563,0),.356,.356,9,STEEL)
    m.taper((0,.562,0),(0,.567,0),.312,.312,9,'#27252a')
    for i,(x,z) in enumerate([(-.15,.08),(.05,-.13),(.14,.08),(-.05,.03),(-.10,-.12),(.02,.16)]):
        m.rock(x,.566,z,.16,.091,.14,['#ab4f30','#d36a38','#8d412c'][i%3],5)
    return m


def spike_trap(Mesh, sprung):
    m = Mesh('Spike grate · ' + ('sprung' if sprung else 'retracted'), 371)
    m.block((0,.043,0),(.97,.086,.97),STONE)
    m.block((0,.094,0),(.84,.025,.84),IRON)
    for x in [-.384,.384]:
        m.block((x,.109,0),(.067,.029,.842),STEEL)
    for z in [-.385,.385]:
        m.block((0,.109,z),(.825,.028,.063),STEEL)
    for x in [-.215,0,.215]:
        for z in [-.214,0,.214]:
            m.taper((x,.107,z),(x,.124,z),.071,.065,6,DARK)
            if sprung:
                m.taper((x,.123,z),(x+.01,.335+(abs(x)+abs(z))*.22,z),.046,.006,4,STEEL)
    for x in [-.35,.35]:
        for z in [-.351,.351]:
            m.taper((x,.124,z),(x,.141,z),.022,.019,5,BRASS)
    return m


def models(builder):
    Mesh = builder['Mesh']
    return {
        'crypt-gate-shut': gate(Mesh, False), 'crypt-gate-raised': gate(Mesh, True),
        'ossuary-niche': niche(Mesh), 'votive-altar': altar(Mesh), 'rune-plinth': rune(Mesh),
        'ember-brazier': brazier(Mesh), 'spike-grate-retracted': spike_trap(Mesh, False),
        'spike-grate-sprung': spike_trap(Mesh, True),
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--builder', type=Path, default=HERE / 'build-barovian-props.py')
    args = parser.parse_args()
    if not args.builder.is_file():
        parser.error('Use the original Barovia mesh builder from prop set 01 to regenerate these GLBs.')
    OUT.mkdir(parents=True, exist_ok=True)
    for name, mesh in models(runpy.run_path(str(args.builder))).items():
        path = OUT / (name + '.glb')
        triangles, bounds = mesh.export(path)
        print(f'{name:23s} {triangles:4d} triangles · {path.stat().st_size:6d} bytes · {bounds}')
