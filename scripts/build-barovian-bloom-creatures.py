#!/usr/bin/env python3
"""Sculpt the Flood Edition Bloom minis and export self-contained GLBs."""
import argparse
import math
import runpy
from pathlib import Path

from barovian_bloom_motion import add_bloom_motion

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / 'public/assets/creatures/barovian-bloom'
MOSS, SHELL, LICHEN = '#607250', '#354438', '#83936a'
PLUM, MAUVE, FLESH = '#542d43', '#89495e', '#b86d78'
BONE, IVORY, VOID = '#c8b48d', '#e2d2a3', '#201c24'
SAC, VEIN, EYE = '#c19b64', '#685041', '#c8d881'
IRON, CLOTH, FUR = '#515557', '#47444e', '#666260'


def tube(m, points, radii, colour, sides=5):
    for a, b, ra, rb in zip(points, points[1:], radii, radii[1:]):
        m.taper(a, b, ra, rb, sides, colour)


def orb(m, centre, scale, colours, sides=10):
    """Faceted oval with flat polar caps."""
    x, y, z = centre
    rx, ry, rz = scale
    bands = [-.98, -.79, -.43, .04, .52, .84, .98]
    rings = []
    for height in bands:
        r = math.sqrt(1-height*height)
        rings.append([(x+rx*r*math.cos(i*math.tau/sides), y+ry*height,
                       z+rz*r*math.sin(i*math.tau/sides)) for i in range(sides)])
    m.face(rings[0], colours[0], (0, -1, 0))
    m.face(rings[-1], colours[-1], (0, 1, 0))
    for k, (lower, upper) in enumerate(zip(rings, rings[1:])):
        for i in range(sides):
            j = (i+1) % sides
            a = (i+.5)*math.tau/sides
            m.face([lower[i], lower[j], upper[j], upper[i]], colours[min(k, len(colours)-1)],
                   (math.cos(a), 0, math.sin(a)))


def maw(m, centre, width, height, count):
    """A forward-facing dark aperture with a collar of angled teeth."""
    x, y, z = centre
    for i in range(count):
        a = i*math.tau/count
        c, s = math.cos(a), math.sin(a)
        rim = (x+c*width, y+s*height, z)
        m.rock(*rim, .095, .070, .094, MAUVE if i % 2 else PLUM, 5)
        root = (rim[0], rim[1]+.035, z+.034)
        tip = (x+c*width*.62, y+s*height*.62+.015, z+.072+(i%2)*.019)
        m.taper(root, tip, .019 if count < 10 else .024, .003, 4, IVORY)
    points = [(x+width*1.04*math.cos(i*math.tau/count),
               y+.028+height*1.04*math.sin(i*math.tau/count), z+.021) for i in range(count)]
    m.face(points, VOID, (0, 0, 1))


def pod(m, centre, radius, colour=SAC):
    x, y, z = centre
    m.rock(x, y, z, radius*2, radius*1.73, radius*1.9, colour, 5)


def feet(m, x, z, w, d, colour):
    m.rock(x, 0, z, w, .116, d, colour, 6)


def sporeling(Mesh):
    m = Mesh('Sporeling', 601)
    orb(m, (0, .282, -.06), (.267, .212, .30),
        [PLUM, SHELL, MOSS, LICHEN, MOSS, LICHEN], 10)
    for side in [-1, 1]:
        for i, z in enumerate([-.234, -.059, .138]):
            x = side*(.39-.021*(i%2))
            foot_z = z+(.10 if i == 2 else -.085 if i == 0 else .015)
            tube(m, [(side*.15, .245, z), (side*.31, .26+i*.017, z-.027),
                     (x, .101, foot_z), (x*.94, .032, foot_z+.046)],
                 [.058, .050, .037, .012], SHELL if i == 1 else MOSS)
            feet(m, x*.94, foot_z+.032, .085, .107, SHELL)
        m.taper((side*.179, .37, .103), (side*.147, .49, .172), .045, .008, 5, LICHEN)
        pod(m, (side*.113, .412, -.124), .053, FLESH)
    maw(m, (0, .224, .203), .179, .106, 9)
    return m


def vessel(Mesh):
    m = Mesh('Bloom Vessel', 617)
    for x, z, knee in [(-.125, .06, -.13), (.13, -.08, .145)]:
        feet(m, x, z+.037, .162, .236, IRON)
        tube(m, [(x, .085, z), (knee, .355, z+.012), (x*.71, .66, -.06)],
             [.070, .09, .102], SHELL, 6)
        m.rock(knee, .278, z+.061, .155, .158, .131, IRON, 5)
    orb(m, (0, .875, -.054), (.268, .267, .156),
        [CLOTH, PLUM, SHELL, MOSS, LICHEN, MOSS], 9)
    for i in range(4):
        x = -.161 + i*.11
        m.block((x, .665+(i%2)*.026, -.01), (.10, .237-i*.015, .285),
                CLOTH if i % 2 else '#61606b', yaw=.06*(i-1))
    for i in range(3):
        y = .783+i*.103
        tube(m, [(-.20, y+.031, .04), (-.10, y, .105), (.03, y+.012, .115)],
             [.035, .030, .014], IRON)
    m.rock(.196, .982, -.052, .223, .16, .239, MOSS, 6)
    tube(m, [(.192, 1.05, -.039), (.302, .872, -.01), (.35, .690, .12)],
         [.112, .075, .054], PLUM, 6)
    for i in range(4):
        tube(m, [(.341+i*.026, .66+i*.055, .121), (.428+i*.017, .65+i*.065, .167),
                 (.480+i*.025, .52+i*.043, .227)],
             [.045, .035, .003], BONE)
    tube(m, [(.291, .81, .094), (.379, .682, .150), (.493, .537, .254)],
         [.061, .062, .005], IVORY, 5)
    tube(m, [(-.186, 1.026, -.042), (-.280, .814, .013), (-.259, .671, .124)],
         [.089, .056, .042], MOSS)
    for i in range(3):
        m.taper((-.30+i*.033, .676, .124), (-.321+i*.029, .563, .193), .018, .004, 5, BONE)
    tube(m, [(0, 1.048, -.06), (-.081, 1.214, .045)], [.086, .070], SHELL)
    orb(m, (-.071, 1.252, .044), (.132, .154, .133),
        [PLUM, MAUVE, MOSS, LICHEN, MOSS, SHELL], 8)
    maw(m, (-.068, 1.160, .142), .077, .050, 7)
    for x, y, r in [(-.119, 1.288, .034), (-.036, 1.306, .041), (.022, 1.263, .028)]:
        pod(m, (x, y, .155), r, EYE)
    return m


def hulk(Mesh):
    m = Mesh('Carrier Hulk', 631)
    for side in [-1, 1]:
        x = side*.29
        feet(m, x, .069, .30, .31, SHELL)
        tube(m, [(x, .08, .026), (side*.304, .284, -.036), (side*.237, .619, -.109)],
             [.127, .153, .178], MOSS, 7)
        m.rock(x, .189, .04, .243, .216, .20, LICHEN, 6)
        tube(m, [(side*.32, 1.03, -.188), (side*.502, .76, -.113), (side*.53, .478, .122)],
             [.132, .116, .106], SHELL, 7)
        m.rock(side*.52, .358, .144, .222, .204, .241, MOSS, 6)
        for i in range(3):
            m.taper((side*(.443+i*.068), .437, .193),
                    (side*(.46+i*.066), .344+i*.016, .281), .027, .006, 5, BONE)
    orb(m, (0, .848, -.203), (.419, .454, .309),
        [PLUM, SHELL, MOSS, SHELL, LICHEN, MOSS], 10)
    orb(m, (0, .728, .129), (.358, .373, .287),
        [PLUM, MAUVE, FLESH, SAC, '#d0ad76', SAC], 12)
    for side in [-1, 1]:
        for i in range(3):
            y = .54+i*.149
            tube(m, [(side*.37, y+.066, -.055), (side*.331, y, .245),
                     (side*(.243-i*.018), y+.012, .358)],
                 [.062, .046, .010], BONE)
        for i in range(2):
            pod(m, (side*(.28-i*.076), .984+i*.129, -.045-i*.19), .094+i*.019, FLESH)
        tube(m, [(side*.09, .494, .322), (side*.138, .652, .380), (side*.155, .778, .390),
                 (side*.116, .907, .339)], [.021, .019, .016, .008], VEIN)
    maw(m, (0, .59, .358), .121, .074, 8)
    for x, y, z in [(-.173, .907, -.401), (.026, 1.129, -.296), (.183, .987, -.375)]:
        m.rock(x, y, z, .23, .197, .25, LICHEN, 5)
    return m


def cyst_node(Mesh):
    m = Mesh('Cyst Node', 643)
    m.rock(0, 0, 0, .79, .168, .76, SHELL, 9)
    orb(m, (0, .46, -.03), (.29, .36, .273),
        [PLUM, MAUVE, FLESH, SAC, '#cba976', LICHEN], 12)
    for i in range(7):
        a = i*math.tau/7
        c, s = math.cos(a), math.sin(a)
        tube(m, [(c*.14, .27, s*.13), (c*.29, .155, s*.26),
                 (c*.429, .092, s*.389), (c*.491, .033, s*.464)],
             [.075, .064, .037, .005], MOSS if i % 2 else PLUM)
        tube(m, [(c*.246, .265, s*.207-.02), (c*.290, .413, s*.279-.03),
                 (c*.27, .58, s*.25-.03), (c*.21, .702, s*.18-.03)],
             [.019, .019, .014, .007], VEIN if i % 2 else MAUVE, 4)
    for x, y, z, r in [(-.237, .16, .18, .103), (.213, .12, .20, .094), (-.18, .18, -.23, .075)]:
        pod(m, (x, y, z), r, FLESH)
    m.rock(.015, .698, -.039, .251, .144, .225, LICHEN, 7)
    for i in range(5):
        a = i*math.tau/5
        c, s = math.cos(a), math.sin(a)
        m.taper((c*.101, .777, -.039+s*.101), (c*.066, .909, -.039+s*.066), .028, .004, 5, BONE)
    return m


def stalker(Mesh):
    m = Mesh('Bloom Stalker', 659)
    for side in [-1, 1]:
        x = side*.198
        feet(m, x, -.247, .117, .190, SHELL)
        tube(m, [(x, .067, -.243), (side*.265, .365, -.351), (side*.177, .543, -.24),
                 (side*.114, .605, -.12)],
             [.046, .064, .082, .081], SHELL, 6)
        for i in range(3):
            m.taper((x+(i-1)*.033, .062, -.18), (x+(i-1)*.036, .032, -.104), .018, .004, 5, BONE)
    orb(m, (0, .637, -.105), (.184, .172, .291),
        [PLUM, MOSS, SHELL, LICHEN, MOSS, LICHEN], 9)
    tube(m, [(0, .641, -.164), (0, .739, .088), (0, .779, .24)], [.114, .154, .084], MOSS, 7)
    orb(m, (0, .795, .24), (.115, .088, .15),
        [PLUM, SHELL, MOSS, LICHEN, MOSS, SHELL], 8)
    m.rock(0, .747, .372, .159, .078, .07, VOID, 5)
    for side in [-1, 1]:
        spread = .425 if side < 0 else .477
        end_y = .183 if side < 0 else .249
        tube(m, [(side*.108, .738, .092), (side*.322, .814, .143),
                 (side*spread, .452, .28), (side*.352, end_y, .376)],
             [.091, .071, .054, .039], PLUM, 6)
        tube(m, [(side*.369, end_y+.040, .347), (side*.323, end_y-.018, .438),
                 (side*.229, end_y-.040, .460), (side*.181, end_y+.021, .411)],
             [.048, .045, .029, .004], BONE, 5)
        for i in range(3):
            z = -.221+i*.125
            m.taper((side*.096, .745+i*.018, z), (side*.18, .871+i*.01, z-.031),
                    .042, .007, 5, MOSS)
        pod(m, (side*.149, .646, -.064), .060, FLESH)
    return m


def wolf(Mesh):
    m = Mesh('Bloomed Wolf', 673)
    orb(m, (0, .477, -.128), (.195, .191, .342),
        [PLUM, FUR, '#7f7774', SHELL, MOSS, LICHEN], 10)
    for side in [-1, 1]:
        for hind in [False, True]:
            z = -.322 if hind else .124
            hip = (side*(.126 if hind else .140), .454, z)
            hock = (side*.165, .216, z+(.116 if hind else -.04))
            toe = (side*.172, .075, z+(-.023 if hind else .061))
            tube(m, [hip, hock, toe], [.089, .055, .034], FUR, 6)
            feet(m, toe[0], toe[2]+.015, .108, .15, SHELL)
        for i in range(3):
            pod(m, (side*(.145+i*.015), .263+(i%2)*.036, -.205+i*.147), .059, FLESH)
    tube(m, [(0, .452, -.402), (-.048, .37, -.536), (-.118, .276, -.630)],
         [.062, .041, .006], SHELL, 6)
    tube(m, [(0, .507, .076), (0, .609, .247)], [.164, .144], SHELL, 7)
    orb(m, (0, .622, .279), (.135, .123, .143), [PLUM, FUR, FUR, MOSS, SHELL, MOSS], 8)
    m.taper((0, .616, .352), (0, .574, .515), .092, .065, 7, FUR)
    m.rock(0, .548, .519, .141, .057, .093, VOID, 6)
    m.taper((0, .544, .336), (0, .485, .498), .071, .050, 6, PLUM)
    for side in [-1, 1]:
        m.taper((side*.085, .674, .234), (side*.125, .821, .202), .051, .006, 4, FUR)
        pod(m, (side*.102, .646, .370), .032, EYE)
        for i in range(3):
            m.taper((side*(.065-i*.009), .569-i*.008, .403+i*.044),
                    (side*(.068-i*.01), .509-i*.005, .410+i*.043), .019, .003, 4, IVORY)
    tube(m, [(0, .583, -.357), (0, .636, -.181), (0, .635, .017), (0, .616, .120)],
         [.047, .065, .052, .016], PLUM, 6)
    for i in range(5):
        z = -.30+i*.091
        for side in [-1, 1]:
            m.taper((side*.047, .605, z), (side*(.111-i*.005), .712+(i%2)*.045, z-.050),
                    .034, .004, 5, BONE if i % 2 else MOSS)
    return m


def creeper(Mesh):
    m = Mesh('Hunger Moss Creeper', 687)
    m.rock(0, .10, -.03, .54, .282, .54, MOSS, 8)
    for i in range(7):
        a = i*math.tau/7
        reach = [.41, .43, .40, .47, .42, .39, .45][i]

        def root(angle, r, y):
            return (math.cos(angle)*r, y, -.02+math.sin(angle)*r)

        ankle = root(a+.34, reach*.87, .065)
        tube(m, [root(a, .18, .214), root(a+.20, reach*.68, .192+(i%3)*.071),
                 ankle, root(a+.59, reach, .030)],
             [.067, .062, .036, .005], MOSS if i%2 else PLUM)
        feet(m, ankle[0], ankle[2], .083, .082, SHELL)
        x, _, z = root(a-.16, .22, 0)
        pod(m, (x, .24, z), .058+(i%3)*.012, LICHEN if i%2 else FLESH)
    # Tilt the tooth ring upward like the original rosette, so it reads from above.
    angle = -.79
    c, s = math.cos(angle), math.sin(angle)
    m.transform = lambda p: (p[0], .34+c*p[1]-s*p[2], .163+s*p[1]+c*p[2])
    maw(m, (0, 0, 0), .197, .141, 10)
    return m


def models(Mesh):
    return {
        'sporeling': sporeling(Mesh),
        'bloom-vessel': vessel(Mesh),
        'carrier-hulk': hulk(Mesh),
        'cyst-node': cyst_node(Mesh),
        'bloom-stalker': stalker(Mesh),
        'bloomed-wolf': wolf(Mesh),
        'hunger-moss-creeper': creeper(Mesh),
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--builder', type=Path, default=HERE / 'build-barovian-props.py')
    args = parser.parse_args()
    if not args.builder.is_file():
        parser.error('Pass --builder with the original mesh helper from Barovia prop set 01.')
    OUT.mkdir(parents=True, exist_ok=True)
    for name, mesh in models(runpy.run_path(str(args.builder))['Mesh']).items():
        path = OUT / f'{name}.glb'
        triangles, bounds = mesh.export(path)
        add_bloom_motion(path, name)
        print(f'{name:18s} {triangles:4d} triangles · {path.stat().st_size:6d} bytes · {bounds}')
