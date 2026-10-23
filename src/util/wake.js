/* KEEP AWAKE — the TV screen and a hero card on a phone shouldn't dim and lock mid-fight (the Screen Wake Lock
   API, in Chrome, Edge and Safari 16.4+). The browser lets go whenever the page is hidden, so it's asked for again
   when the page comes back. Where there is no wake lock, nothing happens. */
let want = false, lock = null;

async function grab(){
  if (!want || lock || document.visibilityState !== 'visible' || !navigator.wakeLock) return;
  try { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } catch { lock = null; }
}
export function keepAwake(on){
  want = !!on;
  if (want) grab(); else { lock?.release().catch(() => {}); lock = null; }
}
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', grab);
export const awake = () => !!lock;
