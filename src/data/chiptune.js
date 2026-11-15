/* Original miniature scores, written for Dread Delve. No borrowed melodies.
   Whitespace separates pitch/length tokens. Pitches: A–G, optional #/b, octave 0–8.
   r = rest; noise uses x (short), X (heavy), h (hat). Length is 1/2/4/8/16/32;
   suffix . multiplies length by 3/2, suffix t by 2/3 (never both). No ties or slides.
   Volumes multiply voice gain by hit gain (x .65, X 1, h .35; pitched notes 1).
   Each denominator describes the sounding duration, including drums. Playback may
   shape an envelope inside it. Trailing rests do not extend duration(). The quiet
   lowHealth score ends on its eight-beat boundary so its loop keeps two full 4/4 bars.
   E minor is home; F natural and D# add unease to the Gaze, not a cheerful major cadence. */
const pulse = (notes, vol = .28, duty = .25) => ({ wave:'square', duty, vol, notes });
const bass = (notes, vol = .32) => ({ wave:'triangle', vol, notes });
const drum = (notes, vol = .16) => ({ wave:'noise', vol, notes });
export const SONGS = [
  { id:'boot', title:'An eye in the lantern', bpm:120, loop:false, voices:{
    pulse1:pulse('E3/8 r/16 B4/16 F#5/8 G5/8 E5/4.'),
    pulse2:pulse('r/4 E4/8 B4/8 G4/4.', .16, .5),
    tri:bass('E2/4 B2/4 E3/4.'), noise:drum('h/16 r/8. r/4 x/16', .10) } },
  { id:'turnStart', title:'Your lantern forward', bpm:144, loop:false, voices:{
    pulse1:pulse('B4/16 E5/8 G5/16 F#5/8 E5/8', .24),
    pulse2:pulse('r/8 B3/8 B4/4', .12, .5), tri:bass('E3/2', .22), noise:drum('x/16', .12) } },
  { id:'turnOther', title:'Another candle', bpm:120, loop:false, voices:{
    pulse1:pulse('G4/8 E4/8', .06, .5) } },
  { id:'levelUp', title:'A step further into the dark', bpm:132, loop:false, voices:{
    pulse1:pulse('E5/8 B5/16 G5/16 A5/8 F#5/8 G5/4 B5/8 D6/8 E6/4', .30),
    pulse2:pulse('B4/4 E5/4 D5/4 G5/4 B4/4', .18, .5),
    tri:bass('E3/4 C3/4 A2/4 B2/4 E3/4'), noise:drum('x/8 h/8 r/4 x/8 h/8 X/4 r/8 h/8') } },
  { id:'victory', title:'Dawn through the shutters', bpm:120, loop:false, voices:{
    pulse1:pulse('G5/8 E5/16 B4/16 D5/4 B5/8 A5/8 G5/4 E5/4'),
    pulse2:pulse('E4/4 B4/4 F#4/4 G4/4 B4/4', .18, .5),
    tri:bass('E3/4 D3/4 C3/4 B2/4 E3/4'), noise:drum('X/8 r/8 h/8 h/8 x/4 r/4 x/4') } },
  { id:'defeat', title:'The wick goes cold', bpm:108, loop:false, voices:{
    pulse1:pulse('B4/8 G4/4 F#4/8 D4/4 E4/4.', .20, .5),
    pulse2:pulse('G3/4 E3/4 B2/4 B3/4.', .12),
    tri:bass('E3/4 C3/4 B2/4 E2/4.', .28), noise:drum('X/8 r/8 h/4', .10) } },
  { id:'questNew', title:'A thread on the map', bpm:120, loop:false, voices:{
    pulse1:pulse('F#5/16 E5/8 B4/16 G5/4', .22),
    pulse2:pulse('r/4 E4/4', .12, .5), tri:bass('E3/2', .22), noise:drum('h/16', .08) } },
  { id:'questDone', title:'One promise kept', bpm:120, loop:false, voices:{
    pulse1:pulse('B4/8 D5/8 G5/4 F#5/8 B5/8 E5/4', .25),
    pulse2:pulse('G4/4 E4/4 D4/4 G4/4', .15, .5),
    tri:bass('C3/4 A2/4 B2/4 E3/4'), noise:drum('x/8 r/8 h/4 r/4 x/4', .12) } },
  { id:'save', title:'Ink sealed', bpm:120, loop:false, voices:{
    pulse1:pulse('B5/16 G5/16 E6/8', .17), tri:bass('E3/4', .16) } },
  { id:'load', title:'The page turns back', bpm:120, loop:false, voices:{
    pulse1:pulse('E6/32 D6/32 B5/16 G5/8 E5/8', .17),
    pulse2:pulse('r/8 B4/4', .09, .5), tri:bass('E3/4.', .15) } },
  { id:'menuMove', title:'A small choice', bpm:120, loop:false, voices:{ pulse1:pulse('B5/32', .09) } },
  { id:'menuOk', title:'The seal agrees', bpm:144, loop:false, voices:{ pulse1:pulse('E5/32 G5/16', .12) } },
  { id:'menuBack', title:'One page back', bpm:120, loop:false, voices:{ tri:bass('B2/16', .16) } },
  { id:'heal', title:'Warmth in your hands', bpm:120, loop:false, voices:{
    pulse1:pulse('E4/16t G4/16t B4/16t F#5/16t G5/16t E5/16t B5/4', .20),
    pulse2:pulse('r/8 E5/8 G5/4', .10, .5), tri:bass('E3/2', .22), noise:drum('h/8', .06) } },
  { id:'hit', title:'Iron on the threshold', bpm:132, loop:false, voices:{
    pulse1:pulse('F4/32 E3/16', .20, .125), tri:bass('E2/8', .28), noise:drum('X/16 x/32', .25) } },
  { id:'crit', title:'The raven strikes', bpm:144, loop:false, voices:{
    pulse1:pulse('B6/32 G6/32 E6/8', .28, .125), pulse2:pulse('G5/16 B5/8', .18, .5),
    tri:bass('E3/8.', .30), noise:drum('X/16 h/32', .22) } },
  { id:'door', title:'The reluctant hinge', bpm:100, loop:false, voices:{
    pulse1:pulse('B2/16 C3/16 B2/8', .08, .125), tri:bass('E2/4', .12),
    noise:drum('x/32 h/16 x/32 X/8', .14) } },
  { id:'stairs', title:'Below the last lantern', bpm:132, loop:false, voices:{
    pulse1:pulse('E5/16 B4/16 D5/16 G4/16 F#4/8 E4/8', .18),
    pulse2:pulse('r/4 B3/4', .10, .5), tri:bass('E3/4 E2/4', .22), noise:drum('h/16 r/8. x/16', .08) } },
  { id:'gazeRises', title:'Someone at the window', bpm:96, loop:false, voices:{
    pulse1:pulse('F3/4 E3/8 D#3/8 E3/2', .16, .125),
    pulse2:pulse('B2/2 F3/2', .10, .5), tri:bass('E2/1', .25), noise:drum('h/8 r/4. x/4 r/4', .07) } },
  { id:'lowHealth', title:'Keep the ember', bpm:80, loop:true, voices:{
    pulse1:pulse('E4/8 r/8 B3/8 r/8 r/2 E4/8 r/8 G4/8 r/8 r/2', .035, .125),
    pulse2:pulse('r/2 B3/4 r/4 r/2 G3/4 r/4', .025, .5),
    tri:bass('E2/2 B2/2 C3/2 E2/2', .08),
    noise:drum('x/16 r/8. h/16 r/8. r/2 x/16 r/8. h/16 r/8. r/2', .025) } },
];
