#!/usr/bin/env python3
"""Build Things That Watch with the original Barovia mesh exporter."""
import argparse
import math
import runpy
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / 'public/assets/props/barovian-horror'
ASH, STONE, PALE = '#393c45', '#696c75', '#92948b'
BONE, WAX = '#c6b99d', '#ddd0aa'
BRASS, PATINA, IRON = '#b69656', '#6e887f', '#47494d'
VOID, GLASS, COLD = '#171c29', '#293c4a', '#81aaa5'
PLUM, ROSE = '#582f47', '#b46974'
WOOD, RUST, MOSS = '#554038', '#866354', '#5c7054'


def slab(m, points, z_back, z_front, colour):
    """Extrude a convex profile in the XY plane."""
    front = [(x, y, z_front) for x, y in points]
    back = [(x, y, z_back) for x, y in points]
    cx, cy = (sum(values)/len(values) for values in zip(*points))
    m.face(front, colour, (0, 0, 1))
    m.face(back, colour, (0, 0, -1))
    for i, (x, y) in enumerate(points):
        j = (i+1) % len(points)
        ax, ay = points[j]
        m.face([back[i], back[j], front[j], front[i]], colour, ((x+ax)/2-cx, (y+ay)/2-cy, 0))


def ring_segment(m, start, end, y, height, inside, outside, colour):
    def point(a, level, r):
        return (r*math.cos(a), level, r*math.sin(a))

    lower = [point(start, y, inside), point(start, y, outside),
             point(end, y, outside), point(end, y, inside)]
    upper = [(x, level+height, z) for x, level, z in lower]
    m.face(upper, colour, (0, 1, 0))
    m.face(lower, colour, (0, -1, 0))
    a = (start+end)/2
    outward = (math.cos(a), 0, math.sin(a))
    away = [(math.sin(start), 0, -math.cos(start)), outward,
            (-math.sin(end), 0, math.cos(end)), tuple(-v for v in outward)]
    for i, n in enumerate(away):
        j = (i+1) % 4
        m.face([lower[i], lower[j], upper[j], upper[i]], colour, n)


def mirror(Mesh, reaching):
    m = Mesh('The other side · ' + ('reaching' if reaching else 'still'), 507)
    m.block((0, .066, 0), (.89, .132, .68), ASH)
    m.block((0, .152, 0), (.79, .058, .58), STONE)
    m.block((0, .272, -.05), (.50, .19, .29), WOOD)
    frame = [(-.39, .34), (.39, .34), (.39, 1.34), (.27, 1.55),
             (0, 1.69), (-.27, 1.55), (-.39, 1.34)]
    inset = [(-.30, .433), (.30, .433), (.30, 1.32), (.20, 1.483),
             (0, 1.59), (-.20, 1.483), (-.30, 1.32)]
    glass = [(-.272, .462), (.272, .462), (.272, 1.31), (.18, 1.46),
             (0, 1.56), (-.18, 1.46), (-.272, 1.31)]
    slab(m, frame, -.18, .123, PATINA)
    slab(m, inset, .116, .151, BRASS)
    slab(m, glass, .145, .164, VOID if reaching else GLASS)
    slab(m, [(-.075, 1.612), (0, 1.728), (.075, 1.612), (0, 1.56)], .126, .184, BRASS)
    for x in [-.342, .342]:
        for y in [.465, .88, 1.285]:
            m.taper((x, y, .119), (x, y, .152), .024, .016, 5, BRASS)

    if reaching:
        m.taper((-.071, .790, .155), (-.04, .88, .25), .069, .061, 6, PATINA)
        m.rock(-.026, .84, .274, .158, .18, .105, BONE, 7)
        for base, knuckle, tip in [
            ((-.080, .97, .283), (-.132, 1.105, .326), (-.17, 1.091, .398)),
            ((-.035, .998, .286), (-.048, 1.167, .343), (-.058, 1.147, .416)),
            ((.015, .998, .29), (.037, 1.148, .356), (.050, 1.110, .42)),
            ((.043, .966, .284), (.107, 1.087, .345), (.130, 1.052, .405)),
            ((.034, .885, .29), (.122, .916, .328), (.160, .968, .375)),
        ]:
            m.taper(base, knuckle, .024, .016, 5, BONE)
            m.taper(knuckle, tip, .017, .004, 5, PALE)
        fractures = [
            ((-.08, .98), (-.181, 1.11), (-.225, 1.33)),
            ((.025, 1.00), (.142, 1.17), (.249, 1.198)),
            ((.031, .87), (.14, .74), (.256, .66)),
            ((-.066, .846), (-.156, .73), (-.195, .56)),
        ]
        for path in fractures:
            for a, b in zip(path, path[1:]):
                m.taper((*a, .169), (*b, .169), .008, .004, 3, COLD)
    else:
        m.face([(-.205, .617, .166), (.219, 1.202, .166), (.220, 1.304, .166),
                (-.204, .735, .166)], '#46636a', (0, 0, 1))
        m.face([(-.22, 1.09, .166), (-.11, 1.271, .166), (-.111, 1.316, .166),
                (-.221, 1.138, .166)], '#597579', (0, 0, 1))
    return m


def mourner(Mesh, unveiled):
    m = Mesh('The stone mourner · ' + ('unveiled' if unveiled else 'veiled'), 519)
    m.taper((0, 0, 0), (0, .094, 0), .399, .399, 8, ASH)
    m.taper((0, .092, 0), (0, .158, 0), .358, .31, 8, STONE)
    m.taper((0, .156, 0), (0, .89, -.026), .301, .231, 8, STONE)
    m.taper((0, .889, -.026), (0, 1.215, -.035), .24, .138, 8, STONE)
    for x in [-.18, -.057, .077, .188]:
        m.taper((x*1.15, .165, .19), (x*.70, .818, .194), .041, .023, 5, PALE)
    for side in [-1, 1]:
        m.taper((side*.158, .958, .083), (side*.106, .713, .198), .067, .055, 6, STONE)
        m.taper((side*.106, .713, .198), (0, .813, .222), .056, .045, 6, PALE)
    m.rock(0, 1.164, -.06, .493, .479, .419, ASH, 8)
    hood = [(-.201, 1.195), (.201, 1.195), (.195, 1.438), (.096, 1.598),
            (0, 1.633), (-.124, 1.566), (-.205, 1.438)]
    opening = [(-.132, 1.233), (.124, 1.233), (.145, 1.42), (.078, 1.538),
               (-.015, 1.556), (-.115, 1.475)]
    slab(m, hood, -.047, .144, STONE)
    slab(m, opening, .140, .161, VOID)
    if unveiled:
        m.rock(.007, 1.275, .161, .213, .253, .112, BONE, 7)
        for x in [-.044, .054]:
            m.taper((x, 1.425, .201), (x, 1.425, .235), .039, .027, 6, VOID)
            m.taper((x, 1.424, .235), (x, 1.424, .243), .014, .009, 5, ROSE)
        m.block((.006, 1.333, .223), (.068, .027, .022), VOID)
        m.taper((.062, 1.398, .230), (.074, 1.307, .210), .01, .004, 4, PLUM)
    else:
        veil = [(-.133, 1.215), (.127, 1.226), (.132, 1.47), (.051, 1.563),
                (-.049, 1.553), (-.131, 1.484)]
        slab(m, veil, .158, .187, '#a29a91')
        for x, tip in [(-.084, 1.478), (0, 1.546), (.086, 1.489)]:
            m.taper((x*1.13, 1.249, .188), (x, tip, .188), .021, .012, 5, '#817975')
    return m


def drowned_well(Mesh):
    m = Mesh('The drowned well', 531)
    for row in range(3):
        for i in range(12):
            a = (i+row*.5)*math.tau/12
            ring_segment(m, a+.019, a+math.tau/12-.019, row*.169, .167,
                         .53, [.82, .78, .83][row], [ASH, STONE, PALE][row])
    m.taper((0, .021, 0), (0, .068, 0), .54, .552, 14, VOID)
    m.taper((0, .068, 0), (0, .073, 0), .517, .52, 14, GLASS)
    for radius in [.21, .36]:
        for start, end in [(.25, 1.05), (1.16, 2.28), (2.53, 3.7), (4.21, 5.36)]:
            ring_segment(m, start, end, .074, .003, radius-.018, radius,
                         '#739895' if radius < .25 else '#4f777c')
    for x, z, radius in [(-.35, .62, .14), (.35, -.64, .19), (.64, -.20, .13)]:
        m.rock(x, .45, z, radius, .069, radius*.81, MOSS, 5)
    for a, b in [((-.676, .28, -.24), (-.68, .53, -.24)),
                 ((-.68, .53, -.24), (-.55, .565, -.24)),
                 ((-.55, .565, -.24), (-.397, .512, -.22)),
                 ((-.397, .512, -.22), (-.32, .343, -.18)),
                 ((-.32, .343, -.18), (-.28, .118, -.13))]:
        m.taper(a, b, .026, .025, 6, BRASS)
    return m


def gibbet(Mesh):
    m = Mesh('The empty gibbet', 543)
    m.block((-.47, .072, 0), (.60, .144, .58), ASH)
    m.block((-.47, .162, 0), (.46, .081, .43), STONE)
    m.block((-.47, 1.151, 0), (.19, 1.96, .22), WOOD)
    m.block((.004, 2.081, 0), (1.41, .16, .22), WOOD)
    m.taper((-.47, 1.416, 0), (.028, 2.025, 0), .061, .069, 4, RUST)
    for y in [.30, 1.86]:
        m.block((-.47, y, 0), (.218, .073, .244), IRON)
    m.block((.39, 2.074, 0), (.113, .198, .248), IRON)

    x = .393
    for y, r in [(.77, .30), (.841, .299), (1.396, .295), (1.52, .231)]:
        m.taper((x, y, 0), (x, y+.039, 0), r, r*.99, 9, IRON)
    for i in range(9):
        a = i*math.tau/9
        cx, cz = math.cos(a), math.sin(a)
        bottom = (x+.285*cx, .808, .285*cz)
        shoulder = (x+.279*cx, 1.412, .279*cz)
        top = (x+.213*cx, 1.544, .213*cz)
        m.taper(bottom, shoulder, .018, .018, 4, IRON)
        m.taper(shoulder, top, .018, .017, 4, RUST)
    for y in [1.574, 1.673, 1.772, 1.871, 1.97]:
        m.taper((x, y, 0), (x, y+.109, 0), .024, .024, 5, IRON)
        m.taper((x-.045, y+.05, 0), (x+.045, y+.05, 0), .028, .028, 5, IRON)
    for off, z, yaw in [(-.11, .08, -.39), (.02, -.05, .48), (.12, .079, -.64)]:
        c, s = math.cos(yaw), math.sin(yaw)
        shape = [(0, -.095), (.027, -.033), (.019, .032), (-.008, .080),
                 (-.025, .019), (-.026, -.044)]
        points = [(x+off+u*c+v*s, .842, z-u*s+v*c) for u, v in shape]
        m.face(points, '#262634', (0, 1, 0))
    return m


def bloom(Mesh):
    m = Mesh('Hunger moss · tooth bloom', 555)
    m.rock(0, 0, 0, 1.35, .225, 1.24, MOSS, 8)
    m.rock(0, .194, 0, .66, .102, .68, PLUM, 8)
    m.taper((0, .293, 0), (0, .308, 0), .218, .216, 9, VOID)
    for i in range(7):
        a = i*math.tau/7
        reach = [.69, .81, .71, .78, .68, .79, .71][i]
        def radial(angle, radius, y):
            return (math.cos(angle)*radius, y, math.sin(angle)*radius)

        root = radial(a, .23, .207)
        knot = radial(a+.15, .47, .33+(i%3)*.038)
        curl = radial(a+.43, reach*.86, .27+(i%2)*.17)
        tip = radial(a+.63, reach, .11+(i%2)*.17)
        for start, end, r1, r2 in [(root, knot, .099, .079), (knot, curl, .081, .041),
                                   (curl, tip, .044, .008)]:
            m.taper(start, end, r1, r2, 5, MOSS if i % 2 else PLUM)
        edge = radial(a+.18, .315, .36+(i%3)*.06)
        m.taper(radial(a+.18, .229, .254), edge, .068, .055, 5, ROSE)
        m.taper(edge, radial(a+.10, .16, .50+(i%3)*.06), .051, .005, 5, BONE)
        x, _, z = radial(a-.17, .47, 0)
        m.rock(x, .166, z, .146, .136+(i%3)*.032, .161, '#92795a', 5)
    return m


def ritual(Mesh):
    m = Mesh('The salt circle', 567)
    for i in range(12):
        start = i*math.tau/12+.033
        if i in [2, 3, 8]:
            continue
        ring_segment(m, start, start+.44, 0, .017, .383, .422, BONE)
        ring_segment(m, start+.03, start+.36, .009, .010, .316, .327, PALE)
    for i in [1, 4, 7, 10]:
        a = i*math.tau/12
        x, z = .386*math.cos(a), .386*math.sin(a)
        height = [.11, .18, .24][i%3]
        m.taper((x, 0, z), (x, .020, z), .060, .054, 6, WAX)
        m.taper((x, .014, z), (x, height, z), .033, .028, 6, WAX)
        m.taper((x, height, z), (x, height+.019, z), .009, .006, 4, IRON)
    m.rock(.035, .003, .025, .22, .019, .206, PLUM, 7)
    m.rock(.007, .021, .016, .11, .031, .095, ROSE, 5)
    for x, z in [(.14, -.37), (.19, -.384), (.265, -.35), (.32, -.34)]:
        m.rock(x, 0, z, .046, .022, .033, BONE, 4)
    return m


def models(Mesh):
    return {
        'mirror-still': mirror(Mesh, False),
        'mirror-reaching': mirror(Mesh, True),
        'mourner-veiled': mourner(Mesh, False),
        'mourner-unveiled': mourner(Mesh, True),
        'drowned-well': drowned_well(Mesh),
        'empty-gibbet': gibbet(Mesh),
        'hunger-moss-bloom': bloom(Mesh),
        'broken-salt-circle': ritual(Mesh),
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
        print(f'{name:22s} {triangles:4d} triangles · {path.stat().st_size:6d} bytes · {bounds}')
