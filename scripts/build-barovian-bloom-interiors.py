#!/usr/bin/env python3
"""Build The Cellar Wakes, four Barovian furnishings in two states each."""
import argparse
import math
import runpy
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / 'public/assets/props/barovian-bloom-interiors'
STONE, PALE, DARK = '#73737b', '#a29c92', '#484852'
WOOD, WORN, END = '#583e34', '#88674e', '#ad8259'
IRON, BRASS = '#46494e', '#b39259'
MOSS, LICHEN, PLUM = '#586f53', '#8b9d6a', '#5d354e'
FLESH, BONE, VOID = '#b3727f', '#d4c099', '#241e2c'


def roots(m, points, radii, colour):
    for start, end, r0, r1 in zip(points, points[1:], radii, radii[1:]):
        m.taper(start, end, r0, r1, 5, colour)


def stone_basin(m, y, height, inside, outside, colours, sides=12):
    for i in range(sides):
        a, b = (i+.015)*math.tau/sides, (i+.985)*math.tau/sides
        low = [(r*math.cos(t), y, r*math.sin(t))
               for r, t in [(inside, a), (outside, a), (outside, b), (inside, b)]]
        high = [(x, yy+height, z) for x, yy, z in low]
        m.face(low, colours[0], (0, -1, 0))
        m.face(high, colours[1], (0, 1, 0))
        c, s = math.cos((a+b)/2), math.sin((a+b)/2)
        for j, away in enumerate([(math.sin(a), 0, -math.cos(a)), (c, 0, s),
                                  (-math.sin(b), 0, math.cos(b)), (-c, 0, -s)]):
            k = (j+1)%4
            m.face([low[j], low[k], high[k], high[j]], colours[0], away)


def font(Mesh, taken):
    m = Mesh('Saint Andral’s font · ' + ('Seep' if taken else 'clear'), 719)
    m.block((0, .056, 0), (.91, .112, .91), DARK)
    m.taper((0, .108, 0), (0, .23, 0), .364, .32, 8, STONE)
    m.taper((0, .225, 0), (0, .66, 0), .245, .195, 8, STONE)
    m.taper((0, .64, 0), (0, .772, 0), .295, .405, 12, STONE)
    m.taper((0, .767, 0), (0, .793, 0), .404, .405, 12, DARK)
    stone_basin(m, .78, .143, .315, .425, (STONE, PALE))
    m.block((0, 1.015, -.318), (.314, .285, .164), STONE)
    m.taper((0, 1.10, -.318), (0, 1.242, -.318), .174, .069, 5, PALE)
    m.block((0, 1.016, -.224), (.121, .036, .028), BRASS)
    m.block((0, 1.015, -.222), (.034, .152, .030), BRASS)
    if not taken:
        m.taper((0, .791, 0), (0, .827, 0), .328, .324, 12, '#54777e')
        for x, z, w, yaw in [(-.13, .108, .157, -.44), (.091, -.071, .14, -.48), (.019, .028, .229, -.48)]:
            m.block((x, .8275, z), (w, .003, .012), '#91b4ad', yaw)
        return m

    m.taper((0, .791, 0), (0, .839, 0), .327, .325, 12, '#363838')
    for a in [.14, 1.89, 3.47, 5.43]:
        c, s = math.cos(a), math.sin(a)
        roots(m, [(c*.12, .833, s*.12), (c*.29, .876, s*.29), (c*.356, .926, s*.356),
                  (c*.384, .916, s*.384)], [.049, .052, .035, .004], MOSS)
        m.rock(c*.27, .835, s*.26, .091, .059, .071, FLESH, 5)
    roots(m, [(-.09, .821, .063), (-.068, .938, .102), (.015, 1.012, .131)],
          [.074, .058, .048], LICHEN)
    m.rock(.025, .966, .133, .163, .132, .101, BONE, 7)
    for x, joint_y, tip_z in [(-.035, 1.15, .188), (.013, 1.191, .184),
                             (.062, 1.172, .205), (.102, 1.132, .210)]:
        roots(m, [(x, 1.07, .129), (x+.014, joint_y, .144), (x+.009, joint_y-.007, tip_z)],
              [.026, .021, .005], BONE)
    roots(m, [(.075, 1.004, .15), (.150, 1.026, .174), (.159, 1.076, .215)],
          [.033, .021, .005], LICHEN)
    return m


def press(Mesh, taken):
    m = Mesh('Winery press · ' + ('rootbound' if taken else 'working'), 731)
    m.block((0, .061, 0), (1.88, .122, .89), WOOD)
    m.block((0, .16, 0), (1.75, .087, .79), WORN)
    for x in [-.76, .76]:
        m.block((x, .83, -.035), (.191, 1.39, .212), WOOD)
        for y in [.278, 1.32]:
            m.block((x, y, -.035), (.216, .088, .234), IRON)
    m.block((0, 1.52, -.035), (1.84, .205, .33), WORN)
    for x in [-.71, .71]:
        m.taper((x, 1.525, .129), (x, 1.525, .155), .047, .039, 6, BRASS)
    m.taper((-.14, .756, -.044), (-.14, 1.529, -.044), .080, .080, 9, IRON)
    for i in range(25):
        a, b = i*math.tau/6, (i+1)*math.tau/6
        start = (-.14+.083*math.cos(a), .794+i*.022, -.044+.083*math.sin(a))
        end = (-.14+.083*math.cos(b), .794+(i+1)*.022, -.044+.083*math.sin(b))
        m.taper(start, end, .016, .015, 4, WORN)
    m.taper((-.44, 1.214, -.046), (.178, 1.214, -.046), .034, .032, 6, IRON)
    for x in [-.45, .182]:
        m.taper((x, 1.16, -.046), (x, 1.258, -.046), .038, .037, 6, END)
    m.taper((-.14, .677, -.044), (-.14, .748, -.044), .275, .269, 11, WOOD)
    for i in range(14):
        a = i*math.tau/14
        x, z = -.14+.279*math.cos(a), -.045+.279*math.sin(a)
        m.block((x, .448+i%3*.009, z), (.113, .399, .063),
                WORN if i % 3 else END, math.pi/2-a)
    for y in [.319, .585]:
        m.taper((-.14, y, -.045), (-.14, y+.031, -.045), .314, .314, 14, IRON)
    m.block((.55, .245, .16), (.345, .087, .33), WOOD)
    for x in [.407, .685]:
        m.block((x, .315, .16), (.052, .07, .315), WORN)
    m.block((.548, .315, .295), (.265, .07, .047), WORN)
    m.block((.547, .293, .154), (.216, .020, .224), PLUM if not taken else MOSS)

    if taken:
        for points in [
            [(-.28, .22, .23), (-.51, .48, .253), (-.47, .71, .194), (-.28, .87, .12), (-.156, 1.14, .015)],
            [(.28, .22, .23), (.26, .43, .253), (.12, .68, .191), (.17, .864, .09), (.095, 1.06, .054)],
            [(.48, .31, .143), (.356, .421, .117), (.297, .622, .11), (.443, .82, .065)],
        ]:
            roots(m, points, [.063, .058, .044, .030][:len(points)-1]+[.004],
                  MOSS if points[0][0] < .4 else PLUM)
        for x, y, z in [(-.49, .48, .27), (-.43, .66, .23), (.19, .57, .28), (.28, .38, .26), (.51, .323, .166)]:
            m.rock(x, y, z, .121, .111, .095, FLESH, 5)
    return m


def shutter(Mesh, taken):
    m = Mesh('Cellar shutters · ' + ('watching' if taken else 'barred'), 743)
    m.block((0, .071, 0), (.94, .142, .67), DARK)
    m.block((0, .75, -.249), (.73, 1.271, .145), VOID)
    for side in [-1, 1]:
        for i in range(5):
            x = side*(.379-.008*(i%2))
            m.block((x, .26+i*.255, -.025), (.163, .245, .49-.017*(i%2)), STONE if i%2 else PALE)
    m.block((0, .174, 0), (.88, .083, .58), STONE)
    m.block((0, 1.511, 0), (.928, .168, .533), PALE)
    m.block((0, 1.62, -.043), (.873, .065, .445), DARK)

    for side in [-1, 1]:
        for i in range(4):
            x = side*(.055+i*.084)
            z = .093 if not taken else .093+.045*(3-i)
            y = .819 if not taken else .815+.027*(i%2)
            m.block((x, y, z), (.081, 1.123-.013*i, .072),
                    WOOD if i%2 else WORN, side*(.065 if taken else 0))
        for y in [.463, 1.179]:
            m.block((side*.239, y, .152), (.173 if taken else .249, .058, .044), IRON)
            m.taper((side*.285, y, .173), (side*.285, y, .190), .022, .019, 5, BRASS)
    if not taken:
        m.block((0, .87, .159), (.512, .092, .071), END)
        return m

    for x, y in [(-.132, .601), (.111, .817), (-.113, 1.136), (.121, 1.295)]:
        roots(m, [(x*2, y-.19, .145), (x*1.15, y-.076, .211), (x*.34, y, .236)],
              [.052, .042, .006], MOSS)
    m.rock(0, .665, .224, .264, .305, .164, PLUM, 8)
    m.taper((0, .827, .262), (0, .827, .318), .112, .085, 9, '#c6c88d')
    m.taper((0, .827, .317), (0, .827, .329), .048, .041, 7, VOID)
    m.taper((-.021, .845, .328), (-.022, .846, .331), .014, .008, 5, '#e8e0b3')
    return m


def shelves(Mesh, taken):
    m = Mesh('Flour shelves · ' + ('hatched' if taken else 'stocked'), 755)
    m.block((0, .052, 0), (1.90, .104, .79), WOOD)
    for x in [-.846, .846]:
        m.block((x, .69, -.032), (.141, 1.278, .622), WORN)
        m.block((x, 1.363, -.032), (.173, .089, .674), WOOD)
    for y in [.216, .657, 1.107]:
        m.block((0, y, -.044), (1.68, .089, .675), WORN)
        m.block((0, y+.01, .286), (1.67, .065, .052), END)
        for x in [-.66, .66]:
            m.taper((x, y, .312), (x, y, .325), .018, .014, 5, IRON)
    for x in [-.54, .54]:
        m.block((x, .686, -.316), (.097, 1.162, .078), WOOD)
    for x, y, z, w, h in [(-.52, .26, .006, .347, .265), (.19, .26, .038, .356, .262),
                          (.49, .26, -.01, .313, .235), (-.47, .702, .014, .321, .252)]:
        c = '#a18e6f' if not taken else '#88826a'
        m.rock(x, y, z, w, h if not taken else h*.57, .272, c, 7)
        if not taken:
            m.taper((x, y+h-.022, z), (x, y+h+.059, z), .042, .023, 6, '#77684f')
    for x, r in [(-.09, .113), (.17, .105), (.446, .096)]:
        m.taper((x, .701, -.022), (x, .905, -.022), r*.8, r, 8, '#67564e')
        m.taper((x, .902, -.022), (x, .956, -.022), r*.91, r*.64, 8, BRASS)
    if taken:
        for x, y, z, w in [(-.51, .318, .059, .126), (.22, .334, .072, .144),
                            (.46, .32, .101, .12), (-.48, .796, .092, .155), (.58, .737, .111, .187)]:
            m.rock(x, y, z, w, w*1.41, w*.93, FLESH, 6)
            m.taper((x, y+w*1.29, z), (x+.035, y+w*1.53, z+.026), .025, .004, 4, BONE)
        for points in [
            [(-.66, .15, .237), (-.52, .32, .247), (-.37, .56, .206), (-.48, .744, .188), (-.651, .906, .17)],
            [(.62, .18, .25), (.44, .43, .223), (.57, .72, .234), (.61, .901, .181), (.48, 1.19, .139)],
            [(-.35, .72, .208), (-.11, .743, .252), (.19, .67, .282), (.42, .73, .227)],
        ]:
            roots(m, points, [.055, .049, .037, .020][:len(points)-1]+[.004],
                  MOSS if points[0][0] != .62 else PLUM)
    else:
        for x, z, w in [(-.66, .037, .205), (-.395, .006, .207), (.055, -.063, .184), (.40, .009, .229)]:
            m.rock(x, 1.153, z, w, .12, .238, '#b6a68a', 6)
    return m


def models(Mesh):
    pairs = [
        (font, 'font-clear', 'font-seep'),
        (press, 'wine-press-working', 'wine-press-rootbound'),
        (shutter, 'cellar-shutters-barred', 'cellar-shutters-watching'),
        (shelves, 'flour-shelves-stocked', 'flour-shelves-hatched'),
    ]
    return {name: make(Mesh, taken)
            for make, clean, infected in pairs
            for name, taken in [(clean, False), (infected, True)]}


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
        print(f'{name:27s} {triangles:4d} triangles · {path.stat().st_size:6d} bytes · {bounds}')
