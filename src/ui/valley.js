/* THE VALLEY TAB — the map of Barovia (SVG), the chosen place, the way there, and the journey in progress. */
import { state, ui } from '../engine/state.js';
import { esc, mulberry32 } from '../util/core.js';
import { VALLEY_PLACES, VALLEY_ROADS, WAY_HOURS, timeOfDay } from '../data/barovia-map.js';
import { PLACE_STATES } from '../data/campaign.js';
import { TEMPLATES } from '../data/themes.js';
import { route, planJourney, placeById, roadBetween } from '../engine/overland.js';
import { valley, onJourney, placeMaps, clockText } from '../game/overworld.js';
import { BEST } from '../data/bestiary.js';
import { mapStatus } from '../game/maps.js';

const GLYPH = { mists:'🌫', gates:'🚪', village:'🏠', crossroads:'⚖', castle:'🏰', coffin:'☄', camp:'🔥', mill:'⚙', town:'🏘', lake:'🌊', ruin:'🏚', swamp:'🛖', vineyard:'🍇', hill:'🗿', tower:'🗼' };
const opt = (v, l, on) => `<option value="${esc(v)}" ${on ? 'selected' : ''}>${esc(l)}</option>`;

// A gentle bend so roads don't look ruled.
function roadPath(a, b, id){
  const g = mulberry32([...id].reduce((h, c) => h * 31 + c.charCodeAt(0), 7) >>> 0);
  const mx = (a.x + b.x) / 2 + (g() - .5) * 5, my = (a.y + b.y) / 2 + (g() - .5) * 5;
  return `M${a.x} ${a.y} Q${mx.toFixed(1)} ${my.toFixed(1)} ${b.x} ${b.y}`;
}
function mapSVG(V, sel, onRoute, player = false){
  // the players' copy shows where they have been, and only rumours of what is next door
  const known = player ? new Set([...V.visited, ...V.visited.flatMap(id => VALLEY_ROADS.filter(r => r.a === id || r.b === id).map(r => r.a === id ? r.b : r.a))]) : null;
  const shown = p => !known || known.has(p.id);
  const g = mulberry32(1771);
  const trees = Array.from({ length:150 }, () => { const x = 4 + g() * 92, y = 4 + g() * 56; return VALLEY_PLACES.some(p => Math.hypot(p.x - x, p.y - y) < 4) ? '' : `<path d="M${x.toFixed(1)} ${(y - 1.1).toFixed(1)}l.8 1.6h-1.6z" />`; }).join('');
  const peaks = [[8, 6], [16, 4], [24, 7], [50, 5], [58, 8], [76, 6], [84, 9], [92, 13], [12, 58], [44, 60], [62, 57], [86, 56], [96, 48], [3, 40]].map(([x, y]) => `<path d="M${x - 3} ${y + 2.5}L${x} ${y - 2.5}L${x + 3} ${y + 2.5}" />`).join('');
  const roads = VALLEY_ROADS.filter(r => !known || (known.has(r.a) && known.has(r.b) && (V.visited.includes(r.a) || V.visited.includes(r.b)))).map(r => { const a = placeById(r.a), b = placeById(r.b), on = onRoute.has(r.id);
    return `<path class="vroad ${r.way} ${on ? 'on' : ''}" d="${roadPath(a, b, r.id)}"><title>${esc(r.name)}</title></path>`; }).join('');
  const here = placeById(V.at), j = V.journey && placeById(V.journey.to);
  const lantern = j ? { x:(here.x + j.x) / 2, y:(here.y + j.y) / 2 } : here;
  const places = VALLEY_PLACES.filter(shown).map(p => {
    const cls = [p.id === V.at ? 'here' : '', V.visited.includes(p.id) ? 'seen' : 'unseen', p.id === sel ? 'sel' : ''].join(' ');
    if (player && !V.visited.includes(p.id)) return `<g class="vplace unseen" transform="translate(${p.x} ${p.y})"><circle r="1.7" class="dot"/><text class="glyph" y=".7">?</text></g>`;
    return `<g class="vplace ${cls}" ${player ? '' : `data-act="valleySel" data-k="${p.id}"`} transform="translate(${p.x} ${p.y})"><title>${esc(p.name)}</title>
      <circle r="2.6" class="halo"/><circle r="1.7" class="dot"/><text class="glyph" y=".7">${GLYPH[p.kind] || '•'}</text>
      <text class="nm" ${p.lab === 'n' ? 'y="-3.1"' : p.lab === 'w' ? 'x="-2.6" y=".8" text-anchor="end"' : 'y="4.4"'}>${esc(p.name.replace(/^The /, ''))}</text></g>`;
  }).join('');
  // Castle Ravenloft: always on the map, for everyone, whether or not they have been near it. Its glow and the red line
  // of its Gaze to the party's lantern strengthen as his Gaze rises.
  const C = placeById('castle'), gz = Math.max(1, state?.dread || 1) / 10;
  const castle = `<g class="vcastle" pointer-events="none" transform="translate(${C.x} ${C.y})">
      <circle r="7" fill="url(#vcglow)" opacity="${(.25 + gz * .75).toFixed(2)}"/>
      <path d="M-3.2 4.2 L-1.9 -.6 L-1.2 -1.1 L1.3 -1.1 L1.9 -.4 L3.1 4.2 Z" fill="#141114" stroke="#2a2428" stroke-width=".15"/>
      <path d="M-1.6 -1.1 V-3.4 H-1.25 V-3.9 H-.95 V-3.4 H-.6 V-3.8 H-.3 V-3.4 H.3 V-3.8 H.6 V-3.4 H.95 V-3.9 H1.25 V-3.4 H1.6 V-1.1 Z" fill="#1c181e"/>
      <path d="M-1.9 -1.1 V-4.6 L-1.55 -5.6 L-1.2 -4.6 V-1.1 Z M1.2 -1.1 V-4.4 L1.55 -5.3 L1.9 -4.4 V-1.1 Z" fill="#17141a"/>
      <path d="M-.35 -3.4 V-6.4 L0 -7.9 L.35 -6.4 V-3.4 Z" fill="#120f14"/>
      <circle class="vcwin" cx="0" cy="-5.6" r=".2" fill="#ff4030"/><circle cx="-1.55" cy="-3.9" r=".11" fill="#ffb060"/><circle cx="1.55" cy="-3.7" r=".11" fill="#ffb060"/><circle cx=".9" cy="-2.3" r=".1" fill="#ffb060"/>
    </g>`;
  const gazeLine = state?.dread >= 3 && lantern ? `<path class="vgaze" d="M${C.x} ${C.y - 5.6} Q${((C.x + lantern.x) / 2).toFixed(1)} ${(Math.min(C.y, lantern.y) - 8).toFixed(1)} ${lantern.x} ${lantern.y - 3.2}" stroke="#ff3a30" stroke-width=".22" fill="none" opacity="${((state.dread - 2) / 14).toFixed(2)}" stroke-dasharray=".6 .9" pointer-events="none"/>` : '';
  return `<svg class="valley-map" viewBox="0 0 100 64" role="img" aria-label="Map of the valley of Barovia">
    <defs>
      <radialGradient id="vmist" cx="50%" cy="50%" r="62%"><stop offset="62%" stop-color="#c8ccd8" stop-opacity="0"/><stop offset="100%" stop-color="#c8ccd8" stop-opacity=".6"/></radialGradient>
      <radialGradient id="vground" cx="55%" cy="45%" r="70%"><stop offset="0%" stop-color="#1d2219"/><stop offset="100%" stop-color="#0b0d0a"/></radialGradient>
      <radialGradient id="vcglow"><stop offset="0%" stop-color="#b8202a" stop-opacity=".55"/><stop offset="100%" stop-color="#b8202a" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="100" height="64" fill="url(#vground)"/>
    <g class="vtrees">${trees}</g><g class="vpeaks">${peaks}</g>
    <path class="vriver" d="M94 42 Q80 39 69 35 T56 37 T44 43 T37 48 T30 52 T26 56"/>
    <ellipse class="vlake" cx="29" cy="20" rx="6.5" ry="3.6"/><ellipse class="vlake" cx="26.5" cy="56.5" rx="3.5" ry="2"/>
    ${castle}${roads}${gazeLine}${places}
    <g class="vlantern" transform="translate(${lantern.x} ${lantern.y - 3.2})"><circle r="1.6"/><text y=".55">🏮</text></g>
    <rect width="100" height="64" fill="url(#vmist)" pointer-events="none"/>
    <g class="vfog" pointer-events="none"><ellipse cx="10" cy="10" rx="18" ry="6"/><ellipse cx="88" cy="56" rx="20" ry="6"/><ellipse cx="96" cy="26" rx="10" ry="12"/><ellipse cx="4" cy="44" rx="10" ry="14"/></g>
  </svg>`;
}

// The map, big (a modal), for planning — and for showing the table where they are.
export function valleyMapHTML(){
  const V = valley(), sel = ui.valleySel && placeById(ui.valleySel) ? ui.valleySel : V.at, onRoute = new Set();
  const path = sel !== V.at ? route(V.at, sel) : null;
  if (path) for (let i = 1; i < path.length; i++) onRoute.add(roadBetween(path[i - 1], path[i]).id);
  if (V.journey) for (let i = 1; i < V.journey.path.length; i++) onRoute.add(roadBetween(V.journey.path[i - 1], V.journey.path[i]).id);
  const p = placeById(sel);
  return `<div class="valley-big">${mapSVG(V, sel, onRoute)}</div>
    <div class="row" style="justify-content:space-between"><div><b>${esc(p.name)}</b> <span class="muted">${esc(p.blurb)}</span></div>
    <div class="row">${path && !V.journey ? `<button class="btn primary" data-act="valleyTravel" data-k="${p.id}">🧭 Set out (${planJourney(V.at, sel).stretches.length} stretches)</button>` : ''}<button class="btn" data-act="valleyMapClose">Close</button></div></div>`;
}

export function valleyTab(){
  const V = valley(), sel = ui.valleySel && placeById(ui.valleySel) ? ui.valleySel : V.at, p = placeById(sel), here = placeById(V.at);
  const path = sel !== V.at ? route(V.at, sel) : null, plan = path && planJourney(V.at, sel);
  const onRoute = new Set(); if (path) for (let i = 1; i < path.length; i++) onRoute.add(roadBetween(path[i - 1], path[i]).id);
  if (V.journey) for (let i = 1; i < V.journey.path.length; i++) onRoute.add(roadBetween(V.journey.path[i - 1], V.journey.path[i]).id);
  const maps = placeMaps(p);
  let h = `<h3>The Valley of Barovia <button class="btn small" style="float:right" data-act="valleyMap">⤢ Enlarge</button></h3>
    <div class="muted">${V.journey ? `On the road to <b>${esc(placeById(V.journey.to).name)}</b>.` : `The party is at <b>${esc(here.name)}</b>.`} ${V.visited.length} of ${VALLEY_PLACES.length} places seen · ${V.journeys} journey${V.journeys === 1 ? '' : 's'}.</div>
    <div class="trait">🕯 <b>${esc(clockText())}</b>${V.weather ? ` · ${esc(V.weather)}` : ''}</div>
    ${mapSVG(V, sel, onRoute)}
    <div class="card sel"><div class="hd"><span class="nm">${GLYPH[p.kind] || ''} ${esc(p.name)}</span>${V.visited.includes(p.id) ? '' : '<span class="muted">not yet seen</span>'}</div>
      <div class="look">${esc(p.blurb)}</div>
      ${p.sessions.length ? `<div class="trait"><b>Sessions here.</b> ${p.sessions.map(n => `<span class="chip" data-act="session" data-k="${n}">${n}</span>`).join('')}</div>` : ''}
      ${p.state ? `<div class="row"><label>Mood</label><select class="txt" style="width:auto" data-edit="place" data-k="${p.state}">${PLACE_STATES.map(st => opt(st, st, (state.campaign.places[p.state] || 'quiet') === st)).join('')}</select></div>` : ''}`;
  if (plan && !V.journey) h += `<div class="trait"><b>The way.</b> ${plan.path.map(id => esc(placeById(id).name)).join(' → ')} · ${plan.stretches.length} stretch${plan.stretches.length === 1 ? '' : 'es'} of road · about ${plan.stretches.reduce((h, st) => h + (WAY_HOURS[VALLEY_ROADS.find(r => r.id === st.road).way] || 2), 0)} hours on foot</div>
      <div class="row"><button class="btn primary" data-act="valleyTravel" data-k="${p.id}">🧭 Set out for ${esc(p.name)}</button></div>
      <div class="muted">Builds the road as maps — one per stretch — and puts the party at the start. The road's shape stays the same each time; what is on it does not.</div>`;
  else if (path === null && sel !== V.at) h += `<div class="bad">No road reaches ${esc(p.name)} from here.</div>`;
  if (sel === V.at && !V.journey && maps.length) h += `<div class="row">${maps.map((m, i) => { const st = mapStatus(`place:${p.id}:${m.id}`), nm = maps.length > 1 ? esc(m.name) : esc(p.name);
      return st === 'here' ? `<span class="chip on">▦ ${nm} — on the table</span>` : `<button class="btn ${i ? '' : 'primary'}" data-act="valleyEnter" data-k="${p.id}" data-id="${m.id}">▦ ${st === 'shelf' ? `Back into ${nm}` : maps.length > 1 ? nm : `Enter ${nm}`}</button>`; }).join('')}</div>
    <div class="muted">${maps.length > 1 ? 'Each map is built the first time' : 'Built the first time'}; after that it's kept as the party left it (Maps tab). The party comes along.</div>`;
  else if (sel !== V.at && !V.journey && maps.length) h += `<div class="muted">Maps here: ${maps.map(m => esc(m.name)).join(' · ')} (once they arrive).</div>`;
  h += `</div>`;
  if (V.journey){
    const L = ui.floor, f = state.floors[L], last = L === state.floors.length - 1, ev = (f?.events || []);
    h += `<h3>🧭 The road to ${esc(placeById(V.journey.to).name)}</h3>
      <div class="sessbar">${state.floors.map((fl, i) => `<span class="chip ${i === L ? 'on' : ''}" data-act="goFloor" data-k="${i}" title="${esc(fl.name)}">${i + 1}</span>`).join('')}</div>
      <div class="muted"><b>${esc(f?.name || '')}</b> — ${onJourney() ? 'stretch ' + (L + 1) + ' of ' + state.floors.length : 'they have left the road'}. Violet runes on the map mark what is waiting (DM only).</div>`;
    for (const e of ev) h += `<div class="card ${e.done ? '' : 'sel'}"><div class="hd"><span class="nm">${e.done ? '✓ ' : '✦ '}${esc(e.label)}</span></div>
      <div class="look">${esc(e.text)}</div>
      ${e.enc ? `<div class="muted">${e.enc.map(([b, n]) => `${n} ${esc(BEST[b]?.name || b)}`).join(', ')}</div>` : ''}
      <div class="row"><button class="btn small" data-act="evRead" data-k="${L}" data-id="${e.id}">📜 Read</button>${e.enc && !e.sprung ? `<button class="btn small seep" data-act="evSpring" data-k="${L}" data-id="${e.id}">⚔ Spring it</button>` : ''}<button class="btn small" data-act="evGo" data-k="${L}" data-id="${e.id}">◎ Show</button><button class="btn small" data-act="evDone" data-k="${L}" data-id="${e.id}">${e.done ? 'Undo' : '✓ Done'}</button></div></div>`;
    if (!ev.length) h += `<div class="muted">Nothing waiting on this stretch. Quiet roads are the worst kind.</div>`;
    h += `<div class="row"><button class="btn small" data-act="roadNew">✦ Something on the road</button><button class="btn small" data-act="night" data-k="road">Roll a road encounter (desk)</button></div>
      ${/^Road:/.test(state.campaign.lastNight || '') ? `<div class="look">${esc(state.campaign.lastNight)}</div>` : ''}
      <div class="row"><button class="btn small" data-act="valleyCamp">⛺ Make camp (8 hours)</button></div>
      <div class="row"><button class="btn ${last ? 'primary' : ''}" data-act="valleyArrive">Arrive at ${esc(placeById(V.journey.to).name)} (+${V.journey.hours || 0}h)</button></div>`;
  }
  h += `<div class="row" style="margin-top:8px"><button class="btn small ${V.shared ? 'on' : ''}" data-act="valleyShare">${V.shared ? '📜 Shared with the table' : '📜 Share the map with the table'}</button></div>
    <div class="muted">${V.shared ? 'Players have a Map tab: the places they have reached, rumours of the places next door, and where they are now.' : 'Players see nothing of this map until you share it — and then only what they have reached.'}</div>`;
  h += `<div class="muted" style="margin-top:8px">Roads: <span class="key road"></span> the Svalich Road · <span class="key path"></span> paths · <span class="key trail"></span> trails. Tap a place to plan the way.</div>`;
  return h;
}
// The players' Map tab: what the DM has shared (state.valley, sent with the delve when sharing is on).
export function playerMapTab(){
  const V = state.valley; if (!V) return '<div class="muted">The DM has not shared the map.</div>';
  const here = placeById(V.at), to = V.journey && placeById(V.journey.to);
  return `<h3>The valley</h3><div class="muted">${to ? `On the road to <b>${esc(to.name)}</b>.` : `You are at <b>${esc(here.name)}</b>.`} The mist hides the rest.</div>
    ${V.day ? `<div class="trait">🕯 <b>Day ${V.day} · ${timeOfDay(V.hour)}</b>${V.weather ? ` · ${esc(V.weather)}` : ''}</div>` : ''}
    ${mapSVG(V, null, new Set((V.journey?.path || []).slice(1).map((id, i) => roadBetween(V.journey.path[i], id)?.id)), true)}
    ${V.visited.map(id => placeById(id)).map(p => `<div class="trait"><b>${esc(p.name)}.</b> ${esc(p.blurb)}</div>`).join('')}`;
}
// Which session happens where (for the Story tab).
export const placesForSession = n => VALLEY_PLACES.filter(p => p.sessions.includes(n));
