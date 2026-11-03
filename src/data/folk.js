/* Original folk, names and dialogue for the valley. No published adventure text.
   The Reedwheel company is an invented travelling community. */
export const FOLK_ROLES = {
  village:['farmer','smith','child','elder','watch','priest','beggar','farmer'],
  town:['watch','smith','farmer','child','elder','priest','beggar','farmer'],
  camp:['traveller','dog','traveller','traveller'],
  road:['peddler','pilgrim','lostChild'],
  dungeon:['hermit','captive'],
};
export const FOLK_NAMES = ['Orvella','Tavrek','Merrin','Zeldra','Osvik','Pellena','Brevka','Nerrek','Istrin','Velda','Torska','Yevren'];
// (darker, for a valley under his Gaze: invented, like the given names)
export const FOLK_SURNAMES = ['Ashvarek','Dravnik','Morrowen','Kolvasz','Belinka','Strezhov','Grimsel','Tamorin','Vukhran','Oszel'];
export const DOG_NAMES = ['Thimble','Turnip','Soot','Copper'];
export const ROLE_LINES = {
  farmer:['Mind the seedlings. They are all we have left.', 'The crows left half a row today. A generous bargain.'],
  smith:['Hold the lantern steady and I can mend that.', 'Iron tells you when it is about to break. People ought to do the same.'],
  child:['We made a town out of buttons. Yours can visit.', 'Have you seen a kite with a spoon for a tail?'],
  elder:['Sit. The kettle still remembers its work.', 'I keep a chair by the door for late arrivals.'],
  watch:['Keep the road clear for the bread cart.', 'We count those coming in. We try to count those going out.'],
  priest:['There is clean water by the steps.', 'A candle costs nothing if you light it for someone else.'],
  beggar:['A crust will do. Keep the hard end for yourself.', 'I can tell you which roof leaks least.'],
  traveller:['Reedwheel folk mend a wheel before asking whose it is.', 'Our wagons carry spare cups. You may have company yet.'],
  dog:['The dog sniffs your boots and wags once.', 'The dog brings you a stick polished by many hopeful teeth.'],
  peddler:['Needles, salt, dry matches. Nothing that promises miracles.', 'I accept buttons if they still have all their holes.'],
  pilgrim:['I am carrying a bell to a place that has forgotten its sound.', 'Will you share the road until the next marker?'],
  lostChild:['The path looked shorter when we left.', 'Our door has a blue latch. Have you seen it?'],
  hermit:['Leave the mushrooms with white stems alone.', 'There is room by the fire if you speak softly.'],
  captive:['Can you reach the latch from your side?', 'Tell someone I am still here. That is enough for now.'],
};
export const MOOD_LINES = {
  wary:['Keep your voice below the window.', 'Names travel further than footsteps here.'],
  afraid:['Please. Not here.', 'I must go.', 'No names.'],
  night:['The shutters are closed. Come back with the light.', 'Someone will hear us. Dawn, please.'],
};
export const RUMOUR_LINES = {
  haunt:['{name} has been seen near {place}. Leave before the lamps go out.', 'The road by {place} has a new toll collector: {name}.'],
  weakness:['They say {name} cannot bear {weakness}. I would ask someone braver before trying it.', 'A carter swears {weakness} is what {name} fears.'],
  lure:['There is shelter near {place}. {name} keeps that road safe, they say.', 'Go by {place}. Ask for {name}; a friend to travellers, surely.'],
  kill:['Someone was killed at {place}. The shutters closed before the footsteps stopped.', 'There was a killing at {place}. Nobody is lending a lantern tonight.'],
  report:['An eye at {place} reports {hero}: {kind}.', 'A quiet message from {place} names {hero} after a {kind}.'],
};
