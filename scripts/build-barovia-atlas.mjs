/* Draw the overworld artwork and DM reference in the Valley's 100 × 64 coordinates. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { VALLEY_PLACES, VALLEY_ROADS } from '../src/data/barovia-map.js';
import { esc, mulberry32 } from '../src/util/core.js';

const assets = new URL('../public/assets/overworld/', import.meta.url);
const docs = new URL('../docs/screens/', import.meta.url);
const svg = 'http://www.w3.org/2000/svg';
const round = value => Number(value.toFixed(2));
const placeById = new Map(VALLEY_PLACES.map(place => [place.id, place]));

const ink = {
  mists: '<path d="M-1.4-.62q.45-.43.96 0t.96 0 1.04-.04M-1.46.06q.46-.42.96 0t.96 0 1.1-.05M-1.1.71q.39-.35.84 0t.84 0 .56-.03"/>',
  gates: '<path d="M-1.2 1.05V-.85h.48V1.05m1.42 0V-.85h.48v1.9M-.72.2V-.39Q0-1 .7-.39V.2M-.34-.54v1.56M.32-.54v1.56M-.72.44H.7"/>',
  village: '<path d="M-1.41.03l.64-.66.65.66m-1.1-.18v1.07h.92V-.15m.14.04.8-.89.8.89M.03-.31V.92h1.16V-.31M.52.92V.36h.22v.56"/>',
  crossroads: '<path d="M-.99.98v-2.03h2.06M-.92-.53l.52-.51M.82-1v.86"/><circle cx=".82" cy=".04" r=".21"/><path d="M-1.32.99h.69"/>',
  castle: '<path d="M-1.22.99V-.37l.35-.63.31.63v.31h.25V-.67L0-1.34l.33.67v.61h.26v-.31l.32-.63.32.63V.99ZM-.17.99V.49Q0 .25.17.49v.5"/><path d="M0-.45v.23" stroke="#f0a08d" stroke-width=".20"/>',
  coffin: '<path d="M-.99-.48.49-.88l.69.51-.13.72-1.38.54-.72-.42zM-.99-.48l.67.47L1.18-.37M-.32-.01v.9M-.11-.51.56-.66m.72-.33.23-.26M-1.18.67l-.2.15"/>',
  tser: '<path d="M-1.41.73-.8-.21l.59.94m-.96-.01h.74M-.04.72.64-.39l.69 1.11Zm.67-.49v.49M-.18-.23q-.32-.43.12-.77.26.42.11.68"/>',
  bonegrinder: '<path d="M-.62.99-.43-.43.10-.88l.53.45.12 1.42ZM-.96-1.01l2.13 1.58M1-.94-.79.59M-.71-.99l.4.22m1.04-.21-.31.30"/>',
  vallaki: '<path d="M-1.34.97V.04l.37-.46.37.46v.93m1.21 0V.04l.37-.46.37.46v.93M-.6.47h1.21M-.51.45V-.22L0-1.08l.51.86v.67M-.23.95v-.33q.23-.36.46 0v.33"/>',
  lake: '<path d="M-.89-.45-.47.12H.63l.36-.57Zm1.10 0v-.6M-1.35.52q.4-.24.82 0t.84 0 1.04-.05M-.88.95q.39-.23.76 0t.76 0"/>',
  argyn: '<path d="M-1.2.96V-.45l.35-.31.24.30.31-.33.41.32.51-.28v.71h.55v1Zm.46-.02V.35q.25-.4.5 0v.59M.20-.24v.29m.52.3h.39M-.76-1.03-.56-.98"/>',
  berez: '<path d="M-.98.72V-.19L-.31-.75.41-.19V.69M-.74.15H.14v.42h-.88zM-1.37.94h2.66M.70.78V.2l.32-.32.30.29v.62m-2.43-.66.09-.25"/>',
  winery: '<path d="M-1.08-.81.89-.11M-1.27-.21l1.98.73M-1.37.37l1.86.7M.25-.83.94-1.16l.41.40v.55L.25-.51Zm.55.03v.19"/>',
  krezk: '<path d="M-1.27.97-.76.22-.43.5-.02-.25.47.46.73.14l.58.83M-.44.16v-.67H.33v.62M-.59-.51-.06-1.05.49-.51M-.06-1.05v-.25m-.19.09h.38"/>',
  yester: '<path d="M-1.32.91-.81.39l.28.18.48-.83.53.79.31-.16.51.54M-.05-.27v-.9m0 .5-.47-.22-.19-.37m.68.67.45-.34.05-.34M-.99.66v-.41m2.05.44v-.40"/>',
  tower: '<path d="M-.50.8V-.64h1V.8m-1.1-1.47.61-.59.58.59M-.13-.26h.25v.28h-.25zm.00 1.03v-.31h.25v.31M-1.19.83q.45-.16.89 0t.86 0 .59-.03"/>',
};

function landmarkSymbols() {
  return VALLEY_PLACES.map(({ id }) =>
    `<symbol id="landmark-${id}" viewBox="-1.7 -1.7 3.4 3.4"><g fill="none" stroke="currentColor" stroke-width=".13" stroke-linejoin="round" stroke-linecap="round">${ink[id] ?? '<path d="M0 -1.1 1.1 0 0 1.1 -1.1 0Z"/>'}</g></symbol>`).join('\n');
}

const river = [
  'M94 42 Q80 39 69 35 T56 37 T44 43 T37 48 T30 52 T26 56',
  'M77 23 Q72.9 28.1 73.71 33.15 T73.9 36.46',
  'M61.1 22.8 C59.5 25.8 61.1 28.4 61.95 30.86 S62.5 32.9 61.2 34.38',
].join(' ');
const lakes = [
  'M22.4 20.2 C24.1 17.1 27 16.1 31.5 16.6 C34.1 16.8 36.1 18.9 35.4 20.8 C34.9 22.3 31.7 22.8 30.2 23.6 C27.5 24.1 24.6 22.8 22.4 20.2 Z',
  'M23 57 C23.1 55.6 24.1 54.9 26.8 54.55 C29.1 54.4 30.4 55.9 29.9 57.05 C29 58.8 25.8 58.85 23 57 Z',
];

function peak(x, y, w, h) {
  const d = `M${round(x - w)} ${y}l${round(w * .48)} ${round(-h * .36)} ${round(w * .52)} ${round(-h * .64)} ${round(w * .50)} ${round(h * .60)} ${round(w * .50)} ${round(h * .40)}`;
  return `<g transform="translate(${x} ${y})"><path d="M${-w} 0L0 ${-h} ${w} 0Q.4 -.45 ${-w} 0Z" fill="#363935" opacity=".79"/><path d="M0 ${-h}L${w} 0 .12 ${round(-h*.26)}Z" fill="#171f20" opacity=".72"/><path d="M${round(-w*.49)} ${round(-h*.31)}L0 ${-h} ${round(w*.34)} ${round(-h*.40)} .08 ${round(-h*.53)}Z" fill="#8a8272" opacity=".30"/><path d="M${round(-w*.63)} -.12l${round(w*.33)} ${round(-h*.22)}M${round(-w*.40)} -.19l${round(w*.24)} ${round(-h*.20)}M${round(w*.23)} ${round(-h*.29)}l${round(w*.34)} ${round(h*.21)}" stroke="#aa9b84" stroke-opacity=".24" stroke-width=".075"/></g><path d="${d}" fill="none" stroke="#777467" stroke-width=".095" opacity=".46"/>`;
}

function mountainRanges(rng) {
  const points = [];
  const lines = [
    [2, 94, 10, 2.4, .77],
    [8, 82, 7, 2.1, .74],
    [4, 97, 60.5, 2.3, 1.04],
    [9, 88, 63.2, 1.7, .74],
    [2, 20, 47, 1.7, .73],
    [70, 98, 57.5, 1.7, .80],
  ];
  for (const [start,end,y,w,h] of lines) {
    for (let x = start; x < end; x += 2.7+rng()*2.8) {
      points.push([round(x), round(y + Math.sin(x*.33)*2 + (rng()-.5)*3),
        round(w * (.7+rng()*.58)), round((2.5+rng()*3.9)*h)]);
    }
  }
  return points.sort((a,b) => a[1]-b[1]).map(p => peak(...p)).join('');
}

function forests(rng) {
  const zones = [
    [9, 17, 7, 8], [30, 8, 7, 4], [52, 14, 12, 7], [68, 22, 10, 7],
    [89, 19, 7, 8], [81, 47, 8, 9], [54, 49, 8, 8], [18, 46, 10, 7],
    [48, 30, 5, 8], [12, 33, 9, 5], [67, 45, 6, 9],
  ];
  const trees = [];
  for (const [cx,cy,rx,ry] of zones) {
    for (let i=0; i<33; i++) {
      const theta = rng()*Math.PI*2, r = Math.sqrt(rng());
      const x = cx+Math.cos(theta)*r*rx, y = cy+Math.sin(theta)*r*ry;
      if (x<2 || x>98 || y<3 || y>61) continue;
      if (((x-29)/7)**2+((y-20)/4)**2 < 1 || ((x-26.5)/4)**2+((y-56.5)/2.4)**2 < 1) continue;
      trees.push([round(x),round(y),round(.62+rng()*.68),rng()<.3?'#58715c':'#384d40']);
    }
  }
  return trees.sort((a,b) => a[1]-b[1]).map(([x,y,size,fill]) =>
    `<path d="M0 -1.04l.27.46h-.13l.30.41h-.14l.31.37H.08v.23H-.08V.20h-.53l.31-.37h-.14l.30-.41h-.13Z" transform="translate(${x} ${y}) scale(${size})" fill="${fill}"/>`).join('');
}

function contours() {
  const landforms = [
    [11, 17, 12, 6, -12], [50, 13, 22, 7, 6], [79, 18, 20, 7, 18],
    [14, 43, 15, 9, 15], [51, 48, 16, 8, -17], [76, 52, 23, 6, -10],
    [89, 31, 10, 4, 26], [36, 38, 12, 5, 8],
  ];
  return landforms.map(([x,y,w,h,tilt]) =>
    `<g transform="translate(${x} ${y}) rotate(${tilt}) scale(${w} ${h})">${[.50,.65,.82,1,1.14].map(k =>
      `<path d="M-.97-.05C-.76-.67-.45-.98-.09-.89S.79-.91.98-.13.66.44.47.69-.11 1.05-.47.66-.97.48-.97-.05Z" transform="scale(${k})" vector-effect="non-scaling-stroke"/>`).join('')}</g>`).join('');
}

function ground() {
  const rng = mulberry32(1771);
  return `
    <rect width="100" height="64" fill="url(#atlas-ground)"/>
    <g fill="none" stroke="#9d9271" stroke-width=".47" opacity=".20">${contours()}</g>
    ${mountainRanges(rng)}
    ${forests(rng)}
    <g fill="none" stroke-linecap="round"><path d="${river}" stroke="#738b88" stroke-width="1.10" opacity=".54"/><path d="${river}" stroke="#2c4853" stroke-width=".86"/><path d="${river}" stroke="#87a09c" stroke-width=".12" stroke-dasharray="2 .9" opacity=".56"/></g>
    <g fill="#263f49" stroke="#76928e" stroke-width=".14">${lakes.map(d => `<path d="${d}"/>`).join('')}</g>
    <path d="M24.9 19.6q2.4-.65 4.6-.28m-.9 1.36q2.4-.47 4.9-1.2m-6.4 2.65q2.4.08 4.04-.5M24.7 57.1q1.9.31 3.5-.12" fill="none" stroke="#85a39b" stroke-width=".13" opacity=".57"/>
    <rect width="100" height="64" fill="url(#atlas-mist)"/>
  `;
}

const reliefDefs = `
  <radialGradient id="atlas-ground" cx="47%" cy="48%" r="65%"><stop stop-color="#33382d"/><stop offset=".64" stop-color="#292f28"/><stop offset="1" stop-color="#171e20"/></radialGradient>
  <radialGradient id="atlas-mist" cx="51%" cy="49%" r="64%"><stop offset=".61" stop-color="#a7ada4" stop-opacity="0"/><stop offset="1" stop-color="#9a9f98" stop-opacity=".27"/></radialGradient>
`;
const mapGround = ground();

function roadCurve(road) {
  const a = placeById.get(road.a), b = placeById.get(road.b);
  const rng = mulberry32([...road.id].reduce((h,c) => h*31+c.charCodeAt(0),7) >>> 0);
  const mx = (a.x+b.x)/2+(rng()-.5)*5, my = (a.y+b.y)/2+(rng()-.5)*5;
  return {
    d: `M${a.x} ${a.y}Q${mx.toFixed(1)} ${my.toFixed(1)} ${b.x} ${b.y}`,
    point: t => [(1-t)**2*a.x+2*t*(1-t)*mx+t*t*b.x, (1-t)**2*a.y+2*t*(1-t)*my+t*t*b.y],
  };
}

const labelOffset = {
  mists:[-3.0,.1,'end'], gates:[2.0,3.2,'middle'], village:[.2,3.9,'middle'],
  crossroads:[.3,-2.7,'middle'], castle:[0,4.8,'middle'], coffin:[.1,-2.8,'middle'],
  tser:[0,-2.7,'middle'], bonegrinder:[.1,-2.9,'middle'], vallaki:[.0,3.9,'middle'],
  lake:[-2.0,-2.3,'middle'], argyn:[0,-2.9,'middle'], berez:[.0,3.0,'middle'],
  winery:[-1.2,3.5,'middle'], krezk:[.0,3.1,'middle'], yester:[.2,3.2,'start'], tower:[-.1,3.5,'middle'],
};

function marker(place) {
  const [dx,dy,align] = labelOffset[place.id] ?? [0,3.1,'middle'];
  const focus = place.id==='castle', color = focus ? '#ecc2ac' : '#eddbad';
  const r = focus ? 2.36 : 1.55;
  const name = esc(place.name.replace(/^The /,''));
  return `<g data-place="${place.id}" transform="translate(${place.x} ${place.y})">
    ${focus ? '<circle r="4.35" fill="#7a443b" opacity=".35"/>' : ''}
    <circle r="${r}" fill="${focus?'#482b2b':'#222822'}" stroke="${focus?'#ce897b':'#b29767'}" stroke-width=".13"/>
    <use href="#landmark-${place.id}" xlink:href="#landmark-${place.id}" x="${-r}" y="${-r}" width="${r*2}" height="${r*2}" color="${color}"/>
    <text x="${dx}" y="${dy}" text-anchor="${align}" fill="none" stroke="#161c1a" stroke-width=".43" stroke-linejoin="round">${name}</text>
    <text x="${dx}" y="${dy}" text-anchor="${align}" fill="${color}">${name}</text>
  </g>`;
}

const style = {
  road: { color:'#d0aa73', dash:'', width:.30 },
  path: { color:'#bfaa84', dash:'1 .48', width:.25 },
  trail:{ color:'#ab9b85', dash:'.16 .55', width:.23 },
};
const crossings = { 'r-east':.62, 'r-tser':.63, 'r-berez':.80, 'r-tower':.54 };
const roads = VALLEY_ROADS.map(road => {
  const { d, point } = roadCurve(road), line = style[road.way];
  const crossing = road.river ? point(crossings[road.id] ?? .5) : null;
  return `<g data-road="${road.id}"><path d="${d}" fill="none" stroke="#171b17" stroke-width=".58" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${line.color}" stroke-width="${line.width}" stroke-dasharray="${line.dash}" stroke-linecap="round"/>${crossing ? `<path d="M0 -.55l.55.55L0 .55-.55 0Z" transform="translate(${crossing.map(round).join(' ')})" fill="#789a96" stroke="#1b2829" stroke-width=".13"/>` : ''}</g>`;
}).join('');

const shell = (viewBox, title, body) => `<svg xmlns="${svg}" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${viewBox}" role="img"><title>${title}</title>${body}</svg>\n`;
const compass = `<g transform="translate(91 52)" fill="none" stroke="#c1ab7a" stroke-width=".11">
  <circle r="2.55"/><circle r="1.62" opacity=".55"/><path d="M0-3.8V3.8M-3.8 0h7.6M0-2.55l.63 1.92L2.55 0 .63.63 0 2.55-.63.63-2.55 0-.63-.63Z"/><path d="M0-2.55l.63 1.92L0 0-.63-.63Z" fill="#dac38d"/>
  <text x="0" y="-4.35" text-anchor="middle" fill="#dac38d" stroke="none" font-family="Georgia,serif" font-size="1.12">N</text></g>`;

const atlas = shell('0 0 108 85', 'The Valley of Barovia, DM atlas', `
  <defs>${reliefDefs}${landmarkSymbols()}<clipPath id="map-frame"><rect width="100" height="64" rx=".5"/></clipPath></defs>
  <rect width="108" height="85" fill="#151c1b"/>
  <rect x="1.2" y="1.2" width="105.6" height="82.6" rx=".5" fill="none" stroke="#645847" stroke-width=".12"/>
  <text x="4" y="4.8" fill="#b39c70" font-family="DejaVu Sans,sans-serif" font-size="1.07" letter-spacing=".25">DREAD DELVE   /   DM OVERWORLD ATLAS</text>
  <text x="4" y="9" fill="#f0dfb7" font-family="Georgia,DejaVu Serif,serif" font-size="3.47">The Valley of Barovia</text>
  <text x="104" y="8.77" fill="#b39c70" text-anchor="end" font-family="DejaVu Sans,sans-serif" font-size="1.06">${VALLEY_PLACES.length} PLACES   ·   ${VALLEY_ROADS.length} ROUTES</text>
  <g transform="translate(4 11)" clip-path="url(#map-frame)">
    ${mapGround}
    <g font-family="DejaVu Sans,sans-serif" font-size="1.30" letter-spacing=".31" fill="#b2a282" opacity=".62">
      <text x="16" y="12">BALINOK FOOTHILLS</text><text x="67" y="15.2">SVALICH WOODS</text>
      <text x="48" y="55.5">THE LOWER VALLEY</text><text x="6" y="49">WESTERN MARSH</text>
    </g>
    ${roads}<g font-family="Georgia,DejaVu Serif,serif" font-size="1.47">${VALLEY_PLACES.map(marker).join('')}</g>
    ${compass}
  </g>
  <rect x="4" y="11" width="100" height="64" rx=".5" fill="none" stroke="#9d8760" stroke-width=".15"/>
  <g transform="translate(5 79)" font-family="DejaVu Sans,sans-serif" font-size="1.13" fill="#dccdab">
    <path d="M0 0h4" stroke="#d0aa73" stroke-width=".28"/><text x="5" y=".39">Road</text>
    <path d="M14 0h4" stroke="#bfaa84" stroke-width=".28" stroke-dasharray="1 .48"/><text x="19" y=".39">Path</text>
    <path d="M28 0h4" stroke="#ab9b85" stroke-width=".28" stroke-dasharray=".16 .55" stroke-linecap="round"/><text x="33" y=".39">Trail</text>
    <path d="M42 -.55l.55.55-.55.55-.55-.55Z" fill="#789a96"/><text x="44" y=".39">Water crossing</text>
    <text x="98" y=".39" text-anchor="end" fill="#b39c70">SCHEMATIC · TRAVEL TIMES FOLLOW THE VTT</text>
  </g>`);

mkdirSync(assets,{recursive:true});
mkdirSync(docs,{recursive:true});
writeFileSync(new URL('barovia-relief.svg',assets),shell('0 0 100 64','Barovia terrain relief',`<defs>${reliefDefs}</defs>${mapGround}`));
writeFileSync(new URL('barovia-landmarks.svg',assets),shell('0 0 3.4 3.4','Barovia landmark symbols',`<defs>${landmarkSymbols()}</defs>`));
writeFileSync(new URL('barovia-overworld-atlas.svg',docs),atlas);
