// Original expected-hit bands, not a published mob table. Stochastic rounding
// preserves the mean without rolling each attack. A natural 20 still has a chance.
export const HIT_BANDS=[{need:2,probability:.95},{need:5,probability:.8},{need:8,probability:.65},{need:11,probability:.5},{need:14,probability:.35},{need:16,probability:.25},{need:18,probability:.15},{need:20,probability:.05}];
export const SURROUND={tiny:8,small:8,medium:8,large:12,huge:16,gargantuan:20};
export const LEADERS=['Mara Ashcroft','Pavel Rook','Anya Bellwood','Tomas Reed'];
export const DEMANDS=['Bring the missing child home before sunset.','Show us what lies beneath the chapel.','Put down your weapons and answer for the fire.','Give back the grain taken from our storehouse.'];
export const MORALE={villagers:-1,guard:3,other:1};
