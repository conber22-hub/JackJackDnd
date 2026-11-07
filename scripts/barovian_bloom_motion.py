"""Bind the Bloom's sculpted GLBs to compact, one-mesh rigs."""
from dataclasses import dataclass
import json
import math
import struct


@dataclass(frozen=True)
class Limb:
    x: float
    z: float
    phase: float


@dataclass(frozen=True)
class Motion:
    pivot: tuple
    body_blend: tuple
    limb_blend: tuple
    limbs: tuple
    idle: float
    move: float
    stride: float
    lift: float
    swell: float
    twitch: float = .006


MOTION = {
    'sporeling': Motion(
        (0, .28, -.06), (.10, .35), (.07, .26),
        tuple(Limb(side*x, z, (i + (side > 0)) % 2 * .5)
              for side in [-1, 1] for i, (x, z) in enumerate([(.37, -.29), (.35, -.01), (.37, .27)])),
        idle=2.15, move=.60, stride=.21, lift=.067, swell=.055, twitch=.017),
    'bloom-vessel': Motion(
        (0, .69, -.04), (.26, .70), (.11, .67),
        (Limb(-.125, .097, 0), Limb(.13, -.043, .5)),
        idle=3.0, move=1.13, stride=.30, lift=.135, swell=.024),
    'carrier-hulk': Motion(
        (0, .62, -.12), (.19, .64), (.12, .58),
        (Limb(-.29, .069, 0), Limb(.29, .069, .5)),
        idle=3.85, move=1.46, stride=.25, lift=.104, swell=.065, twitch=.010),
    'cyst-node': Motion(
        (0, .29, -.03), (.13, .48), (0, 1), (),
        idle=3.5, move=0, stride=0, lift=0, swell=.11, twitch=0),
    'bloom-stalker': Motion(
        (0, .60, -.12), (.20, .64), (.13, .68),
        (Limb(-.198, -.23, .5), Limb(.198, -.23, 0),
         Limb(-.31, .40, 0), Limb(.31, .40, .5)),
        idle=2.65, move=.77, stride=.28, lift=.115, swell=.027, twitch=.025),
    'bloomed-wolf': Motion(
        (0, .45, -.08), (.13, .48), (.09, .45),
        (Limb(-.172, .20, 0), Limb(.172, .20, .5),
         Limb(-.172, -.33, .5), Limb(.172, -.33, 0)),
        idle=2.35, move=.71, stride=.25, lift=.091, swell=.038, twitch=.010),
    'hunger-moss-creeper': Motion(
        (0, .22, -.02), (.07, .26), (.06, .27),
        tuple(Limb(math.cos(i*math.tau/7+.34)*reach*.87,
                   -.02+math.sin(i*math.tau/7+.34)*reach*.87, i/7)
              for i, reach in enumerate([.41, .43, .40, .47, .42, .39, .45])),
        idle=2.8, move=.88, stride=.20, lift=.078, swell=.08, twitch=.016),
}


def smooth(t):
    t = max(0, min(t, 1))
    return t*t*(3-2*t)


def between(value, bounds):
    lo, hi = bounds
    return smooth((value-lo)/(hi-lo))


def weights_at(p, motion):
    x, y, z = p
    body = between(y, motion.body_blend)
    leg = 0
    joint = 0
    if motion.limbs:
        def distance(limb):
            return math.hypot(x-limb.x, z-limb.z)

        index, limb = min(enumerate(motion.limbs), key=lambda entry: distance(entry[1]))
        influence = 1-between(distance(limb), (.10, .25))
        leg = (1-between(y, motion.limb_blend))*influence
        joint = index+2
    leg_byte = round(255*leg)
    body_byte = round((255-leg_byte)*body)
    return (0, 1, joint, 0), (255-leg_byte-body_byte, body_byte, leg_byte, 0)


def stance(phase, stride, lift):
    phase %= 1
    contact = .62
    if phase < contact:
        return (0, stride*(.5-phase/contact))
    step = (phase-contact)/(1-contact)
    # Match the stance velocity at lift-off and landing.
    tangent = -(1-contact)/contact
    curve = smooth(step) + tangent*step*(1-step)*(1-2*step)
    return (lift*math.sin(math.pi*step)**2, stride*(curve-.5))


def body_sample(motion, phase, moving):
    beat = phase*math.tau
    if moving:
        rise = motion.lift*.22 * (1-math.cos(beat*2))
        return ((.022*math.sin(beat), rise, 0),
                (1, 1-.022*math.sin(beat*2), 1),
                .045*math.sin(beat))
    breath = (1-math.cos(beat))/2
    swell = motion.swell*breath
    return ((.008*math.sin(beat), swell*.28, 0),
            (1+swell, 1+swell*.72, 1+swell*.8),
            .021*math.sin(beat))


def pack_rows(code, rows):
    return b''.join(struct.pack('<'+code*len(row), *row) for row in rows)


class Model:
    def __init__(self, path):
        self.path = path
        raw = path.read_bytes()
        header_size = struct.unpack_from('<I', raw, 12)[0]
        self.gltf = json.loads(raw[20:20+header_size])
        self.binary = bytearray(raw[28+header_size:])
        self.primitive = self.gltf['meshes'][0]['primitives'][0]

    def positions(self):
        acc = self.gltf['accessors'][self.primitive['attributes']['POSITION']]
        view = self.gltf['bufferViews'][acc['bufferView']]
        offset = view.get('byteOffset', 0)+acc.get('byteOffset', 0)
        stride = view['byteStride']
        return [struct.unpack_from('<3f', self.binary, offset+i*stride) for i in range(acc['count'])]

    def accessor(self, rows, shape, component=5126, normalized=False, vertex=False, bounds=False):
        self.binary.extend(b'\0'*(-len(self.binary)%4))
        data = pack_rows('f' if component == 5126 else 'B', rows)
        view = {'buffer': 0, 'byteOffset': len(self.binary), 'byteLength': len(data)}
        if vertex:
            view['target'] = 34962
        self.binary.extend(data)
        accessors, views = self.gltf['accessors'], self.gltf['bufferViews']
        accessor = {'bufferView': len(views), 'componentType': component,
                    'count': len(rows), 'type': shape}
        if normalized:
            accessor['normalized'] = True
        if bounds:
            accessor.update(min=list(rows[0]), max=list(rows[-1]))
        views.append(view)
        accessors.append(accessor)
        return len(accessors)-1

    def write(self):
        self.gltf['buffers'][0]['byteLength'] = len(self.binary)
        manifest = json.dumps(self.gltf, separators=(',', ':')).encode()
        manifest += b' '*(-len(manifest)%4)
        self.binary.extend(b'\0'*(-len(self.binary)%4))
        chunks = struct.pack('<I4s', len(manifest), b'JSON')+manifest
        chunks += struct.pack('<I4s', len(self.binary), b'BIN\0')+self.binary
        self.path.write_bytes(struct.pack('<4sII', b'glTF', 2, 12+len(chunks))+chunks)


def inverse_bind(pivot):
    x, y, z = pivot
    return (1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -x, -y, -z, 1)


def animation(model, motion, name, duration):
    moving = name == 'Move'
    steps = math.ceil(duration*24)
    phases = [i/steps for i in range(steps)]+[0]
    time = model.accessor([(duration*i/steps,) for i in range(steps+1)], 'SCALAR', bounds=True)
    samplers, channels = [], []

    def track(node, path, rows, shape='VEC3'):
        channels.append({'sampler': len(samplers), 'target': {'node': node, 'path': path}})
        samplers.append({'input': time, 'output': model.accessor(rows, shape), 'interpolation': 'LINEAR'})

    body = [body_sample(motion, phase, moving) for phase in phases]
    track(2, 'translation', [tuple(a+b for a, b in zip(motion.pivot, offset)) for offset, _, _ in body])
    track(2, 'scale', [scale for _, scale, _ in body])
    track(2, 'rotation', [(0, 0, math.sin(roll/2), math.cos(roll/2)) for _, _, roll in body], 'VEC4')
    for index, limb in enumerate(motion.limbs):
        if moving:
            offsets = [stance(phase+limb.phase, motion.stride, motion.lift) for phase in phases]
        else:
            offsets = [(motion.twitch * ((1-math.cos((phase+limb.phase)*math.tau))/2)**5, 0)
                       for phase in phases]
        track(index+3, 'translation', [(limb.x, dy, limb.z+dz) for dy, dz in offsets])
    return {'name': name, 'channels': channels, 'samplers': samplers}


def add_bloom_motion(path, name):
    motion = MOTION[name]
    model = Model(path)
    joints, weights = zip(*(weights_at(p, motion) for p in model.positions()))
    attrs = model.primitive['attributes']
    attrs['JOINTS_0'] = model.accessor(joints, 'VEC4', component=5121, vertex=True)
    attrs['WEIGHTS_0'] = model.accessor(weights, 'VEC4', component=5121, normalized=True, vertex=True)

    pivots = [motion.pivot, *((limb.x, 0, limb.z) for limb in motion.limbs)]
    nodes = model.gltf['nodes']
    nodes[0]['skin'] = 0
    nodes.append({'name': 'BloomRoot', 'children': list(range(2, 2+len(pivots)))})
    for i, pivot in enumerate(pivots):
        nodes.append({'name': 'BloomBody' if i == 0 else f'BloomLimb{i}', 'translation': pivot})
    model.gltf['scenes'][0]['nodes'].append(1)
    model.gltf['skins'] = [{'skeleton': 1, 'joints': list(range(1, len(nodes))),
                           'inverseBindMatrices': model.accessor([inverse_bind(p) for p in [(0, 0, 0), *pivots]], 'MAT4')}]
    clips = [animation(model, motion, 'Idle', motion.idle)]
    if motion.move:
        clips.append(animation(model, motion, 'Move', motion.move))
    model.gltf['animations'] = clips
    model.write()
