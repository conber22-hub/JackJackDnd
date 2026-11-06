// Options remain plain data; explicit cavern() options override these presets.
export const PRESETS = {
  grotto: { fill:.49, steps:4, minChamber:12, lake:.12 },
  hall:   { fill:.43, steps:6, minChamber:24, lake:.08 },
  warren: { fill:.48, steps:4, minChamber:7, lake:0 },
  lake:   { fill:.44, steps:5, minChamber:18, lake:1 },
  chasm:  { fill:.45, steps:5, minChamber:16, lake:0, chasm:true },
};
