// Original camp prompts. An outlook is a DM choice, separate from wages or loyalty.
export const CAMP_OUTLOOKS = {
  keeper: { label: 'Keeper', values: 'Protects the vulnerable, even when it costs the party.' },
  sworn: { label: 'Sworn', values: 'Judges the party by its promises and who bears the cost of breaking them.' },
  wayfarer: { label: 'Wayfarer', values: 'Values preparation and getting everyone home alive.' },
};

export const CAMP_CHOICES = {
  'shelter-stranger': { label: 'Give shelter at a cost', reactions: { keeper: 2, sworn: 1, wayfarer: -1 } },
  'abandon-stranger': { label: 'Leave a stranger to danger', reactions: { keeper: -2, sworn: -1, wayfarer: 1 } },
  'keep-oath': { label: 'Keep a costly promise', reactions: { keeper: 1, sworn: 2, wayfarer: -1 } },
  'break-oath': { label: 'Break a promise to escape danger', reactions: { keeper: -1, sworn: -2, wayfarer: 1 } },
  'plan-retreat': { label: 'Scout a safe way out', reactions: { keeper: 1, sworn: 0, wayfarer: 2 } },
  'charge-blind': { label: 'Risk the group without warning', reactions: { keeper: -1, sworn: 0, wayfarer: -2 } },
};

export const CAMP_SCENES = {
  keeper: [
    { id: 'empty-bowl', at: 'friction', title: 'The empty bowl',
      opening: 'They set an empty bowl just inside the light. “What would have made you turn back?”',
      prompt: 'Ask which person the heroes would go back for. Let the companion name one of their own.' },
    { id: 'extra-blanket', at: 'trust', title: 'An extra blanket',
      opening: 'They hang a dry blanket at the edge of the camp. “I used to think that if you could see the fire, someone would make room.”',
      prompt: 'Ask a hero who first made room for them. The companion offers to stand beside them at the next difficult door.' },
    { id: 'second-chair', at: 'bond', title: 'The second chair',
      opening: 'They set out two places for breakfast, long before dawn. “If we make it out, who will you leave a chair for?”',
      prompt: 'Give a hero a moment to say who they miss. Ask whether the companion can help carry a message home.' },
  ],
  sworn: [
    { id: 'knotted-cord', at: 'friction', title: 'The knotted cord',
      opening: 'They tug a knot tight enough to hurt. “Tell me what you promised. I want to hear the words again.”',
      prompt: 'Let the heroes explain the choice. Ask what smaller promise the companion could reasonably trust tomorrow.' },
    { id: 'one-coin', at: 'trust', title: 'One bent coin',
      opening: 'They lay a bent coin on the log between you. “I kept this because it was the first time someone paid me what they said they would.”',
      prompt: 'Ask a hero about a promise they still owe. Let the companion offer to witness it, if asked.' },
    { id: 'name-on-wood', at: 'bond', title: 'A name on wood',
      opening: 'They start carving a name into the underside of a cup. “If I forget what we agreed to, make me read this.”',
      prompt: 'Ask the party what the companion should write. Agree at the table on who will hold them to it.' },
  ],
  wayfarer: [
    { id: 'boots-on', at: 'friction', title: 'Boots on',
      opening: 'Their boots are still on and the pack is closed. “If the watch goes quiet, which way are we running?”',
      prompt: 'Ask a hero to show the route on the map. The companion points out one thing they would leave behind.' },
    { id: 'chalk-arrow', at: 'trust', title: 'The chalk arrow',
      opening: 'They draw a small arrow on a stone. “When the mist takes the road, look for the little things people left for you.”',
      prompt: 'Agree on a mark the group will recognise. Ask which hero they would trust to leave the last mark.' },
    { id: 'morning-road', at: 'bond', title: 'The morning road',
      opening: 'They pour the last of the hot water into your cup. “I think I finally know who I would wait for at the fork.”',
      prompt: 'Ask a hero where they would take the companion if the Mists parted for one morning.' },
  ],
};
