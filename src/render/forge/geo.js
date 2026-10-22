/* FORGE GEOMETRY — the sculpted shapes figures are made of: lathed torsos and limbs, shaped heads, tapered tubes
   (horns, tails, braids, bows), extruded blades and plates. Every shape is cached by its parameters and shared by
   every figure that uses it; figures clone them only when merging (render/forge/build.js). */
import * as THREE from 'three';

const cache = new Map();
export const cached = (key, make) => { let g = cache.get(key); if (!g){ g = make(); g.userData.shared = true; cache.set(key, g); } return g; };
const V2 = (x, y) => new THREE.Vector2(x, y);

// A smooth solid of revolution through (radius, height) points, closed at both ends.
export function lathe(points, seg = 14){
  const pts = points.map(([r, y]) => V2(Math.max(.0005, r), y));
  return new THREE.LatheGeometry(pts, seg);
}
// Smooth a profile with Catmull-Rom so lathed parts read as sculpted, not faceted.
export function smoothProfile(points, n = 24){
  const curve = new THREE.SplineCurve(points.map(([r, y]) => V2(r, y)));
  return curve.getPoints(n).map(p => [p.x, p.y]);
}
// A limb segment hanging down from its joint: rounded top, a little bulge, tapering to a rounded end.
export function limb(r0, r1, len, bulge = 1.08, seg = 12){
  const k = `limb|${r0.toFixed(4)}|${r1.toFixed(4)}|${len.toFixed(4)}|${bulge}|${seg}`;
  return cached(k, () => {
    // flat-ish caps: the joint spheres (elbows, knees) fill the gap, so the limb reads as one piece, not a doll's
    const rm = Math.max(r0, r1) * bulge, pts = [[.0005, r0 * .45], [r0 * .8, r0 * .3], [r0, 0], [rm, -len * .3], [(rm + r1) / 2, -len * .65], [r1, -len], [r1 * .8, -len - r1 * .3], [.0005, -len - r1 * .45]];
    const g = lathe(smoothProfile(pts, 26), seg); g.rotateY(Math.PI); return g;   // the seam goes to the back
  });
}
// A lathed shell from a profile; sx / sz squash it into an oval (a torso is deeper side to side than front to back).
export function shell(key, points, sx = 1, sz = .72, seg = 18, smooth = true){
  return cached(`shell|${key}|${sx.toFixed(3)}|${sz.toFixed(3)}|${seg}`, () => {
    const g = lathe(smooth ? smoothProfile(points, 30) : points, seg); g.rotateY(Math.PI); g.scale(sx, 1, sz); g.computeVertexNormals(); return g;   // seam at the back
  });
}
// A tube along a curve whose radius tapers from r0 to r1 (horns, tails, braids, bow limbs, staves, whips).
export function taperTube(key, pts, r0, r1, tubular = 24, radial = 8){
  return cached(`tube|${key}|${r0}|${r1}|${tubular}|${radial}`, () => {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
    const g = new THREE.TubeGeometry(curve, tubular, 1, radial, false);
    // TubeGeometry has one radius: pull each ring toward its centre by how far along the tube it is
    const pos = g.attributes.position, frames = curve.computeFrenetFrames(tubular, false), v = new THREE.Vector3();
    for (let i = 0; i <= tubular; i++){
      const c = curve.getPointAt(i / tubular), r = r0 + (r1 - r0) * (i / tubular);
      for (let j = 0; j <= radial; j++){ const k = i * (radial + 1) + j; v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c); pos.setXYZ(k, v.x, v.y, v.z); }
    }
    void frames; g.computeVertexNormals(); return g;
  });
}
// A flat shape, extruded with a soft bevel (blades, axe heads, shields, plates). Shape points in x,y.
export function plate(key, outline, depth, bevel = .004, curveSeg = 1){
  return cached(`plate|${key}|${depth}|${bevel}`, () => {
    const s = new THREE.Shape(outline.map(([x, y]) => V2(x, y)));
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled:bevel > 0, bevelThickness:bevel, bevelSize:bevel, bevelSegments:2, curveSegments:curveSeg });
    g.translate(0, 0, -depth / 2); g.computeVertexNormals(); return g;
  });
}
export const sphere = (r, w = 16, h = 12) => cached(`sph|${r}|${w}|${h}`, () => new THREE.SphereGeometry(r, w, h));
export const ellipsoid = (rx, ry, rz, w = 16, h = 12) => cached(`ell|${rx}|${ry}|${rz}|${w}|${h}`, () => { const g = new THREE.SphereGeometry(1, w, h); g.scale(rx, ry, rz); return g; });
export const cylinder = (r0, r1, h, s = 12, open = false) => cached(`cyl|${r0}|${r1}|${h}|${s}|${open}`, () => new THREE.CylinderGeometry(r0, r1, h, s, 1, open));
export const cone = (r, h, s = 10) => cached(`cone|${r}|${h}|${s}`, () => new THREE.ConeGeometry(r, h, s));
export const box = (a, b, c) => cached(`box|${a}|${b}|${c}`, () => new THREE.BoxGeometry(a, b, c));
export const torus = (r, t, rs = 8, ts = 24, arc = Math.PI * 2) => cached(`tor|${r}|${t}|${rs}|${ts}|${arc}`, () => new THREE.TorusGeometry(r, t, rs, ts, arc));
// A partial sphere (helmets, hoods, caps, pauldrons): phi around, theta from the top.
export const dome = (r, thetaLen = Math.PI / 2, w = 18, h = 10, phiStart = 0, phiLen = Math.PI * 2, thetaStart = 0) =>
  cached(`dome|${r}|${thetaLen}|${w}|${h}|${phiStart}|${phiLen}|${thetaStart}`, () => new THREE.SphereGeometry(r, w, h, phiStart, phiLen, thetaStart, thetaLen));

/* A head: a sphere shaped into a skull and jaw, facing +z. chin / jaw widths change the character of the face. */
export function headGeo(r, jaw = 1, snout = 0){
  return cached(`head|${r}|${jaw}|${snout}`, () => {
    const g = new THREE.SphereGeometry(r, 26, 20), p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++){
      v.fromBufferAttribute(p, i);
      const ny = v.y / r, nz = v.z / r;
      v.x *= .9;                                                    // narrower than deep
      if (ny < -.1){ const k = Math.min(1, (-ny - .1) / .9); v.x *= 1 - .2 * k * (2 - jaw); v.z *= 1 - .06 * k; if (nz > .3) v.z += r * .05 * k * jaw; v.y -= r * .05 * k; }   // jaw and chin
      if (nz < -.2 && ny > -.3) v.z *= 1.06;                       // the back of the skull
      if (nz > .5 && Math.abs(ny + .05) < .35) v.z += r * .03;     // brow and cheekbones
      if (snout > 0 && nz > .2 && ny < .25 && ny > -.75){ const k = (nz - .2) / .8; v.z += r * snout * k * (1 - Math.abs(ny + .25) * 1.2); v.y -= r * .1 * snout * k; }
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals(); return g;
  });
}
/* A cloak: a curved sheet round the back from the shoulders, flaring toward the hem. Its rest positions are kept
   so the render loop can ripple it (render/forge/anim.js). w: half-angle of the wrap; len: down to the hem. */
export function cloakGeo(top, flare, len, wrap = 1.9, segX = 12, segY = 10, hood = false){
  // not cached: each cloak's vertices move on their own
  const g = new THREE.PlaneGeometry(1, 1, segX, segY), p = g.attributes.position;
  for (let i = 0; i < p.count; i++){
    const u = p.getX(i) + .5, v = .5 - p.getY(i);                  // u across, v down
    const a = Math.PI + (u - .5) * wrap * 2, r = top + (flare - top) * Math.pow(v, .8);
    const wave = Math.sin(u * Math.PI * 5) * .012 * v;                // folds
    p.setXYZ(i, Math.sin(a) * (r + wave), -v * len, Math.cos(a) * (r + wave) - (hood ? 0 : .01));
  }
  g.computeVertexNormals();
  g.userData.rest = Float32Array.from(p.array);
  return g;
}

// A ring of fur: a fat torus pushed in and out with noise (barbarians' collars, hide trim).
export function furRing(r, t, key = 'fur'){
  return cached(`furring|${r}|${t}|${key}`, () => {
    const g = new THREE.TorusGeometry(r, t, 10, 40), p = g.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3();
    for (let i = 0; i < p.count; i++){
      v.fromBufferAttribute(p, i); const a = Math.atan2(v.y, v.x); c.set(Math.cos(a) * r, Math.sin(a) * r, 0);
      const k = 1 + .35 * Math.sin(a * 23 + v.z * 90) * Math.sin(a * 7 + 1.3) + .15 * Math.sin(a * 51);
      v.sub(c).multiplyScalar(k).add(c); p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals(); return g;
  });
}
/* Skin weights for a limb or torso piece, so it bends smoothly at a joint instead of meeting the next piece at a
   ball. Bone 0 is the piece's own; bone 1 its neighbour across the joint at height jy. below: the neighbour is
   below the joint (an upper arm's forearm), else above (a forearm's upper arm). band: how far the blend reaches. */
export function skinned(geo, jy, below, band = .03){
  return cached(`skin|${geo.uuid}|${jy}|${below}|${band}`, () => {
    const g = geo.index ? geo.clone() : geo.clone(), p = g.attributes.position, n = p.count;
    const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++){
      const y = p.getY(i), d = below ? jy - y : y - jy;                 // > 0: across the joint
      const k = Math.min(1, Math.max(0, (d + band) / (band * 2))), w = k * k * (3 - 2 * k);   // half and half at the joint itself
      si[i * 4] = 0; si[i * 4 + 1] = 1; sw[i * 4] = 1 - w; sw[i * 4 + 1] = w;
    }
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
    return g;
  });
}
