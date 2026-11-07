#!/usr/bin/env python3
"""Build Barovia battlefield props using the original mesh exporter."""
import argparse
import math
import runpy
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / 'public/assets/props/barovian-battle'
STONE, MORTAR, CAP = '#747875', '#494d49', '#90938a'
WOOD, WORN, END = '#684a36', '#8e6748', '#b48759'
IRON, EDGE, BRASS = '#434b4d', '#9fa8a2', '#b88f52'
CLOTH, ROPE = '#823b41', '#b6a07b'


def breastwork(Mesh):
    m = Mesh('Broken stone breastwork', 401)
    m.block((0, .12, 0), (1.90, .24, .42), MORTAR)
    for x, y, w, h, z, d, colour in [
        (-.66, .08, .62, .26, -.01, .57, STONE),
        (-.02, .07, .64, .24, .01, .56, STONE),
        (.62, .08, .61, .25, 0, .54, CAP),
        (-.73, .26, .46, .22, -.04, .51, STONE),
        (-.23, .26, .56, .27, -.03, .53, CAP),
        (.32, .25, .50, .24, -.03, .50, STONE),
        (.73, .24, .35, .15, .02, .44, STONE),
        (-.48, .44, .87, .16, -.03, .47, CAP),
        (.20, .43, .50, .15, -.05, .42, CAP),
        (.51, 0, .27, .29, .12, .30, STONE),
        (.82, 0, .28, .22, .10, .24, CAP),
        (.17, 0, .29, .22, .09, .29, MORTAR),
    ]:
        m.rock(x, y, z, w, h, d, colour, 6)
    return m


def arrow_slit(Mesh):
    m = Mesh('Arrow-slit redoubt', 413)
    m.block((0, .075, 0), (1.92, .15, .66), MORTAR)
    for x in [-.49, .49]:
        m.block((x, .75, 0), (.79, 1.26, .40), MORTAR)
        for row in range(4):
            y = .30 + row * .30
            joint = x + (.11 if row % 2 else -.13)
            for left, right in [(x-.445, joint-.014), (joint+.014, x+.445)]:
                m.block(((left+right)/2, y, 0), (right-left, .282, .47+.007*row),
                        STONE if row % 2 else CAP)
    m.block((0, .38, 0), (.31, .46, .48), STONE)
    m.block((0, .625, 0), (.34, .09, .53), CAP)
    m.block((0, 1.29, 0), (.34, .20, .51), STONE)
    m.block((0, 1.455, 0), (1.92, .16, .59), CAP)
    for x in [-.71, 0, .71]:
        m.block((x, 1.645, 0), (.49, .26, .51), STONE)
        m.block((x, 1.793, 0), (.51, .068, .55), CAP)
    return m


def mantlet(Mesh):
    m = Mesh('Watch mantlet', 425)
    for x in [-.33, .33]:
        m.block((x, .05, -.03), (.15, .10, .83), WOOD)
        m.taper((x, .10, -.35), (x, .73, .112), .049, .044, 4, WORN)
    for i, height in enumerate([.98, 1.095, 1.19, 1.08, .99]):
        x = (i-2)*.173
        m.block((x, .10+height/2, .13), (.162, height, .096), WORN if i % 2 else WOOD)
        m.block((x-.042, .20+height*.43, .181), (.009, height*.71, .008), END)
    for y in [.31, .93]:
        m.block((0, y, .20), (.89, .067, .046), IRON)
        for x in [-.34, -.17, 0, .17, .34]:
            m.taper((x, y, .222), (x, y, .238), .016, .012, 5, EDGE)
    m.block((0, .68, .192), (.27, .30, .019), CLOTH)
    for x in [-.047, .047]:
        m.block((x, .68, .205), (.024, .154, .01), END, 0)
    m.block((0, .63, .206), (.13, .024, .012), END)
    return m


def stake_barrier(Mesh):
    m = Mesh('Crossed stake barrier', 437)
    m.taper((-.92, .43, 0), (.92, .43, 0), .10, .086, 7, WOOD)
    for x in [-.69, -.23, .23, .69]:
        for direction in [-1, 1]:
            start = (x-.05*direction, .036, -.335*direction)
            shoulder = (x+.07*direction, .69, .277*direction)
            tip = (x+.09*direction, .86, .39*direction)
            m.taper(start, shoulder, .052, .043, 5, WORN)
            m.taper(shoulder, tip, .042, .006, 5, END)
        for offset in [-.033, 0, .033]:
            m.taper((x+offset-.012, .43, 0), (x+offset+.012, .43, 0), .115, .114, 9, ROPE)
    # Flat feet establish the floor anchor and make the base readable from above.
    for x in [-.74, .74]:
        m.block((x, .027, 0), (.23, .054, .85), WOOD)
    return m


def caltrops(Mesh):
    m = Mesh('Scattered caltrops', 449)
    for x, z, yaw in [(-.29, -.27, .1), (.20, -.30, .7), (-.06, -.09, 1.2),
                      (-.32, .17, .6), (.24, .11, 0), (.09, .31, .32)]:
        m.rock(x, 0, z, .080, .059, .080, IRON, 5)
        for arm in range(3):
            angle = yaw + arm*math.tau/3
            c, s = math.cos(angle), math.sin(angle)
            m.taper((x, .042, z), (x+.105*c, .016, z+.105*s), .025, .004, 4, EDGE)
        m.taper((x, .036, z), (x+.027, .154, z+.019), .033, .004, 4, EDGE)
    return m


def oil_cask(Mesh, spilled):
    m = Mesh('Pitch cask · ' + ('spilled' if spilled else 'sealed'), 461)
    if spilled:
        m.rock(.025, 0, .025, .91, .014, .91, '#343029', 9)
        m.rock(.13, .012, .13, .35, .009, .29, '#50473a', 7)
        for x, y, z, length, yaw in [
            (-.28, .087, -.18, .34, -.32),
            (-.18, .093, -.17, .40, -.28),
            (-.08, .071, -.20, .37, -.22),
            (.038, .048, -.20, .28, -.65),
            (.16, .036, -.16, .30, .56),
        ]:
            m.block((x, y, z), (.087, .051, length), WORN, yaw)
        m.taper((-.31, .057, -.32), (-.31, .070, -.32), .113, .111, 7, IRON)
        m.taper((-.31, .070, -.32), (-.31, .076, -.32), .081, .081, 7, WOOD)
        m.taper((.29, .013, .24), (.29, .053, .24), .044, .039, 6, END)
        m.block((.22, .029, .06), (.065, .035, .18), CLOTH, .80)
        return m

    m.taper((0, 0, 0), (0, .32, 0), .28, .35, 10, WOOD)
    m.taper((0, .32, 0), (0, .67, 0), .35, .28, 10, WORN)
    for y, radius in [(.095, .315), (.31, .36), (.57, .315)]:
        m.taper((0, y, 0), (0, y+.037, 0), radius, radius, 10, IRON)
    m.taper((0, .666, 0), (0, .685, 0), .282, .282, 10, IRON)
    m.taper((0, .683, 0), (0, .695, 0), .245, .245, 10, END)
    m.taper((0, .694, .081), (0, .733, .081), .052, .045, 6, WOOD)
    m.block((0, .459, .319), (.22, .147, .035), CLOTH)
    m.block((0, .461, .340), (.038, .103, .009), BRASS)
    return m


def ballista(Mesh):
    m = Mesh('Watch ballista', 473)
    for x in [-.34, .34]:
        m.block((x, .066, 0), (.19, .132, 1.31), WOOD)
        for z in [-.36, .36]:
            m.taper((x, .115, z), (x*.52, .67, z*.73), .062, .053, 5, WORN)
    for z in [-.39, .39]:
        m.block((0, .16, z), (.76, .14, .17), WORN)
    m.block((0, .66, -.08), (.35, .17, 1.44), WOOD)
    for x in [-.132, .132]:
        m.block((x, .761, -.03), (.059, .051, 1.43), IRON)
    for side in [-1, 1]:
        root = (side*.14, .79, .36)
        joint = (side*.53, .79, .27)
        tip = (side*.79, .79, .055)
        m.taper(root, joint, .076, .051, 5, WORN)
        m.taper(joint, tip, .054, .024, 5, WORN)
        m.taper(tip, (0, .816, -.37), .011, .011, 4, ROPE)
        m.taper((side*.35, .754, .30), (side*.35, .928, .30), .064, .051, 6, IRON)
    m.taper((-.30, .65, -.53), (.30, .65, -.53), .074, .074, 8, BRASS)
    m.taper((.296, .65, -.53), (.37, .65, -.65), .023, .023, 5, IRON)
    m.taper((0, .818, -.46), (0, .818, .65), .023, .021, 5, WOOD)
    m.taper((0, .818, .625), (0, .818, .835), .055, .004, 4, EDGE)
    for x in [-.031, .031]:
        m.block((x, .831, -.41), (.025, .065, .17), CLOTH)
    return m


def models(Mesh):
    return {
        'stone-breastwork': breastwork(Mesh),
        'arrow-slit-redoubt': arrow_slit(Mesh),
        'watch-mantlet': mantlet(Mesh),
        'crossed-stakes': stake_barrier(Mesh),
        'caltrop-field': caltrops(Mesh),
        'pitch-cask-sealed': oil_cask(Mesh, False),
        'pitch-cask-spilled': oil_cask(Mesh, True),
        'watch-ballista': ballista(Mesh),
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
        print(f'{name:21s} {triangles:4d} triangles · {path.stat().st_size:6d} bytes · {bounds}')
