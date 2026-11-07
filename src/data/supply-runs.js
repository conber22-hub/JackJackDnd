// Holding stores use abstract units. These are configurable packing weights in pounds per unit.
export const SUPPLY_WEIGHTS = { timber: 10, stone: 20, salt: 5 };
export const SUPPLY_PACES = {
  cautious: { time: 1.25, risk: -0.10 },
  steady: { time: 1, risk: 0 },
  hurry: { time: 0.8, risk: 0.12 },
};

export const RESCUE_SCENES = {
  ambush: {
    title: 'The wagon in the ditch',
    module: 'wagon',
    opening: 'A wheel still turns above the ditch. A split crate lies in the road, and a trail of spilled salt leads into the trees.',
    prompt: 'The crew and the stolen cargo are in different places. Let the party decide which trail to follow first. A scrap of the dispatch note could point to an informant if one fits your campaign.',
  },
  breakdown: {
    title: 'A wheel short of home',
    module: 'cart',
    opening: 'The wagon leans on a pile of stones where its wheel should be. Someone has hung a coat on a branch to signal the road.',
    prompt: 'The crew took shelter close by. Give the party a choice between repairing the axle here and unloading enough cargo to haul it out before dusk.',
  },
  storm: {
    title: 'The washout',
    module: 'wagon',
    opening: 'The road ends in a fresh cut through the earth. A rope runs from the stranded wagon to a tree on the near bank.',
    prompt: 'The bank is giving way. Let the party rig a second line, bring the crew across, or save the crates before they slide.',
  },
};
