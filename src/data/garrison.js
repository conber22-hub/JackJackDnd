// Original table rules: a link is one round of travel; quiet lowers alert every ten minutes.
export const POSTURES={guard:{hearing:1,delay:0},sleep:{hearing:-2,delay:2},lair:{hearing:0,delay:1},patrol:{hearing:1,delay:0},ritual:{hearing:-1,delay:1},feast:{hearing:-1,delay:1}};
export const ROLE_POSTURES={guardpost:['guard'],barracks:['sleep','feast'],lair:['lair'],boss:['lair'],shrine:['ritual']};
export const NOISE_COST={open:1,door:3,secret:5};
export const ATTITUDES={hostile:{flee:.2,help:true},wary:{flee:.35,help:true},bargain:{flee:.5,help:false},desperate:{flee:.6,help:true}};
export const LINES={runner:'A guard runs to warn a friendly post.',help:'Boots in the passage: allies are coming.',rival:'The rivals wait to pick off the winner.',flee:'The beaten group falls back to its stronghold.',home:'The search ends; the group returns to its post, wide awake.'};
