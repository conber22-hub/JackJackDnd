/* 🎨 SHELLS AND STICKERS (brief-11): more handheld shells and vinyl stickers a player can stick on their own
   console, so four friends' phones on the table look like four different consoles. The pack's CSS is injected once;
   the menu's shell list and the shell's build are Claude's (the hook is in the PR), so until then the pack is driven
   through window.DreadDelve.shells. Stickers live per device in localStorage, separately for portrait and
   landscape, as % of .hh-body's box, so they survive any phone size. A sticker never sits over the screen itself:
   one dropped there is snapped off it. All art is our own inline SVG and CSS: no images from elsewhere, and no
   console maker's names, logos or trade dress. */
export const SHELL_PACK = [
  { k:'obsidian', label:'Ravenloft obsidian',
    vars:{ '--hh-a':'#16161d', '--hh-b':'#050507', '--hh-edge':'rgba(255,64,64,.6)', '--hh-ink':'#e8d8d8',
      '--hh-key':'#0c0c10', '--hh-key-hi':'#2a2a33', '--hh-key-ink':'#d8c8c8', '--hh-ab':'#5e0e14', '--hh-ab-hi':'#a01e26', '--hh-bezel':'#000000' },
    css:`#handheld[data-shell="obsidian"] .hh-body{background-image:radial-gradient(90% 60% at 50% 0%,rgba(255,255,255,.20),transparent 55%),radial-gradient(120% 90% at 50% 0%,rgba(255,255,255,.10),transparent 55%),linear-gradient(170deg,var(--hh-a),var(--hh-b));box-shadow:inset 0 2px 0 var(--hh-edge),inset 0 -6px 18px rgba(0,0,0,.5),0 0 0 1px rgba(120,10,16,.8)}` },
  { k:'vistani', label:'Vistani painted',
    vars:{ '--hh-a':'#8a1f24', '--hh-b':'#450d12', '--hh-edge':'rgba(233,165,74,.55)', '--hh-ink':'#f6dcae',
      '--hh-key':'#2a1210', '--hh-key-hi':'#5a2a20', '--hh-key-ink':'#f0d6a8', '--hh-ab':'#8a6d1f', '--hh-ab-hi':'#d4a437', '--hh-bezel':'#1c0d0d' },
    css:`#handheld[data-shell="vistani"] .hh-body{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='72'%3E%3Cg fill='none' stroke='%23d4a437' stroke-opacity='.30' stroke-width='2'%3E%3Cpath d='M6 36 q10 -14 20 0 t20 0'/%3E%3Cpath d='M6 14 q10 -8 20 2'/%3E%3Ccircle cx='36' cy='56' r='7'/%3E%3Cpath d='M52 62 q8 -6 12 0'/%3E%3C/g%3E%3C/svg%3E"),radial-gradient(120% 90% at 50% 0%,rgba(255,255,255,.16),transparent 55%),linear-gradient(170deg,var(--hh-a),var(--hh-b));background-size:72px 72px,auto,auto}` },
  { k:'amber', label:'Amber Temple',
    vars:{ '--hh-a':'rgba(233,165,74,.94)', '--hh-b':'rgba(122,62,10,.97)', '--hh-edge':'rgba(255,220,150,.55)', '--hh-ink':'#3a2005',
      '--hh-key':'#3a2410', '--hh-key-hi':'#6a4420', '--hh-key-ink':'#ffe2a0', '--hh-ab':'#5e3a08', '--hh-ab-hi':'#a06a1e', '--hh-bezel':'#241608' },
    css:`#handheld[data-shell="amber"] .hh-body{background-image:radial-gradient(55% 45% at 50% 46%,rgba(24,10,2,.55),transparent 72%),radial-gradient(120% 90% at 50% 0%,rgba(255,235,180,.30),transparent 55%),linear-gradient(170deg,var(--hh-a),var(--hh-b))}` },
  { k:'krezk', label:'Krezk whitewash',
    vars:{ '--hh-a':'#f2ede0', '--hh-b':'#cfc4a8', '--hh-edge':'rgba(255,255,255,.85)', '--hh-ink':'#4a4238',
      '--hh-key':'#3a3f46', '--hh-key-hi':'#5a6068', '--hh-key-ink':'#e8e4d8', '--hh-ab':'#7a2a2a', '--hh-ab-hi':'#a84a4a', '--hh-bezel':'#2b2b2e' },
    css:`#handheld[data-shell="krezk"] .hh-body{background-image:repeating-linear-gradient(0deg,rgba(90,70,40,.05) 0 2px,transparent 2px 6px),radial-gradient(120% 90% at 50% 0%,rgba(255,255,255,.25),transparent 55%),linear-gradient(170deg,var(--hh-a),var(--hh-b))}` },
  { k:'pine', label:'Svalich pine',
    vars:{ '--hh-a':'#7a5a34', '--hh-b':'#3e2c16', '--hh-edge':'rgba(255,230,180,.28)', '--hh-ink':'#f0dcc0',
      '--hh-key':'#2c1f10', '--hh-key-hi':'#54401e', '--hh-key-ink':'#e8d8b8', '--hh-ab':'#5e2a12', '--hh-ab-hi':'#8a4a22', '--hh-bezel':'#1a1208' },
    css:`#handheld[data-shell="pine"] .hh-body{background-image:repeating-linear-gradient(90deg,rgba(20,10,0,.16) 0 2px,transparent 2px 9px,rgba(255,230,180,.06) 9px 11px,transparent 11px 24px),radial-gradient(120% 90% at 50% 0%,rgba(255,255,255,.10),transparent 55%),linear-gradient(170deg,var(--hh-a),var(--hh-b))}` },
  { k:'wedding', label:'Wedding of the Count',
    vars:{ '--hh-a':'#f6f1e6', '--hh-b':'#d8cbb2', '--hh-edge':'rgba(255,255,255,.9)', '--hh-ink':'#6a5a48',
      '--hh-key':'#8a7a68', '--hh-key-hi':'#b0a28c', '--hh-key-ink':'#2e2620', '--hh-ab':'#b08a5a', '--hh-ab-hi':'#d4b078', '--hh-bezel':'#3a3230' },
    css:`#handheld[data-shell="wedding"] .hh-body{background-image:radial-gradient(circle at 25% 25%,rgba(120,90,50,.16) 1.5px,transparent 2.5px),radial-gradient(circle at 75% 75%,rgba(120,90,50,.12) 1.5px,transparent 2.5px),radial-gradient(120% 90% at 50% 0%,rgba(255,255,255,.25),transparent 55%),linear-gradient(170deg,var(--hh-a),var(--hh-b));background-size:26px 26px,26px 26px,auto,auto}` },
  { k:'frost', label:'Moonlit frost',
    vars:{ '--hh-a':'#bcd6e8', '--hh-b':'#6a8aa8', '--hh-edge':'rgba(255,255,255,.9)', '--hh-ink':'#2e4456',
      '--hh-key':'#2e4456', '--hh-key-hi':'#54708a', '--hh-key-ink':'#e0ecf4', '--hh-ab':'#7a9ab8', '--hh-ab-hi':'#a8c4d8', '--hh-bezel':'#1e2e3e' },
    css:`#handheld[data-shell="frost"] .hh-body{background-image:radial-gradient(130% 110% at 50% 50%,transparent 52%,rgba(255,255,255,.55) 100%),radial-gradient(120% 90% at 50% 0%,rgba(255,255,255,.30),transparent 55%),linear-gradient(170deg,var(--hh-a),var(--hh-b));box-shadow:inset 0 0 44px rgba(255,255,255,.45),inset 0 2px 0 var(--hh-edge),inset 0 -6px 18px rgba(0,0,0,.30),0 0 0 1px rgba(0,0,0,.55)}` },
  { k:'bloodmoon', label:'Bloodmoon',
    vars:{ '--hh-a':'#6e0d16', '--hh-b':'#2a0308', '--hh-edge':'rgba(255,120,120,.32)', '--hh-ink':'#f0b8a8',
      '--hh-key':'#0a0a0a', '--hh-key-hi':'#262626', '--hh-key-ink':'#e8c9b2', '--hh-ab':'#1c0e11', '--hh-ab-hi':'#3a1d22', '--hh-bezel':'#0d0508' },
    css:`#handheld[data-shell="bloodmoon"] .hh-body{background-image:radial-gradient(42% 32% at 50% 0%,rgba(255,48,48,.38),transparent 72%),radial-gradient(120% 90% at 50% 0%,rgba(255,255,255,.12),transparent 55%),linear-gradient(170deg,var(--hh-a),var(--hh-b))}` },
];

/* ---------- the stickers: sixteen of our own, drawn as inline SVG. `sil` is the silhouette (it gets the white
   die-cut edge and the shine clipped to it); `det` is the detail drawn on top, with its own colours. ---------- */
export const STICKERS = [
  { id:'bat', label:'Bat', fill:'#2a2138',
    sil:`<path d="M30 32 C22 20 12 16 5 20 C9 24 11 28 11 32 C7 32 5 34 5 36 C11 38 19 38 25 36 Z"/><path d="M34 32 C42 20 52 16 59 20 C55 24 53 28 53 32 C57 32 59 34 59 36 C53 38 45 38 39 36 Z"/><path d="M32 22 C29 22 27 25 27 29 C27 34 29 38 32 38 C35 38 37 34 37 29 C37 25 35 22 32 22 Z"/><path d="M28 23 L27 15 L31 20 Z"/><path d="M36 23 L37 15 L33 20 Z"/>`,
    det:`<circle cx="29" cy="28" r="1.6" fill="#e9a54a"/><circle cx="35" cy="28" r="1.6" fill="#e9a54a"/>` },
  { id:'rose', label:'Rose', fill:'#a01830',
    sil:`<path d="M32 12 C42 12 48 20 48 28 C48 38 40 44 32 44 C24 44 16 38 16 28 C16 20 22 12 32 12 Z"/><path d="M30 44 L34 44 L33 58 L31 58 Z" fill="#4a6a34"/><path d="M33 50 C40 46 46 48 48 54 C42 56 36 54 33 50 Z" fill="#4a6a34"/>`,
    det:`<path d="M32 20 C37 20 40 24 40 28 C40 33 36 36 32 36 C28 36 24 33 24 28 C24 24 27 20 32 20 Z" fill="#c02840"/><circle cx="32" cy="28" r="3" fill="#7a1020"/>` },
  { id:'raven', label:'Raven', fill:'#1c1c22',
    sil:`<path d="M18 44 C13 34 17 21 28 15 C30 14 33 14 34 16 L42 21 L54 24 L45 28 C47 35 42 43 34 47 C26 49 20 48 18 44 Z"/>`,
    det:`<path d="M42 21 L54 24 L43 27 Z" fill="#3a3a42"/><circle cx="30" cy="22" r="1.8" fill="#e9a54a"/><path d="M20 40 C26 42 34 42 40 38" stroke="#3a3a42" stroke-width="1.5" fill="none"/>` },
  { id:'candle', label:'Candle', fill:'#e8dfcf',
    sil:`<path d="M26 28 L38 28 L38 54 L26 54 Z"/><path d="M22 54 L42 54 L40 59 L24 59 Z" fill="#6a5a3a"/>`,
    det:`<path d="M32 9 C36 15 36 20 32 24 C28 20 28 15 32 9 Z" fill="#f0a832"/><rect x="31" y="24" width="2" height="5" fill="#3a2a1a"/><path d="M26 32 C28 36 26 40 28 44" stroke="#c8b890" stroke-width="1.5" fill="none"/>` },
  { id:'d20', label:'D20', fill:'#5b2a5e',
    sil:`<path d="M32 8 L54 20 L54 44 L32 56 L10 44 L10 20 Z"/>`,
    det:`<path d="M32 8 L32 32 M10 20 L32 32 M54 20 L32 32" stroke="#cfc4e8" stroke-width="1.5" fill="none"/><text x="32" y="45" text-anchor="middle" font-size="15" fill="#fff" font-family="Georgia,serif">20</text>` },
  { id:'skull', label:'Skull', fill:'#e8e0cc',
    sil:`<path d="M32 10 C44 10 50 20 50 30 C50 38 46 42 44 46 L44 52 L20 52 L20 46 C18 42 14 38 14 30 C14 20 20 10 32 10 Z"/>`,
    det:`<ellipse cx="24" cy="30" rx="4.5" ry="5.5" fill="#1c1c22"/><ellipse cx="40" cy="30" rx="4.5" ry="5.5" fill="#1c1c22"/><path d="M32 36 L29 42 L35 42 Z" fill="#1c1c22"/><path d="M26 52 L26 47 M32 52 L32 47 M38 52 L38 47" stroke="#8a7a5a" stroke-width="1.5"/>` },
  { id:'wheel', label:'Vistani wheel', fill:'#6a4426',
    sil:`<circle cx="32" cy="32" r="20"/>`,
    det:`<circle cx="32" cy="32" r="13" fill="#2a1c10"/><path d="M32 12 L32 52 M12 32 L52 32 M18 18 L46 46 M46 18 L18 46" stroke="#d8c8a8" stroke-width="2.5"/><circle cx="32" cy="32" r="4.5" fill="#d4a437"/>` },
  { id:'sun', label:'Sun', fill:'#e9a54a',
    sil:`<circle cx="32" cy="32" r="14"/><path d="M32 4 L35 13 L29 13 Z"/><path d="M32 60 L35 51 L29 51 Z"/><path d="M4 32 L13 29 L13 35 Z"/><path d="M60 32 L51 29 L51 35 Z"/><path d="M12 12 L19 17 L15 21 Z"/><path d="M52 12 L45 17 L49 21 Z"/><path d="M12 52 L19 47 L15 43 Z"/><path d="M52 52 L45 47 L49 43 Z"/>`,
    det:`<circle cx="27" cy="30" r="2" fill="#7a4a08"/><circle cx="37" cy="30" r="2" fill="#7a4a08"/><path d="M26 36 Q32 41 38 36" stroke="#7a4a08" stroke-width="2" fill="none"/>` },
  { id:'moon', label:'Crescent moon', fill:'#dfe8f0',
    sil:`<path d="M50 10 A28 28 0 1 0 50 54 A22 22 0 1 1 50 10 Z"/>`,
    det:`<path d="M52 26 L53.4 30 L57.5 31.4 L53.4 32.8 L52 37 L50.6 32.8 L46.5 31.4 L50.6 30 Z" fill="#e9a54a"/>` },
  { id:'amber', label:'Amber shard', fill:'#e9a54a',
    sil:`<path d="M32 8 L46 24 L40 54 L24 54 L18 24 Z"/>`,
    det:`<path d="M32 8 L40 24 L32 34 L24 24 Z" fill="#f6dcae" opacity=".75"/><path d="M24 24 L32 34 L40 24" stroke="#a06a1e" stroke-width="1.5" fill="none"/><path d="M32 34 L32 54" stroke="#a06a1e" stroke-width="1.5"/>` },
  { id:'garlic', label:'Garlic', fill:'#f0e8d8',
    sil:`<path d="M30 14 L34 14 L33 7 L31 7 Z"/><path d="M32 14 C22 14 16 24 16 34 C16 46 24 54 32 54 C40 54 48 46 48 34 C48 24 42 14 32 14 Z"/>`,
    det:`<path d="M32 18 C28 26 28 38 32 50 M32 18 C36 26 36 38 32 50" stroke="#c8b898" stroke-width="1.5" fill="none"/>` },
  { id:'holy', label:'Holy symbol', fill:'#d4a437',
    sil:`<circle cx="32" cy="32" r="13"/><path d="M32 8 L34.5 15 L29.5 15 Z"/><path d="M32 56 L34.5 49 L29.5 49 Z"/><path d="M8 32 L15 29.5 L15 34.5 Z"/><path d="M56 32 L49 29.5 L49 34.5 Z"/><path d="M15 15 L20 19 L16.5 22.5 Z"/><path d="M49 15 L44 19 L47.5 22.5 Z"/><path d="M15 49 L20 45 L16.5 41.5 Z"/><path d="M49 49 L44 45 L47.5 41.5 Z"/>`,
    det:`<circle cx="32" cy="32" r="7.5" fill="#8a6d1f"/><circle cx="32" cy="32" r="3.5" fill="#a01830"/>` },
  { id:'wolf', label:'Wolf', fill:'#5a6068',
    sil:`<path d="M18 10 L22 22 L20 34 C20 42 26 50 32 52 C38 50 44 42 44 34 L42 22 L46 10 L36 16 C34 15 30 15 28 16 Z"/>`,
    det:`<circle cx="26" cy="30" r="1.8" fill="#e9a54a"/><circle cx="38" cy="30" r="1.8" fill="#e9a54a"/><path d="M29 44 L35 44 L32 48 Z" fill="#1c1c22"/><path d="M32 48 L32 51" stroke="#1c1c22" stroke-width="1.5"/>` },
  { id:'coffin', label:'Coffin', fill:'#3a2a1e',
    sil:`<path d="M24 8 L40 8 L46 20 L42 56 L22 56 L18 20 Z"/>`,
    det:`<path d="M32 20 L32 34 M27 25 L37 25" stroke="#d4a437" stroke-width="3"/><path d="M24 14 L40 14 M22 50 L42 50" stroke="#1c1410" stroke-width="1.5"/>` },
  { id:'scroll', label:"Don't wake the Count", fill:'#e8dfc8',
    sil:`<path d="M16 14 L48 14 L48 50 L16 50 Z"/><rect x="11" y="12" width="6" height="40" rx="3" fill="#c8b890"/><rect x="47" y="12" width="6" height="40" rx="3" fill="#c8b890"/>`,
    det:`<text x="32" y="27" text-anchor="middle" font-size="6.5" fill="#5a3a1a" font-family="Georgia,serif">DON'T WAKE</text><text x="32" y="37" text-anchor="middle" font-size="6.5" fill="#5a3a1a" font-family="Georgia,serif">THE COUNT</text><path d="M22 44 L42 44" stroke="#8a7a5a" stroke-width="1.5"/>` },
  { id:'ghost', label:'Little ghost', fill:'#e8ecf0',
    sil:`<path d="M32 10 C22 10 16 18 16 28 L16 48 L21 44 L26 48 L32 44 L38 48 L43 44 L48 48 L48 28 C48 18 42 10 32 10 Z"/>`,
    det:`<ellipse cx="26" cy="28" rx="2.5" ry="4" fill="#1c1c22"/><ellipse cx="38" cy="28" rx="2.5" ry="4" fill="#1c1c22"/><ellipse cx="32" cy="38" rx="3" ry="2" fill="#1c1c22"/>` },
];

/* ---------- keeping: per device, portrait and landscape apart, positions in % of .hh-body's box ---------- */
const KEY = 'dreaddelve.stickers.v1';
const MAX = 12;            // at most twelve on a shell
const BASE_SIZE = 64;      // a sticker's size in px at scale 1
const blank = () => ({ portrait:[], landscape:[] });
function loadAll(){ try { const v = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (v && Array.isArray(v.portrait) && Array.isArray(v.landscape)) return v; } catch {} return blank(); }
function saveAll(v){ try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} }
const orient = () => (typeof matchMedia !== 'undefined' && matchMedia('(orientation:portrait)').matches) ? 'portrait' : 'landscape';
const stickersFor = (o = orient()) => loadAll()[o];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* ---------- the vinyl look: a white die-cut edge round the silhouette, a shine clipped to it ---------- */
function svgFor(d){
  return `<svg viewBox="0 0 64 64" role="img" aria-label="${d.label}"><defs><clipPath id="clip-${d.id}">${d.sil}</clipPath><linearGradient id="shine-${d.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".45" stop-color="#fff" stop-opacity=".08"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><g fill="${d.fill}" stroke="#fff" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">${d.sil}</g><g clip-path="url(#clip-${d.id})"><rect width="64" height="64" fill="url(#shine-${d.id})"/></g><g stroke="none">${d.det || ''}</g></svg>`;
}
export function stickerSVG(id){ const d = STICKERS.find(s => s.id === id); return d ? svgFor(d) : ''; }

/* ---------- the pack's CSS, injected once ---------- */
const BASE_CSS = `
.hh-stickers{position:absolute;inset:0;pointer-events:none;z-index:0}
.hh-left,.hh-right,.hh-pills{position:relative;z-index:1}   /* the stickers sit between the body and the controls */
.hh-sticker{position:absolute;width:64px;height:64px;transform:translate(-50%,-50%);pointer-events:none}
.hh-sticker svg{width:100%;height:100%;display:block;filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))}
.hh-stickers.editing .hh-sticker{cursor:grab;touch-action:none}
.hh-sticker.sel{outline:2px dashed rgba(255,255,255,.75);outline-offset:3px;border-radius:10px}
.hh-sticker-ghost{position:fixed;z-index:200;width:64px;height:64px;pointer-events:none;transform:translate(-50%,-50%);opacity:.92}
.hh-sticker-ghost svg{width:100%;height:100%;display:block}
#stickerBook{position:fixed;inset:0;z-index:120;display:flex;flex-direction:column;pointer-events:none;font-family:Cinzel,Georgia,serif;color:#f0d6a8;touch-action:none}
.sb-head{display:flex;align-items:center;gap:10px;padding:10px 12px;pointer-events:auto;background:linear-gradient(180deg,rgba(12,7,12,.94),rgba(12,7,12,.82));border-bottom:1px solid rgba(233,165,74,.35)}
.sb-head b{font-size:17px;letter-spacing:.06em}
.sb-count{font-size:13px;color:#c8b898}
.sb-count.full{color:#f08a8a}
.sb-tools{display:flex;gap:6px;margin-left:auto}
.sb-tools button,.sb-head>button{pointer-events:auto;border:1px solid rgba(233,165,74,.5);background:rgba(233,165,74,.16);color:#f6dcae;font:inherit;font-size:14px;padding:5px 10px;border-radius:999px;cursor:pointer}
.sb-tools button:disabled{opacity:.4}
.sb-head>button.arm{background:rgba(160,30,38,.5)}
.sb-stage{flex:1;pointer-events:auto}
.sb-tray{display:flex;gap:8px;overflow-x:auto;padding:10px 12px;pointer-events:auto;background:linear-gradient(0deg,rgba(12,7,12,.94),rgba(12,7,12,.82));border-top:1px solid rgba(233,165,74,.35);scrollbar-width:thin}
.sb-tray button{flex:0 0 auto;width:60px;height:66px;padding:2px;border:1px solid rgba(233,165,74,.35);border-radius:12px;background:rgba(255,255,255,.07);cursor:grab;touch-action:none}
.sb-tray button svg{width:100%;height:44px;display:block}
.sb-tray button span{display:block;font-size:8px;color:#c8b898;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
`;
let cssIn = false;
export function injectShells(){
  if (cssIn || document.getElementById('shellsCss')){ cssIn = true; return; }
  const st = document.createElement('style'); st.id = 'shellsCss';
  let css = BASE_CSS;
  for (const sh of SHELL_PACK) css += `\n#handheld[data-shell="${sh.k}"]{${Object.entries(sh.vars).map(([k, v]) => `${k}:${v};`).join('')}}` + (sh.css ? `\n${sh.css}` : '');
  st.textContent = css; document.head.appendChild(st); cssIn = true;
}

/* ---------- putting the saved stickers on the shell ---------- */
let layer = null, layerBody = null, orientBound = false, lastOrient = null, selIdx = null;
function stickerEl(st){
  const el = document.createElement('div');
  el.className = 'hh-sticker'; el.dataset.id = st.id;
  el.innerHTML = svgFor(STICKERS.find(d => d.id === st.id) || STICKERS[0]);
  el.style.left = st.x + '%'; el.style.top = st.y + '%';
  el.style.transform = `translate(-50%,-50%) rotate(${st.r || 0}deg) scale(${st.s || 1})`;
  return el;
}
// A sticker over the bezel is allowed, but never over the screen itself: move it to the nearest clear side.
function snapOffScreen(body, st){
  const scr = document.getElementById('hhScreen');
  if (!scr) return st;
  const br = body.getBoundingClientRect(), sr = scr.getBoundingClientRect();
  if (!br.width || !br.height) return st;
  const half = (BASE_SIZE * (st.s || 1)) / 2 + 2;
  const sx0 = sr.left - br.left, sy0 = sr.top - br.top, sx1 = sx0 + sr.width, sy1 = sy0 + sr.height;
  const cx = st.x / 100 * br.width, cy = st.y / 100 * br.height;
  if (cx + half <= sx0 || cx - half >= sx1 || cy + half <= sy0 || cy - half >= sy1) return st;   // clear already
  const opts = [
    { x:st.x, y:(sy0 - half - 2) / br.height * 100, d:cy - (sy0 - half - 2) },
    { x:st.x, y:(sy1 + half + 2) / br.height * 100, d:(sy1 + half + 2) - cy },
    { x:(sx0 - half - 2) / br.width * 100, y:st.y, d:cx - (sx0 - half - 2) },
    { x:(sx1 + half + 2) / br.width * 100, y:st.y, d:(sx1 + half + 2) - cx },
  ].filter(o => o.x >= 2 && o.x <= 98 && o.y >= 2 && o.y <= 98);
  if (!opts.length) return { ...st, x:clamp(st.x, 2, 98), y:clamp(st.y, 2, 98) };
  opts.sort((a, b) => a.d - b.d);
  const best = opts[0];
  return { ...st, x:Math.round(best.x * 10) / 10, y:Math.round(best.y * 10) / 10 };
}
function applySel(){
  if (layer) [...layer.children].forEach((el, i) => el.classList.toggle('sel', i === selIdx));
  const t = book?.querySelector('.sb-tools');
  if (t) for (const b of t.querySelectorAll('button')) b.disabled = selIdx == null;
}
function renderStickers(){
  if (!layer || !layerBody) return;
  const o = orient();
  if (lastOrient !== null && o !== lastOrient) selIdx = null;   // a turn is a different shell's worth
  lastOrient = o;
  const all = loadAll();
  let list = all[o].filter(s => STICKERS.some(d => d.id === s.id)).slice(0, MAX);
  let changed = list.length !== all[o].length;
  list = list.map(s => { const n = snapOffScreen(layerBody, s);
    if (n.x !== s.x || n.y !== s.y){ changed = true; return n; } return s; });
  if (changed){ all[o] = list; saveAll(all); }
  layer.replaceChildren(...list.map(stickerEl));
  const c = document.querySelector('.sb-count');
  if (c){ c.textContent = `${list.length} / ${MAX}`; c.classList.toggle('full', list.length >= MAX); }
  applySel();
}
export function mountStickers(shellEl){
  injectShells();
  const hh = shellEl || document.querySelector('#handheld');
  if (!hh) return null;
  const body = hh.querySelector('.hh-body');
  if (!body) return null;
  layerBody = body;
  layer = body.querySelector('.hh-stickers');
  if (!layer){ layer = document.createElement('div'); layer.className = 'hh-stickers'; body.prepend(layer); }
  renderStickers();
  if (!orientBound){ orientBound = true;
    if (typeof matchMedia !== 'undefined'){ const mq = matchMedia('(orientation:portrait)'); mq.addEventListener?.('change', renderStickers); }
    addEventListener('orientationchange', () => setTimeout(renderStickers, 250));
  }
  return layer;
}

/* ---------- the sticker book: a sheet over the phone. The middle is the shell itself, seen through the sheet
   (the sheet's stage sits over it and takes the taps, so the shell's own buttons stay quiet while you edit);
   the stickers live in a tray along the bottom. Drag one onto the shell, drag it to move it, twist it with two
   fingers (or the ⟲ ⟳ buttons), pinch or tap −/+ to scale, drag it back to the tray to peel it off. ---------- */
let book = null, bookOnClose = null, drag = null, clearArm = null;
function selectIdx(i){ selIdx = (i == null || i < 0) ? null : i; applySel(); }
function stickerAt(x, y){
  if (!layer) return null;
  for (const el of [...layer.children].reverse()){ const r = el.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return el; }
  return null;
}
function flashFull(){
  const c = book?.querySelector('.sb-count'); if (!c) return;
  c.classList.add('full'); c.textContent = '12 at most — peel one off first';
  setTimeout(() => renderStickers(), 2000);
}
function startTrayDrag(id, e){
  if (stickersFor().length >= MAX){ flashFull(); return; }
  e.preventDefault();
  const ghost = document.createElement('div');
  ghost.className = 'hh-sticker-ghost'; ghost.innerHTML = svgFor(STICKERS.find(d => d.id === id));
  document.body.appendChild(ghost);
  drag = { mode:'tray', id, ghost };
  moveGhost(e);
}
function moveGhost(e){ if (drag?.ghost){ drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px'; } }
function dropTray(e){
  const d = drag; drag = null;
  d.ghost?.remove();
  const tray = book.querySelector('.sb-tray').getBoundingClientRect();
  if (e.clientY >= tray.top && e.clientX >= tray.left && e.clientX <= tray.right) return;   // back on the tray: cancelled
  const br = layerBody.getBoundingClientRect();
  if (e.clientX < br.left || e.clientX > br.right || e.clientY < br.top || e.clientY > br.bottom) return;   // off the shell: cancelled
  const all = loadAll(), o = orient();
  if (all[o].length >= MAX) return;
  const st = snapOffScreen(layerBody, { id:d.id, x:(e.clientX - br.left) / br.width * 100, y:(e.clientY - br.top) / br.height * 100, r:0, s:1 });
  all[o].push(st); saveAll(all); renderStickers(); selectIdx(all[o].length - 1);
}
function startMoveDrag(el, e){
  const idx = [...layer.children].indexOf(el); if (idx < 0) return;
  selectIdx(idx);
  e.preventDefault();
  const st = loadAll()[orient()][idx];
  drag = { mode:'move', el, idx, pointers:new Map([[e.pointerId, { x:e.clientX, y:e.clientY }]]),
    orig:{ x:st.x, y:st.y }, startX:e.clientX, startY:e.clientY, cur:null };
}
function moveStickerEl(e){
  const br = layerBody.getBoundingClientRect();
  const x = clamp(drag.orig.x + (e.clientX - drag.startX) / br.width * 100, 2, 98);
  const y = clamp(drag.orig.y + (e.clientY - drag.startY) / br.height * 100, 2, 98);
  drag.el.style.left = x + '%'; drag.el.style.top = y + '%';
  drag.cur = { x, y };
}
function dropMove(e){
  const d = drag; drag = null;
  const tray = book.querySelector('.sb-tray').getBoundingClientRect();
  const all = loadAll(), o = orient(), list = all[o];
  if (e.clientY >= tray.top && e.clientY <= tray.bottom && e.clientX >= tray.left && e.clientX <= tray.right){
    list.splice(d.idx, 1); saveAll(all); selIdx = null; renderStickers(); return;   // peeled off
  }
  const st = list[d.idx]; if (!st) return;
  const pos = d.cur || { x:st.x, y:st.y };
  Object.assign(st, snapOffScreen(layerBody, { ...st, x:pos.x, y:pos.y }));
  saveAll(all); renderStickers(); selectIdx(d.idx);
}
// A second finger on the same sticker: twist to turn it, pinch to scale it.
function addGesturePointer(e){
  drag.pointers.set(e.pointerId, { x:e.clientX, y:e.clientY });
  if (drag.pointers.size !== 2) return;
  const [a, b] = [...drag.pointers.values()];
  drag.mode = 'gesture';
  drag.baseAngle = Math.atan2(b.y - a.y, b.x - a.x);
  drag.baseDist = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const st = loadAll()[orient()][drag.idx];
  drag.baseR = st.r || 0; drag.baseS = st.s || 1; drag.curR = null; drag.curS = null;
}
function updateGesture(e){
  const p = drag.pointers.get(e.pointerId); if (!p) return;
  p.x = e.clientX; p.y = e.clientY;
  const [a, b] = [...drag.pointers.values()];
  const r = drag.baseR + (Math.atan2(b.y - a.y, b.x - a.x) - drag.baseAngle) * 180 / Math.PI;
  const s = clamp(drag.baseS * (Math.hypot(b.x - a.x, b.y - a.y) || 1) / drag.baseDist, .5, 2.5);
  drag.el.style.transform = `translate(-50%,-50%) rotate(${r}deg) scale(${s})`;
  drag.curR = r; drag.curS = s;
}
function saveGesture(d){
  const all = loadAll(), st = all[orient()][d.idx]; if (!st) return;
  if (d.curR != null) st.r = Math.round(((d.curR % 360) + 360) % 360);
  if (d.curS != null) st.s = Math.round(d.curS * 100) / 100;
  saveAll(all); renderStickers(); selectIdx(d.idx);
}
function adjustSel(dr, ds){
  if (selIdx == null) return;
  const all = loadAll(), st = all[orient()][selIdx]; if (!st) return;
  st.r = Math.round(((st.r || 0) + dr + 360) % 360);
  st.s = Math.round(clamp((st.s || 1) * ds, .5, 2.5) * 100) / 100;
  saveAll(all); renderStickers(); selectIdx(selIdx);
}
function clearAll(btn){
  if (clearArm){ clearTimeout(clearArm); clearArm = null; btn.textContent = 'Clear'; btn.classList.remove('arm');
    const all = loadAll(); all[orient()] = []; saveAll(all); selIdx = null; renderStickers(); return; }
  btn.textContent = 'Sure?'; btn.classList.add('arm');
  clearArm = setTimeout(() => { btn.textContent = 'Clear'; btn.classList.remove('arm'); clearArm = null; }, 3000);
}
function onPointerDown(e){
  if (!book) return;
  if (drag){
    if (drag.mode === 'move' && drag.pointers.size === 1 && stickerAt(e.clientX, e.clientY) === drag.el) addGesturePointer(e);
    return;
  }
  const trayBtn = e.target.closest?.('.sb-tray [data-sticker]');
  if (trayBtn){ startTrayDrag(trayBtn.dataset.sticker, e); return; }
  const stEl = stickerAt(e.clientX, e.clientY);
  if (stEl){ startMoveDrag(stEl, e); return; }
  if (!e.target.closest('.sb-head, .sb-tray')) selectIdx(null);   // a tap on the shell's empty space
}
function onPointerMove(e){
  if (!drag) return;
  if (drag.mode === 'gesture'){ updateGesture(e); return; }
  if (drag.mode === 'tray'){ moveGhost(e); return; }
  if (drag.mode === 'move'){
    const p = drag.pointers.get(e.pointerId); if (!p) return;
    p.x = e.clientX; p.y = e.clientY; moveStickerEl(e);
  }
}
function onPointerUp(e){
  if (!drag) return;
  if (drag.mode === 'tray'){ dropTray(e); return; }
  drag.pointers.delete(e.pointerId);
  if (drag.mode === 'gesture'){
    if (drag.pointers.size === 0){ const d = drag; drag = null; saveGesture(d); }
    else if (drag.pointers.size === 1){   // one finger left: back to moving with it
      drag.mode = 'move';
      const p = [...drag.pointers.values()][0];
      drag.startX = p.x; drag.startY = p.y;
      const st = loadAll()[orient()][drag.idx];
      drag.orig = { x:st.x, y:st.y }; drag.cur = null;
    }
    return;
  }
  if (drag.pointers.size === 0) dropMove(e);
}
function closeBook(){
  if (!book) return;
  book.remove(); book = null;
  layer?.classList.remove('editing');
  document.removeEventListener('pointerdown', onPointerDown);
  document.removeEventListener('pointermove', onPointerMove);
  document.removeEventListener('pointerup', onPointerUp);
  document.removeEventListener('pointercancel', onPointerUp);
  if (clearArm){ clearTimeout(clearArm); clearArm = null; }
  const cb = bookOnClose; bookOnClose = null; selIdx = null; drag = null;
  applySel();   // the last-picked sticker's dashed outline goes with the book
  cb?.();
}
export function openStickerBook({ onClose } = {}){
  if (book) return book;
  mountStickers();
  if (!layer) return null;
  bookOnClose = onClose || null; selIdx = null;
  book = document.createElement('div'); book.id = 'stickerBook';
  book.innerHTML = `<div class="sb-head"><b>Stickers</b><span class="sb-count"></span><span class="sb-tools"><button data-sb="rotL" title="Turn left">⟲</button><button data-sb="rotR" title="Turn right">⟳</button><button data-sb="smaller" title="Smaller">−</button><button data-sb="bigger" title="Bigger">+</button></span><button data-sb="clear">Clear</button><button data-sb="done">Done</button></div><div class="sb-stage"></div><div class="sb-tray">${STICKERS.map(d => `<button data-sticker="${d.id}" title="${d.label}">${svgFor(d)}<span>${d.label}</span></button>`).join('')}</div>`;
  document.body.appendChild(book);
  layer.classList.add('editing');
  book.addEventListener('click', e => {
    const b = e.target.closest('[data-sb]'); if (!b) return;
    const k = b.dataset.sb;
    if (k === 'done') closeBook();
    else if (k === 'clear') clearAll(b);
    else if (k === 'rotL') adjustSel(-15, 1);
    else if (k === 'rotR') adjustSel(15, 1);
    else if (k === 'smaller') adjustSel(0, .85);
    else if (k === 'bigger') adjustSel(0, 1.18);
  });
  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('pointercancel', onPointerUp);
  renderStickers(); selectIdx(null);
  return book;
}
