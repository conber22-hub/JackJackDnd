// Keys are campaign place IDs. The DM can stage the details on any matching map.
export const FIELD_SURVEYS = {
  village: {
    title: 'Village of Barovia',
    observations: [
      { id: 'well-height', kind: 'terrain', title: 'The high-water cut',
        text: 'Three cuts in the well curb mark flood heights. The deepest is above the level of the lane.' },
      { id: 'blue-thread', kind: 'sign', title: 'Blue thread on the latches',
        text: 'The houses with blue thread on their latches stand one step higher than their neighbours.' },
      { id: 'chimney-bricks', kind: 'lore', title: 'The bricklayer’s rhyme',
        text: 'An old work rhyme says to look for the chimney with two pale bricks when the lane fills.' },
    ],
    lead: { title: 'A loft above the water',
      text: 'The chimney marks a shared refuge above a boarded house. If the party reopens the outside stair, the next flood can become an evacuation scene with a defensible destination.' },
  },
  woods: {
    title: 'Svalich Woods',
    observations: [
      { id: 'dry-ridge', kind: 'terrain', title: 'A dry spine of rock',
        text: 'A narrow rib of stone stays dry where the forest track sinks into the mud.' },
      { id: 'green-needles', kind: 'sign', title: 'Needles that point uphill',
        text: 'Bloom threads bend uphill through a bed of dead pine needles. They stop at a pale scar on the rock.' },
      { id: 'salt-notch', kind: 'lore', title: 'Notches on a charcoal tin',
        text: 'A charcoal burner scratched the pale scar on a tin lid and marked two notches west of it.' },
    ],
    lead: { title: 'The charcoal burner’s crossing',
      text: 'Two old salt posts mark a narrow crossing west of the scar. Offer it as a way around the Bloomed track. A companion or scout must take the exposed lead.' },
  },
  vallaki: {
    title: 'Vallaki',
    observations: [
      { id: 'runnel', kind: 'terrain', title: 'The crooked runnel',
        text: 'Water from the market drains towards a low section of wall, then disappears before it reaches the gate.' },
      { id: 'candle-slats', kind: 'sign', title: 'Wax between the slats',
        text: 'Fresh white wax has hardened on both sides of a shutter in a boarded storehouse.' },
      { id: 'tallow-book', kind: 'lore', title: 'An odd entry for tallow',
        text: 'An old market book lists lamp oil for the drain inspection every year, even in years when the storehouse stood empty.' },
    ],
    lead: { title: 'The lamplighter’s door',
      text: 'The shutter conceals a narrow maintenance entrance to the drain. Let the party bargain with a lamplighter for access or scout it when the water falls.' },
  },
  krezk: {
    title: 'Krezk',
    observations: [
      { id: 'snow-line', kind: 'terrain', title: 'The broken snow line',
        text: 'A straight band of bare stone climbs the hillside where snow settles everywhere else.' },
      { id: 'worn-pegs', kind: 'sign', title: 'Three worn pegs',
        text: 'Iron pegs in the wall are polished by rope. The middle peg has been replaced much more recently than the others.' },
      { id: 'sled-list', kind: 'lore', title: 'A sledge maker’s tally',
        text: 'A tally of winter repairs lists a narrow supply sledge and three lengths of rope for the upper path.' },
    ],
    lead: { title: 'The winter supply path',
      text: 'The old sledge path reaches a sheltered ledge above the main approach. The party can bring one load up quietly if they first replace the loose middle peg.' },
  },
  berez: {
    title: 'Berez',
    observations: [
      { id: 'raised-stones', kind: 'terrain', title: 'Stone above the reeds',
        text: 'Three flat stones break the water in a line. Each has the same bevel on its dry edge.' },
      { id: 'reed-ties', kind: 'sign', title: 'Reeds tied in pairs',
        text: 'Freshly tied reeds lean away from the deepest water. One pair has been cut at the roots.' },
      { id: 'boat-mark', kind: 'lore', title: 'The ferryman’s mark',
        text: 'An overturned punt bears a sketch of the stones. Its owner marked the crossing with a shape like a bent elbow.' },
    ],
    lead: { title: 'The drowned causeway',
      text: 'The sketch points to a turn in the causeway hidden by reeds. Marking the bend gives the party a route to the far bank, and the cut reeds suggest someone is trying to erase it.' },
  },
};
