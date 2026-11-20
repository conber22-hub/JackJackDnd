export const TRADITIONS = {
  "archivist": {
    "id": "archivist",
    "calling": "archivist",
    "word": "Protocol",
    "plural": "Protocols",
    "voice": "The Ghostlight files an observation in a hand older than its keeper."
  },
  "chaplain": {
    "id": "chaplain",
    "calling": "chaplain",
    "word": "Rite",
    "plural": "Rites",
    "voice": "A field prayer follows the measured breath of the one keeping watch."
  },
  "seepbound": {
    "id": "seepbound",
    "calling": "seepbound",
    "word": "Gift",
    "plural": "Gifts",
    "voice": "The Chorus offers something warm and already knows where it will fit."
  },
  "relicborn": {
    "id": "relicborn",
    "calling": "relicborn",
    "word": "Shardwork",
    "plural": "Shardworks",
    "voice": "An old engine answers through the caster’s blood in angles of light."
  },
  "herald": {
    "id": "herald",
    "calling": "herald",
    "word": "Cadence",
    "plural": "Cadences",
    "voice": "A hand on the drumhead can tell the company as much as a shout."
  },
  "mistwalker": {
    "id": "mistwalker",
    "calling": "mistwalker",
    "word": "Mistcraft",
    "plural": "Mistcraft",
    "voice": "The valley answers in the small movements of root, fur and water."
  },
  "warden": {
    "id": "warden",
    "calling": "warden",
    "word": "Vow",
    "plural": "Vows",
    "voice": "The sworn speak plainly enough for the stone beneath their feet to witness."
  },
  "marksman": {
    "id": "marksman",
    "calling": "marksman",
    "word": "Fieldcraft",
    "plural": "Fieldcraft",
    "voice": "A scout gives the distance, the sign and the moment to move."
  }
};

// Canonical spell keys stay on saved sheets and casts. Only the displayed voice changes.
export const RITES = {
  "Acid Arrow": { by: {
    archivist: {"n": "Study of the Verdigris Quill", "line": "The lamp records how green drops chew holes in the dust."},
  } },
  "Acid Splash": { by: {
    relicborn: {"n": "Bitter Rain Array", "line": "Through a lattice of light, a handful of sour pearls bursts."},
    archivist: {"n": "Study of the Bitter Rain", "line": "The lamp records how a handful of sour pearls bursts."},
  } },
  "Aid": { by: {
    herald: {"n": "Borrowed Morrow Measure", "line": "On the lifted stick, warmth pools behind the breastbone."},
    chaplain: {"n": "Borrowed Morrow Litany", "line": "At the final amen, warmth pools behind the breastbone."},
    mistwalker: {"n": "Borrowed Morrow of the Vale", "line": "In the valley hush, warmth pools behind the breastbone."},
    warden: {"n": "Keep the Borrowed Morrow", "line": "At the seal of the vow, warmth pools behind the breastbone."},
    marksman: {"n": "Read the Borrowed Morrow", "line": "From the sightline, warmth pools behind the breastbone."},
  } },
  "Alarm": { by: {
    marksman: {"n": "Trail Sign: Wakeful Hinge", "line": "In the field glass, a hair of copper spans the sill."},
    archivist: {"n": "Index of the Wakeful Hinge", "line": "On the lens, a hair of copper spans the sill."},
  } },
  "Alter Self": { by: {
    relicborn: {"n": "Borrowed Bones Lattice", "line": "As the red cell hums, the cheekbones shift like river stones."},
    archivist: {"n": "Borrowed Bones Protocol", "line": "The margin shows how the cheekbones shift like river stones."},
  } },
  "Animal Friendship": { by: {
    herald: {"n": "Open Palm Measure", "line": "On the lifted stick, a wet muzzle dips towards the hand."},
    mistwalker: {"n": "Open Palm of the Vale", "line": "In the valley hush, a wet muzzle dips towards the hand."},
    marksman: {"n": "Read the Open Palm", "line": "From the sightline, a wet muzzle dips towards the hand."},
  } },
  "Animal Messenger": { by: {
    herald: {"n": "Call of the Feather Post", "line": "On the answering beat, a folded word rides beneath a wing."},
    mistwalker: {"n": "Feather Post in the Reeds", "line": "In the alder shade, a folded word rides beneath a wing."},
    marksman: {"n": "Sign of the Feather Post", "line": "In the field glass, a folded word rides beneath a wing."},
  } },
  "Animal Shapes": { by: {
    mistwalker: {"n": "Many Hides of the Vale", "line": "Where the mist thins, fur passes over a row of shoulders."},
  } },
  "Animate Dead": { by: {
    chaplain: {"n": "Office of the Unquiet Muster", "line": "At the final amen, old joints remember a marching step."},
    archivist: {"n": "Index of the Unquiet Muster", "line": "On the lens, old joints remember a marching step."},
  } },
  "Animate Objects": { by: {
    herald: {"n": "Little Revolt March", "line": "As the pennant dips, the furniture puts its feet down."},
    relicborn: {"n": "Little Revolt Circuit", "line": "Through a lattice of light, the furniture puts its feet down."},
    archivist: {"n": "Index of the Little Revolt", "line": "The lamp records how the furniture puts its feet down."},
  } },
  "Antilife Shell": { by: {
    mistwalker: {"n": "Empty Orchard in the Mire", "line": "Where the mist thins, the grass bends away from an empty rim."},
  } },
  "Antimagic Field": { by: {
    chaplain: {"n": "Office of the Blank Folio", "line": "Over folded linen, the colours drain from a perfect circle."},
    archivist: {"n": "Index of the Blank Folio", "line": "The margin shows how the colours drain from a perfect circle."},
  } },
  "Antipathy/Sympathy": { by: {
    herald: {"n": "Heart Compass Refrain", "line": "On the lifted stick, a needle swings between welcome and disgust."},
    mistwalker: {"n": "Heart Compass in the Mire", "line": "Through a veil of dew, a needle swings between welcome and disgust."},
    archivist: {"n": "Study of the Heart Compass", "line": "On the lens, a needle swings between welcome and disgust."},
  } },
  "Arcane Eye": { by: {
    archivist: {"n": "Index of the Keyhole Witness", "line": "On the lens, a pupil swims free of its socket."},
  } },
  "Arcane Hand": { by: {
    relicborn: {"n": "Absent Porter Circuit", "line": "Between pulses, the air creases around enormous knuckles."},
    archivist: {"n": "Index of the Absent Porter", "line": "In pale tracing ink, the air creases around enormous knuckles."},
  } },
  "Arcane Lock": { by: {
    archivist: {"n": "File: Blind Tumbler", "line": "The margin shows how a blue seam closes in the lock."},
  } },
  "Arcane Sword": { by: {
    herald: {"n": "Edge Without Hilt March", "line": "As the pennant dips, a blade hangs where no hand can reach."},
    archivist: {"n": "Index of the Edge Without Hilt", "line": "The lamp records how a blade hangs where no hand can reach."},
  } },
  "Arcanist's Magic Aura": { by: {
    archivist: {"n": "Index of the False Provenance", "line": "The lamp records how the old seal takes a fresh impression."},
  } },
  "Astral Projection": { by: {
    chaplain: {"n": "Silver Mooring Observance", "line": "Over folded linen, pale thread unspools from the ribs."},
    seepbound: {"n": "We Kept the Silver Mooring", "line": "Under the wet murmur, pale thread unspools from the ribs."},
    archivist: {"n": "Study of the Silver Mooring", "line": "The margin shows how pale thread unspools from the ribs."},
  } },
  "Augury": { by: {
    chaplain: {"n": "Office of the Divided Ash", "line": "At the final amen, the ashes part like two roads."},
    mistwalker: {"n": "Divided Ash of the Fen", "line": "In the valley hush, the ashes part like two roads."},
    archivist: {"n": "Index of the Divided Ash", "line": "On the lens, the ashes part like two roads."},
  } },
  "Aura of Life": { by: {
    chaplain: {"n": "Green Vigil Litany", "line": "At the final amen, a ring of candlewicks turns green."},
    warden: {"n": "Keep the Green Vigil", "line": "At the seal of the vow, a ring of candlewicks turns green."},
  } },
  "Awaken": { by: {
    herald: {"n": "Call of the First Answer", "line": "As the pennant dips, a new thought blinks behind familiar eyes."},
    mistwalker: {"n": "First Answer in the Reeds", "line": "Where the mist thins, a new thought blinks behind familiar eyes."},
  } },
  "Bane": { by: {
    herald: {"n": "Bitter Measure Measure", "line": "As the pennant dips, every heartbeat lands a little crooked."},
    chaplain: {"n": "Bitter Measure Litany", "line": "Under the little bell, every heartbeat lands a little crooked."},
    seepbound: {"n": "We Lend the Bitter Measure", "line": "“See, dear one, how every heartbeat lands a little crooked.”"},
  } },
  "Banishment": { by: {
    chaplain: {"n": "Office of the Closed Ledger", "line": "Between two breaths, the outline folds to the width of a page."},
    warden: {"n": "Closed Ledger Vigil", "line": "Before silent witnesses, the outline folds to the width of a page."},
    relicborn: {"n": "Closed Ledger Circuit", "line": "Through a lattice of light, the outline folds to the width of a page."},
    seepbound: {"n": "Our Closed Ledger", "line": "Through a film of brine, the outline folds to the width of a page."},
    archivist: {"n": "Index of the Closed Ledger", "line": "The lamp records how the outline folds to the width of a page."},
  } },
  "Barkskin": { by: {
    mistwalker: {"n": "Grain Beneath Skin of the Fen", "line": "Where the mist thins, rings of oak ripple along the arm."},
    marksman: {"n": "Trail Sign: Grain Beneath Skin", "line": "At the held breath, rings of oak ripple along the arm."},
  } },
  "Beacon of Hope": { by: {
    chaplain: {"n": "Office of the Last Window", "line": "Between two breaths, one warm square shines through the rain."},
  } },
  "Befuddlement": { by: {
    herald: {"n": "Call of the Scattered Letters", "line": "On the lifted stick, a thought comes apart like wet type."},
    mistwalker: {"n": "Scattered Letters in the Reeds", "line": "In the valley hush, a thought comes apart like wet type."},
    seepbound: {"n": "Your Share: Scattered Letters", "line": "Behind our shared eyelid, a thought comes apart like wet type."},
    archivist: {"n": "File: Scattered Letters", "line": "On the lens, a thought comes apart like wet type."},
  } },
  "Bestow Curse": { by: {
    herald: {"n": "Black Inheritance Measure", "line": "As the pennant dips, a second shadow fastens at the heel."},
    chaplain: {"n": "Black Inheritance Litany", "line": "Under the little bell, a second shadow fastens at the heel."},
    archivist: {"n": "Black Inheritance Protocol", "line": "In pale tracing ink, a second shadow fastens at the heel."},
  } },
  "Black Tentacles": { by: {
    archivist: {"n": "Study of the Sump Fingers", "line": "On the lens, long black loops feel along the floor."},
  } },
  "Blade Barrier": { by: {
    chaplain: {"n": "Prayer of the Turning Teeth", "line": "At the final amen, thin edges turn like a mill in spate."},
  } },
  "Bless": { by: {
    chaplain: {"n": "Count the Living", "line": "One quiet name, one warm ring of light, then the chaplain takes the next breath."},
    warden: {"n": "None Shall Stand Alone", "line": "Gold circles turn above the company like rings held up to the same candle."},
  } },
  "Blight": { by: {
    mistwalker: {"n": "Dry Harvest of the Vale", "line": "In the alder shade, green veins shrivel into brown lace."},
    relicborn: {"n": "Dry Harvest Lattice", "line": "Through a lattice of light, green veins shrivel into brown lace."},
    seepbound: {"n": "We Lend the Dry Harvest", "line": "Through a film of brine, green veins shrivel into brown lace."},
    archivist: {"n": "Dry Harvest Protocol", "line": "The lamp records how green veins shrivel into brown lace."},
  } },
  "Blindness/Deafness": { by: {
    herald: {"n": "Drawn Shutters Measure", "line": "On the answering beat, grey shutters fall behind the face."},
    chaplain: {"n": "Drawn Shutters Litany", "line": "Between two breaths, grey shutters fall behind the face."},
    relicborn: {"n": "Drawn Shutters Lattice", "line": "Through a lattice of light, grey shutters fall behind the face."},
    archivist: {"n": "Drawn Shutters Protocol", "line": "The lamp records how grey shutters fall behind the face."},
  } },
  "Blink": { by: {
    relicborn: {"n": "Missing Beat Array", "line": "In the shard’s afterglow, a silhouette skips a beat."},
    archivist: {"n": "Study of the Missing Beat", "line": "On the lens, a silhouette skips a beat."},
  } },
  "Blur": { by: {
    relicborn: {"n": "Rain on Glass Circuit", "line": "Between pulses, the figure runs like ink on a pane."},
    archivist: {"n": "Index of the Rain on Glass", "line": "In pale tracing ink, the figure runs like ink on a pane."},
  } },
  "Burning Hands": { by: {
    relicborn: {"n": "Copper Fan Relay", "line": "As the red cell hums, a fan of furnace sparks snaps open."},
    archivist: {"n": "File: Copper Fan", "line": "The margin shows how a fan of furnace sparks snaps open."},
  } },
  "Call Lightning": { by: {
    mistwalker: {"n": "Split Belfry in the Mire", "line": "Through a veil of dew, a fork of white opens the cloud."},
  } },
  "Calm Emotions": { by: {
    herald: {"n": "Call of the Still Basin", "line": "On the answering beat, ripples smooth out from the centre."},
    chaplain: {"n": "Prayer of the Still Basin", "line": "Between two breaths, ripples smooth out from the centre."},
  } },
  "Chain Lightning": { by: {
    relicborn: {"n": "Branching Scar Relay", "line": "Between pulses, white roots leap between silhouettes."},
    archivist: {"n": "File: Branching Scar", "line": "In pale tracing ink, white roots leap between silhouettes."},
  } },
  "Charm Monster": { by: {
    herald: {"n": "Call of the Gentle Bridle", "line": "Across the drumskin, a vast jaw slackens for an instant."},
    mistwalker: {"n": "Gentle Bridle in the Reeds", "line": "Through a veil of dew, a vast jaw slackens for an instant."},
    relicborn: {"n": "Gentle Bridle Relay", "line": "As the red cell hums, a vast jaw slackens for an instant."},
    seepbound: {"n": "Your Share: Gentle Bridle", "line": "Under the wet murmur, a vast jaw slackens for an instant."},
    archivist: {"n": "File: Gentle Bridle", "line": "The margin shows how a vast jaw slackens for an instant."},
  } },
  "Charm Person": { by: {
    herald: {"n": "Familiar Face Measure", "line": "Across the drumskin, the stranger’s face catches a friendly warmth."},
    mistwalker: {"n": "Familiar Face of the Vale", "line": "Through a veil of dew, the stranger’s face catches a friendly warmth."},
    relicborn: {"n": "Familiar Face Lattice", "line": "As the red cell hums, the stranger’s face catches a friendly warmth."},
    seepbound: {"n": "We Lend the Familiar Face", "line": "Under the wet murmur, the stranger’s face catches a friendly warmth."},
    archivist: {"n": "Familiar Face Protocol", "line": "The margin shows how the stranger’s face catches a friendly warmth."},
  } },
  "Chill Touch": { by: {
    relicborn: {"n": "Cold Creditor Relay", "line": "In the shard’s afterglow, pallid knuckles leave a thumbprint."},
    seepbound: {"n": "Your Share: Cold Creditor", "line": "Behind our shared eyelid, pallid knuckles leave a thumbprint."},
    archivist: {"n": "File: Cold Creditor", "line": "On the lens, pallid knuckles leave a thumbprint."},
  } },
  "Chromatic Orb": { by: {
    relicborn: {"n": "Many-Sided Pearl Circuit", "line": "In the shard’s afterglow, colour turns under a glassy skin."},
    archivist: {"n": "Index of the Many-Sided Pearl", "line": "On the lens, colour turns under a glassy skin."},
  } },
  "Circle of Death": { by: {
    relicborn: {"n": "Ash Meridian Circuit", "line": "In the shard’s afterglow, ash blows out in a widening ring."},
    seepbound: {"n": "Our Ash Meridian", "line": "Behind our shared eyelid, ash blows out in a widening ring."},
    archivist: {"n": "Index of the Ash Meridian", "line": "On the lens, ash blows out in a widening ring."},
  } },
  "Clairvoyance": { by: {
    herald: {"n": "Distant Aperture Refrain", "line": "On the lifted stick, a bead of glass holds a distant room."},
    chaplain: {"n": "Distant Aperture Observance", "line": "At the final amen, a bead of glass holds a distant room."},
    relicborn: {"n": "Distant Aperture Array", "line": "In the shard’s afterglow, a bead of glass holds a distant room."},
    archivist: {"n": "Study of the Distant Aperture", "line": "On the lens, a bead of glass holds a distant room."},
  } },
  "Clone": { by: {
    archivist: {"n": "Index of the Spare Vessel", "line": "The margin shows how a second face rests beneath a still surface."},
  } },
  "Cloudkill": { by: {
    relicborn: {"n": "Mustard Shroud Relay", "line": "As the red cell hums, heavy yellow folds roll through the hollow."},
    archivist: {"n": "File: Mustard Shroud", "line": "The margin shows how heavy yellow folds roll through the hollow."},
  } },
  "Color Spray": { by: {
    herald: {"n": "Broken Spectrum Measure", "line": "On the lifted stick, shards of colour spill over the eyes."},
    relicborn: {"n": "Broken Spectrum Lattice", "line": "In the shard’s afterglow, shards of colour spill over the eyes."},
    archivist: {"n": "Broken Spectrum Protocol", "line": "On the lens, shards of colour spill over the eyes."},
  } },
  "Command": { by: {
    herald: {"n": "Call of the Iron Syllable", "line": "On the lifted stick, one word falls with the weight of a key."},
    chaplain: {"n": "Prayer of the Iron Syllable", "line": "At the final amen, one word falls with the weight of a key."},
    warden: {"n": "Witness the Iron Syllable", "line": "At the seal of the vow, one word falls with the weight of a key."},
  } },
  "Commune": { by: {
    chaplain: {"n": "High Petition Observance", "line": "Over folded linen, a breath hangs in expectation of an answer."},
  } },
  "Commune with Nature": { by: {
    mistwalker: {"n": "Valley Ear in the Reeds", "line": "In the valley hush, earth and water seem to lean closer."},
    marksman: {"n": "Sign of the Valley Ear", "line": "From the sightline, earth and water seem to lean closer."},
  } },
  "Comprehend Languages": { by: {
    herald: {"n": "Unsealed Alphabet Refrain", "line": "On the answering beat, foreign marks loosen into meaning."},
    relicborn: {"n": "Unsealed Alphabet Array", "line": "Through a lattice of light, foreign marks loosen into meaning."},
    seepbound: {"n": "We Kept the Unsealed Alphabet", "line": "Through a film of brine, foreign marks loosen into meaning."},
    archivist: {"n": "Study of the Unsealed Alphabet", "line": "The lamp records how foreign marks loosen into meaning."},
  } },
  "Compulsion": { by: {
    herald: {"n": "Crooked Bearing March", "line": "As the pennant dips, all the shadows tip the same way."},
  } },
  "Cone of Cold": { by: {
    mistwalker: {"n": "White Avalanche in the Mire", "line": "In the valley hush, a fan of rime rasps across stone."},
    relicborn: {"n": "White Avalanche Array", "line": "Through a lattice of light, a fan of rime rasps across stone."},
    archivist: {"n": "Study of the White Avalanche", "line": "The lamp records how a fan of rime rasps across stone."},
  } },
  "Confusion": { by: {
    herald: {"n": "Broken Compass Refrain", "line": "Across the drumskin, four directions trade places."},
    mistwalker: {"n": "Broken Compass in the Mire", "line": "Where the mist thins, four directions trade places."},
    relicborn: {"n": "Broken Compass Array", "line": "As the red cell hums, four directions trade places."},
    archivist: {"n": "Study of the Broken Compass", "line": "The margin shows how four directions trade places."},
  } },
  "Conjure Animals": { by: {
    mistwalker: {"n": "Hoofprint Muster in the Reeds", "line": "In the alder shade, green pawprints wheel through the air."},
    marksman: {"n": "Sign of the Hoofprint Muster", "line": "In the field glass, green pawprints wheel through the air."},
  } },
  "Conjure Celestial": { by: {
    chaplain: {"n": "Star Visitor Observance", "line": "Between two breaths, a tall shape gathers out of pale points."},
  } },
  "Conjure Elemental": { by: {
    mistwalker: {"n": "Kiln Guest of the Fen", "line": "In the valley hush, a body heaves up in the chosen element."},
    archivist: {"n": "Index of the Kiln Guest", "line": "On the lens, a body heaves up in the chosen element."},
  } },
  "Conjure Fey": { by: {
    mistwalker: {"n": "Thorn Visitor of the Vale", "line": "In the alder shade, a strange outline steps through briar lace."},
  } },
  "Conjure Minor Elementals": { by: {
    mistwalker: {"n": "Pocket Tempest of the Fen", "line": "Where the mist thins, little whorls of weather orbit the ankles."},
    archivist: {"n": "Index of the Pocket Tempest", "line": "In pale tracing ink, little whorls of weather orbit the ankles."},
  } },
  "Conjure Woodland Beings": { by: {
    mistwalker: {"n": "Green Procession of the Vale", "line": "Where the mist thins, leaf shadows crowd the clearing."},
    marksman: {"n": "Read the Green Procession", "line": "Against the grey, leaf shadows crowd the clearing."},
  } },
  "Contact Other Plane": { by: {
    seepbound: {"n": "We Lend the Far Receiver", "line": "Behind our shared eyelid, an answer comes through like a voice under ice."},
    archivist: {"n": "Far Receiver Protocol", "line": "On the lens, an answer comes through like a voice under ice."},
  } },
  "Contagion": { by: {
    chaplain: {"n": "Sickly Seal Litany", "line": "Over folded linen, a livid seal trembles against the flesh."},
    mistwalker: {"n": "Sickly Seal of the Vale", "line": "Through a veil of dew, a livid seal trembles against the flesh."},
  } },
  "Contingency": { by: {
    archivist: {"n": "Index of the Waiting Clause", "line": "The margin shows how a second mark sleeps inside the first."},
  } },
  "Continual Flame": { by: {
    chaplain: {"n": "Unspent Wick Litany", "line": "Over folded linen, a flame stands still in the draught."},
    mistwalker: {"n": "Unspent Wick of the Vale", "line": "Through a veil of dew, a flame stands still in the draught."},
    archivist: {"n": "Unspent Wick Protocol", "line": "The margin shows how a flame stands still in the draught."},
  } },
  "Control Water": { by: {
    chaplain: {"n": "River Reins Observance", "line": "Over folded linen, a crease runs against the current."},
    mistwalker: {"n": "River Reins in the Mire", "line": "Where the mist thins, a crease runs against the current."},
    archivist: {"n": "Study of the River Reins", "line": "The margin shows how a crease runs against the current."},
  } },
  "Control Weather": { by: {
    chaplain: {"n": "Office of the Sky Reins", "line": "Over folded linen, the cloud banks turn like laden wagons."},
    mistwalker: {"n": "Sky Reins of the Fen", "line": "Through a veil of dew, the cloud banks turn like laden wagons."},
    archivist: {"n": "Index of the Sky Reins", "line": "The margin shows how the cloud banks turn like laden wagons."},
  } },
  "Counterspell": { by: {
    relicborn: {"n": "Break the Carrier Wave", "line": "The shard slips half a beat and the gathering light folds in on itself."},
    seepbound: {"n": "Give Us the Last Syllable", "line": "The Chorus mouths the end of the word before its speaker can."},
    archivist: {"n": "Strike from the Record", "line": "The lamp draws a blue stroke across a sentence still being written."},
  } },
  "Create Food and Water": { by: {
    chaplain: {"n": "Road Supper Litany", "line": "Over folded linen, bread and clear drops settle out of vapour."},
    warden: {"n": "Keep the Road Supper", "line": "As the vow is spoken, bread and clear drops settle out of vapour."},
  } },
  "Create or Destroy Water": { by: {
    chaplain: {"n": "Rain Ledger Litany", "line": "Over folded linen, moisture gathers along a wavering line."},
    mistwalker: {"n": "Rain Ledger of the Vale", "line": "Through a veil of dew, moisture gathers along a wavering line."},
  } },
  "Create Undead": { by: {
    chaplain: {"n": "Office of the Midnight Levy", "line": "Under the little bell, buried shoulders shift beneath the soil."},
    seepbound: {"n": "Our Midnight Levy", "line": "“See, dear one, how buried shoulders shift beneath the soil.”"},
    archivist: {"n": "Index of the Midnight Levy", "line": "In pale tracing ink, buried shoulders shift beneath the soil."},
  } },
  "Creation": { by: {
    relicborn: {"n": "Brief Substance Circuit", "line": "Between pulses, a dark outline takes on weight."},
    archivist: {"n": "Index of the Brief Substance", "line": "In pale tracing ink, a dark outline takes on weight."},
  } },
  "Cure Wounds": { by: {
    herald: {"n": "Rest on the Fourth Beat", "line": "A held note quivers along the seam as the torn edges meet."},
    chaplain: {"n": "Close the Red Margin", "line": "The chaplain draws two fingers together. Mint stitches follow them across the wound."},
    mistwalker: {"n": "Greenstick Binding", "line": "Fine green threads curl through the rent like sap finding a broken branch."},
    warden: {"n": "I Will Hold the Edges", "line": "Gold light gathers between the sworn hands like the lips of a closing clasp."},
    marksman: {"n": "Bind Before Sundown", "line": "A thin green line runs true as saddle thread through the ragged seam."},
  } },
  "Dancing Lights": { by: {
    herald: {"n": "Call of the Wandering Wicks", "line": "On the lifted stick, a little procession of lamps changes course."},
    relicborn: {"n": "Wandering Wicks Relay", "line": "In the shard’s afterglow, a little procession of lamps changes course."},
    archivist: {"n": "File: Wandering Wicks", "line": "On the lens, a little procession of lamps changes course."},
  } },
  "Darkness": { by: {
    relicborn: {"n": "Ink Well Relay", "line": "Through a lattice of light, the rim of the black globe swallows reflections."},
    seepbound: {"n": "Your Share: Ink Well", "line": "Through a film of brine, the rim of the black globe swallows reflections."},
    archivist: {"n": "File: Ink Well", "line": "The lamp records how the rim of the black globe swallows reflections."},
  } },
  "Darkvision": { by: {
    mistwalker: {"n": "Night Lens of the Vale", "line": "In the alder shade, a grey gleam catches in the pupils."},
    marksman: {"n": "Read the Night Lens", "line": "In the field glass, a grey gleam catches in the pupils."},
    relicborn: {"n": "Night Lens Lattice", "line": "Through a lattice of light, a grey gleam catches in the pupils."},
    archivist: {"n": "Night Lens Protocol", "line": "The lamp records how a grey gleam catches in the pupils."},
  } },
  "Daylight": { by: {
    chaplain: {"n": "Unshuttered Noon Litany", "line": "Under the little bell, white gold washes the floorboards."},
    mistwalker: {"n": "Unshuttered Noon of the Vale", "line": "Where the mist thins, white gold washes the floorboards."},
    warden: {"n": "Keep the Unshuttered Noon", "line": "Beneath the oath ring, white gold washes the floorboards."},
    marksman: {"n": "Read the Unshuttered Noon", "line": "Against the grey, white gold washes the floorboards."},
    relicborn: {"n": "Unshuttered Noon Lattice", "line": "Between pulses, white gold washes the floorboards."},
  } },
  "Death Ward": { by: {
    chaplain: {"n": "Last Knot Observance", "line": "Over folded linen, a second knot holds fast at the wrist."},
    warden: {"n": "Swear by the Last Knot", "line": "Beneath the oath ring, a second knot holds fast at the wrist."},
  } },
  "Delayed Blast Fireball": { by: {
    relicborn: {"n": "Patient Coal Relay", "line": "In the shard’s afterglow, an amber bead swells between beats."},
    archivist: {"n": "File: Patient Coal", "line": "On the lens, an amber bead swells between beats."},
  } },
  "Demiplane": { by: {
    relicborn: {"n": "Spare Room Relay", "line": "In the shard’s afterglow, a door opens onto an unfamiliar floor."},
    seepbound: {"n": "Your Share: Spare Room", "line": "Behind our shared eyelid, a door opens onto an unfamiliar floor."},
    archivist: {"n": "File: Spare Room", "line": "On the lens, a door opens onto an unfamiliar floor."},
  } },
  "Detect Evil and Good": { by: {
    chaplain: {"n": "Office of the Divided Footprints", "line": "Under the little bell, two kinds of track gleam through the grime."},
    warden: {"n": "Divided Footprints Vigil", "line": "Beneath the oath ring, two kinds of track gleam through the grime."},
  } },
  "Detect Magic": { by: {
    herald: {"n": "Hear the Missing Part", "line": "Beneath the room’s ordinary sounds the drum finds an answering pitch."},
    chaplain: {"n": "Wax at the Threshold", "line": "The little flame inclines as though someone has opened a vestry door."},
    mistwalker: {"n": "Dew on the Stranger", "line": "Dew catches along the working as it would along a spider’s thread."},
    warden: {"n": "Bear Witness to the Hand", "line": "The oath ring casts a second glint wherever a working stirs."},
    marksman: {"n": "Find the Other Track", "line": "There is a second trail through the room, bright as snail tracks after rain."},
    relicborn: {"n": "Read Residual Charge", "line": "Blue tracks wake on the inner faces of the shard."},
    seepbound: {"n": "Tell Us What Touched You", "line": "Beneath the varnish something glistens like the print of a wet thumb."},
    archivist: {"n": "Read the Watermark", "line": "Turn the lamp sideways. A second hand has written across the first."},
  } },
  "Detect Poison and Disease": { by: {
    chaplain: {"n": "Spoiled Cup Litany", "line": "Over folded linen, a sickly sheen gathers at the rim."},
    mistwalker: {"n": "Spoiled Cup of the Vale", "line": "Through a veil of dew, a sickly sheen gathers at the rim."},
    warden: {"n": "Keep the Spoiled Cup", "line": "As the vow is spoken, a sickly sheen gathers at the rim."},
    marksman: {"n": "Read the Spoiled Cup", "line": "At the held breath, a sickly sheen gathers at the rim."},
  } },
  "Detect Thoughts": { by: {
    herald: {"n": "Call of the Surface Ink", "line": "On the lifted stick, half-formed words stir under a smooth surface."},
    relicborn: {"n": "Surface Ink Relay", "line": "In the shard’s afterglow, half-formed words stir under a smooth surface."},
    archivist: {"n": "File: Surface Ink", "line": "On the lens, half-formed words stir under a smooth surface."},
  } },
  "Dimension Door": { by: {
    herald: {"n": "Near Horizon Measure", "line": "On the answering beat, a far threshold stands suddenly close."},
    relicborn: {"n": "Near Horizon Lattice", "line": "Through a lattice of light, a far threshold stands suddenly close."},
    seepbound: {"n": "We Lend the Near Horizon", "line": "Through a film of brine, a far threshold stands suddenly close."},
    archivist: {"n": "Near Horizon Protocol", "line": "The lamp records how a far threshold stands suddenly close."},
  } },
  "Disguise Self": { by: {
    herald: {"n": "Call of the Second Cut", "line": "As the pennant dips, the silhouette wears another set of seams."},
    relicborn: {"n": "Second Cut Relay", "line": "Between pulses, the silhouette wears another set of seams."},
    archivist: {"n": "File: Second Cut", "line": "In pale tracing ink, the silhouette wears another set of seams."},
  } },
  "Disintegrate": { by: {
    relicborn: {"n": "Dust Writ Relay", "line": "As the red cell hums, the outline sifts away like mortar."},
    archivist: {"n": "File: Dust Writ", "line": "The margin shows how the outline sifts away like mortar."},
  } },
  "Dispel Evil and Good": { by: {
    chaplain: {"n": "Office of the Clear the Threshold", "line": "At the final amen, a chalk-white boundary pushes outward."},
    warden: {"n": "Clear the Threshold Vigil", "line": "At the seal of the vow, a chalk-white boundary pushes outward."},
  } },
  "Dispel Magic": { by: {
    herald: {"n": "Loose Stitch Measure", "line": "Across the drumskin, the bright threads of a working fray."},
    chaplain: {"n": "Loose Stitch Litany", "line": "Over folded linen, the bright threads of a working fray."},
    mistwalker: {"n": "Loose Stitch of the Vale", "line": "Through a veil of dew, the bright threads of a working fray."},
    warden: {"n": "Keep the Loose Stitch", "line": "As the vow is spoken, the bright threads of a working fray."},
    marksman: {"n": "Read the Loose Stitch", "line": "At the held breath, the bright threads of a working fray."},
    relicborn: {"n": "Loose Stitch Lattice", "line": "As the red cell hums, the bright threads of a working fray."},
    seepbound: {"n": "We Lend the Loose Stitch", "line": "Under the wet murmur, the bright threads of a working fray."},
    archivist: {"n": "Loose Stitch Protocol", "line": "The margin shows how the bright threads of a working fray."},
  } },
  "Dissonant Whispers": { by: {
    herald: {"n": "Earworm Refrain", "line": "As the pennant dips, a splinter of sound catches behind the ear."},
  } },
  "Divination": { by: {
    chaplain: {"n": "Office of the Tomorrow’s Margin", "line": "Under the little bell, a mark appears where the hand has yet to write."},
    mistwalker: {"n": "Tomorrow’s Margin of the Fen", "line": "Where the mist thins, a mark appears where the hand has yet to write."},
    archivist: {"n": "Index of the Tomorrow’s Margin", "line": "In pale tracing ink, a mark appears where the hand has yet to write."},
  } },
  "Divine Favor": { by: {
    warden: {"n": "Honeyed Edge Vigil", "line": "At the seal of the vow, a fine gold bead runs towards the point."},
  } },
  "Divine Smite": { by: {
    warden: {"n": "Noon on Iron Vigil", "line": "As the vow is spoken, a blade meets a flash of buried noon."},
  } },
  "Divine Word": { by: {
    chaplain: {"n": "Prayer of the Final Syllable", "line": "Between two breaths, the air buckles around a single vowel."},
  } },
  "Dominate Beast": { by: {
    mistwalker: {"n": "Beast Rein in the Mire", "line": "Through a veil of dew, a cord of shadow draws taut beneath the mane."},
    marksman: {"n": "Beast Rein Drill", "line": "From the sightline, a cord of shadow draws taut beneath the mane."},
    relicborn: {"n": "Beast Rein Array", "line": "In the shard’s afterglow, a cord of shadow draws taut beneath the mane."},
  } },
  "Dominate Monster": { by: {
    herald: {"n": "Colossus Rein March", "line": "As the pennant dips, a giant shadow bends at an unseen tug."},
    relicborn: {"n": "Colossus Rein Circuit", "line": "Through a lattice of light, a giant shadow bends at an unseen tug."},
    seepbound: {"n": "Our Colossus Rein", "line": "Through a film of brine, a giant shadow bends at an unseen tug."},
    archivist: {"n": "Index of the Colossus Rein", "line": "The lamp records how a giant shadow bends at an unseen tug."},
  } },
  "Dominate Person": { by: {
    herald: {"n": "Puppet Knot Refrain", "line": "As the pennant dips, a fine knot turns at the nape."},
    relicborn: {"n": "Puppet Knot Array", "line": "Between pulses, a fine knot turns at the nape."},
    archivist: {"n": "Study of the Puppet Knot", "line": "In pale tracing ink, a fine knot turns at the nape."},
  } },
  "Dragon's Breath": { by: {
    relicborn: {"n": "Furnace Throat Relay", "line": "Through a lattice of light, a scale of colour lifts at the throat."},
    archivist: {"n": "File: Furnace Throat", "line": "The lamp records how a scale of colour lifts at the throat."},
  } },
  "Dream": { by: {
    herald: {"n": "Night Letter March", "line": "As the pennant dips, a sleeping face turns towards distant footsteps."},
    seepbound: {"n": "Our Night Letter", "line": "Through a film of brine, a sleeping face turns towards distant footsteps."},
    archivist: {"n": "Index of the Night Letter", "line": "The lamp records how a sleeping face turns towards distant footsteps."},
  } },
  "Druidcraft": { by: {
    mistwalker: {"n": "Seed Weather in the Mire", "line": "In the alder shade, dew trembles on a leaf no bigger than a nail."},
  } },
  "Earthquake": { by: {
    chaplain: {"n": "Prayer of the Fault Bell", "line": "Between two breaths, the earth rings like a cracked bell."},
    mistwalker: {"n": "Fault Bell in the Reeds", "line": "In the alder shade, the earth rings like a cracked bell."},
    relicborn: {"n": "Fault Bell Relay", "line": "Through a lattice of light, the earth rings like a cracked bell."},
  } },
  "Eldritch Blast": { by: {
    seepbound: {"n": "Take This Rib of Ours", "line": "Something warm leaves the palm. Behind the teeth, the Chorus counts one less."},
  } },
  "Elementalism": { by: {
    mistwalker: {"n": "Four Small Winds in the Mire", "line": "Through a veil of dew, grit and droplets turn round a coal."},
    relicborn: {"n": "Four Small Winds Array", "line": "In the shard’s afterglow, grit and droplets turn round a coal."},
    archivist: {"n": "Study of the Four Small Winds", "line": "On the lens, grit and droplets turn round a coal."},
  } },
  "Enhance Ability": { by: {
    herald: {"n": "Animal Seal Refrain", "line": "On the lifted stick, a beast-shaped gleam settles over the shoulders."},
    chaplain: {"n": "Animal Seal Observance", "line": "At the final amen, a beast-shaped gleam settles over the shoulders."},
    mistwalker: {"n": "Animal Seal in the Mire", "line": "Through a veil of dew, a beast-shaped gleam settles over the shoulders."},
    marksman: {"n": "Animal Seal Drill", "line": "From the sightline, a beast-shaped gleam settles over the shoulders."},
    relicborn: {"n": "Animal Seal Array", "line": "In the shard’s afterglow, a beast-shaped gleam settles over the shoulders."},
    archivist: {"n": "Study of the Animal Seal", "line": "On the lens, a beast-shaped gleam settles over the shoulders."},
  } },
  "Enlarge/Reduce": { by: {
    herald: {"n": "Sliding Scale March", "line": "Across the drumskin, the shadow changes length beneath its owner."},
    mistwalker: {"n": "Sliding Scale of the Fen", "line": "Where the mist thins, the shadow changes length beneath its owner."},
    relicborn: {"n": "Sliding Scale Circuit", "line": "Between pulses, the shadow changes length beneath its owner."},
    archivist: {"n": "Index of the Sliding Scale", "line": "In pale tracing ink, the shadow changes length beneath its owner."},
  } },
  "Ensnaring Strike": { by: {
    marksman: {"n": "Sign of the Hooked Runner", "line": "Against the grey, a vine tightens around the point of impact."},
  } },
  "Entangle": { by: {
    mistwalker: {"n": "The Furrow Takes Hold", "line": "Roots shoulder up the flagstones and curl like sleeping dogs around the boots."},
    marksman: {"n": "Briar Across the Run", "line": "The ground draws its runners tight as the last knot in a trail net."},
  } },
  "Enthrall": { by: {
    herald: {"n": "Captive Gallery Measure", "line": "On the answering beat, every gaze turns like a row of lamps."},
    seepbound: {"n": "We Lend the Captive Gallery", "line": "Through a film of brine, every gaze turns like a row of lamps."},
  } },
  "Etherealness": { by: {
    herald: {"n": "Call of the Thin Country", "line": "Across the drumskin, familiar walls fade to the colour of breath."},
    chaplain: {"n": "Prayer of the Thin Country", "line": "Over folded linen, familiar walls fade to the colour of breath."},
    relicborn: {"n": "Thin Country Relay", "line": "As the red cell hums, familiar walls fade to the colour of breath."},
    seepbound: {"n": "Your Share: Thin Country", "line": "Under the wet murmur, familiar walls fade to the colour of breath."},
    archivist: {"n": "File: Thin Country", "line": "The margin shows how familiar walls fade to the colour of breath."},
  } },
  "Expeditious Retreat": { by: {
    relicborn: {"n": "Fleet Heel Lattice", "line": "Through a lattice of light, bright commas flick off the heels."},
    seepbound: {"n": "We Lend the Fleet Heel", "line": "Through a film of brine, bright commas flick off the heels."},
    archivist: {"n": "Fleet Heel Protocol", "line": "The lamp records how bright commas flick off the heels."},
  } },
  "Eyebite": { by: {
    herald: {"n": "Call of the Bad Pupil", "line": "As the pennant dips, a dark pupil swims across the eye."},
    relicborn: {"n": "Bad Pupil Relay", "line": "Between pulses, a dark pupil swims across the eye."},
    seepbound: {"n": "Your Share: Bad Pupil", "line": "“See, dear one, how a dark pupil swims across the eye.”"},
    archivist: {"n": "File: Bad Pupil", "line": "In pale tracing ink, a dark pupil swims across the eye."},
  } },
  "Fabricate": { by: {
    archivist: {"n": "Index of the Bench Without Hands", "line": "The margin shows how raw material creases along a maker’s lines."},
  } },
  "Faerie Fire": { by: {
    herald: {"n": "Violet Tracing Measure", "line": "Across the drumskin, violet seams pick out the hidden contours."},
    mistwalker: {"n": "Violet Tracing of the Vale", "line": "Through a veil of dew, violet seams pick out the hidden contours."},
  } },
  "Faithful Hound": { by: {
    archivist: {"n": "Index of the Invisible Kennel", "line": "The margin shows how a dog’s breath dimples the air."},
  } },
  "False Life": { by: {
    relicborn: {"n": "Wax Pulse Relay", "line": "Through a lattice of light, a false warmth settles over the heart."},
    archivist: {"n": "File: Wax Pulse", "line": "The lamp records how a false warmth settles over the heart."},
  } },
  "Fear": { by: {
    herald: {"n": "Long Shadow Measure", "line": "On the lifted stick, the shadow ahead grows long and personal."},
    relicborn: {"n": "Long Shadow Lattice", "line": "In the shard’s afterglow, the shadow ahead grows long and personal."},
    seepbound: {"n": "We Lend the Long Shadow", "line": "Behind our shared eyelid, the shadow ahead grows long and personal."},
    archivist: {"n": "Long Shadow Protocol", "line": "On the lens, the shadow ahead grows long and personal."},
  } },
  "Feather Fall": { by: {
    herald: {"n": "Merciful Descent Measure", "line": "On the lifted stick, pale down drifts below the falling boots."},
    relicborn: {"n": "Merciful Descent Lattice", "line": "In the shard’s afterglow, pale down drifts below the falling boots."},
    archivist: {"n": "Merciful Descent Protocol", "line": "On the lens, pale down drifts below the falling boots."},
  } },
  "Find Familiar": { by: {
    archivist: {"n": "Little Witness Protocol", "line": "In pale tracing ink, two curious eyes appear below knee height."},
  } },
  "Find Steed": { by: {
    warden: {"n": "Keep the Empty Saddle", "line": "Beneath the oath ring, hoof marks deepen beneath an empty bridle."},
  } },
  "Find the Path": { by: {
    herald: {"n": "Call of the Home Needle", "line": "On the lifted stick, a thin point trembles towards the road."},
    chaplain: {"n": "Prayer of the Home Needle", "line": "At the final amen, a thin point trembles towards the road."},
    mistwalker: {"n": "Home Needle in the Reeds", "line": "In the valley hush, a thin point trembles towards the road."},
  } },
  "Find Traps": { by: {
    chaplain: {"n": "Prayer of the Treacherous Inch", "line": "Between two breaths, a warning pricks like grit beneath a boot."},
    mistwalker: {"n": "Treacherous Inch in the Reeds", "line": "In the alder shade, a warning pricks like grit beneath a boot."},
    marksman: {"n": "Sign of the Treacherous Inch", "line": "In the field glass, a warning pricks like grit beneath a boot."},
  } },
  "Finger of Death": { by: {
    relicborn: {"n": "Pale Verdict Lattice", "line": "Between pulses, a bone-white line cuts through the dim."},
    seepbound: {"n": "We Lend the Pale Verdict", "line": "“See, dear one, how a bone-white line cuts through the dim.”"},
    archivist: {"n": "Pale Verdict Protocol", "line": "In pale tracing ink, a bone-white line cuts through the dim."},
  } },
  "Fireball": { by: {
    relicborn: {"n": "Furnace Heart", "line": "A point of copper swells until its shell gives way in a roll of soot."},
    archivist: {"n": "The Burning Index", "line": "A single entry glows orange. For an instant its black margins fill the whole room."},
  } },
  "Fire Bolt": { by: {
    relicborn: {"n": "Spit from the Kiln", "line": "One hot mote skips away with a tail of red grit."},
    archivist: {"n": "Burn After Reading", "line": "A coal leaps from the final full stop and trails a hairline of red ink."},
  } },
  "Fire Shield": { by: {
    mistwalker: {"n": "Mantle of Coals in the Reeds", "line": "In the valley hush, bright ribbons curl around the shoulders."},
    relicborn: {"n": "Mantle of Coals Relay", "line": "In the shard’s afterglow, bright ribbons curl around the shoulders."},
    archivist: {"n": "File: Mantle of Coals", "line": "On the lens, bright ribbons curl around the shoulders."},
  } },
  "Fire Storm": { by: {
    chaplain: {"n": "Prayer of the Scarlet Furrows", "line": "Between two breaths, upright flames race down crooked lanes."},
    mistwalker: {"n": "Scarlet Furrows in the Reeds", "line": "In the alder shade, upright flames race down crooked lanes."},
    relicborn: {"n": "Scarlet Furrows Relay", "line": "Through a lattice of light, upright flames race down crooked lanes."},
  } },
  "Flame Blade": { by: {
    mistwalker: {"n": "Saffron Crescent of the Fen", "line": "In the valley hush, a hot curved edge sweats amber sparks."},
    relicborn: {"n": "Saffron Crescent Circuit", "line": "In the shard’s afterglow, a hot curved edge sweats amber sparks."},
  } },
  "Flame Strike": { by: {
    chaplain: {"n": "Prayer of the Falling Brand", "line": "Under the little bell, white fire descends in a crimson sleeve."},
  } },
  "Flaming Sphere": { by: {
    mistwalker: {"n": "Rolling Kiln of the Fen", "line": "Where the mist thins, a tumbling coal leaves a wake of sparks."},
    relicborn: {"n": "Rolling Kiln Circuit", "line": "Between pulses, a tumbling coal leaves a wake of sparks."},
    archivist: {"n": "Index of the Rolling Kiln", "line": "In pale tracing ink, a tumbling coal leaves a wake of sparks."},
  } },
  "Flesh to Stone": { by: {
    mistwalker: {"n": "Marble Debt of the Vale", "line": "In the valley hush, mineral grain climbs over living skin."},
    relicborn: {"n": "Marble Debt Lattice", "line": "In the shard’s afterglow, mineral grain climbs over living skin."},
    archivist: {"n": "Marble Debt Protocol", "line": "On the lens, mineral grain climbs over living skin."},
  } },
  "Floating Disk": { by: {
    archivist: {"n": "File: Burden Plate", "line": "On the lens, a flat blue lens steadies above the dirt."},
  } },
  "Fly": { by: {
    relicborn: {"n": "Skyward Thread Relay", "line": "Through a lattice of light, invisible rigging draws the body up."},
    seepbound: {"n": "Your Share: Skyward Thread", "line": "Through a film of brine, invisible rigging draws the body up."},
    archivist: {"n": "File: Skyward Thread", "line": "The lamp records how invisible rigging draws the body up."},
  } },
  "Fog Cloud": { by: {
    mistwalker: {"n": "Milk of Morning in the Reeds", "line": "Through a veil of dew, pearl vapour gathers in low folds."},
    marksman: {"n": "Sign of the Milk of Morning", "line": "At the held breath, pearl vapour gathers in low folds."},
    relicborn: {"n": "Milk of Morning Relay", "line": "As the red cell hums, pearl vapour gathers in low folds."},
    archivist: {"n": "File: Milk of Morning", "line": "The margin shows how pearl vapour gathers in low folds."},
  } },
  "Forbiddance": { by: {
    chaplain: {"n": "Office of the Sealed Parish", "line": "Over folded linen, old boundaries show like salt on a map."},
  } },
  "Forcecage": { by: {
    herald: {"n": "Call of the Glass Gaol", "line": "On the lifted stick, empty air takes a set of hard corners."},
    seepbound: {"n": "Your Share: Glass Gaol", "line": "Behind our shared eyelid, empty air takes a set of hard corners."},
    archivist: {"n": "File: Glass Gaol", "line": "On the lens, empty air takes a set of hard corners."},
  } },
  "Foresight": { by: {
    herald: {"n": "Call of the Early Shadow", "line": "On the answering beat, the shadow flinches just before the body."},
    mistwalker: {"n": "Early Shadow in the Reeds", "line": "In the alder shade, the shadow flinches just before the body."},
    seepbound: {"n": "Your Share: Early Shadow", "line": "Through a film of brine, the shadow flinches just before the body."},
    archivist: {"n": "File: Early Shadow", "line": "The lamp records how the shadow flinches just before the body."},
  } },
  "Freedom of Movement": { by: {
    herald: {"n": "Uncaught Heel Measure", "line": "Across the drumskin, tight threads slip harmlessly off a boot."},
    chaplain: {"n": "Uncaught Heel Litany", "line": "Over folded linen, tight threads slip harmlessly off a boot."},
    mistwalker: {"n": "Uncaught Heel of the Vale", "line": "Through a veil of dew, tight threads slip harmlessly off a boot."},
    marksman: {"n": "Read the Uncaught Heel", "line": "At the held breath, tight threads slip harmlessly off a boot."},
  } },
  "Freezing Sphere": { by: {
    relicborn: {"n": "Winter Pearl Circuit", "line": "As the red cell hums, a bead of winter shines blue through its shell."},
    archivist: {"n": "Index of the Winter Pearl", "line": "The margin shows how a bead of winter shines blue through its shell."},
  } },
  "Gaseous Form": { by: {
    relicborn: {"n": "Loosen the Outline Relay", "line": "Through a lattice of light, the figure unravels into grey ribbons."},
    seepbound: {"n": "Your Share: Loosen the Outline", "line": "Through a film of brine, the figure unravels into grey ribbons."},
    archivist: {"n": "File: Loosen the Outline", "line": "The lamp records how the figure unravels into grey ribbons."},
  } },
  "Gate": { by: {
    chaplain: {"n": "Office of the Wide Threshold", "line": "Over folded linen, another sky fills the opening."},
    relicborn: {"n": "Wide Threshold Circuit", "line": "As the red cell hums, another sky fills the opening."},
    seepbound: {"n": "Our Wide Threshold", "line": "Under the wet murmur, another sky fills the opening."},
    archivist: {"n": "Index of the Wide Threshold", "line": "The margin shows how another sky fills the opening."},
  } },
  "Geas": { by: {
    herald: {"n": "Old Injunction Refrain", "line": "On the lifted stick, an unspoken sentence tightens at the throat."},
    chaplain: {"n": "Old Injunction Observance", "line": "At the final amen, an unspoken sentence tightens at the throat."},
    mistwalker: {"n": "Old Injunction in the Mire", "line": "Through a veil of dew, an unspoken sentence tightens at the throat."},
    warden: {"n": "Swear by the Old Injunction", "line": "As the vow is spoken, an unspoken sentence tightens at the throat."},
    archivist: {"n": "Study of the Old Injunction", "line": "On the lens, an unspoken sentence tightens at the throat."},
  } },
  "Gentle Repose": { by: {
    chaplain: {"n": "Office of the Quiet Tallow", "line": "At the final amen, wax-pale stillness settles on the eyelids."},
    warden: {"n": "Quiet Tallow Vigil", "line": "At the seal of the vow, wax-pale stillness settles on the eyelids."},
    archivist: {"n": "Index of the Quiet Tallow", "line": "On the lens, wax-pale stillness settles on the eyelids."},
  } },
  "Giant Insect": { by: {
    mistwalker: {"n": "Many-Jointed Guest of the Fen", "line": "In the alder shade, a small shadow unfurls too many legs."},
  } },
  "Glibness": { by: {
    herald: {"n": "Call of the Silver Tongueprint", "line": "As the pennant dips, each syllable leaves a polished edge."},
    seepbound: {"n": "Your Share: Silver Tongueprint", "line": "“See, dear one, how each syllable leaves a polished edge.”"},
  } },
  "Globe of Invulnerability": { by: {
    relicborn: {"n": "Clear Reliquary Relay", "line": "In the shard’s afterglow, a glassy dome stands against the draught."},
    archivist: {"n": "File: Clear Reliquary", "line": "On the lens, a glassy dome stands against the draught."},
  } },
  "Glyph of Warding": { by: {
    herald: {"n": "Waiting Seal March", "line": "Across the drumskin, a bright knot lies flush with the dust."},
    chaplain: {"n": "Office of the Waiting Seal", "line": "Under the little bell, a bright knot lies flush with the dust."},
    archivist: {"n": "Index of the Waiting Seal", "line": "In pale tracing ink, a bright knot lies flush with the dust."},
  } },
  "Goodberry": { by: {
    mistwalker: {"n": "Red Ration of the Fen", "line": "In the valley hush, soft red beads glow under green leaves."},
    marksman: {"n": "Trail Sign: Red Ration", "line": "In the field glass, soft red beads glow under green leaves."},
  } },
  "Grease": { by: {
    relicborn: {"n": "Slick Penny Relay", "line": "Between pulses, copper colours skate across the floor."},
    archivist: {"n": "File: Slick Penny", "line": "In pale tracing ink, copper colours skate across the floor."},
  } },
  "Greater Invisibility": { by: {
    herald: {"n": "Stolen Outline March", "line": "As the pennant dips, even the silver rim of the figure goes missing."},
    relicborn: {"n": "Stolen Outline Circuit", "line": "Through a lattice of light, even the silver rim of the figure goes missing."},
    archivist: {"n": "Index of the Stolen Outline", "line": "The lamp records how even the silver rim of the figure goes missing."},
  } },
  "Greater Restoration": { by: {
    herald: {"n": "Deep Unpicking Refrain", "line": "Across the drumskin, dark splinters lift clear of the skin."},
    chaplain: {"n": "Deep Unpicking Observance", "line": "Over folded linen, dark splinters lift clear of the skin."},
    mistwalker: {"n": "Deep Unpicking in the Mire", "line": "Where the mist thins, dark splinters lift clear of the skin."},
    warden: {"n": "Swear by the Deep Unpicking", "line": "Beneath the oath ring, dark splinters lift clear of the skin."},
    marksman: {"n": "Deep Unpicking Drill", "line": "At the held breath, dark splinters lift clear of the skin."},
  } },
  "Guardian of Faith": { by: {
    chaplain: {"n": "Chapel Sentinel Observance", "line": "Between two breaths, a tall outline stands under a ring of gold."},
  } },
  "Guards and Wards": { by: {
    herald: {"n": "Hostile House Measure", "line": "On the answering beat, the corridors wear unfamiliar shadows."},
    archivist: {"n": "Hostile House Protocol", "line": "The lamp records how the corridors wear unfamiliar shadows."},
  } },
  "Guidance": { by: {
    chaplain: {"n": "Kind Bearing Observance", "line": "At the final amen, a gold point settles on a waiting hand."},
    mistwalker: {"n": "Kind Bearing in the Mire", "line": "Through a veil of dew, a gold point settles on a waiting hand."},
  } },
  "Guiding Bolt": { by: {
    chaplain: {"n": "Quarry Star Observance", "line": "Under the little bell, a star hangs where the bright shaft landed."},
  } },
  "Gust of Wind": { by: {
    mistwalker: {"n": "Bellows Lane of the Vale", "line": "In the alder shade, a straight rush of air combs the grit."},
    marksman: {"n": "Read the Bellows Lane", "line": "In the field glass, a straight rush of air combs the grit."},
    relicborn: {"n": "Bellows Lane Lattice", "line": "Through a lattice of light, a straight rush of air combs the grit."},
    archivist: {"n": "Bellows Lane Protocol", "line": "The lamp records how a straight rush of air combs the grit."},
  } },
  "Hallow": { by: {
    chaplain: {"n": "Prayer of the Consecrated Acre", "line": "Under the little bell, a pale border settles into the land."},
  } },
  "Hallucinatory Terrain": { by: {
    herald: {"n": "Counterfeit Valley Refrain", "line": "Across the drumskin, the hillside wears another season’s coat."},
    mistwalker: {"n": "Counterfeit Valley in the Mire", "line": "Where the mist thins, the hillside wears another season’s coat."},
    seepbound: {"n": "We Kept the Counterfeit Valley", "line": "Under the wet murmur, the hillside wears another season’s coat."},
    archivist: {"n": "Study of the Counterfeit Valley", "line": "The margin shows how the hillside wears another season’s coat."},
  } },
  "Harm": { by: {
    chaplain: {"n": "Wasting Writ Observance", "line": "Under the little bell, a bruise spreads like ink through linen."},
  } },
  "Haste": { by: {
    relicborn: {"n": "Double Tick Circuit", "line": "Between pulses, two shadows chase each moving heel."},
    archivist: {"n": "Index of the Double Tick", "line": "In pale tracing ink, two shadows chase each moving heel."},
  } },
  "Heal": { by: {
    chaplain: {"n": "Whole Cloth Litany", "line": "Between two breaths, the last torn seam fills with green."},
    mistwalker: {"n": "Whole Cloth of the Vale", "line": "In the alder shade, the last torn seam fills with green."},
  } },
  "Healing Word": { by: {
    herald: {"n": "Breath on the Upbeat", "line": "A lone green note trembles where the singer’s hand would rest."},
    chaplain: {"n": "Stay for Matins", "line": "A syllable soft as clean linen opens green against the ribs."},
    mistwalker: {"n": "Bud Under Snow", "line": "Under the bruised skin a green bud opens into warmth."},
  } },
  "Heat Metal": { by: {
    herald: {"n": "Cherry Iron March", "line": "Across the drumskin, red heat creeps along the worked seams."},
    mistwalker: {"n": "Cherry Iron of the Fen", "line": "Where the mist thins, red heat creeps along the worked seams."},
  } },
  "Hellish Rebuke": { by: {
    seepbound: {"n": "Your Share: Debtor’s Pyre", "line": "“See, dear one, how red teeth of flame snap up from below.”"},
  } },
  "Heroes' Feast": { by: {
    herald: {"n": "Long Table Refrain", "line": "On the lifted stick, steam rises along an unbroken board."},
    chaplain: {"n": "Long Table Observance", "line": "At the final amen, steam rises along an unbroken board."},
    mistwalker: {"n": "Long Table in the Mire", "line": "Through a veil of dew, steam rises along an unbroken board."},
  } },
  "Heroism": { by: {
    herald: {"n": "Call of the Steadfast Wick", "line": "As the pennant dips, a small dawn holds behind the breastbone."},
    warden: {"n": "Witness the Steadfast Wick", "line": "Beneath the oath ring, a small dawn holds behind the breastbone."},
  } },
  "Hex": { by: {
    seepbound: {"n": "Our Bad Penny", "line": "“See, dear one, how a violet eye turns with its quarry.”"},
  } },
  "Hideous Laughter": { by: {
    herald: {"n": "Unbidden Mirth March", "line": "On the answering beat, crooked commas tumble from the lips."},
    seepbound: {"n": "Our Unbidden Mirth", "line": "Behind our shared eyelid, crooked commas tumble from the lips."},
    archivist: {"n": "Index of the Unbidden Mirth", "line": "On the lens, crooked commas tumble from the lips."},
  } },
  "Hold Monster": { by: {
    herald: {"n": "Call of the Great Fetters", "line": "On the lifted stick, steel-blue links close around the great limbs."},
    relicborn: {"n": "Great Fetters Relay", "line": "In the shard’s afterglow, steel-blue links close around the great limbs."},
    seepbound: {"n": "Your Share: Great Fetters", "line": "Behind our shared eyelid, steel-blue links close around the great limbs."},
    archivist: {"n": "File: Great Fetters", "line": "On the lens, steel-blue links close around the great limbs."},
  } },
  "Hold Person": { by: {
    herald: {"n": "Grey Fetters Measure", "line": "On the lifted stick, grey links cinch at wrist and ankle."},
    chaplain: {"n": "Grey Fetters Litany", "line": "At the final amen, grey links cinch at wrist and ankle."},
    mistwalker: {"n": "Grey Fetters of the Vale", "line": "In the valley hush, grey links cinch at wrist and ankle."},
    relicborn: {"n": "Grey Fetters Lattice", "line": "In the shard’s afterglow, grey links cinch at wrist and ankle."},
    seepbound: {"n": "We Lend the Grey Fetters", "line": "Behind our shared eyelid, grey links cinch at wrist and ankle."},
    archivist: {"n": "Grey Fetters Protocol", "line": "On the lens, grey links cinch at wrist and ankle."},
  } },
  "Holy Aura": { by: {
    chaplain: {"n": "Office of the Procession of Gold", "line": "Under the little bell, a moving ring of light gathers at the feet."},
  } },
  "Hunter's Mark": { by: {
    marksman: {"n": "Cut the Quarry Notch", "line": "An amber nick hangs above the trail like a cut in the bark of an invisible tree."},
  } },
  "Hypnotic Pattern": { by: {
    herald: {"n": "Turning Brocade Refrain", "line": "On the answering beat, violet diamonds fold into rose-coloured silk."},
    relicborn: {"n": "Turning Brocade Array", "line": "Through a lattice of light, violet diamonds fold into rose-coloured silk."},
    seepbound: {"n": "We Kept the Turning Brocade", "line": "Through a film of brine, violet diamonds fold into rose-coloured silk."},
    archivist: {"n": "Study of the Turning Brocade", "line": "The lamp records how violet diamonds fold into rose-coloured silk."},
  } },
  "Ice Knife": { by: {
    mistwalker: {"n": "Winter Splinter of the Vale", "line": "In the valley hush, a glass barb breaks into stinging sleet."},
    relicborn: {"n": "Winter Splinter Lattice", "line": "In the shard’s afterglow, a glass barb breaks into stinging sleet."},
    archivist: {"n": "Winter Splinter Protocol", "line": "On the lens, a glass barb breaks into stinging sleet."},
  } },
  "Ice Storm": { by: {
    mistwalker: {"n": "Roof of Hail of the Vale", "line": "Where the mist thins, hard pellets drum on a ceiling of cloud."},
    relicborn: {"n": "Roof of Hail Lattice", "line": "Between pulses, hard pellets drum on a ceiling of cloud."},
    archivist: {"n": "Roof of Hail Protocol", "line": "In pale tracing ink, hard pellets drum on a ceiling of cloud."},
  } },
  "Identify": { by: {
    herald: {"n": "Maker’s Ticket Refrain", "line": "On the answering beat, fine labels turn round the object."},
    archivist: {"n": "Study of the Maker’s Ticket", "line": "The lamp records how fine labels turn round the object."},
  } },
  "Illusory Script": { by: {
    herald: {"n": "Double Handwriting Refrain", "line": "As the pennant dips, letters turn their faces from the reader."},
    seepbound: {"n": "We Kept the Double Handwriting", "line": "“See, dear one, how letters turn their faces from the reader.”"},
    archivist: {"n": "Study of the Double Handwriting", "line": "In pale tracing ink, letters turn their faces from the reader."},
  } },
  "Imprisonment": { by: {
    seepbound: {"n": "Our Last Coffin", "line": "“See, dear one, how a seal closes on an impossibly quiet space.”"},
    archivist: {"n": "Index of the Last Coffin", "line": "In pale tracing ink, a seal closes on an impossibly quiet space."},
  } },
  "Incendiary Cloud": { by: {
    mistwalker: {"n": "Banked Furnace of the Fen", "line": "In the valley hush, orange seams open in banks of soot."},
    relicborn: {"n": "Banked Furnace Circuit", "line": "In the shard’s afterglow, orange seams open in banks of soot."},
    archivist: {"n": "Index of the Banked Furnace", "line": "On the lens, orange seams open in banks of soot."},
  } },
  "Inflict Wounds": { by: {
    chaplain: {"n": "Office of the Ashen Palm", "line": "Between two breaths, plum-dark cracks spread from a handprint."},
  } },
  "Insect Plague": { by: {
    chaplain: {"n": "Black Harvest Observance", "line": "Over folded linen, the air takes on the grain of crawling wings."},
    mistwalker: {"n": "Black Harvest in the Mire", "line": "Where the mist thins, the air takes on the grain of crawling wings."},
    relicborn: {"n": "Black Harvest Array", "line": "As the red cell hums, the air takes on the grain of crawling wings."},
  } },
  "Instant Summons": { by: {
    archivist: {"n": "File: Sapphire Tether", "line": "The margin shows how a blue thread pulls against the distance."},
  } },
  "Irresistible Dance": { by: {
    herald: {"n": "Crooked Reel Refrain", "line": "On the answering beat, the feet pick up an unwanted measure."},
    archivist: {"n": "Study of the Crooked Reel", "line": "The lamp records how the feet pick up an unwanted measure."},
  } },
  "Invisibility": { by: {
    herald: {"n": "Call of the Empty Sleeve", "line": "On the lifted stick, the silhouette slides out of its shadow."},
    relicborn: {"n": "Empty Sleeve Relay", "line": "In the shard’s afterglow, the silhouette slides out of its shadow."},
    seepbound: {"n": "Your Share: Empty Sleeve", "line": "Behind our shared eyelid, the silhouette slides out of its shadow."},
    archivist: {"n": "File: Empty Sleeve", "line": "On the lens, the silhouette slides out of its shadow."},
  } },
  "Jump": { by: {
    mistwalker: {"n": "Long Spring in the Mire", "line": "In the valley hush, a green coil unwinds under the heels."},
    marksman: {"n": "Long Spring Drill", "line": "In the field glass, a green coil unwinds under the heels."},
    relicborn: {"n": "Long Spring Array", "line": "Through a lattice of light, a green coil unwinds under the heels."},
    archivist: {"n": "Study of the Long Spring", "line": "The lamp records how a green coil unwinds under the heels."},
  } },
  "Knock": { by: {
    herald: {"n": "Brass Rap Measure", "line": "As the pennant dips, one hard ripple strikes the lock."},
    relicborn: {"n": "Brass Rap Lattice", "line": "Between pulses, one hard ripple strikes the lock."},
    archivist: {"n": "Brass Rap Protocol", "line": "In pale tracing ink, one hard ripple strikes the lock."},
  } },
  "Legend Lore": { by: {
    herald: {"n": "Dust Biography March", "line": "On the lifted stick, old deeds drift up like dust from a coat."},
    chaplain: {"n": "Office of the Dust Biography", "line": "Over folded linen, old deeds drift up like dust from a coat."},
    archivist: {"n": "Index of the Dust Biography", "line": "The margin shows how old deeds drift up like dust from a coat."},
  } },
  "Lesser Restoration": { by: {
    herald: {"n": "Clean Splinter Refrain", "line": "As the pennant dips, a green spark carries off a fleck of grey."},
    chaplain: {"n": "Clean Splinter Observance", "line": "Under the little bell, a green spark carries off a fleck of grey."},
    mistwalker: {"n": "Clean Splinter in the Mire", "line": "In the alder shade, a green spark carries off a fleck of grey."},
    warden: {"n": "Swear by the Clean Splinter", "line": "Before silent witnesses, a green spark carries off a fleck of grey."},
    marksman: {"n": "Clean Splinter Drill", "line": "Against the grey, a green spark carries off a fleck of grey."},
  } },
  "Levitate": { by: {
    relicborn: {"n": "Plumb Line Lattice", "line": "In the shard’s afterglow, pale rings stack under a rising figure."},
    archivist: {"n": "Plumb Line Protocol", "line": "On the lens, pale rings stack under a rising figure."},
  } },
  "Light": { by: {
    herald: {"n": "Borrowed Wick Refrain", "line": "As the pennant dips, warm honey gathers on the touched surface."},
    chaplain: {"n": "Borrowed Wick Observance", "line": "Under the little bell, warm honey gathers on the touched surface."},
    relicborn: {"n": "Borrowed Wick Array", "line": "Between pulses, warm honey gathers on the touched surface."},
    archivist: {"n": "Study of the Borrowed Wick", "line": "In pale tracing ink, warm honey gathers on the touched surface."},
  } },
  "Lightning Bolt": { by: {
    relicborn: {"n": "Split Rail Circuit", "line": "Between pulses, a white crack joins two stretches of air."},
    archivist: {"n": "Index of the Split Rail", "line": "In pale tracing ink, a white crack joins two stretches of air."},
  } },
  "Locate Animals or Plants": { by: {
    herald: {"n": "Living Needle Refrain", "line": "On the lifted stick, a leaf-shaped needle turns in slow degrees."},
    mistwalker: {"n": "Living Needle in the Mire", "line": "Through a veil of dew, a leaf-shaped needle turns in slow degrees."},
    marksman: {"n": "Living Needle Drill", "line": "From the sightline, a leaf-shaped needle turns in slow degrees."},
  } },
  "Locate Creature": { by: {
    herald: {"n": "Call of the Warm Bearing", "line": "Across the drumskin, a little pulse tugs at an invisible cord."},
    chaplain: {"n": "Prayer of the Warm Bearing", "line": "Over folded linen, a little pulse tugs at an invisible cord."},
    mistwalker: {"n": "Warm Bearing in the Reeds", "line": "Through a veil of dew, a little pulse tugs at an invisible cord."},
    warden: {"n": "Witness the Warm Bearing", "line": "As the vow is spoken, a little pulse tugs at an invisible cord."},
    marksman: {"n": "Sign of the Warm Bearing", "line": "At the held breath, a little pulse tugs at an invisible cord."},
    archivist: {"n": "File: Warm Bearing", "line": "The margin shows how a little pulse tugs at an invisible cord."},
  } },
  "Locate Object": { by: {
    herald: {"n": "Call of the Lost Property", "line": "On the lifted stick, a gold needle twitches in the palm."},
    chaplain: {"n": "Prayer of the Lost Property", "line": "At the final amen, a gold needle twitches in the palm."},
    mistwalker: {"n": "Lost Property in the Reeds", "line": "In the valley hush, a gold needle twitches in the palm."},
    warden: {"n": "Witness the Lost Property", "line": "At the seal of the vow, a gold needle twitches in the palm."},
    marksman: {"n": "Sign of the Lost Property", "line": "From the sightline, a gold needle twitches in the palm."},
    archivist: {"n": "File: Lost Property", "line": "On the lens, a gold needle twitches in the palm."},
  } },
  "Longstrider": { by: {
    herald: {"n": "Measured Mile March", "line": "On the answering beat, amber prints fade behind the moving heel."},
    mistwalker: {"n": "Measured Mile of the Fen", "line": "In the valley hush, amber prints fade behind the moving heel."},
    marksman: {"n": "Trail Sign: Measured Mile", "line": "In the field glass, amber prints fade behind the moving heel."},
    archivist: {"n": "Index of the Measured Mile", "line": "On the lens, amber prints fade behind the moving heel."},
  } },
  "Mage Armor": { by: {
    relicborn: {"n": "Glass Hauberk Relay", "line": "Through a lattice of light, clear plates overlap across the ribs."},
    archivist: {"n": "File: Glass Hauberk", "line": "The lamp records how clear plates overlap across the ribs."},
  } },
  "Mage Hand": { by: {
    herald: {"n": "Absent Palm March", "line": "Across the drumskin, teal fingers unfold from empty air."},
    relicborn: {"n": "Absent Palm Circuit", "line": "Between pulses, teal fingers unfold from empty air."},
    seepbound: {"n": "Our Absent Palm", "line": "“See, dear one, how teal fingers unfold from empty air.”"},
    archivist: {"n": "Index of the Absent Palm", "line": "In pale tracing ink, teal fingers unfold from empty air."},
  } },
  "Magic Circle": { by: {
    chaplain: {"n": "Prayer of the Nested Seals", "line": "Over folded linen, bright writing locks into concentric tracks."},
    warden: {"n": "Witness the Nested Seals", "line": "As the vow is spoken, bright writing locks into concentric tracks."},
    seepbound: {"n": "Your Share: Nested Seals", "line": "Under the wet murmur, bright writing locks into concentric tracks."},
    archivist: {"n": "File: Nested Seals", "line": "The margin shows how bright writing locks into concentric tracks."},
  } },
  "Magic Jar": { by: {
    archivist: {"n": "Tenant Vessel Protocol", "line": "On the lens, a face moves deep in a polished surface."},
  } },
  "Magic Missile": { by: {
    relicborn: {"n": "Split Filament", "line": "The shard rings once. Its bright splinters bend round one another in flight."},
    archivist: {"n": "The Unerring Errata", "line": "Small lights lift off the page and make their corrections in the air."},
  } },
  "Magic Mouth": { by: {
    herald: {"n": "Speaking Seal Measure", "line": "On the lifted stick, a pair of lips stirs among the letters."},
    archivist: {"n": "Speaking Seal Protocol", "line": "On the lens, a pair of lips stirs among the letters."},
  } },
  "Magic Weapon": { by: {
    warden: {"n": "Witness the Tempered Edge", "line": "Before silent witnesses, fine runes chase each other down the blade."},
    marksman: {"n": "Sign of the Tempered Edge", "line": "In the field glass, fine runes chase each other down the blade."},
    relicborn: {"n": "Tempered Edge Relay", "line": "Through a lattice of light, fine runes chase each other down the blade."},
    archivist: {"n": "File: Tempered Edge", "line": "The lamp records how fine runes chase each other down the blade."},
  } },
  "Magnificent Mansion": { by: {
    herald: {"n": "House Beyond Rain Measure", "line": "On the answering beat, a lit doorway spills warmth onto wet stone."},
    archivist: {"n": "House Beyond Rain Protocol", "line": "The lamp records how a lit doorway spills warmth onto wet stone."},
  } },
  "Major Image": { by: {
    herald: {"n": "Deep Tableau Refrain", "line": "On the answering beat, threads of colour fill out a breathing scene."},
    relicborn: {"n": "Deep Tableau Array", "line": "Through a lattice of light, threads of colour fill out a breathing scene."},
    seepbound: {"n": "We Kept the Deep Tableau", "line": "Through a film of brine, threads of colour fill out a breathing scene."},
    archivist: {"n": "Study of the Deep Tableau", "line": "The lamp records how threads of colour fill out a breathing scene."},
  } },
  "Mass Cure Wounds": { by: {
    herald: {"n": "Call of the Company Sutures", "line": "Across the drumskin, bright stitches travel from coat to coat."},
    chaplain: {"n": "Prayer of the Company Sutures", "line": "Over folded linen, bright stitches travel from coat to coat."},
    mistwalker: {"n": "Company Sutures in the Reeds", "line": "Through a veil of dew, bright stitches travel from coat to coat."},
  } },
  "Mass Heal": { by: {
    chaplain: {"n": "Common Pulse Litany", "line": "At the final amen, a whole rank draws breath together."},
  } },
  "Mass Healing Word": { by: {
    herald: {"n": "Company Response Refrain", "line": "As the pennant dips, green syllables bloom among the wounded."},
    chaplain: {"n": "Company Response Observance", "line": "Under the little bell, green syllables bloom among the wounded."},
  } },
  "Mass Suggestion": { by: {
    herald: {"n": "One Persuasion Refrain", "line": "On the answering beat, the same small thought settles behind many eyes."},
    relicborn: {"n": "One Persuasion Array", "line": "Through a lattice of light, the same small thought settles behind many eyes."},
    archivist: {"n": "Study of the One Persuasion", "line": "The lamp records how the same small thought settles behind many eyes."},
  } },
  "Maze": { by: {
    archivist: {"n": "Index of the Endless Turn", "line": "On the lens, the straight road folds at right angles."},
  } },
  "Meld into Stone": { by: {
    chaplain: {"n": "Office of the Stone Guest", "line": "Under the little bell, mineral ripples swallow the last outline."},
    mistwalker: {"n": "Stone Guest of the Fen", "line": "Where the mist thins, mineral ripples swallow the last outline."},
    marksman: {"n": "Trail Sign: Stone Guest", "line": "At the held breath, mineral ripples swallow the last outline."},
  } },
  "Mending": { by: {
    herald: {"n": "Draw the Seam Measure", "line": "Across the drumskin, a fine thread closes the broken join."},
    chaplain: {"n": "Draw the Seam Litany", "line": "Over folded linen, a fine thread closes the broken join."},
    mistwalker: {"n": "Draw the Seam of the Vale", "line": "Through a veil of dew, a fine thread closes the broken join."},
    relicborn: {"n": "Draw the Seam Lattice", "line": "As the red cell hums, a fine thread closes the broken join."},
    archivist: {"n": "Draw the Seam Protocol", "line": "The margin shows how a fine thread closes the broken join."},
  } },
  "Message": { by: {
    herald: {"n": "Private Wire March", "line": "Across the drumskin, a tiny curl of breath unwinds at the ear."},
    mistwalker: {"n": "Private Wire of the Fen", "line": "Where the mist thins, a tiny curl of breath unwinds at the ear."},
    relicborn: {"n": "Private Wire Circuit", "line": "Between pulses, a tiny curl of breath unwinds at the ear."},
    archivist: {"n": "Index of the Private Wire", "line": "In pale tracing ink, a tiny curl of breath unwinds at the ear."},
  } },
  "Meteor Swarm": { by: {
    relicborn: {"n": "Four Fallen Crowns Lattice", "line": "Between pulses, molten crowns trail long black streamers."},
    archivist: {"n": "Four Fallen Crowns Protocol", "line": "In pale tracing ink, molten crowns trail long black streamers."},
  } },
  "Mind Blank": { by: {
    herald: {"n": "Empty Index Refrain", "line": "On the lifted stick, the mind lies smooth as an unused slate."},
    archivist: {"n": "Study of the Empty Index", "line": "On the lens, the mind lies smooth as an unused slate."},
  } },
  "Mind Spike": { by: {
    relicborn: {"n": "Glass Thought Array", "line": "As the red cell hums, a pink thorn hangs behind the brow."},
    seepbound: {"n": "We Kept the Glass Thought", "line": "Under the wet murmur, a pink thorn hangs behind the brow."},
    archivist: {"n": "Study of the Glass Thought", "line": "The margin shows how a pink thorn hangs behind the brow."},
  } },
  "Minor Illusion": { by: {
    herald: {"n": "Little Tableau Refrain", "line": "Across the drumskin, a trembling sketch fills with borrowed colour."},
    relicborn: {"n": "Little Tableau Array", "line": "As the red cell hums, a trembling sketch fills with borrowed colour."},
    seepbound: {"n": "We Kept the Little Tableau", "line": "Under the wet murmur, a trembling sketch fills with borrowed colour."},
    archivist: {"n": "Study of the Little Tableau", "line": "The margin shows how a trembling sketch fills with borrowed colour."},
  } },
  "Mirage Arcane": { by: {
    herald: {"n": "Call of the Counterfeit Horizon", "line": "On the lifted stick, a new horizon lies across the old one."},
    mistwalker: {"n": "Counterfeit Horizon in the Reeds", "line": "In the valley hush, a new horizon lies across the old one."},
    archivist: {"n": "File: Counterfeit Horizon", "line": "On the lens, a new horizon lies across the old one."},
  } },
  "Mirror Image": { by: {
    herald: {"n": "Errant Reflections Measure", "line": "On the lifted stick, silver doubles step out of a single shadow."},
    relicborn: {"n": "Errant Reflections Lattice", "line": "In the shard’s afterglow, silver doubles step out of a single shadow."},
    seepbound: {"n": "We Lend the Errant Reflections", "line": "Behind our shared eyelid, silver doubles step out of a single shadow."},
    archivist: {"n": "Errant Reflections Protocol", "line": "On the lens, silver doubles step out of a single shadow."},
  } },
  "Mislead": { by: {
    herald: {"n": "Call of the False Departure", "line": "On the lifted stick, the departing figure wears a light too thin."},
    seepbound: {"n": "Your Share: False Departure", "line": "Behind our shared eyelid, the departing figure wears a light too thin."},
    archivist: {"n": "File: False Departure", "line": "On the lens, the departing figure wears a light too thin."},
  } },
  "Misty Step": { by: {
    relicborn: {"n": "Fold at the Bright Joint", "line": "Two silver edges meet like halves of a broken clasp."},
    seepbound: {"n": "Let Us Wear the Distance", "line": "For one silver breath the Chorus feels the cold at both ends of the step."},
    archivist: {"n": "Cross-Reference", "line": "The Ghostlight finds the same silver fingerprint in two places on the page."},
  } },
  "Modify Memory": { by: {
    herald: {"n": "Rebound Volume March", "line": "On the lifted stick, one page of recollection lifts free."},
    archivist: {"n": "Index of the Rebound Volume", "line": "The margin shows how one page of recollection lifts free."},
  } },
  "Moonbeam": { by: {
    mistwalker: {"n": "Cold Meridian of the Vale", "line": "In the valley hush, a shaft of moon-silver touches the earth."},
  } },
  "Move Earth": { by: {
    mistwalker: {"n": "Slow Furrow in the Reeds", "line": "In the alder shade, the slope changes like cloth under a hand."},
    relicborn: {"n": "Slow Furrow Relay", "line": "Through a lattice of light, the slope changes like cloth under a hand."},
    archivist: {"n": "File: Slow Furrow", "line": "The lamp records how the slope changes like cloth under a hand."},
  } },
  "Nondetection": { by: {
    herald: {"n": "Shuttered Lens Measure", "line": "On the answering beat, blue letters close their eyes and fade."},
    marksman: {"n": "Read the Shuttered Lens", "line": "In the field glass, blue letters close their eyes and fade."},
    archivist: {"n": "Shuttered Lens Protocol", "line": "The lamp records how blue letters close their eyes and fade."},
  } },
  "Passwall": { by: {
    archivist: {"n": "File: Soft Lintel", "line": "In pale tracing ink, hard masonry opens along a pencilled seam."},
  } },
  "Pass without Trace": { by: {
    mistwalker: {"n": "Unwritten Trail of the Vale", "line": "In the alder shade, dark motes drink the prints behind the party."},
    marksman: {"n": "Read the Unwritten Trail", "line": "In the field glass, dark motes drink the prints behind the party."},
  } },
  "Phantasmal Force": { by: {
    herald: {"n": "Private Apparition Refrain", "line": "As the pennant dips, a thought casts its own unlikely shadow."},
    relicborn: {"n": "Private Apparition Array", "line": "Between pulses, a thought casts its own unlikely shadow."},
    archivist: {"n": "Study of the Private Apparition", "line": "In pale tracing ink, a thought casts its own unlikely shadow."},
  } },
  "Phantasmal Killer": { by: {
    herald: {"n": "Last Apparition Refrain", "line": "On the answering beat, a private terror steps out of its frame."},
    archivist: {"n": "Study of the Last Apparition", "line": "The lamp records how a private terror steps out of its frame."},
  } },
  "Phantom Steed": { by: {
    archivist: {"n": "Study of the Smoke Bridle", "line": "The lamp records how a grey horse gathers under a lilac mane."},
  } },
  "Planar Ally": { by: {
    chaplain: {"n": "Visitor’s Terms Observance", "line": "At the final amen, a second shadow waits to hear the price."},
  } },
  "Planar Binding": { by: {
    herald: {"n": "Visitor’s Knot March", "line": "As the pennant dips, a cord tightens around an unearthly outline."},
    chaplain: {"n": "Office of the Visitor’s Knot", "line": "Between two breaths, a cord tightens around an unearthly outline."},
    mistwalker: {"n": "Visitor’s Knot of the Fen", "line": "In the alder shade, a cord tightens around an unearthly outline."},
    seepbound: {"n": "Our Visitor’s Knot", "line": "Through a film of brine, a cord tightens around an unearthly outline."},
    archivist: {"n": "Index of the Visitor’s Knot", "line": "The lamp records how a cord tightens around an unearthly outline."},
  } },
  "Plane Shift": { by: {
    chaplain: {"n": "Foreign Meridian Litany", "line": "At the final amen, the stars turn to an unfamiliar arrangement."},
    mistwalker: {"n": "Foreign Meridian of the Vale", "line": "In the valley hush, the stars turn to an unfamiliar arrangement."},
    relicborn: {"n": "Foreign Meridian Lattice", "line": "In the shard’s afterglow, the stars turn to an unfamiliar arrangement."},
    seepbound: {"n": "We Lend the Foreign Meridian", "line": "Behind our shared eyelid, the stars turn to an unfamiliar arrangement."},
    archivist: {"n": "Foreign Meridian Protocol", "line": "On the lens, the stars turn to an unfamiliar arrangement."},
  } },
  "Plant Growth": { by: {
    herald: {"n": "Green Overrun Measure", "line": "On the answering beat, shoots crowd together over the old path."},
    mistwalker: {"n": "Green Overrun of the Vale", "line": "In the alder shade, shoots crowd together over the old path."},
    marksman: {"n": "Read the Green Overrun", "line": "In the field glass, shoots crowd together over the old path."},
  } },
  "Poison Spray": { by: {
    mistwalker: {"n": "Bitter Exhalation in the Reeds", "line": "Where the mist thins, olive vapour beads in yellow drops."},
    relicborn: {"n": "Bitter Exhalation Relay", "line": "Between pulses, olive vapour beads in yellow drops."},
    seepbound: {"n": "Your Share: Bitter Exhalation", "line": "“See, dear one, how olive vapour beads in yellow drops.”"},
    archivist: {"n": "File: Bitter Exhalation", "line": "In pale tracing ink, olive vapour beads in yellow drops."},
  } },
  "Polymorph": { by: {
    herald: {"n": "Borrowed Hide Measure", "line": "On the answering beat, one outline turns inside out into another."},
    mistwalker: {"n": "Borrowed Hide of the Vale", "line": "In the alder shade, one outline turns inside out into another."},
    relicborn: {"n": "Borrowed Hide Lattice", "line": "Through a lattice of light, one outline turns inside out into another."},
    archivist: {"n": "Borrowed Hide Protocol", "line": "The lamp records how one outline turns inside out into another."},
  } },
  "Power Word Heal": { by: {
    herald: {"n": "Call of the Kind Syllable", "line": "Across the drumskin, a word opens warm as a hand on the chest."},
    chaplain: {"n": "Prayer of the Kind Syllable", "line": "Over folded linen, a word opens warm as a hand on the chest."},
  } },
  "Power Word Kill": { by: {
    herald: {"n": "Black Syllable March", "line": "Across the drumskin, a black letter shuts inside a pale ring."},
    relicborn: {"n": "Black Syllable Circuit", "line": "Between pulses, a black letter shuts inside a pale ring."},
    seepbound: {"n": "Our Black Syllable", "line": "“See, dear one, how a black letter shuts inside a pale ring.”"},
    archivist: {"n": "Index of the Black Syllable", "line": "In pale tracing ink, a black letter shuts inside a pale ring."},
  } },
  "Power Word Stun": { by: {
    herald: {"n": "Call of the Heavy Syllable", "line": "Across the drumskin, a word hangs like lead against the brow."},
    relicborn: {"n": "Heavy Syllable Relay", "line": "As the red cell hums, a word hangs like lead against the brow."},
    seepbound: {"n": "Your Share: Heavy Syllable", "line": "Under the wet murmur, a word hangs like lead against the brow."},
    archivist: {"n": "File: Heavy Syllable", "line": "The margin shows how a word hangs like lead against the brow."},
  } },
  "Prayer of Healing": { by: {
    chaplain: {"n": "Quiet Infirmary Observance", "line": "At the final amen, pale arches meet above the resting company."},
    warden: {"n": "Swear by the Quiet Infirmary", "line": "As the vow is spoken, pale arches meet above the resting company."},
  } },
  "Prestidigitation": { by: {
    herald: {"n": "Call of the Pocket Flourish", "line": "Across the drumskin, apricot sparks tuck into a little curl."},
    relicborn: {"n": "Pocket Flourish Relay", "line": "As the red cell hums, apricot sparks tuck into a little curl."},
    seepbound: {"n": "Your Share: Pocket Flourish", "line": "Under the wet murmur, apricot sparks tuck into a little curl."},
    archivist: {"n": "File: Pocket Flourish", "line": "The margin shows how apricot sparks tuck into a little curl."},
  } },
  "Prismatic Spray": { by: {
    herald: {"n": "Call of the Broken Rainbow", "line": "On the answering beat, wedges of colour scatter across the air."},
    relicborn: {"n": "Broken Rainbow Relay", "line": "Through a lattice of light, wedges of colour scatter across the air."},
    archivist: {"n": "File: Broken Rainbow", "line": "The lamp records how wedges of colour scatter across the air."},
  } },
  "Prismatic Wall": { by: {
    herald: {"n": "Seven Curtains Refrain", "line": "On the answering beat, sheets of colour hang edge to edge."},
    archivist: {"n": "Study of the Seven Curtains", "line": "The lamp records how sheets of colour hang edge to edge."},
  } },
  "Private Sanctum": { by: {
    archivist: {"n": "Shuttered Chamber Protocol", "line": "In pale tracing ink, a veil settles along the room’s four edges."},
  } },
  "Produce Flame": { by: {
    mistwalker: {"n": "Palm Ember in the Reeds", "line": "Where the mist thins, a coal sits bright in the hollow of the hand."},
  } },
  "Programmed Illusion": { by: {
    herald: {"n": "Waiting Tableau March", "line": "On the answering beat, a sleeping picture stirs in its frame."},
    archivist: {"n": "Index of the Waiting Tableau", "line": "On the lens, a sleeping picture stirs in its frame."},
  } },
  "Project Image": { by: {
    herald: {"n": "Far Double Measure", "line": "On the answering beat, a distant silhouette wears a familiar coat."},
    archivist: {"n": "Far Double Protocol", "line": "The lamp records how a distant silhouette wears a familiar coat."},
  } },
  "Protection from Energy": { by: {
    chaplain: {"n": "Office of the Weather Scales", "line": "Under the little bell, clear scales turn bright faces towards the blast."},
    mistwalker: {"n": "Weather Scales of the Fen", "line": "Where the mist thins, clear scales turn bright faces towards the blast."},
    marksman: {"n": "Trail Sign: Weather Scales", "line": "At the held breath, clear scales turn bright faces towards the blast."},
    relicborn: {"n": "Weather Scales Circuit", "line": "Between pulses, clear scales turn bright faces towards the blast."},
    archivist: {"n": "Index of the Weather Scales", "line": "In pale tracing ink, clear scales turn bright faces towards the blast."},
  } },
  "Protection from Evil and Good": { by: {
    chaplain: {"n": "Prayer of the Guarded Threshold", "line": "Under the little bell, a fine chalk arch shelters the figure."},
    mistwalker: {"n": "Guarded Threshold in the Reeds", "line": "Where the mist thins, a fine chalk arch shelters the figure."},
    warden: {"n": "Witness the Guarded Threshold", "line": "Beneath the oath ring, a fine chalk arch shelters the figure."},
    seepbound: {"n": "Your Share: Guarded Threshold", "line": "“See, dear one, how a fine chalk arch shelters the figure.”"},
    archivist: {"n": "File: Guarded Threshold", "line": "In pale tracing ink, a fine chalk arch shelters the figure."},
  } },
  "Protection from Poison": { by: {
    chaplain: {"n": "Prayer of the Venom Sieve", "line": "Over folded linen, jade drops roll off a green shell."},
    mistwalker: {"n": "Venom Sieve in the Reeds", "line": "Through a veil of dew, jade drops roll off a green shell."},
    warden: {"n": "Witness the Venom Sieve", "line": "As the vow is spoken, jade drops roll off a green shell."},
    marksman: {"n": "Sign of the Venom Sieve", "line": "At the held breath, jade drops roll off a green shell."},
  } },
  "Purify Food and Drink": { by: {
    chaplain: {"n": "Clean Board Litany", "line": "Over folded linen, dark flecks lift from the cup and plate."},
    mistwalker: {"n": "Clean Board of the Vale", "line": "Through a veil of dew, dark flecks lift from the cup and plate."},
    warden: {"n": "Keep the Clean Board", "line": "As the vow is spoken, dark flecks lift from the cup and plate."},
  } },
  "Raise Dead": { by: {
    herald: {"n": "Open Grave Measure", "line": "Across the drumskin, colour returns to a face the earth remembers."},
    chaplain: {"n": "Open Grave Litany", "line": "Over folded linen, colour returns to a face the earth remembers."},
    warden: {"n": "Keep the Open Grave", "line": "As the vow is spoken, colour returns to a face the earth remembers."},
  } },
  "Ray of Enfeeblement": { by: {
    seepbound: {"n": "Your Share: Grey Siphon", "line": "Through a film of brine, a grey strand draws warmth from an arm."},
    archivist: {"n": "File: Grey Siphon", "line": "The lamp records how a grey strand draws warmth from an arm."},
  } },
  "Ray of Frost": { by: {
    relicborn: {"n": "Rime Quill Relay", "line": "In the shard’s afterglow, a blue needle leaves a seam of frost."},
    archivist: {"n": "File: Rime Quill", "line": "On the lens, a blue needle leaves a seam of frost."},
  } },
  "Regenerate": { by: {
    herald: {"n": "Patient Loom Measure", "line": "Across the drumskin, new flesh grows along threads of rose and ivory."},
    chaplain: {"n": "Patient Loom Litany", "line": "Over folded linen, new flesh grows along threads of rose and ivory."},
    mistwalker: {"n": "Patient Loom of the Vale", "line": "Through a veil of dew, new flesh grows along threads of rose and ivory."},
  } },
  "Ray of Sickness": { by: {
    relicborn: {"n": "Sallow Thread Array", "line": "As the red cell hums, a crooked yellow line hangs in the air."},
    archivist: {"n": "Study of the Sallow Thread", "line": "The margin shows how a crooked yellow line hangs in the air."},
  } },
  "Reincarnate": { by: {
    mistwalker: {"n": "Second Cradle in the Mire", "line": "In the valley hush, an unfamiliar hand opens with a familiar gesture."},
  } },
  "Remove Curse": { by: {
    chaplain: {"n": "Untie the Debt Observance", "line": "At the final amen, a black knot loosens in blue light."},
    warden: {"n": "Swear by the Untie the Debt", "line": "As the vow is spoken, a black knot loosens in blue light."},
    seepbound: {"n": "We Kept the Untie the Debt", "line": "Behind our shared eyelid, a black knot loosens in blue light."},
    archivist: {"n": "Study of the Untie the Debt", "line": "On the lens, a black knot loosens in blue light."},
  } },
  "Resilient Sphere": { by: {
    archivist: {"n": "Unbroken Pearl Protocol", "line": "In pale tracing ink, a round glass shell closes on one clear ripple."},
  } },
  "Resistance": { by: {
    chaplain: {"n": "Office of the Little Buckler", "line": "Over folded linen, a pearl disc hovers over the heart."},
    mistwalker: {"n": "Little Buckler of the Fen", "line": "Through a veil of dew, a pearl disc hovers over the heart."},
  } },
  "Resurrection": { by: {
    herald: {"n": "Returning Tide March", "line": "Across the drumskin, the still chest rises like a lifting shore."},
    chaplain: {"n": "Office of the Returning Tide", "line": "Under the little bell, the still chest rises like a lifting shore."},
  } },
  "Reverse Gravity": { by: {
    mistwalker: {"n": "Inverted Rain of the Vale", "line": "Through a veil of dew, loose grit goes up like rain in reverse."},
    relicborn: {"n": "Inverted Rain Lattice", "line": "As the red cell hums, loose grit goes up like rain in reverse."},
    archivist: {"n": "Inverted Rain Protocol", "line": "The margin shows how loose grit goes up like rain in reverse."},
  } },
  "Revivify": { by: {
    chaplain: {"n": "One Name Off the Slate", "line": "A honey spark catches at the ribs. The chaplain wipes one name from the slate."},
    mistwalker: {"n": "Sap After Frost", "line": "One amber bead moves under the skin like spring sap beneath grey bark."},
    warden: {"n": "Answer When I Call", "line": "At the last syllable of the oath a little gold beat stirs beneath the sternum."},
    marksman: {"n": "Catch the Fading Sign", "line": "The trail has all but vanished. One warm print glimmers in the mud."},
  } },
  "Rope Trick": { by: {
    archivist: {"n": "File: Loft Knot", "line": "The margin shows how a cord climbs towards a pinprick of sky."},
  } },
  "Sacred Flame": { by: {
    chaplain: {"n": "Prayer of the Ivory Petal", "line": "Under the little bell, a white-gold petal falls straight down."},
  } },
  "Sanctuary": { by: {
    chaplain: {"n": "Quiet Arch Litany", "line": "Between two breaths, a pale arch closes above a bowed head."},
  } },
  "Scorching Ray": { by: {
    relicborn: {"n": "Furnace Needles Array", "line": "Through a lattice of light, white needles trail red filaments."},
    archivist: {"n": "Study of the Furnace Needles", "line": "The lamp records how white needles trail red filaments."},
  } },
  "Scrying": { by: {
    herald: {"n": "Call of the Distant Basin", "line": "On the lifted stick, a far room trembles on a wet surface."},
    chaplain: {"n": "Prayer of the Distant Basin", "line": "At the final amen, a far room trembles on a wet surface."},
    mistwalker: {"n": "Distant Basin in the Reeds", "line": "In the valley hush, a far room trembles on a wet surface."},
    seepbound: {"n": "Your Share: Distant Basin", "line": "Behind our shared eyelid, a far room trembles on a wet surface."},
    archivist: {"n": "File: Distant Basin", "line": "On the lens, a far room trembles on a wet surface."},
  } },
  "Searing Smite": { by: {
    warden: {"n": "Witness the Branded Edge", "line": "Before silent witnesses, red gold burns along the striking edge."},
  } },
  "Secret Chest": { by: {
    archivist: {"n": "Index of the Hidden Strongbox", "line": "On the lens, a brass corner winks out of reach."},
  } },
  "See Invisibility": { by: {
    herald: {"n": "Hidden Contour Refrain", "line": "On the answering beat, thin light finds the edge of an absent figure."},
    relicborn: {"n": "Hidden Contour Array", "line": "Through a lattice of light, thin light finds the edge of an absent figure."},
    archivist: {"n": "Study of the Hidden Contour", "line": "The lamp records how thin light finds the edge of an absent figure."},
  } },
  "Seeming": { by: {
    herald: {"n": "Company of Masks Refrain", "line": "As the pennant dips, all the faces shift like painted gauze."},
    relicborn: {"n": "Company of Masks Array", "line": "Between pulses, all the faces shift like painted gauze."},
    archivist: {"n": "Study of the Company of Masks", "line": "In pale tracing ink, all the faces shift like painted gauze."},
  } },
  "Sending": { by: {
    herald: {"n": "Far Dispatch Refrain", "line": "As the pennant dips, a bright sentence folds itself into the distance."},
    chaplain: {"n": "Far Dispatch Observance", "line": "Under the little bell, a bright sentence folds itself into the distance."},
    archivist: {"n": "Study of the Far Dispatch", "line": "In pale tracing ink, a bright sentence folds itself into the distance."},
  } },
  "Sequester": { by: {
    archivist: {"n": "Index of the Absent Record", "line": "The margin shows how the outline sinks out of sight like a stone."},
  } },
  "Shapechange": { by: {
    mistwalker: {"n": "Many-Coated Soul in the Reeds", "line": "Where the mist thins, one shape slips through the seams of another."},
    archivist: {"n": "File: Many-Coated Soul", "line": "In pale tracing ink, one shape slips through the seams of another."},
  } },
  "Shatter": { by: {
    herald: {"n": "Call of the Glass Funeral", "line": "On the answering beat, a pressure ring breaks into lilac teeth."},
    relicborn: {"n": "Glass Funeral Relay", "line": "Through a lattice of light, a pressure ring breaks into lilac teeth."},
    archivist: {"n": "File: Glass Funeral", "line": "The lamp records how a pressure ring breaks into lilac teeth."},
  } },
  "Shield": { by: {
    relicborn: {"n": "Six-Sided Reflex", "line": "The shard unfolds six pale faces faster than the hand can open."},
    archivist: {"n": "Close the Glass Cover", "line": "A case of pale hexagonal panes shuts over the figure like a precious exhibit."},
  } },
  "Shield of Faith": { by: {
    chaplain: {"n": "Carried Chapel Litany", "line": "Between two breaths, gold filigree cups an ivory shell."},
    warden: {"n": "Keep the Carried Chapel", "line": "Before silent witnesses, gold filigree cups an ivory shell."},
  } },
  "Shillelagh": { by: {
    mistwalker: {"n": "Sap Cudgel of the Fen", "line": "In the valley hush, green light wakes under the wooden grain."},
  } },
  "Shining Smite": { by: {
    warden: {"n": "Keep the Quarry Flare", "line": "As the vow is spoken, an amber star clings to the struck shape."},
  } },
  "Shocking Grasp": { by: {
    relicborn: {"n": "Storm Palm Relay", "line": "As the red cell hums, blue sparks web the outstretched fingers."},
    archivist: {"n": "File: Storm Palm", "line": "The margin shows how blue sparks web the outstretched fingers."},
  } },
  "Silence": { by: {
    herald: {"n": "Call of the Hushed Dome", "line": "Across the drumskin, a clear dome swallows its own ripples."},
    chaplain: {"n": "Prayer of the Hushed Dome", "line": "Over folded linen, a clear dome swallows its own ripples."},
    marksman: {"n": "Sign of the Hushed Dome", "line": "At the held breath, a clear dome swallows its own ripples."},
  } },
  "Silent Image": { by: {
    herald: {"n": "Quiet Tableau Measure", "line": "Across the drumskin, violet gauze fills a perfectly quiet shape."},
    relicborn: {"n": "Quiet Tableau Lattice", "line": "As the red cell hums, violet gauze fills a perfectly quiet shape."},
    archivist: {"n": "Quiet Tableau Protocol", "line": "The margin shows how violet gauze fills a perfectly quiet shape."},
  } },
  "Simulacrum": { by: {
    archivist: {"n": "Winter Twin Protocol", "line": "The margin shows how snow takes on the familiar creases of a face."},
  } },
  "Sleep": { by: {
    herald: {"n": "Poppy Drift March", "line": "As the pennant dips, pale grains fall like drowsy snow."},
    relicborn: {"n": "Poppy Drift Circuit", "line": "Through a lattice of light, pale grains fall like drowsy snow."},
    archivist: {"n": "Index of the Poppy Drift", "line": "The lamp records how pale grains fall like drowsy snow."},
  } },
  "Sleet Storm": { by: {
    mistwalker: {"n": "Slant Rain of the Vale", "line": "Through a veil of dew, silver sleet slants through steel-grey cloud."},
    relicborn: {"n": "Slant Rain Lattice", "line": "As the red cell hums, silver sleet slants through steel-grey cloud."},
    archivist: {"n": "Slant Rain Protocol", "line": "The margin shows how silver sleet slants through steel-grey cloud."},
  } },
  "Slow": { by: {
    herald: {"n": "Dragging Wheel March", "line": "Across the drumskin, bronze clock teeth drag through thick air."},
    relicborn: {"n": "Dragging Wheel Circuit", "line": "Between pulses, bronze clock teeth drag through thick air."},
    archivist: {"n": "Index of the Dragging Wheel", "line": "In pale tracing ink, bronze clock teeth drag through thick air."},
  } },
  "Sorcerous Burst": { by: {
    relicborn: {"n": "Fracture Seed Circuit", "line": "Between pulses, a violet seed pops into uneven sparks."},
  } },
  "Spare the Dying": { by: {
    chaplain: {"n": "Prayer of the Sheltered Pulse", "line": "Under the little bell, a pale hand steadies one wavering spark."},
    mistwalker: {"n": "Sheltered Pulse in the Reeds", "line": "Where the mist thins, a pale hand steadies one wavering spark."},
  } },
  "Speak with Animals": { by: {
    herald: {"n": "Fur Alphabet March", "line": "Across the drumskin, little gold tracks turn to letters at the lips."},
    mistwalker: {"n": "Fur Alphabet of the Fen", "line": "Where the mist thins, little gold tracks turn to letters at the lips."},
    marksman: {"n": "Trail Sign: Fur Alphabet", "line": "At the held breath, little gold tracks turn to letters at the lips."},
    seepbound: {"n": "Our Fur Alphabet", "line": "“See, dear one, how little gold tracks turn to letters at the lips.”"},
  } },
  "Speak with Dead": { by: {
    herald: {"n": "Jawbone Alphabet Measure", "line": "On the lifted stick, pale words climb through a still jaw."},
    chaplain: {"n": "Jawbone Alphabet Litany", "line": "At the final amen, pale words climb through a still jaw."},
    archivist: {"n": "Jawbone Alphabet Protocol", "line": "On the lens, pale words climb through a still jaw."},
  } },
  "Speak with Plants": { by: {
    herald: {"n": "Leaf Alphabet Measure", "line": "Across the drumskin, green letters curl from stems and branches."},
    mistwalker: {"n": "Leaf Alphabet of the Vale", "line": "Through a veil of dew, green letters curl from stems and branches."},
    marksman: {"n": "Read the Leaf Alphabet", "line": "At the held breath, green letters curl from stems and branches."},
  } },
  "Spider Climb": { by: {
    relicborn: {"n": "Threaded Soles Lattice", "line": "In the shard’s afterglow, fine threads lace the palms and soles."},
    seepbound: {"n": "We Lend the Threaded Soles", "line": "Behind our shared eyelid, fine threads lace the palms and soles."},
    archivist: {"n": "Threaded Soles Protocol", "line": "On the lens, fine threads lace the palms and soles."},
  } },
  "Spike Growth": { by: {
    mistwalker: {"n": "Rust Furrow in the Reeds", "line": "Where the mist thins, bronze-tipped thorns crowd the ground."},
    marksman: {"n": "Sign of the Rust Furrow", "line": "Against the grey, bronze-tipped thorns crowd the ground."},
  } },
  "Spirit Guardians": { by: {
    chaplain: {"n": "Names on the Chapel Wall", "line": "Pale figures take their stations as each name passes the chaplain’s lips."},
  } },
  "Spiritual Weapon": { by: {
    chaplain: {"n": "Prayer of the Votive Iron", "line": "Under the little bell, a violet blade gathers from rotating marks."},
  } },
  "Starry Wisp": { by: {
    herald: {"n": "Blue Wick Refrain", "line": "As the pennant dips, a wisp drags blue light down a golden thread."},
    mistwalker: {"n": "Blue Wick in the Mire", "line": "In the alder shade, a wisp drags blue light down a golden thread."},
  } },
  "Stinking Cloud": { by: {
    herald: {"n": "Sour Blanket Measure", "line": "On the lifted stick, mustard billows roll above a dark olive belly."},
    relicborn: {"n": "Sour Blanket Lattice", "line": "In the shard’s afterglow, mustard billows roll above a dark olive belly."},
    archivist: {"n": "Sour Blanket Protocol", "line": "On the lens, mustard billows roll above a dark olive belly."},
  } },
  "Stone Shape": { by: {
    chaplain: {"n": "Mason’s Thumb Litany", "line": "Between two breaths, solid rock creases like damp clay."},
    mistwalker: {"n": "Mason’s Thumb of the Vale", "line": "In the alder shade, solid rock creases like damp clay."},
    archivist: {"n": "Mason’s Thumb Protocol", "line": "The lamp records how solid rock creases like damp clay."},
  } },
  "Stoneskin": { by: {
    mistwalker: {"n": "Quarried Mantle of the Vale", "line": "In the valley hush, mineral flecks glint across the skin."},
    marksman: {"n": "Read the Quarried Mantle", "line": "From the sightline, mineral flecks glint across the skin."},
    relicborn: {"n": "Quarried Mantle Lattice", "line": "In the shard’s afterglow, mineral flecks glint across the skin."},
    archivist: {"n": "Quarried Mantle Protocol", "line": "On the lens, mineral flecks glint across the skin."},
  } },
  "Storm of Vengeance": { by: {
    mistwalker: {"n": "Sky Sentence of the Vale", "line": "Where the mist thins, the sky rolls up its sleeves in thunderheads."},
  } },
  "Suggestion": { by: {
    herald: {"n": "Planted Sentence Refrain", "line": "As the pennant dips, a rose-coloured phrase curls behind the ear."},
    relicborn: {"n": "Planted Sentence Array", "line": "Between pulses, a rose-coloured phrase curls behind the ear."},
    seepbound: {"n": "We Kept the Planted Sentence", "line": "“See, dear one, how a rose-coloured phrase curls behind the ear.”"},
    archivist: {"n": "Study of the Planted Sentence", "line": "In pale tracing ink, a rose-coloured phrase curls behind the ear."},
  } },
  "Summon Dragon": { by: {
    archivist: {"n": "Scaled Visitor Protocol", "line": "The lamp records how a great wing unfolds against the mist."},
  } },
  "Sunbeam": { by: {
    chaplain: {"n": "Prayer of the Shaft of Noon", "line": "Between two breaths, a solid lance of noon sheds golden dust."},
    mistwalker: {"n": "Shaft of Noon in the Reeds", "line": "In the alder shade, a solid lance of noon sheds golden dust."},
    relicborn: {"n": "Shaft of Noon Relay", "line": "Through a lattice of light, a solid lance of noon sheds golden dust."},
    archivist: {"n": "File: Shaft of Noon", "line": "The lamp records how a solid lance of noon sheds golden dust."},
  } },
  "Sunburst": { by: {
    chaplain: {"n": "Opened Sun Litany", "line": "Under the little bell, a white core throws broad fans of gold."},
    mistwalker: {"n": "Opened Sun of the Vale", "line": "Where the mist thins, a white core throws broad fans of gold."},
    relicborn: {"n": "Opened Sun Lattice", "line": "Between pulses, a white core throws broad fans of gold."},
    archivist: {"n": "Opened Sun Protocol", "line": "In pale tracing ink, a white core throws broad fans of gold."},
  } },
  "Symbol": { by: {
    herald: {"n": "Buried Sentence Measure", "line": "As the pennant dips, a letter sleeps like a seed under ash."},
    chaplain: {"n": "Buried Sentence Litany", "line": "Under the little bell, a letter sleeps like a seed under ash."},
    mistwalker: {"n": "Buried Sentence of the Vale", "line": "Where the mist thins, a letter sleeps like a seed under ash."},
    archivist: {"n": "Buried Sentence Protocol", "line": "In pale tracing ink, a letter sleeps like a seed under ash."},
  } },
  "Telekinesis": { by: {
    relicborn: {"n": "Invisible Tackle Array", "line": "In the shard’s afterglow, a heavy shape leans against unseen ropes."},
    archivist: {"n": "Study of the Invisible Tackle", "line": "On the lens, a heavy shape leans against unseen ropes."},
  } },
  "Telepathic Bond": { by: {
    herald: {"n": "Shared Wire Measure", "line": "As the pennant dips, a thread hums between quiet foreheads."},
    archivist: {"n": "Shared Wire Protocol", "line": "In pale tracing ink, a thread hums between quiet foreheads."},
  } },
  "Teleport": { by: {
    herald: {"n": "Call of the Folded Mile", "line": "On the lifted stick, the far road meets the near one at a crease."},
    relicborn: {"n": "Folded Mile Relay", "line": "In the shard’s afterglow, the far road meets the near one at a crease."},
    archivist: {"n": "File: Folded Mile", "line": "On the lens, the far road meets the near one at a crease."},
  } },
  "Teleportation Circle": { by: {
    herald: {"n": "Round Junction Refrain", "line": "On the answering beat, a ring of sigils opens on another floor."},
    relicborn: {"n": "Round Junction Array", "line": "Through a lattice of light, a ring of sigils opens on another floor."},
    seepbound: {"n": "We Kept the Round Junction", "line": "Through a film of brine, a ring of sigils opens on another floor."},
    archivist: {"n": "Study of the Round Junction", "line": "The lamp records how a ring of sigils opens on another floor."},
  } },
  "Thaumaturgy": { by: {
    chaplain: {"n": "Prayer of the Belfry Flourish", "line": "Between two breaths, a little gesture casts an outsize shadow."},
  } },
  "Thunderwave": { by: {
    herald: {"n": "Bell Skin March", "line": "On the answering beat, a pearl ring slams outward through the dust."},
    mistwalker: {"n": "Bell Skin of the Fen", "line": "In the valley hush, a pearl ring slams outward through the dust."},
    relicborn: {"n": "Bell Skin Circuit", "line": "In the shard’s afterglow, a pearl ring slams outward through the dust."},
    archivist: {"n": "Index of the Bell Skin", "line": "On the lens, a pearl ring slams outward through the dust."},
  } },
  "Time Stop": { by: {
    relicborn: {"n": "Held Pendulum Circuit", "line": "Between pulses, a bead of rain hangs motionless in the air."},
    archivist: {"n": "Index of the Held Pendulum", "line": "In pale tracing ink, a bead of rain hangs motionless in the air."},
  } },
  "Tiny Hut": { by: {
    herald: {"n": "Amber Bivouac March", "line": "Across the drumskin, amber panes knit a dome against the night."},
    archivist: {"n": "Index of the Amber Bivouac", "line": "In pale tracing ink, amber panes knit a dome against the night."},
  } },
  "Tongues": { by: {
    herald: {"n": "Common Alphabet March", "line": "Across the drumskin, strange syllables sit easily on the tongue."},
    chaplain: {"n": "Office of the Common Alphabet", "line": "Under the little bell, strange syllables sit easily on the tongue."},
    relicborn: {"n": "Common Alphabet Circuit", "line": "Between pulses, strange syllables sit easily on the tongue."},
    seepbound: {"n": "Our Common Alphabet", "line": "“See, dear one, how strange syllables sit easily on the tongue.”"},
    archivist: {"n": "Index of the Common Alphabet", "line": "In pale tracing ink, strange syllables sit easily on the tongue."},
  } },
  "Transport via Plants": { by: {
    mistwalker: {"n": "Green Threshold in the Reeds", "line": "In the valley hush, a second wood waits inside the opened trunk."},
  } },
  "Tree Stride": { by: {
    mistwalker: {"n": "Bark Passage in the Reeds", "line": "In the alder shade, a shoulder slips into the grain of the tree."},
    marksman: {"n": "Sign of the Bark Passage", "line": "In the field glass, a shoulder slips into the grain of the tree."},
  } },
  "True Polymorph": { by: {
    herald: {"n": "Lasting Hide Measure", "line": "On the answering beat, a second shape closes like a fitted garment."},
    seepbound: {"n": "We Lend the Lasting Hide", "line": "Through a film of brine, a second shape closes like a fitted garment."},
    archivist: {"n": "Lasting Hide Protocol", "line": "The lamp records how a second shape closes like a fitted garment."},
  } },
  "True Resurrection": { by: {
    chaplain: {"n": "Office of the Unlost Name", "line": "Under the little bell, a name rings clear across the last silence."},
    mistwalker: {"n": "Unlost Name of the Fen", "line": "Where the mist thins, a name rings clear across the last silence."},
  } },
  "True Seeing": { by: {
    herald: {"n": "Call of the Clean Lens", "line": "On the answering beat, false edges fall away like scales."},
    chaplain: {"n": "Prayer of the Clean Lens", "line": "Between two breaths, false edges fall away like scales."},
    relicborn: {"n": "Clean Lens Relay", "line": "Through a lattice of light, false edges fall away like scales."},
    seepbound: {"n": "Your Share: Clean Lens", "line": "Through a film of brine, false edges fall away like scales."},
    archivist: {"n": "File: Clean Lens", "line": "The lamp records how false edges fall away like scales."},
  } },
  "True Strike": { by: {
    herald: {"n": "Plumb Stroke Measure", "line": "Across the drumskin, a gold thread runs from hand to quarry."},
    relicborn: {"n": "Plumb Stroke Lattice", "line": "As the red cell hums, a gold thread runs from hand to quarry."},
    seepbound: {"n": "We Lend the Plumb Stroke", "line": "Under the wet murmur, a gold thread runs from hand to quarry."},
    archivist: {"n": "Plumb Stroke Protocol", "line": "The margin shows how a gold thread runs from hand to quarry."},
  } },
  "Tsunami": { by: {
    mistwalker: {"n": "Travelling Shore of the Fen", "line": "Through a veil of dew, a whole horizon of water leans forward."},
  } },
  "Unseen Servant": { by: {
    herald: {"n": "Empty Apron March", "line": "On the lifted stick, dust stirs beneath a pair of absent feet."},
    seepbound: {"n": "Our Empty Apron", "line": "Under the wet murmur, dust stirs beneath a pair of absent feet."},
    archivist: {"n": "Index of the Empty Apron", "line": "The margin shows how dust stirs beneath a pair of absent feet."},
  } },
  "Vampiric Touch": { by: {
    relicborn: {"n": "Red Siphon Lattice", "line": "In the shard’s afterglow, wine-dark ribbons crawl back into the palm."},
    seepbound: {"n": "We Lend the Red Siphon", "line": "Behind our shared eyelid, wine-dark ribbons crawl back into the palm."},
    archivist: {"n": "Red Siphon Protocol", "line": "On the lens, wine-dark ribbons crawl back into the palm."},
  } },
  "Vicious Mockery": { by: {
    herald: {"n": "The Crooked Salute", "line": "The herald gives a perfect salute on precisely the wrong beat. Pink barbs follow."},
  } },
  "Vitriolic Sphere": { by: {
    relicborn: {"n": "Caustic Pearl Array", "line": "Through a lattice of light, a sour green globe trembles and breaks."},
    archivist: {"n": "Study of the Caustic Pearl", "line": "The lamp records how a sour green globe trembles and breaks."},
  } },
  "Wall of Fire": { by: {
    mistwalker: {"n": "Furnace Curtain in the Reeds", "line": "In the alder shade, copper flame climbs in upright folds."},
    relicborn: {"n": "Furnace Curtain Relay", "line": "Through a lattice of light, copper flame climbs in upright folds."},
    archivist: {"n": "File: Furnace Curtain", "line": "The lamp records how copper flame climbs in upright folds."},
  } },
  "Wall of Force": { by: {
    archivist: {"n": "Study of the Hard Horizon", "line": "The margin shows how violet edges sketch an invisible plane."},
  } },
  "Wall of Ice": { by: {
    archivist: {"n": "Winter Palisade Protocol", "line": "In pale tracing ink, blue glass rises in frozen plates."},
  } },
  "Wall of Stone": { by: {
    mistwalker: {"n": "Quarry Seam of the Vale", "line": "In the valley hush, courses of grey rock climb out of the dust."},
    relicborn: {"n": "Quarry Seam Lattice", "line": "In the shard’s afterglow, courses of grey rock climb out of the dust."},
    archivist: {"n": "Quarry Seam Protocol", "line": "On the lens, courses of grey rock climb out of the dust."},
  } },
  "Wall of Thorns": { by: {
    mistwalker: {"n": "Hooked Hedge in the Reeds", "line": "Through a veil of dew, black thorns knit together without a gap."},
  } },
  "Warding Bond": { by: {
    chaplain: {"n": "Prayer of the Paired Rings", "line": "At the final amen, a silver filament joins two blue rings."},
    warden: {"n": "Witness the Paired Rings", "line": "At the seal of the vow, a silver filament joins two blue rings."},
  } },
  "Water Breathing": { by: {
    mistwalker: {"n": "River Collar in the Reeds", "line": "Where the mist thins, pearl bubbles form a collar at the throat."},
    marksman: {"n": "Sign of the River Collar", "line": "Against the grey, pearl bubbles form a collar at the throat."},
    relicborn: {"n": "River Collar Relay", "line": "Between pulses, pearl bubbles form a collar at the throat."},
    archivist: {"n": "File: River Collar", "line": "In pale tracing ink, pearl bubbles form a collar at the throat."},
  } },
  "Water Walk": { by: {
    chaplain: {"n": "Surface Tread Litany", "line": "Over folded linen, turquoise rings widen beneath each footstep."},
    mistwalker: {"n": "Surface Tread of the Vale", "line": "Through a veil of dew, turquoise rings widen beneath each footstep."},
    marksman: {"n": "Read the Surface Tread", "line": "At the held breath, turquoise rings widen beneath each footstep."},
    relicborn: {"n": "Surface Tread Lattice", "line": "As the red cell hums, turquoise rings widen beneath each footstep."},
  } },
  "Web": { by: {
    relicborn: {"n": "Moonspun Net Lattice", "line": "In the shard’s afterglow, silver threads stitch a sagging net."},
    archivist: {"n": "Moonspun Net Protocol", "line": "On the lens, silver threads stitch a sagging net."},
  } },
  "Weird": { by: {
    seepbound: {"n": "Your Share: Private Gallows", "line": "Through a film of brine, each frightened face follows a different shadow."},
    archivist: {"n": "File: Private Gallows", "line": "The lamp records how each frightened face follows a different shadow."},
  } },
  "Wind Walk": { by: {
    mistwalker: {"n": "Cloudstride of the Fen", "line": "Through a veil of dew, the company loosens into pale streamers."},
  } },
  "Wind Wall": { by: {
    mistwalker: {"n": "Silver Baffle of the Vale", "line": "Through a veil of dew, upright air twists into a moving curtain."},
    marksman: {"n": "Read the Silver Baffle", "line": "At the held breath, upright air twists into a moving curtain."},
  } },
  "Wish": { by: {
    relicborn: {"n": "First Engine’s Last Key", "line": "Somewhere inside the shard, a lock turns for the first time in an age."},
    archivist: {"n": "Amend the Original", "line": "The lamp opens a volume with no spine. Its wet ink runs back towards the nib."},
  } },
  "Word of Recall": { by: {
    chaplain: {"n": "Home Toll Observance", "line": "Over folded linen, the old threshold feels close enough to touch."},
  } },
  "Zone of Truth": { by: {
    herald: {"n": "Honest Acre Refrain", "line": "As the pennant dips, an unbroken circle glimmers around the speakers."},
    chaplain: {"n": "Honest Acre Observance", "line": "Under the little bell, an unbroken circle glimmers around the speakers."},
    warden: {"n": "Swear by the Honest Acre", "line": "Before silent witnesses, an unbroken circle glimmers around the speakers."},
  } },
};
