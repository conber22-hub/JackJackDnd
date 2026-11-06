// Original role cues and influence adaptation using the SRD's easy/moderate/hard
// DC bands (10/15/20). Attitude is not mind control; dangerous requests can fail outright.
export const ATTITUDES=['hostile','indifferent','friendly'];
export const APPROACHES={persuade:'Persuasion',deceive:'Deception',intimidate:'Intimidation',bribe:'Persuasion',perform:'Performance',insight:'Insight'};
export const DC={friendly:10,indifferent:15,hostile:20};
export const MOTIVES={
 priest:{want:'the dead buried properly',fear:'the Church being shamed'},
 farmer:{want:'a safe harvest',fear:'the loss of family'},
 smith:{want:'fair payment for honest work',fear:'the forge being seized'},
 peddler:{want:'a safe road and a paying customer',fear:'a search by the Count’s men'},
 watch:{want:'order in the streets',fear:'the burgomaster’s punishment'},
 elder:{want:'the village’s children kept safe',fear:'another winter without help'},
 child:{want:'a trusted adult nearby',fear:'being left alone'},
 beggar:{want:'a warm meal',fear:'being driven into the Mists'},
 pilgrim:{want:'safe passage to a shrine',fear:'a broken oath'},
 other:{want:'a little safety and respect',fear:'the Count’s attention'},
};
export const RUMOURS={true:['The old road is watched; take a guide who knows the village.'],half:['The old road is watched, though nobody agrees who keeps the watch.'],lie:['The old road is safe now; the watch has gone to Vallaki.']};
