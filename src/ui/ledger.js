/* 📒 THE LEDGER — five of ChatGPT's engines at the DM's hand, in one sheet (Night tab, or the palette):
   - 🔎 Field surveys (engine/field-surveys.js): what the party has noticed at a place, one confirmed detail at a time;
     the whole set unlocks a lead. The party's field notes can go to their phones.
   - 🔥 By the fire (engine/camp-bonds.js): companions (allied NPC tokens) with an outlook react to the choices they
     witnessed; after a long rest, a scene of friction, trust or bond. Its opening can go to the table screen.
   - ⚖ Bounties (engine/town-bounties.js): an offence in Barovia, Vallaki or Krezk counts only when a witness reports
     it; the town's response; a wanted notice on the screen; pay the fine (from the hero's purse) or a pardon.
   - 🛞 Supply runs (engine/supply-runs.js): a wagon hauls timber, stone or salt between two holdings along the
     valley's roads; it arrives as the valley clock passes its hour, or goes missing and becomes a rescue.
   - 🗳 A vote (engine/party-votes.js): a question to the heroes' phones, one ballot a seat, the result on the screen.
   All of it lives on state.campaign (the Curtain never sends campaign to players). */
import { state, ui, tokById, log } from '../engine/state.js';
import { $, esc } from '../util/core.js';
import { FIELD_SURVEYS } from '../data/field-surveys.js';
import { newSurveyBook, recordObservation, surveyStatus, claimSurvey, surveysForPlayers } from '../engine/field-surveys.js';
import { CAMP_CHOICES, CAMP_OUTLOOKS } from '../data/camp-bonds.js';
import { newCampBonds, recordCampChoice, campOffers, playCampScene } from '../engine/camp-bonds.js';
import { TOWN_LAWS, TOWN_OFFENCES } from '../data/town-bounties.js';
import { newBountyLedger, recordOffence, reportOffence, bountyStatus, postBounty, settleBounty, bountyNotices } from '../engine/town-bounties.js';
import { SUPPLY_PACES } from '../data/supply-runs.js';
import { newSupplyBook, quoteSupplyRun, dispatchSupplyRun, checkSupplyRun, supplyRescue, resolveSupplyRun, writeOffSupplyRun } from '../engine/supply-runs.js';
import { openPartyVote, castPartyVote, closePartyVote, partyVoteForPlayers } from '../engine/party-votes.js';
import { VALLEY_PLACES } from '../data/barovia-map.js';
import { spendCoins } from '../engine/coins.js';
import { holdings } from '../game/holdings.js';
import { transport } from '../game/workshop.js';
import { wxNow, fourKind } from '../game/weather.js';
import { hourHooks } from '../game/overworld.js';
import { narrate } from '../game/night.js';
import { changed } from '../game/session.js';
import { net, sendToSeat, sendHost } from '../net/table.js';
import { showCard, toast } from './hud.js';
import { registerCommands } from './palette.js';

let tab = 'survey', place = null, town = 'vallaki', lastNote = '';
const C = () => state.campaign;
const book = k => {
  const c = C(), mk = { fieldSurveys:newSurveyBook, campBonds:newCampBonds, townBounties:newBountyLedger, supplyRuns:newSupplyBook }[k];
  return (c[k] ||= mk());
};
const put = (k, v) => { C()[k] = v; changed(); };
const valleyHour = () => { const V = C().valley || {}; return ((V.day ?? 1) - 1) * 24 + (V.hour ?? 12); };
const heroes = () => state.tokens.filter(t => t.kind === 'pc' && !t.dead && !t.flags?.gone);
const companions = () => state.tokens.filter(t => t.kind === 'npc' && !t.dead && !t.flags?.gone && !t.flags?.taken);
const placeName = id => VALLEY_PLACES.find(p => p.id === id)?.name || TOWN_LAWS[id]?.name || FIELD_SURVEYS[id]?.title || id;
const uid = p => `${p}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
const sel = (id, opts, cur, attrs = '') => `<select class="txt" style="width:auto;max-width:100%" id="${id}" ${attrs}>${opts.map(([v, l]) => `<option value="${esc(v)}" ${v === cur ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;

export function openLedger(k){ if (ui.role !== 'dm' || !state) return; if (k) tab = k; lastNote = ''; tickSupply(true); render(); }
function close(){ $('#ledgerSheet')?.classList.add('hidden'); }
const isOpen = () => $('#ledgerSheet') && !$('#ledgerSheet').classList.contains('hidden');

function render(){
  let m = $('#ledgerSheet');
  if (!m){ m = document.createElement('div'); m.id = 'ledgerSheet'; m.className = 'modal'; document.body.appendChild(m); m.addEventListener('click', onClick); m.addEventListener('change', onChange); }
  const tabs = [['survey', '🔎 Surveys'], ['camp', '🔥 By the fire'], ['bounty', '⚖ Bounties'], ['supply', '🛞 Supply runs'], ['vote', '🗳 A vote']];
  let h = `<div class="box lg-sheet"><div class="row" style="align-items:center"><h2 style="flex:1;margin:0">📒 The ledger</h2><button class="btn small" data-lgx="close">✕</button></div>
    <div class="row">${tabs.map(([k, l]) => `<button class="btn small ${tab === k ? 'on' : ''}" data-lgx="tab" data-k="${k}">${l}</button>`).join('')}</div>`;
  h += ({ survey:surveyTab, camp:campTab, bounty:bountyTab, supply:supplyTab, vote:voteTab }[tab])();
  if (lastNote) h += `<div class="ch-events">${lastNote}</div>`;
  m.innerHTML = h + '</div>'; m.classList.remove('hidden');
}

/* ---------- 🔎 field surveys ---------- */
function surveyTab(){
  const ids = Object.keys(FIELD_SURVEYS); place = ids.includes(place) ? place : ids.includes(C().valley?.at) ? C().valley.at : ids[0];
  const s = surveyStatus(book('fieldSurveys'), place);
  let h = `<div class="muted">Stage these details where they fit the map; tick one when the party finds it. The whole set unlocks a lead.</div>
    <div class="row">${sel('lgPlace', ids.map(id => [id, FIELD_SURVEYS[id].title]), place)}</div>`;
  h += s.observations.map(o => `<div class="lg-item ${o.found ? 'done' : ''}"><b>${o.found ? '✓' : '○'} ${esc(o.title)}</b> <span class="muted">(${esc(o.kind)})</span><div>${esc(o.text)}</div>
    ${o.found ? '' : `<button class="btn small" data-lgx="found" data-k="${esc(o.id)}">They found it</button>`}</div>`).join('');
  if (s.complete) h += `<div class="lg-item"><b>💡 ${esc(s.lead.title)}</b><div>${esc(s.lead.text)}</div>${s.claimed ? '<div class="muted">Claimed.</div>' : `<button class="btn small primary" data-lgx="claim">Claim the lead</button>`}</div>`;
  h += `<div class="row"><button class="btn small" data-lgx="notes" title="The places they've studied and what they noticed, to every seated player's phone">📜 Send the field notes</button></div>`;
  return h;
}

/* ---------- 🔥 by the fire ---------- */
const outlooks = () => (C().campOutlooks ||= {});
const roster = () => companions().filter(t => outlooks()[t.id]).map(t => ({ id:t.id, name:t.name, outlook:outlooks()[t.id] }));
function campTab(){
  const cs = companions(), B = book('campBonds'), score = id => B.bonds.find(b => b.id === id)?.score ?? 0;
  let h = `<div class="muted">Companions are the allied NPCs travelling with the party. Give each an outlook; record the choices they saw; after a long rest, offer a scene.</div>`;
  if (!cs.length) return h + `<p class="muted">No allies on the map.</p>`;
  h += cs.map(t => `<div class="row"><span class="grow">${esc(t.name)}${outlooks()[t.id] ? ` <span class="muted">· ${score(t.id) > 0 ? '+' : ''}${score(t.id)}</span>` : ''}</span>
    ${sel(`lgOut-${t.id}`, [['', '(not at the fire)'], ...Object.entries(CAMP_OUTLOOKS).map(([k, o]) => [k, o.label])], outlooks()[t.id] || '', `data-outlook="${esc(t.id)}" title="${esc(Object.values(CAMP_OUTLOOKS).map(o => `${o.label}: ${o.values}`).join('\n'))}"`)}</div>`).join('');
  h += `<h4>A choice they witnessed</h4><div class="row">${sel('lgChoice', Object.entries(CAMP_CHOICES).map(([k, c]) => [k, c.label]), 'shelter-stranger')}
    <button class="btn small" data-lgx="choice" title="Everyone with an outlook on this floor saw it">Record it</button></div>`;
  const rest = C().lastRestId, offers = rest && roster().length ? campOffers(B, { restId:rest, present:roster() }) : [];
  h += `<h4>After the long rest</h4>${!rest ? '<p class="muted">Offers appear after the party takes a long rest.</p>' : offers.length ? offers.map(o => `<div class="lg-item"><b>${esc(o.name)}: ${esc(o.title)}</b> <span class="muted">(${esc(o.at)})</span><div><i>${esc(o.opening)}</i></div>${o.prompt ? `<div class="muted">${esc(o.prompt)}</div>` : ''}
    <div class="row"><button class="btn small" data-lgx="scene" data-id="${esc(o.companionId)}" data-k="${esc(o.id)}">Play it</button><button class="btn small" data-lgx="scene" data-id="${esc(o.companionId)}" data-k="${esc(o.id)}" data-share="1">Play it, on the screen</button></div></div>`).join('') : '<p class="muted">Nothing stirs at this fire tonight.</p>'}`;
  return h;
}

/* ---------- ⚖ bounties ---------- */
function bountyTab(){
  const L = book('townBounties'), hs = heroes();
  let h = `<div class="muted">An offence counts once a witness reaches the watch. Fines are house rules, in gold.</div>
    <div class="row">${sel('lgTown', Object.entries(TOWN_LAWS).map(([k, t]) => [k, t.name]), town)}</div>
    <h4>An offence</h4><div class="row">${sel('lgSuspect', hs.map(t => [t.id, t.name]), hs[0]?.id)}${sel('lgOffence', Object.entries(TOWN_OFFENCES).map(([k, o]) => [k, `${o.label} (${o.fine} gp)`]), 'theft')}
    <input class="txt" id="lgWitness" placeholder="who saw it (blank: no one)" style="width:170px"><button class="btn small" data-lgx="offence">Record</button></div>`;
  for (const t of hs){
    const st = bountyStatus(L, { townId:town, suspectId:t.id }); if (!st) continue;
    const open = L.cases.filter(c => c.townId === town && c.suspectId === t.id && !c.resolution);
    if (!open.length) continue;
    h += `<div class="lg-item"><b>${esc(t.name)}</b> ${st.fine ? `owes ${st.fine} gp` : ''}${st.prompt ? `<div><i>${esc(st.prompt)}</i></div>` : ''}
      ${open.map(c => `<div class="row"><span class="grow">${esc(TOWN_OFFENCES[c.offence].label)} · ${c.reportedBy ? `reported by ${esc(c.reportedBy)}` : c.witnesses.length ? `seen by ${esc(c.witnesses.join(', '))}, not yet reported` : 'unseen'}${c.publicName ? ' · 📜 posted' : ''}</span>
        ${!c.reportedBy && c.witnesses.length ? `<button class="btn small" data-lgx="report" data-id="${esc(c.id)}" data-k="${esc(c.witnesses[0])}">They report it</button>` : ''}
        ${c.reportedBy ? `${c.publicName ? '' : `<input class="txt" id="lgPost-${esc(c.id)}" value="${esc(t.name)}, a stranger" style="width:150px" title="How the notice describes them"><button class="btn small" data-lgx="post" data-id="${esc(c.id)}">Post a notice</button>`}<button class="btn small" data-lgx="settle" data-id="${esc(c.id)}" data-k="paid">Pay ${c.fine} gp</button><button class="btn small" data-lgx="settle" data-id="${esc(c.id)}" data-k="pardoned">Pardon</button>` : ''}</div>`).join('')}</div>`;
  }
  const notices = bountyNotices(L, town);
  if (notices.length) h += `<div class="row"><button class="btn small" data-lgx="wanted">📜 The wanted board, on the screen</button></div>`;
  return h;
}

/* ---------- 🛞 supply runs ---------- */
const guessPin = h => VALLEY_PLACES.find(p => p.id === h.pin || p.name === h.place || (h.place || '').includes(p.name))?.id || '';
function supplyTab(){
  const hs = holdings(), wagons = transport().filter(w => w.kind === 'wagon'), B = book('supplyRuns');
  let h = `<div class="muted">A wagon hauls stores between two holdings along the valley's roads. It arrives when the valley clock reaches its hour, or doesn't.</div>`;
  if (hs.length < 2 || !wagons.length) h += `<p class="muted">${hs.length < 2 ? 'It needs two holdings (🏰 Holdings).' : ''} ${!wagons.length ? 'It needs a wagon (🔨 Workshop).' : ''}</p>`;
  else {
    const busy = new Set(B.runs.filter(r => r.status === 'en-route' || r.status === 'missing').map(r => r.wagonId));
    const out = C().valley?.wagon;
    h += `<div class="row">From ${sel('lgFrom', hs.map(x => [x.id, x.name]), hs[0].id)} to ${sel('lgTo', hs.map(x => [x.id, x.name]), hs[1].id)}</div>
      <div class="row">${hs.slice(0, 8).map(x => `<label class="muted">${esc(x.name)} stands at ${sel(`lgPin-${x.id}`, [['', '(where?)'], ...VALLEY_PLACES.map(p => [p.id, p.name])], guessPin(x), `data-pin="${esc(x.id)}"`)}</label>`).join(' ')}</div>
      <div class="row">${sel('lgWagon', wagons.filter(w => !busy.has(w.id) && w.id !== out).map(w => [w.id, w.n || w.name || 'Wagon']), '')}${sel('lgPace', Object.keys(SUPPLY_PACES).map(k => [k, k]), 'steady')}
        ${['timber', 'stone', 'salt'].map(k => `<label class="muted">${k} <input class="txt num" type="number" min="0" id="lgCargo-${k}" value="${k === 'timber' ? 10 : 0}" style="width:56px"></label>`).join('')}</div>
      <div class="row"><button class="btn small" data-lgx="quote">Quote</button><button class="btn small primary" data-lgx="dispatch">Send it</button></div>`;
  }
  for (const r of [...B.runs].reverse().slice(0, 12)){
    h += `<div class="lg-item"><b>${esc(r.origin)} → ${esc(r.destination)}</b> <span class="muted">${esc(Object.entries(r.quote.cargo).map(([k, n]) => `${n} ${k}`).join(', '))} · ${esc(r.status)}${r.status === 'en-route' ? ` · due in ${Math.max(0, r.due - valleyHour())} h` : ''}</span>
      ${r.status === 'missing' ? `<div class="row"><button class="btn small" data-lgx="rescue" data-id="${esc(r.id)}">The rescue</button><button class="btn small" data-lgx="recovered" data-id="${esc(r.id)}">Crew saved, cargo back</button><button class="btn small" data-lgx="crewOnly" data-id="${esc(r.id)}">Crew saved, cargo lost</button><button class="btn small danger" data-lgx="writeoff" data-id="${esc(r.id)}">Write it off</button></div>` : ''}</div>`;
  }
  return h;
}
function cargoNow(){ const o = {}; for (const k of ['timber', 'stone', 'salt']){ const n = Math.round(+$(`#lgCargo-${k}`)?.value || 0); if (n > 0) o[k] = n; } return o; }
function supplyInput(){
  const from = holdings().find(x => x.id === $('#lgFrom')?.value), to = holdings().find(x => x.id === $('#lgTo')?.value), w = transport().find(x => x.id === $('#lgWagon')?.value);
  const pins = C().holdingPins ||= {};
  const a = pins[from?.id] || guessPin(from || {}), b = pins[to?.id] || guessPin(to || {});
  if (!from || !to || from === to){ toast('Pick two different holdings.'); return null; }
  if (!a || !b){ toast('Say where each holding stands in the valley.'); return null; }
  if (!w){ toast('Pick a wagon that is home.'); return null; }
  const wagon = { id:w.id, capacity:w.capacity, speed:w.speed, hp:w.hp, damage:w.damage || 0, fittings:w.fittings || [] };
  return { from:a, to:b, cargo:cargoNow(), wagon, pace:$('#lgPace')?.value || 'steady', weather:fourKind(wxNow()?.kind) || 'clear', gaze:state.dread || 1, origin:from, dest:to, name:w.n || w.name || 'The wagon' };
}
// the valley clock moved: runs that are due arrive, or go missing (overworld.js calls this on every passTime)
export function tickSupply(quiet = false){
  const c = C(); if (!c?.supplyRuns?.runs?.length) return;
  let B = c.supplyRuns, H = holdings(); const now = valleyHour();
  for (const r of B.runs.filter(x => x.status === 'en-route' && x.due <= now)){
    const out = checkSupplyRun(B, H, { id:r.id, now }); B = out.book; H = out.holdings;
    const after = B.runs.find(x => x.id === r.id);
    if (after.status === 'delivered'){ log(`🛞 ${r.origin}'s wagon reaches ${r.destination}: ${Object.entries(after.delivered).map(([k, n]) => `${n} ${k}`).join(', ')}.`, true); if (!quiet) toast(`🛞 The wagon reaches ${r.destination}.`); }
    else { log(`🛞 The wagon from ${r.origin} never reaches ${r.destination}.`, true); if (!quiet) showCard({ kind:'miss', title:'A wagon is missing', sub:`${r.origin} → ${r.destination}`, lines:['It should have arrived by now. 📒 The ledger → Supply runs has the rescue.'] }); }
  }
  syncHoldings(H); c.supplyRuns = B;
}
// the engine returns new holding objects: copy their stores back onto the live ones (the Holdings panel holds references)
function syncHoldings(H){ for (const h of H){ const live = holdings().find(x => x.id === h.id); if (live) live.stores = h.stores; } }

/* ---------- 🗳 a vote ---------- */
const seatedHeroes = () => heroes().filter(t => Object.values(state.seats || {}).includes(t.id));
function voteTab(){
  const v = C().partyVote, hs = heroes();
  if (v && v.status === 'open'){
    const voted = new Set(v.ballots.map(b => b.seatId));
    return `<div class="lg-item"><b>${esc(v.question)}</b><div class="muted">${v.options.map(o => esc(o.label)).join(' · ')}</div>
      <div class="row">${v.eligibleSeatIds.map(id => `<span class="chip ${voted.has(id) ? 'on' : ''}">${esc(tokById(id)?.name || id)} ${voted.has(id) ? '✓' : '…'}</span>`).join('')}</div>
      <div class="row">${v.eligibleSeatIds.filter(id => !voted.has(id)).map(id => `<span class="muted">${esc(tokById(id)?.name || id)}:</span>${v.options.map(o => `<button class="btn small" data-lgx="castFor" data-id="${esc(id)}" data-k="${esc(o.id)}" title="For a hero with no phone">${esc(o.label)}</button>`).join('')}`).join('<br>')}</div>
      <div class="row"><button class="btn small primary" data-lgx="closeVote">Close it and show the result</button><button class="btn small" data-lgx="cancelVote">Cancel</button></div></div>`;
  }
  let h = `<div class="muted">A question to the heroes' phones: one ballot each, abstaining allowed. The result goes on the screen.</div>
    <div class="row"><input class="txt" id="lgQ" placeholder="Do we take the stranger's offer?" style="flex:1"></div>
    <div class="row"><input class="txt" id="lgOpts" placeholder="Choices, separated by commas: Yes, No, Not tonight" style="flex:1"></div>
    <div class="row">${hs.map(t => `<span class="muted">${esc(t.name)}${Object.values(state.seats || {}).includes(t.id) ? ' 📱' : ''}</span>`).join(' · ') || '<span class="muted">No heroes.</span>'}</div>
    <div class="row"><button class="btn small primary" data-lgx="openVote">🗳 Put it to them</button></div>`;
  if (v?.status === 'closed') h += `<div class="lg-item">Last vote: <b>${esc(v.question)}</b> — ${esc(resultText(v))}</div>`;
  return h;
}
function resultText(v){
  const r = partyVoteForPlayers(v).result; if (!r) return '';
  const lab = id => v.options.find(o => o.id === id)?.label || id;
  const head = r.outcome === 'winner' ? `${lab(r.leaders[0])}` : r.outcome === 'tie' ? `a tie: ${r.leaders.map(lab).join(' / ')}` : 'no decision';
  return `${head} (${r.totals.map(t => `${lab(t.id)} ${t.votes}`).join(', ')}${r.abstentions ? `, ${r.abstentions} abstained` : ''}${r.outstanding ? `, ${r.outstanding} didn't vote` : ''})`;
}
function sendVote(){ const v = C().partyVote; if (!v) return; for (const id of v.eligibleSeatIds) sendToSeat(id, { t:'vote', vote:partyVoteForPlayers(v, id) }); }
// a ballot from a phone: the seat comes from the connection (net/table.js passes the hero it sits at)
export function castVoteFrom(me, m){
  const v = C()?.partyVote; if (!v || !me) return;
  const next = castPartyVote(v, me.id, { voteId:m.voteId, optionId:m.optionId ?? null });
  if (next === v) return;
  C().partyVote = next; sendToSeat(me.id, { t:'vote', vote:partyVoteForPlayers(next, me.id) }); changed();
  if (isOpen() && tab === 'vote') render();
}

/* ---------- the clicks ---------- */
function onChange(e){
  const t = e.target;
  if (t.id === 'lgPlace'){ place = t.value; render(); }
  else if (t.id === 'lgTown'){ town = t.value; render(); }
  else if (t.dataset.outlook){ if (t.value) outlooks()[t.dataset.outlook] = t.value; else delete outlooks()[t.dataset.outlook]; changed(); render(); }
  else if (t.dataset.pin){ (C().holdingPins ||= {})[t.dataset.pin] = t.value; changed(); }
}
function onClick(e){
  const b = e.target.closest('[data-lgx]'); if (!b) return;
  const k = b.dataset.lgx, id = b.dataset.id, key = b.dataset.k;
  try {
    if (k === 'close') return close();
    if (k === 'tab'){ tab = key; lastNote = ''; return render(); }
    // surveys
    if (k === 'found'){ put('fieldSurveys', recordObservation(book('fieldSurveys'), { placeId:place, observationId:key })); log(`🔎 A detail noticed at ${placeName(place)}.`, true); }
    else if (k === 'claim'){ const r = claimSurvey(book('fieldSurveys'), place); put('fieldSurveys', r.book); if (r.lead) lastNote = `💡 <b>${esc(r.lead.title)}</b>: ${esc(r.lead.text)}`; }
    else if (k === 'notes'){
      const notes = surveysForPlayers(book('fieldSurveys'));
      if (!notes.length){ toast('They have noticed nothing yet.'); return; }
      const text = notes.map(p => `${p.title}${p.complete ? ' ✓' : ''}\n${p.observations.map(o => `• ${o.title}: ${o.text}`).join('\n')}`).join('\n\n');
      const seats = seatedHeroes(); seats.forEach(t => sendToSeat(t.id, { t:'note', text:`📜 Field notes\n\n${text}`.slice(0, 1200), strahd:false }));
      lastNote = seats.length ? `Sent to ${seats.map(t => esc(t.name)).join(', ')}.` : 'No phones at the table: read them out.';
    }
    // by the fire
    else if (k === 'choice'){
      const here = roster().filter(r => tokById(r.id)?.floor === ui.floor), choice = $('#lgChoice').value;
      if (!here.length){ toast('No companion with an outlook is here to see it.'); return; }
      put('campBonds', recordCampChoice(book('campBonds'), { eventId:uid('choice'), choice, witnesses:here }));
      lastNote = `${here.map(r => esc(r.name)).join(', ')} saw it: ${esc(CAMP_CHOICES[choice].label.toLowerCase())}.`;
    }
    else if (k === 'scene'){
      const r = playCampScene(book('campBonds'), { restId:C().lastRestId, present:roster(), companionId:id, sceneId:key, share:!!b.dataset.share });
      if (r.scene){ put('campBonds', r.state); if (b.dataset.share) narrate(`${r.scene.name}, by the fire`, r.scene.opening); lastNote = `<i>${esc(r.scene.opening)}</i>`; }
    }
    // bounties
    else if (k === 'offence'){
      const w = ($('#lgWitness').value || '').split(',').map(s => s.trim()).filter(Boolean);
      put('townBounties', recordOffence(book('townBounties'), { id:uid('case'), townId:town, suspectId:$('#lgSuspect').value, offence:$('#lgOffence').value, witnesses:w }));
    }
    else if (k === 'report') put('townBounties', reportOffence(book('townBounties'), { id, witnessId:key }));
    else if (k === 'post'){ const name = ($(`#lgPost-${id}`)?.value || '').trim() || 'A stranger'; put('townBounties', postBounty(book('townBounties'), { id, publicName:name })); }
    else if (k === 'settle'){
      const L0 = book('townBounties'), c = L0.cases.find(x => x.id === id), plan = settleBounty(L0, { id, method:key });
      if (plan.costGp){ const t = tokById(c.suspectId), hero = state.characters?.[t?.charId]; const paid = hero && spendCoins(hero.coins || {}, plan.costGp); if (!paid){ toast(`${t?.name || 'They'} can't pay ${plan.costGp} gp.`); return; } hero.coins = paid; }
      if (plan.settled){ put('townBounties', plan.ledger); log(`⚖ ${tokById(c.suspectId)?.name || 'A hero'}: ${key === 'paid' ? `the fine paid, ${plan.costGp} gp` : 'pardoned'} in ${TOWN_LAWS[c.townId].name}.`); }
    }
    else if (k === 'wanted'){ const n = bountyNotices(book('townBounties'), town); narrate(`Wanted in ${TOWN_LAWS[town].name}`, n.map(x => `${x.name} — ${x.offence}. ${x.fine} gold.`).join('\n')); }
    // supply runs
    else if (k === 'quote'){ const s = supplyInput(); if (!s) return; const q = quoteSupplyRun(s); lastNote = `${q.hours} h on the road, ${Math.round(q.risk * 100)}% chance of trouble · ${q.pounds} lb · ${q.legs.map(l => esc(l.name)).join(' → ')}${q.reasons.length ? `<div class="muted">${esc(q.reasons.join(' '))}</div>` : ''}`; }
    else if (k === 'dispatch'){
      const s = supplyInput(); if (!s) return;
      const crew = (s.origin.hired || []).map(x => x.id).filter(Boolean).slice(0, 2);
      const out = dispatchSupplyRun(book('supplyRuns'), holdings(), { id:uid('run'), originId:s.origin.id, destinationId:s.dest.id, wagon:s.wagon, crewIds:crew.length ? crew : [`carters-${s.wagon.id}`], seed:String(state.meta.seed), now:valleyHour(), ...s });
      syncHoldings(out.holdings); put('supplyRuns', out.book); const r = out.book.runs.at(-1);
      log(`🛞 ${s.name} sets out from ${s.origin.name} for ${s.dest.name}, due in ${r.quote.hours} h.`, true); lastNote = `On the road: due in ${r.quote.hours} hours.`;
    }
    else if (k === 'rescue'){ const r = supplyRescue(book('supplyRuns'), id); if (r) showCard({ kind:'miss', title:r.title || 'The missing wagon', sub:r.leg?.name || '', flair:r.opening || '', lines:[r.prompt || '', ...(r.wagonLines || [])].filter(Boolean) }, false); }
    else if (k === 'recovered' || k === 'crewOnly'){
      const run = book('supplyRuns').runs.find(x => x.id === id);
      const out = resolveSupplyRun(book('supplyRuns'), holdings(), { id, now:valleyHour(), recovered:k === 'recovered' ? { ...run.quote.cargo } : {}, crew:'safe' });
      syncHoldings(out.holdings); put('supplyRuns', out.book);
    }
    else if (k === 'writeoff') put('supplyRuns', writeOffSupplyRun(book('supplyRuns'), { id, now:valleyHour() }));
    // a vote
    else if (k === 'openVote'){
      const q = $('#lgQ').value.trim(), opts = $('#lgOpts').value.split(',').map(s => s.trim()).filter(Boolean), hs = heroes();
      if (!q || opts.length < 2){ toast('A question and at least two choices.'); return; }
      C().partyVote = openPartyVote({ id:uid('vote'), question:q, options:opts.slice(0, 8).map((l, i) => ({ id:`o${i}`, label:l })), eligibleSeatIds:hs.map(t => t.id) });
      sendVote(); changed(); log(`🗳 A vote: ${q}`, true);
    }
    else if (k === 'castFor'){ castVoteFrom(tokById(id), { voteId:C().partyVote.id, optionId:key }); }
    else if (k === 'closeVote' || k === 'cancelVote'){
      const v = closePartyVote(C().partyVote, { cancel:k === 'cancelVote' }); C().partyVote = v; sendVote(); changed();
      if (k === 'closeVote'){ narrate(v.question, resultText(v)); lastNote = esc(resultText(v)); }
    }
  } catch (err){ toast(err.message || String(err)); return; }
  render();
}

/* ---------- the player's ballot ---------- */
function playerVote(v){
  let el = $('#votePop');
  if (!v || v.status === 'cancelled'){ el?.remove(); return; }
  if (!el){ el = document.createElement('div'); el.id = 'votePop'; el.className = 'modal'; document.body.appendChild(el);
    el.addEventListener('click', e => { const b = e.target.closest('[data-vote]'); if (!b) return; if (b.dataset.vote === 'x'){ el.remove(); return; } sendHost({ t:'vote', voteId:el.dataset.id, optionId:b.dataset.vote === '-' ? null : b.dataset.vote }); }); }
  el.dataset.id = v.id;
  const lab = id => v.options.find(o => o.id === id)?.label || 'abstain';
  el.innerHTML = `<div class="box" style="max-width:420px"><h2 style="margin-top:0">🗳 ${esc(v.question)}</h2>
    ${v.canVote ? `${v.options.map(o => `<button class="btn primary" style="display:block;width:100%;margin:6px 0" data-vote="${esc(o.id)}">${esc(o.label)}</button>`).join('')}<button class="btn small" data-vote="-">Abstain</button>`
      : v.result ? `<p>${v.result.outcome === 'winner' ? `<b>${esc(lab(v.result.leaders[0]))}</b>` : v.result.outcome === 'tie' ? `A tie: ${v.result.leaders.map(id => esc(lab(id))).join(' / ')}` : 'No decision.'}</p><p class="muted">${v.result.totals.map(t => `${esc(lab(t.id))}: ${t.votes}`).join(' · ')}</p>`
      : `<p class="muted">You chose: <b>${esc(v.hasVoted ? lab(v.choice) : '…')}</b>. Waiting for the others.</p>`}
    <div class="row"><button class="btn small" data-vote="x">Close</button></div></div>`;
  el.classList.remove('hidden');
}

let started = false;
export function ensureLedger(){
  if (started) return; started = true;
  const st = document.createElement('style');
  st.textContent = `.lg-sheet{max-width:700px}.lg-item{margin:8px 0;padding:8px 10px;border-left:2px solid rgba(255,255,255,.15);font-size:14px}.lg-item.done{opacity:.75;border-left-color:var(--gold)}`;
  document.head.appendChild(st);
  net.onVote = m => playerVote(m.vote);
  net.onVoteCast = castVoteFrom;
  hourHooks.push(() => tickSupply(false));
  registerCommands([{ id:'ledger', n:'The ledger', hint:'Field surveys, companions by the fire, bounties, supply runs and party votes', icon:'📒', role:'dm', run:() => openLedger() }]);
}
