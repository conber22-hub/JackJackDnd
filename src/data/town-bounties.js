// Optional house rules for the DM's own Barovia. All fines are in whole gold pieces.
export const TOWN_LAWS = {
  village: {
    name: 'Village of Barovia', detainAt: 25, huntAt: 60,
    responses: {
      question: 'A neighbour waits by the well to hear your side.',
      detain: 'The village watch wants you to answer at the burgomaster’s door.',
      hunt: 'The watch has sent runners to the roads out of the village.',
    },
  },
  vallaki: {
    name: 'Vallaki', detainAt: 15, huntAt: 45,
    responses: {
      question: 'A gate guard asks you to step aside and explain.',
      detain: 'The watch bars the gate until the charges are answered.',
      hunt: 'Patrols carry your description between the gates and the square.',
    },
  },
  krezk: {
    name: 'Krezk', detainAt: 20, huntAt: 50,
    responses: {
      question: 'Someone at the gate asks which household will speak for you.',
      detain: 'The gatekeeper asks you to wait while the village hears the report.',
      hunt: 'A pair of watchers take the ridge path to cut off your approach.',
    },
  },
};

export const TOWN_OFFENCES = {
  trespass: { label: 'Trespass', fine: 5 },
  theft: { label: 'Theft', fine: 15 },
  assault: { label: 'Assault', fine: 25 },
  killing: { label: 'Unlawful killing', fine: 60 },
};
