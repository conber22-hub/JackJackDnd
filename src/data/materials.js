// Original, near-neutral recipes. Scale counts repeat over the whole texture.
// gap is a fraction of cell width; contrast and depth control colour and relief.
export const MATERIALS = {
  flag:    {pattern:'stones',scale:4,gap:.12,depth:.65,contrast:.38,roughness:.86,tone:.59,grain:.05,normal:3},
  cobble:  {pattern:'stones',scale:9,gap:.22,depth:.8,contrast:.42,roughness:.88,tone:.55,grain:.07,normal:3,moss:.12},
  plank:   {pattern:'planks',scale:6,gap:.06,depth:.55,contrast:.38,roughness:.79,tone:.54,grain:.09,normal:2},
  rock:    {pattern:'rock',scale:5,gap:.07,depth:.45,contrast:.42,roughness:.94,tone:.51,grain:.12,normal:4},
  dirt:    {pattern:'dirt',scale:12,gap:.1,depth:.22,contrast:.26,roughness:.96,tone:.48,grain:.14,normal:2},
  mud:     {pattern:'mud',scale:4,gap:.1,depth:.12,contrast:.2,roughness:.27,tone:.38,grain:.025,normal:1},
  brick:   {pattern:'bricks',rows:8,cols:4,gap:.1,depth:.6,contrast:.4,roughness:.9,tone:.56,grain:.08,normal:3},
  ashlar:  {pattern:'bricks',rows:4,cols:3,gap:.035,depth:.4,contrast:.24,roughness:.72,tone:.65,grain:.025,normal:3},
  plaster: {pattern:'plaster',scale:5,gap:.025,depth:.3,contrast:.26,roughness:.92,tone:.72,grain:.09,normal:2},
  snow:    {pattern:'snow',scale:5,gap:.05,depth:.08,contrast:.06,roughness:.76,tone:.91,grain:.025,normal:1},
  bone:    {pattern:'bone',scale:7,gap:.16,depth:.6,contrast:.32,roughness:.8,tone:.73,grain:.06,normal:3},
};
export const KINDS = Object.keys(MATERIALS);
