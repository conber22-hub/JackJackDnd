/* Original accounts; mechanical facts come only from supplied stats. */
export const FAMILY = {
  "beast": "The valley’s hungry flesh and fur.",
  "undead": "Those whom the earth could not keep.",
  "fiend": "Cruelty with time to spare.",
  "fey": "Old bargains walking in new shapes.",
  "construct": "Made by hands, moved by something else.",
  "humanoid": "The valley also has ordinary knives.",
  "monstrosity": "Shapes the road teaches you to fear.",
  "bloom": "The new growth beneath the old grief."
};
export const LORE = {
  "wolf": {
    "family": "beast",
    "seen": "It watches the smallest gap between your friends.",
    "fought": [
      "It tests the edges of a group before committing its weight.",
      "Keep your companions close."
    ],
    "lore": "I leave the bones well away from camp. A wolf learns where supper ends. Do not teach it where you sleep.",
    "voice": "a hunter",
    "tip": "Keep your companions close.",
    "killsForLore": 3
  },
  "dire-wolf": {
    "family": "beast",
    "seen": "Its shoulders rise above the roadside nettles.",
    "fought": [
      "It presses forward when the line of defenders opens.",
      "Leave room to retreat before it closes."
    ],
    "lore": "I thought the fence would hold. It stepped over where the snow had drifted. The sheep never made a sound.",
    "voice": "a shepherd",
    "tip": "Leave room to retreat before it closes.",
    "killsForLore": 3
  },
  "barovian-wolf": {
    "family": "beast",
    "seen": "Its coat is the colour of old hearth ash.",
    "fought": [
      "It circles beyond easy reach before closing.",
      "Watch the edges of the light."
    ],
    "lore": "They wait beyond the smoke. My father said smoke meant safety. His coat still hangs where he left it.",
    "voice": "a charcoal burner",
    "tip": "Watch the edges of the light.",
    "killsForLore": 3
  },
  "count-s-wolf": {
    "family": "beast",
    "seen": "The other wolves leave a space around it.",
    "fought": [
      "Its companions move into the spaces it leaves.",
      "Do not let its companions circle behind you."
    ],
    "lore": "It sits beyond the gate when the castle windows shine. It does not beg or hunt. I think it counts who comes through.",
    "voice": "a gatekeeper",
    "tip": "Do not let its companions circle behind you.",
    "killsForLore": 3
  },
  "bloomed-wolf": {
    "family": "bloom",
    "seen": "Pale threads stitch its muzzle shut.",
    "fought": [
      "Growth shakes loose when its body takes a blow.",
      "Keep clear of the growth and its fallen remains."
    ],
    "lore": "It tried to howl through the growth. Something smaller answered from its chest. I shut the sheep in and burnt the bedding.",
    "voice": "a frightened herder",
    "tip": "Keep clear of the growth and its fallen remains.",
    "killsForLore": 3
  },
  "werewolf": {
    "family": "humanoid",
    "seen": "A strip of cloth is caught beneath its fur.",
    "fought": [
      "It moves between you and the way you came.",
      "Prepare an escape route before confronting it."
    ],
    "lore": "I recognised my stitching on the sleeve. I did not recognise the hand inside it. Now I leave repairs outside before dusk.",
    "voice": "a seamstress",
    "tip": "Prepare an escape route before confronting it.",
    "killsForLore": 3
  },
  "swarm-of-bats": {
    "family": "beast",
    "seen": "The air becomes a tangle of folding shadows.",
    "fought": [
      "The wings make it hard to follow any single body.",
      "Avoid being surrounded in a narrow passage."
    ],
    "lore": "They sleep above the bell. I used to ring it with my eyes shut. Now I wear a hood even in summer.",
    "voice": "a bellringer",
    "tip": "Avoid being surrounded in a narrow passage.",
    "killsForLore": 3
  },
  "swarm-of-rats": {
    "family": "beast",
    "seen": "The floor seems to move before the first squeak.",
    "fought": [
      "The mass spreads around obstacles rather than stopping.",
      "Do not let the swarm cut off your exit."
    ],
    "lore": "We lost the flour before we noticed the holes. Then we lost the cat. I have stopped sending children downstairs.",
    "voice": "a cellar keeper",
    "tip": "Do not let the swarm cut off your exit.",
    "killsForLore": 3
  },
  "giant-rat": {
    "family": "beast",
    "seen": "Its teeth scrape the bottom of the door.",
    "fought": [
      "It bites from the shelter of broken furniture.",
      "Watch your footing in its cramped hiding places."
    ],
    "lore": "It gnawed through a fresh stave in one night. I found the shavings in a little bed. Something was nesting behind the wine.",
    "voice": "a cooper",
    "tip": "Watch your footing in its cramped hiding places.",
    "killsForLore": 3
  },
  "giant-spider": {
    "family": "beast",
    "seen": "The web carries a vibration without any wind.",
    "fought": [
      "It uses the space above your eyes as part of the battlefield.",
      "Check the route above as well as ahead."
    ],
    "lore": "I thought the bundle was a sack. It was my neighbour’s coat, still buttoned. The web held it higher than I could reach.",
    "voice": "a woodcutter",
    "tip": "Check the route above as well as ahead.",
    "killsForLore": 3
  },
  "zombie": {
    "family": "undead",
    "seen": "Its boots keep walking after its eyes lose you.",
    "fought": [
      "It advances through blows that would make a living foe hesitate.",
      "Keep space to move when it closes."
    ],
    "lore": "We buried him with his work boots. He wore them back to the gate. His wife asked me to mend the latch, not the grave.",
    "voice": "a gravedigger",
    "tip": "Keep space to move when it closes.",
    "killsForLore": 3
  },
  "skeleton": {
    "family": "undead",
    "seen": "Loose joints click like stones in a bowl.",
    "fought": [
      "Its weapon remains steady despite the rattling joints.",
      "Use cover and watch where it is aiming."
    ],
    "lore": "The bones came out of a wall I was repairing. Someone had laid them facing inward. I put down my hammer and left the opening.",
    "voice": "a mason",
    "tip": "Use cover and watch where it is aiming.",
    "killsForLore": 3
  },
  "ghoul": {
    "family": "undead",
    "seen": "It tastes the air before it notices your blade.",
    "fought": [
      "It reaches for whoever has lost their footing.",
      "Do not fight it alone at arm’s length."
    ],
    "lore": "The dogs would not touch the scraps. By dawn the scraps were gone and so was a dog. I stopped leaving meat for the watch.",
    "voice": "a night watchman",
    "tip": "Do not fight it alone at arm’s length.",
    "killsForLore": 3
  },
  "grave-ghoul": {
    "family": "undead",
    "seen": "Wet earth packs the creases of its hands.",
    "fought": [
      "It scrambles across disturbed earth without looking down.",
      "Keep a friend ready to help anyone it catches."
    ],
    "lore": "It waits until we have finished the prayers. Then it digs without a spade. I have started watching the graves from the church roof.",
    "voice": "a grave tender",
    "tip": "Keep a friend ready to help anyone it catches.",
    "killsForLore": 3
  },
  "wight": {
    "family": "undead",
    "seen": "It carries its weapon as though still on duty.",
    "fought": [
      "It keeps its weapon between its body and yours.",
      "Treat its reach with the respect due an armed soldier."
    ],
    "lore": "I knew the old salute. It returned it before drawing steel. That was worse than if it had forgotten us.",
    "voice": "a retired guard",
    "tip": "Treat its reach with the respect due an armed soldier.",
    "killsForLore": 3
  },
  "specter": {
    "family": "undead",
    "seen": "The outline is clearer than the face inside it.",
    "fought": [
      "Its outline slips across the edges of your cover.",
      "Keep your retreat open around walls and corners."
    ],
    "lore": "It stands where his chair used to be. I moved the table and it stayed. I no longer lay a second place.",
    "voice": "a widow",
    "tip": "Keep your retreat open around walls and corners.",
    "killsForLore": 3
  },
  "ghost": {
    "family": "undead",
    "seen": "It looks past you at a room that is no longer there.",
    "fought": [
      "It returns its attention to a place you cannot see.",
      "Watch its behaviour before deciding to strike."
    ],
    "lore": "She asks for the room upstairs. We lost that floor in the fire. I keep the old key because I cannot bear to tell her.",
    "voice": "an innkeeper",
    "tip": "Watch its behaviour before deciding to strike.",
    "killsForLore": 3
  },
  "banshee": {
    "family": "undead",
    "seen": "Every small sound seems to withdraw around her.",
    "fought": [
      "Its stillness breaks with a sound that fills the whole space.",
      "Do not gather the whole party around one threat."
    ],
    "lore": "I saw the reeds bend without wind. Then my passenger put his hands over his ears. We rowed back without speaking.",
    "voice": "a ferryman",
    "tip": "Do not gather the whole party around one threat.",
    "killsForLore": 1
  },
  "shadow": {
    "family": "undead",
    "seen": "Its edge moves against the direction of the light.",
    "fought": [
      "It closes where the light leaves a gap.",
      "Watch the ground behind your companions."
    ],
    "lore": "I counted five shadows for four customers. The fifth waited after the shop shut. I burnt my best candle that night.",
    "voice": "a candle maker",
    "tip": "Watch the ground behind your companions.",
    "killsForLore": 3
  },
  "revenant": {
    "family": "undead",
    "seen": "It checks each face and dismisses most of them.",
    "fought": [
      "It fixes its attention on one face even among many.",
      "Learn whom it seeks before obstructing its path."
    ],
    "lore": "It asked the same name at every gate. No threat, no bargain, just the name. I hope whoever owns it has stopped running.",
    "voice": "a road warden",
    "tip": "Learn whom it seeks before obstructing its path.",
    "killsForLore": 3
  },
  "vampire": {
    "family": "undead",
    "seen": "Its stillness makes your own breathing seem rude.",
    "fought": [
      "It studies who is separated before choosing its approach.",
      "Plan your protection and escape before an audience."
    ],
    "lore": "The visitor never took off his gloves. He knew which room held the sick. I wish I had asked who told him.",
    "voice": "a physician",
    "tip": "Plan your protection and escape before an audience.",
    "killsForLore": 1
  },
  "night-spawn": {
    "family": "undead",
    "seen": "It recoils from a remembered habit before leaning towards you.",
    "fought": [
      "It moves from hesitation to hunger without warning.",
      "Protect isolated allies and keep sight of exits."
    ],
    "lore": "She used to buy the burnt loaves cheaply. Last night she stood at my window and watched the oven. She was not looking at the bread.",
    "voice": "a baker",
    "tip": "Protect isolated allies and keep sight of exits.",
    "killsForLore": 3
  },
  "scarecrow": {
    "family": "construct",
    "seen": "The straw rustles without a breeze.",
    "fought": [
      "The first movement comes from beneath the hanging sleeves.",
      "Do not assume a still figure is harmless."
    ],
    "lore": "I stuffed it with last year’s straw. Something has replaced the stuffing with hair. I cannot bring myself to check the coat pockets.",
    "voice": "a farmer",
    "tip": "Do not assume a still figure is harmless.",
    "killsForLore": 3
  },
  "scarecrow-watcher": {
    "family": "construct",
    "seen": "Its painted eyes follow the edge of the field.",
    "fought": [
      "It turns towards movement at the edge of the field.",
      "Approach with cover rather than across open ground."
    ],
    "lore": "We turned it towards the crows. In the morning it faced the house. We moved away before the apples ripened.",
    "voice": "an orchard keeper",
    "tip": "Approach with cover rather than across open ground.",
    "killsForLore": 3
  },
  "green-hag": {
    "family": "fey",
    "seen": "Her smile arrives a little before the rest of her face.",
    "fought": [
      "It offers a distraction before showing its true position.",
      "Do not accept an apparent opening without checking it."
    ],
    "lore": "She offered me a cure in a clean jar. The lid was warm and the jar was empty. I gave it back without asking the price.",
    "voice": "a midwife",
    "tip": "Do not accept an apparent opening without checking it.",
    "killsForLore": 3
  },
  "night-hag": {
    "family": "fiend",
    "seen": "The air about her smells of a bed left damp.",
    "fought": [
      "It watches fear as closely as it watches weapons.",
      "Treat bargains and safe-looking rests with care."
    ],
    "lore": "I stitched my pillow shut with red thread. In the morning the thread was tied round my wrist. She had not needed to open anything.",
    "voice": "a sleepless tailor",
    "tip": "Treat bargains and safe-looking rests with care.",
    "killsForLore": 1
  },
  "flameskull": {
    "family": "undead",
    "seen": "Fire shines through the empty spaces between its teeth.",
    "fought": [
      "Its burning face turns before the magic follows.",
      "Spread out and use cover against its magic."
    ],
    "lore": "It lit every candle as it passed. The wax ran upwards. I left the altar cloth where it fell.",
    "voice": "a church caretaker",
    "tip": "Spread out and use cover against its magic.",
    "killsForLore": 3
  },
  "will-o-wisp": {
    "family": "undead",
    "seen": "A small light waits exactly where the path becomes uncertain.",
    "fought": [
      "The light draws back as you approach uncertain ground.",
      "Keep to ground you have checked."
    ],
    "lore": "My brother said he could see a lantern. I could only see where he stopped making ripples. I never follow a light without a voice I know.",
    "voice": "a marsh guide",
    "tip": "Keep to ground you have checked.",
    "killsForLore": 3
  },
  "animated-armor": {
    "family": "construct",
    "seen": "The visor turns, but nothing breathes behind it.",
    "fought": [
      "Its empty joints keep the rhythm of a trained guard.",
      "Make room to manoeuvre around its guarded front."
    ],
    "lore": "I know every rivet in that suit. I made it for a man with a limp. Whatever wears it now walks evenly.",
    "voice": "a smith",
    "tip": "Make room to manoeuvre around its guarded front.",
    "killsForLore": 3
  },
  "flesh-golem": {
    "family": "construct",
    "seen": "The seams do not quite agree on where the body ends.",
    "fought": [
      "It keeps moving when the seams begin to split.",
      "Keep distance and watch how it responds to each attack."
    ],
    "lore": "I carried the bundles separately. Later someone thanked me with a voice from one of them. I do not take deliveries upstairs now.",
    "voice": "an abbey porter",
    "tip": "Keep distance and watch how it responds to each attack.",
    "killsForLore": 1
  },
  "mist-thing": {
    "family": "monstrosity",
    "seen": "The fog parts around an absence shaped like a head.",
    "fought": [
      "Its outline becomes harder to follow in disturbed fog.",
      "Keep companions within sight in the fog."
    ],
    "lore": "We held hands to cross the hollow. Halfway through, the hand in mine changed size. I have never counted the party so carefully since.",
    "voice": "a traveller",
    "tip": "Keep companions within sight in the fog.",
    "killsForLore": 3
  },
  "bandit": {
    "family": "humanoid",
    "seen": "The hungry eyes reach your purse before the blade does.",
    "fought": [
      "One blade holds your attention while another looks for a gap.",
      "Watch the flanks while one of them talks."
    ],
    "lore": "He asked for bread before money. His friends watched him as closely as they watched me. I left the loaf and kept the horses moving.",
    "voice": "a carter",
    "tip": "Watch the flanks while one of them talks.",
    "killsForLore": 3
  },
  "bandit-captain": {
    "family": "humanoid",
    "seen": "The others move when this one stops speaking.",
    "fought": [
      "Its companions answer its gestures in the middle of a blow.",
      "Disrupt the group’s coordination and protect your rear."
    ],
    "lore": "She knew how many arrows we had left. She had been counting from the trees. I should have counted the shapes behind her.",
    "voice": "a caravan guard",
    "tip": "Disrupt the group’s coordination and protect your rear.",
    "killsForLore": 3
  },
  "cultist": {
    "family": "humanoid",
    "seen": "A familiar household knot fastens an unfamiliar symbol.",
    "fought": [
      "It advances where another believer can cover it.",
      "Look for allies hidden beyond the first figure."
    ],
    "lore": "I knew him by the way he tied his scarf. He would not look at me. I still wonder whether that was shame or mercy.",
    "voice": "a neighbour",
    "tip": "Look for allies hidden beyond the first figure.",
    "killsForLore": 3
  },
  "cult-fanatic": {
    "family": "humanoid",
    "seen": "The prayer continues through clenched teeth.",
    "fought": [
      "The spoken prayer continues while others close around you.",
      "Watch the caster while others try to distract you."
    ],
    "lore": "He kept praying after the candles went out. Then the others answered in their sleep. I left my robe on the chapel steps.",
    "voice": "a former acolyte",
    "tip": "Watch the caster while others try to distract you.",
    "killsForLore": 3
  },
  "berserker": {
    "family": "humanoid",
    "seen": "Each breath seems to wind the body tighter.",
    "fought": [
      "It commits its whole weight and trusts the next step to follow.",
      "Keep a route clear rather than trading every blow."
    ],
    "lore": "I waited for him to tire. My shield broke first. Courage is cheaper when you are not the one holding it.",
    "voice": "a shield bearer",
    "tip": "Keep a route clear rather than trading every blow.",
    "killsForLore": 3
  },
  "bloom-stalker": {
    "family": "bloom",
    "seen": "The growth bends aside before its feet touch the ground.",
    "fought": [
      "It closes through growth that hides its lower limbs.",
      "Watch more than the path directly ahead."
    ],
    "lore": "There were no broken twigs behind it. The branches closed as though it had never passed. I marked the trees and found the marks facing inward.",
    "voice": "a forester",
    "tip": "Watch more than the path directly ahead.",
    "killsForLore": 3
  },
  "sporeling": {
    "family": "bloom",
    "seen": "A little cap nods with the weight of something breathing beneath it.",
    "fought": [
      "A blow makes the little cap tremble and shed dust.",
      "Keep your distance from the loose spores."
    ],
    "lore": "I thought it was wearing a hat. I asked where its mother was. Every mushroom beside the fence turned towards me.",
    "voice": "a frightened child",
    "tip": "Keep your distance from the loose spores.",
    "killsForLore": 3
  },
  "bloom-vessel": {
    "family": "bloom",
    "seen": "The chest swells out of time with the mouth’s breathing.",
    "fought": [
      "The swelling changes shape when the body is struck.",
      "Give its body room when it begins to rupture."
    ],
    "lore": "He asked me to cut the growth away. It asked me to leave it. Both voices used his tongue.",
    "voice": "a village healer",
    "tip": "Give its body room when it begins to rupture.",
    "killsForLore": 3
  },
  "dinner-guest": {
    "family": "bloom",
    "seen": "It has folded its hands beside a plate nobody set.",
    "fought": [
      "It rises from the table without moving the chair aside.",
      "Do not let its quiet manners draw you into close quarters."
    ],
    "lore": "I thought my wife had invited it. She thought I had. We took the children out through the kitchen before it asked for seconds.",
    "voice": "an innkeeper",
    "tip": "Do not let its quiet manners draw you into close quarters.",
    "killsForLore": 1
  }
};
