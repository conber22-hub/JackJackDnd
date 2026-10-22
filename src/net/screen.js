/* THE TABLE SCREEN'S WIRE — a second window of this same browser (dragged onto the TV, or a second monitor)
   talks to the DM's window over a BroadcastChannel: no table to open, no internet. The DM's side treats it as
   one more connection (net/table.js addLocalScreen), so it gets everything players get, redacted the same.
   A screen on another device (a smart TV's browser, a tablet) joins with the table code instead (?screen=CODE). */
import { state, ui } from '../engine/state.js';
import { addLocalScreen, dropLocalScreen, onClientMsg } from './table.js';

const CH = 'dreaddelve-screen';
const chan = () => typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CH);

// The DM's window: answer screens that say hello (once there's a delve to show), and wave when (re)loaded.
export function listenForScreens(){
  const ch = chan(); if (!ch) return;
  ch.onmessage = e => {
    const m = e.data; if (!m || ui.role !== 'dm') return;
    if (m.t === 'screenHello' && state) addLocalScreen('screen:' + m.id, x => ch.postMessage({ to:m.id, m:x }));
    else if (m.t === 'screenBye') dropLocalScreen('screen:' + m.id);
  };
  ch.postMessage({ t:'dmHere' });
}
// The screen's window: say hello until the DM's window answers with the state; again if the DM's window reloads.
export function runLocalScreen(){
  const ch = chan(); if (!ch) return false;
  const id = Math.random().toString(36).slice(2, 9);
  let got = false, timer = null;
  const hello = () => { clearTimeout(timer); if (got) return; ch.postMessage({ t:'screenHello', id }); timer = setTimeout(hello, 1500); };
  ch.onmessage = e => {
    const d = e.data; if (!d) return;
    if (d.t === 'dmHere'){ got = false; hello(); return; }
    if (d.to !== id) return;
    if (d.m?.t === 'state') got = true;
    onClientMsg(d.m);
  };
  addEventListener('beforeunload', () => ch.postMessage({ t:'screenBye', id }));
  hello();
  return true;
}
