#!/usr/bin/env python3
"""Build wholly original Barovia character content. Does not read or package .prism files."""
from pathlib import Path
import json, textwrap
root=Path(__file__).resolve().parents[3]
out=root/'src/data/barovia-character-codex-vii.js'
SRC='Original Barovia character homebrew, Pack VII (2026)'

# Each class has a complete twenty-level feature schedule. The core game must explicitly opt into
# the supplementary class system before these become available in a live character sheet.
classes={}
def addclass(name,hd,saves,primary,armor,skills,spellcasting,theme,table,subs):
    features={}
    for level,details in enumerate(table.split('|'),1):
        if not details.strip():continue
        pieces=[details.strip()] if details.strip() else []
        features[str(level)]=[{'name':p.split(':',1)[0].strip(),'text':p.split(':',1)[1].strip() if ':' in p else f'Your {name} gains {p.strip()}. Consult the table for its narrative trigger; the DM adjudicates its effect.'} for p in pieces]
    assert len(features)==20,(name,len(features))
    classes[name]={'name':name,'hd':hd,'saves':saves,'primary':primary,'armor':armor,'skills':skills,'skillChoices':2,'casting':spellcasting,'pitch':theme,'features':features,'subclassLevel':3,'subclasses':subs,'manualRules':True,'src':SRC}

addclass('Lantern Marshal',10,['Str','Wis'],['Str','Wis'],'medium+shield',['Athletics','Insight','Intimidation','Medicine','Perception','Religion','Survival'],'half',
'An oathkeeper who lights the road for others, measuring every victory by the lives carried home.',
'''Keeper of the Wick: Carry a consecrated lantern; once per long rest, let an ally reroll a failed death save while within 15 feet.|Watchful Step: Gain proficiency in Perception, or expertise in it if already proficient.|Order Initiation: Choose an order; gain its level-3 feature.|Ability Score Improvement|Stand the Line: When an adjacent ally is hit, use your reaction to reduce damage by 1d8 + Wisdom modifier; proficiency bonus uses per long rest.|Sheltering Circle: Allies within 10 feet of your lit lantern have advantage on checks to resist magical fear once per short rest.|Two-Way Signal: Once per rest, silently mark a visible ally; each of you knows the other's direction until dawn.|Ability Score Improvement|Lanternfire: Your lantern can reveal invisible footprints in a 15-foot radius for ten minutes, once per long rest.|Shared Vigil: During a short rest, two allies may recover one additional Hit Die each.|Unbroken Formation: One ally within 10 feet may move 10 feet as your reaction after you take a hit; no opportunity attacks from your attacker.|Ability Score Improvement|Call the Lost: Once per long rest, learn whether a named creature is alive within one mile, unless warded.|Second Flame: You can activate Sheltering Circle twice between rests.|Road Without End: Ignore one level of exhaustion imposed by travel until you finish a long rest.|Ability Score Improvement|The Quiet Bell: Once per long rest, suppress hostile magical sounds in a 20-foot radius for one round.|Last Defender: When you fall to 0 HP, you may first allow two allies to move up to half speed without reactions, once per long rest.|Epic Boon|Light Returned: The first time each long rest an ally within 30 feet would fall to 0 HP, it instead remains at 1 HP; your lantern goes dark until dawn.''',
['Order of the Golden Wick','Order of the Black Lantern'])
addclass('Veilwalker',8,['Dex','Wis'],['Dex','Wis'],'light', ['Acrobatics','Deception','Insight','Investigation','Perception','Sleight of Hand','Stealth','Survival'],None,
'A courier of secret paths who fights with direction, silence, and the places enemies refuse to look.',
'''Path Memory: After traveling a route once, remember its visible forks and landmarks without a check.|Quick Cut: Bonus action Disengage proficiency bonus times per long rest.|Veil Discipline: Choose a discipline; gain its level-3 feature.|Ability Score Improvement|Second Step: Once per turn after hitting with a finesse weapon, move 5 feet without provoking from that creature.|False Trail: During an hour of travel, hide tracks for up to six willing travelers; once per long rest.|No Footprint: Difficult terrain caused by mud, snow, or roots costs you no extra movement.|Ability Score Improvement|Borrowed Shadow: As a reaction while in dim light, impose disadvantage on one attack against you; twice per long rest.|Whisper Route: Designate one ally at dawn; you can communicate basic direction by touch at any time.|Through the Crack: Squeeze through openings sized for a creature one size smaller without penalty, if physically possible.|Ability Score Improvement|Never Here: Once per long rest, when targeted you may move 10 feet before the attack resolves, if you can see the source.|The Quiet Hand: Gain expertise in one noncombat skill you are proficient in.|Road Ghost: You cannot be tracked by mundane means unless you leave an intentional sign.|Ability Score Improvement|Outrun the Name: After failing a Dexterity save, reroll it; once per long rest.|Three Places: Once per long rest as an action, move up to your speed and take the Hide action, crossing enemies' reach without opportunity attacks.|Epic Boon|Exit Wound: Once per turn, after a successful finesse hit on a creature that has not acted this round, deal an extra 2d6 damage; this bonus cannot stack with a similar feature granted by the DM.''',
['The Ravensworn','The Keyless'])
addclass('Ashbinder',6,['Int','Wis'],['Int','Wis'],'none', ['Arcana','History','Investigation','Medicine','Nature','Religion'],'full',
'An occult scholar who writes wards in cold ash, and knows that the shape of a ruin is another language.',
'''Ash Script: Record one harmless symbol in ash that persists until washed away; you can read any of your marks within 30 feet.|Cinder Preparation: After a long rest, designate one known ritual as prepared without counting it against your own allotment.|Ash Tradition: Choose a tradition; gain its level-3 feature.|Ability Score Improvement|Pattern Break: As a reaction, grant +2 to one ally's saving throw against magic within 30 feet, twice per long rest.|Cold Crucible: You can create a small harmless flame or extinguish a nonmagical flame without a slot.|Warding Ash: Mark a doorway; the first undead crossing it before dawn is outlined in faint silver light for one minute.|Ability Score Improvement|Unwritten Memory: Once per long rest, reconstruct the last spoken sentence near an intact unburned page or inscription; DM determines ambiguity.|Ashen Sight: Your light cantrips reveal the edges of invisible writing for one minute, once per rest.|Scour the Seal: When you dispel a magical glyph, learn the school of the spell that made it.|Ability Score Improvement|Borrowed Ember: Once per short rest, regain one expended first-level spell slot, but never above your normal slot maximum.|Precise Circle: Friendly creatures in your ritual circles ignore the first 5 feet of magical difficult terrain on their turns.|Book of Last Names: When you speak an undead creature's true name, learn whether it is controlled by another creature.|Ability Score Improvement|Ash Remembers: One use of Unwritten Memory per short rest instead of per long rest.|Ruin's Answer: Once per long rest, ask a destroyed structure one yes/no question about its last day; the DM answers according to lingering impressions.|Epic Boon|White Furnace: Once per long rest, when you cast a spell of level 5 or lower using a slot, restore an ally within 30 feet for 2d8 HP and remove the frightened condition from it.''',
['The White Ash','The Furnace Choir'])
addclass('Thornbound',10,['Con','Wis'],['Con','Wis'],'medium+shield', ['Animal Handling','Athletics','Insight','Medicine','Nature','Perception','Survival'],'half',
'A guardian of living boundaries who takes on a fraction of the land’s wounds to keep its inhabitants alive.',
'''Briar Pact: Touch a plant to learn whether it was injured within the previous hour; the memory is sensory, not speech.|Rooted Guard: When you stand still for a turn, gain +1 AC against the first melee attack before your next turn.|Thorn Oath: Choose an oath; gain its level-3 feature.|Ability Score Improvement|Riven Hedge: Once per long rest, create 10 feet of nonmagical thorny difficult terrain until the end of your next turn.|Wild Watch: Gain advantage on checks to identify unnatural plant growth or spore infestations.|Verdant Claim: Plants in a 5-foot space cannot be magically withered for one minute, once per rest.|Ability Score Improvement|Barkskin Memory: Once per long rest as a reaction, reduce slashing damage by 1d10 + Wisdom modifier.|Mercy of the Soil: During a short rest, an ally who expends a Hit Die gains temporary HP equal to your proficiency bonus.|Heartroot: Once per rest, stabilize a creature within 15 feet by causing roots to brace its wounds.|Ability Score Improvement|Green Silence: Twice per long rest, command natural foliage to conceal a stationary camp from distant sight for one hour.|The Unrotted: Advantage on saves against nonmagical poison; your skin visibly bears living bark veins.|Briar Charge: Once on each of your turns after moving 15 feet, you may push a creature hit by a melee attack 5 feet if it is no more than one size larger.|Ability Score Improvement|Season's Reversal: Once per long rest, clear nonmagical blight from a 20-foot garden or plot over ten minutes.|Against the Harvest: Once per long rest, when an ally is grappled or restrained by a plant, free it as a reaction within 30 feet.|Epic Boon|One Last Spring: Once per long rest, when you would be reduced to 0 HP, remain at 1 HP instead and create a 15-foot zone of flowering difficult terrain for enemies for one minute.''',
['The Briar Covenant','The Hollow Orchard'])

subs={}
def sub(cls,name,pitch,tier):
    levels=[3,6,10,14] if cls not in ('Fighter','Rogue') else [3,7,10,15]
    fs={str(l):[{'name':feat.split(':',1)[0].strip(),'text':feat.split(':',1)[1].strip()}] for l,feat in zip(levels,tier)}
    subs[name]={'name':name,'className':cls,'pitch':pitch,'features':fs,'src':SRC,'manualRules':True}

# Each subclass feature is original, concise and intentionally manual until the DM reviews automation.
sub('Barbarian','Path of the Last Hearth','Rage as a protective promise rather than a hunger.',[
'Hearthrage: When you rage, one ally within 10 feet gains temporary HP equal to your proficiency bonus.',
'Body at the Door: During rage, use your reaction to swap places with a willing adjacent ally targeted by an attack.',
'Ash Unbroken: At the end of a short rest, choose one ally to gain advantage on its next save against fear.',
'Last Hearth Standing: Once per long rest when raging, a hit that would drop an adjacent ally to 0 HP leaves it at 1 HP instead.'])
sub('Bard','College of Unheard Bells','Messages hidden in rhythm, memory and absence.',[
'No-Bell Chorus: Give one creature your Inspiration silently within 30 feet when you can see it.',
'Dissonant Toll: Once per short rest after giving Inspiration, one hostile creature within 30 feet suffers -1d4 on its next Insight check.',
'Borrowed Refrain: During a rest, recover the exact melody you heard in the past 24 hours.',
'The Bell Remembers: Once per long rest, an ally who expended your Inspiration can reroll its check and use either result.'])
sub('Cleric','Domain of the Dying Candle','Protect the light that remains.',[
'Vigil Spark: When you heal a creature, it can also stand from prone without spending movement, once per turn.',
'Conserved Flame: Once per short rest, a creature in your light has advantage on a death save.',
'Quiet Mercy: Your healing suppresses mundane pain and panic for one minute in a willing creature.',
'Final Benediction: Once per long rest, when a willing creature within 30 feet fails a death save, treat the result as a success.'])
sub('Druid','Circle of Blackwater','The marsh keeps what the river will not.',[
'Blackwater Gift: Gain a swim speed equal to your walking speed while unarmored.',
'Reed Mirror: Once per long rest, create a stationary watery duplicate for one minute that can be seen but cannot act.',
'Sunken Path: Your allies ignore natural marsh difficult terrain while following you within 10 feet.',
'Lake of Second Faces: Once per long rest, learn the last creature reflected in an undisturbed pool you touch.'])
sub('Fighter','Gravewatch Sentinel','A soldier who knows how long a siege can last.',[
'Pale Stand: While wielding a shield, reduce one adjacent ally\'s damage by 2 as a reaction; once per short rest.',
'Silent Muster: During a rest, grant one ally advantage on its next initiative roll.',
'Gravewise Footing: Ignore nonmagical rubble difficult terrain.',
'Hold Until Dawn: Once per long rest, when an ally within 10 feet drops to 0 HP, it instead drops to 1 HP.'])
sub('Monk','Way of the Veiled Step','An empty road can be the sharpest weapon.',[
'Mist Foot: Once per short rest, move 10 feet through an enemy\'s reach without provoking.',
'Breath Without Witness: You can hold your breath for ten minutes; your breathing is inaudible.',
'Footfall Unmade: After using Step of the Wind, you leave no visible tracks until your next turn.',
'Unseen Arrival: Once per long rest, when you begin your turn hidden, your first unarmed hit deals 2d6 extra psychic damage.'])
sub('Paladin','Oath of the Unbroken Gate','A vow that no innocents pass into the dark alone.',[
'Gate Oath: Once per long rest, as a bonus action mark a five-foot opening; allies crossing it gain temporary HP equal to your Charisma modifier.',
'Unyielding Lintel: Allies within your aura cannot be unwillingly pushed through a doorway or portal while conscious.',
'Threshold of Mercy: When you restore HP to an ally, that ally ignores opportunity attacks from one creature until its next turn.',
'No One Left Outside: Once per long rest, teleport to an ally you can see within 30 feet who is below half HP.'])
sub('Ranger','Mist-Hound Conclave','The trail itself is the companion.',[
'Grey Scent: Gain advantage on Survival checks to track creatures through mist and rain.',
'Hound\'s Warning: Once per short rest, you and one ally cannot be surprised by a creature you can hear approaching.',
'Crosswind Hunter: Your ranged attacks ignore half cover created by natural fog and foliage.',
'The Last Trail: Once per long rest, name a creature you have tracked; for one hour you know the direction of its most recent footprints within one mile.'])
sub('Rogue','Knifewhisper','One breath, one note, one missing key.',[
'Quiet Blade: If you hit a creature while hidden, it cannot shout until the beginning of its next turn; once per short rest.',
'Key Memory: After examining a mundane lock for a minute, you gain advantage on one check to open a lock of the same make.',
'Veiled Warning: Once per short rest, use your reaction to grant an ally within 10 feet +2 AC against one attack.',
'Last Word: Once per long rest, when you hit a creature that has not acted this round, add 3d6 psychic damage.'])
sub('Sorcerer','Bloodmoon Sorcery','Moonlight heard beating inside the veins.',[
'Crimson Tide: Once per long rest after casting a spell, gain temporary HP equal to its slot level + Charisma modifier.',
'Lunar Bend: Once per short rest, change a spell\'s harmless visual signature to bloodred moonlight.',
'Heart Clock: Advantage on Arcana checks to identify blood-related curses.',
'Eclipse Within: Once per long rest, resist one instance of necrotic damage, halving it.'])
sub('Warlock','The Hollow Saint','A patron represented by a shrine with no saint.',[
'Empty Reliquary: Once per short rest, your whispered plea grants one ally +1d4 on a single Religion or Insight check.',
'Absent Grace: Gain advantage on saves to resist magical compulsion to kneel or worship.',
'Blasphemous Silence: Once per long rest, cancel the sound of your own footsteps for one minute.',
'The Unnamed Answer: Once per long rest, ask your patron one yes/no question about a place you can see; it may answer in symbols.'])
sub('Wizard','School of Lost Hours','Time is a room with doors someone misplaced.',[
'Missed Minute: Once per long rest, add 1d4 to initiative after seeing your roll.',
'Margin Note: A ritual you cast leaves a small, visible countdown sigil known only to you.',
'Hourglass Memory: You recall the exact time of any event you witnessed in the previous seven days.',
'Borrow Tomorrow: Once per long rest, when you fail an Intelligence save, reroll it.'])
sub('Lantern Marshal','Order of the Golden Wick','A bright line between innocents and predators.',[
'Guiding Halo: An ally next to your lit lantern ignores the first 5 feet of difficult terrain each turn.',
'Warm Shelter: Your rest fires grant each resting companion two temporary HP at dawn.',
'Hands of the Watch: Once per rest, stabilize a creature within 15 feet as a bonus action.',
'Dawn Answer: Once per long rest, after an ally fails a death save, turn it into a success.'])
sub('Lantern Marshal','Order of the Black Lantern','Hide the light so the hunted can survive.',[
'Shuttered Flame: Your lantern can illuminate only creatures you choose within 10 feet for one minute.',
'Trapped Glow: Once per rest, mark a spot; the next hostile creature crossing it sheds dim light one round.',
'Night Drill: Allies following you have advantage on one group Stealth check per day.',
'Black Beacon: Once per long rest, illuminate an invisible creature you can see for one minute.'])
sub('Veilwalker','The Ravensworn','The feather is both message and warning.',[
'Raven Signal: Once per short rest, communicate three words to a visible ally within 120 feet without sound.',
'Shadow Perch: Gain advantage on Stealth checks while atop walls and branches.',
'Wingbreak: Once per rest, force a creature that hits you with a melee attack to make a DC 8+PB+Dex save or lose reactions until next turn.',
'Last Feather: Once per long rest, when a creature you can see attacks an ally, impose disadvantage on that roll.'])
sub('Veilwalker','The Keyless','No threshold stays closed forever.',[
'Soft Latch: Once per short rest, gain advantage on a check to open a mundane lock.',
'Framewalker: Entering or exiting a window costs you no additional movement.',
'Silent Entry: Once per short rest, an opened mundane door makes no sound for ten minutes.',
'Pass Without Passage: Once per long rest, teleport between two unlocked doorways within 30 feet that you can see.'])
sub('Ashbinder','The White Ash','Burn infection without burning the patient.',[
'Pale Trace: You can identify mundane infectious residues by sight.',
'Quarantine Geometry: Once per long rest, draw a five-foot ward that grants advantage on one save against spores.',
'Clean Cinder: Once per short rest, remove a nonmagical disease from drinking water in a five-foot cube.',
'Purity of the Furnace: Once per long rest, end one magical poison effect on an ally by touching it.'])
sub('Ashbinder','The Furnace Choir','Hear the language of coals and old engines.',[
'Coal Canticle: Speak to a nonmagical flame to learn its fuel type.',
'Sealed Ember: Once per short rest, keep a flame alive through wind and rain for one hour.',
'Iron Hymn: Allies within 10 feet gain +1 on checks to operate a forge or mechanism.',
'Furnace Verdict: Once per long rest, your fire damage ignores resistance on one spell you cast.'])
sub('Thornbound','The Briar Covenant','Protect by binding the ground beneath you.',[
'Hedge Skin: When you use Rooted Guard, the first creature to miss you in melee takes 1 piercing damage.',
'Briar Line: Once per long rest, create a ten-foot hedge that provides half cover until dawn.',
'Uncut Thorn: You have advantage on checks to escape plant-based restraints.',
'Guardian Root: Once per long rest, a plant adjacent to you takes damage in your place, reducing one hit by 2d8.'])
sub('Thornbound','The Hollow Orchard','What rots nourishes what remains.',[
'Autumn Sap: Once per short rest, give a dying plant one week of healthy life.',
'Grafted Memory: Learn what weather a fruit tree survived last season by touching it.',
'Rot Exchange: Once per long rest, cure one ally of poisoned but you become poisoned for one minute.',
'Last Harvest: Once per long rest, when you fall below half HP, allies within 10 feet gain temporary HP equal to your Wisdom modifier.'])
assert len(subs)==20

species={}
def species_add(name,speed,size,traits,lore):
 species[name]={'name':name,'speed':speed,'size':size,'traits':[{'name':s.split(':',1)[0],'text':s.split(':',1)[1].strip()} for s in traits.split('|')], 'lore':lore,'src':SRC}
species_add('Ashkin',30,'Medium','Cinder Lungs: You have advantage on checks to breathe through smoke and ash, but not poisonous gas.|Glowmark: Once per long rest, cause one palm to emit dim light for an hour.|Furnace Memory: Gain proficiency in History or Investigation.','Descendants of smiths who returned from a fire that never stopped burning.')
species_add('Mireborn',30,'Medium','Bogstride: Nonmagical mud costs you no extra movement.|Stillwater Breath: Hold your breath for up to 15 minutes.|Reedwise: Gain proficiency in Nature or Survival.','Raised where floodwater has swallowed the names of villages.')
species_add('Duskling',30,'Small','Dusk Eyes: You have darkvision 60 feet.|Hedge Runner: Move through the space of any creature larger than you; you cannot end there.|Watch the Windows: Gain proficiency in Perception.','Small travelers who never cross the same threshold twice.')
species_add('Bellforged',30,'Medium','Brass Echo: As an action, emit a clear bell note audible up to 60 feet, once per short rest.|Steady Frame: Advantage on checks to avoid being knocked prone by wind.|Clockmaker: Proficiency with tinkers tools.','Once-living souls sheltered in modest iron and oak bodies.')
species_add('Gravekin',30,'Medium','Last Rites: Gain proficiency in Religion or Medicine.|Quiet Nerves: Advantage on saves against being frightened by undead once per long rest.|Mortal Breath: You are living, can be healed normally, and are not undead.','Living children of gravekeepers whose dreams carry cemetery songs.')
species_add('Thornmarked',30,'Medium','Green Blood: You can communicate simple emotional impressions with ordinary plants by touch; they cannot answer questions.|Briar Hands: Advantage on checks to climb living trees.|Fieldcraft: Gain proficiency in Nature.','Travelers born with barklike scars after the valley blossomed in the wrong season.')
species_add('Palecrest',30,'Medium','Mountain Footing: You have advantage on checks to keep your balance on stone slopes.|Thin Air: Hold your breath twice as long as a typical humanoid.|Peak Memory: Gain proficiency in Athletics or Survival.','The pale mountain families who hear avalanches before they happen.')
species_add('Crowblood',30,'Medium','Raven-Taught: Gain proficiency in Insight or Perception.|Borrowed Cry: Mimic a short nonverbal bird call you have heard; not speech.|Feather Omen: Once per long rest, gain advantage on a check to locate a familiar landmark.','People marked by a covenant with watchers that know the safe road.')
assert len(species)==8

origins={}
def origin(n,ab,skills,feat,hook,tool):
 origins[n]={'name':n,'abilities':ab.split(','),'skills':skills.split(','),'feat':feat,'tool':tool,'hook':hook,'src':SRC}
origin('Grave Tender','Wis,Con,Int','Medicine,Religion','Salt-Ring Keeper','Which grave is missing its occupant?','Herbalism kit')
origin('Night Ferryman','Dex,Wis,Con','Athletics,Survival','River-Bound','What knocked three times beneath your boat?','Vehicles (water)')
origin('Plague Bellringer','Con,Cha,Wis','Religion,Perception','Bellward','Whose name was the final toll for?','Musical instrument')
origin('Road Cartographer','Int,Wis,Dex','Investigation,Survival','Marker Reader','Which road exists on no map except yours?','Cartographer tools')
origin('Candle Keeper','Wis,Cha,Con','Insight,Religion','Wickwise','Whose candle do you refuse to extinguish?','Calligrapher tools')
origin('Wolf Tracker','Dex,Wis,Str','Perception,Survival','Quiet Boot','Which wolf waits for you at the treeline?','Leatherworker tools')
origin('Relic Smuggler','Dex,Cha,Int','Deception,Sleight of Hand','False Compartments','What relic did you deliver to the wrong person?','Thieves tools')
origin('Weather Scribe','Int,Wis,Con','Nature,Investigation','Storm Reader','What did yesterday’s rain spell on the windows?','Calligrapher tools')
origin('Ash Harvester','Con,Str,Wis','Athletics,Nature','Cinderproof','What remained burning in the ashes you gathered?','Smith tools')
origin('Lake Diver','Dex,Con,Wis','Athletics,Investigation','Blackwater Lungs','What did you leave chained below the jetty?','Vehicles (water)')
origin('Abandoned Heir','Cha,Int,Wis','History,Persuasion','Last Name','Why does a stranger carry your family seal?','Forgery kit')
origin('Gate Watcher','Str,Con,Wis','Insight,Perception','Threshold Sentinel','What walked through the gate after the watch changed?','Mason tools')
assert len(origins)==12

feat_rows={
'Origin':[
('Salt-Ring Keeper','Trace a five-foot ring of salt during a rest; your group learns whether a creature crosses it during the next hour, but the ring does not stop the creature.'),
('River-Bound','You can swim half your walking speed in ordinary water and identify the safest visible landing on a riverbank.'),
('Bellward','Once per long rest, toll a handheld bell to grant an ally advantage on one save against the frightened condition within 30 feet.'),
('Marker Reader','With one minute of study, identify the direction of the nearest traveled road you have already crossed.'),
('Wickwise','A mundane flame you light lasts twice as long; once per long rest, use it to grant +1d4 to an ally’s Perception check in darkness.'),
('Quiet Boot','Once per short rest, reroll a failed Stealth check made while stationary.'),
('False Compartments','During a short rest, hide one Tiny object in your clothing; a searcher has disadvantage on checks to locate it until you move it.'),
('Storm Reader','Once per long rest, predict whether a natural storm will begin within the next hour; the DM answers truthfully if weather is natural.'),
('Cinderproof','Gain advantage on saving throws against nonmagical choking smoke, not poison gas.'),
('Blackwater Lungs','Hold your breath for ten minutes; you can orient yourself in dark water by the feel of current.'),
('Last Name','Once per long rest, gain advantage on one Persuasion check with someone familiar with your family name.'),
('Threshold Sentinel','When you take the Ready action to defend a doorway, gain temporary HP equal to your proficiency bonus, once per short rest.')],
'General':[
('Coffin Listener','You have advantage on Investigation checks to locate movement or scraping within a wooden container.'),
('Mist Cartographer','After traveling through magical fog, you can make a map of the physical path you took with one hour of work.'),
('Scarecrow Breaker','When you hit a construct made primarily of straw, it cannot take reactions until your next turn, once per short rest.'),
('Chapel Refuge','Once per long rest, after spending ten minutes at a consecrated shrine, grant one ally 1d6 temporary HP.'),
('Warded Blood','Once per long rest, gain advantage on a saving throw against a spore-borne or curse-borne effect.'),
('Cold Iron Grip','You gain advantage on Athletics checks to keep hold of a metal object against being disarmed.'),
('Raven Pact','As a ritual, leave food for local ravens; you gain advantage on your next Survival check to follow a trail, once per long rest.'),
('Ashen Resolve','Once per long rest, when you fail a Constitution saving throw, add 1d4 to the result, potentially succeeding.'),
('Oathscarred','After making a promise before allies, gain advantage on one check made directly to fulfill it that day; once per long rest.'),
('Wolf-Wise','You have advantage on Animal Handling checks against ordinary wolves, though not undead or magical wolves.'),
('Briar Athlete','Ignore difficult terrain caused by nonmagical roots for the first ten feet of your turn.'),
('Grave Reader','Identify approximate age of a grave from soil and weathering with one minute of inspection.'),
('Tomb Compass','After navigating a stone dungeon for ten minutes, know the direction of the exit you entered through unless teleportation intervened.'),
('Unlit Watch','While stationary in darkness, creatures cannot find you solely from the sound of your breathing.'),
('Glassmaker','You can improvise a mundane spyglass or signal mirror over a short rest if suitable materials are available; it breaks after use.'),
('Dawn Resilience','Once per long rest, when you gain temporary HP, add your proficiency bonus to that amount.'),
('Quiet Revelator','Once per short rest, you can discern if someone is deliberately concealing a noise, provided you can normally hear it.'),
('Pale Mountain Step','Reduce the first 10 feet of falling distance after you deliberately jump from natural stone.'),
('Lantern Duelist','While holding a lit lantern in your off hand, once per short rest impose -1d4 on one enemy melee attack against you.'),
('One More Night','Once per long rest, when you finish a short rest with 0 Hit Dice left, recover 1 expended Hit Die.'),
('Echo Listener','Gain advantage on Investigation checks to identify the direction of a sound heard through masonry.'),
('Copper Sigil','When you take lightning damage, reduce it by your proficiency bonus once per long rest.'),
('Mourners Friend','After spending an hour comforting a grieving creature, gain advantage on your next Insight check against it within a day.'),
('Hollow Key','Once per long rest, gain advantage on one check to force open a mundane locked door that you have previously examined.')],
'Fighting Style':[
('Gatehold','While using a shield in a narrow passage, gain +1 AC against the first melee attack each round.'),
('Lantern Guard','You may pick up or set down a lantern as part of your movement; once per turn on a melee hit while carrying one, deal +1 fire damage.'),
('Coffin Nail','Once per turn, when you hit a creature with a one-handed piercing weapon, you can prevent it moving 5 feet by a reaction until your next turn; once per short rest.'),
('Reed Spear','When you Ready a spear attack against an approaching enemy, add +1 to its attack roll.'),
('Stonewall Stance','If you have not moved this turn, gain advantage on your next check to resist a shove until your next turn.'),
('Mercy Blade','Once per turn, reduce damage from your melee weapon by up to your proficiency bonus, declaring the blow nonlethal.'),
('Ravenflight Archery','After a ranged attack from elevated ground, move 5 feet without provoking attacks from your target; once per turn.'),
('Ashen Counter','Once per short rest, after a melee attack misses you, use a reaction to make one attack with a light weapon you wield.')],
'Epic Boon':[
('Boon of the Last Lantern','Once per long rest, when you and nearby allies would be magically plunged into darkness, your light instead persists for one round.'),
('Boon of the Road Beyond','Once per long rest, travel instantly with up to five willing allies along an already-known short path of no more than one mile; DM approves line of travel.'),
('Boon of the Unforgotten','Once per long rest, an ally who dies within 30 feet may speak one final sentence before its spirit departs; this does not revive them.'),
('Boon of Spring After Ash','Once per long rest, restore one acre of nonmagical blighted vegetation over an hour, leaving magically cursed areas unchanged.')]
}
feats={}
for cat,rows in feat_rows.items():
 for n,text in rows:
  feats[n]={'name':n,'category':cat,'minimumLevel':19 if cat=='Epic Boon' else 4 if cat!='Origin' else 1,'text':text,'repeatable':False,'manualRules':True,'src':SRC}
assert len(feats)==48

# Six original spells at every tier, levels 0–9. Runtime fields are conservative: utility
# spells never carry dice (the existing engine treats util + dice as a smite).
spell_lines=r'''
0|Candle Compass|Divination|60|Instantaneous|Bard,Cleric,Druid,Wizard,Lantern Marshal|A candle points toward the nearest visible safe path you have traveled today. It cannot reveal a hidden passage.
0|Ashmark|Transmutation|Touch|1 hour|Druid,Sorcerer,Wizard,Ashbinder|Draw an ash symbol on a solid surface. Only creatures you name can see its cold gray glow.
0|Reed Whisper|Divination|30|1 minute|Bard,Druid,Ranger,Thornbound|A patch of grass repeats the last loud sound within ten feet of it, distorted by wind.
0|Grave Glow|Evocation|Touch|10 minutes|Cleric,Paladin,Warlock,Lantern Marshal|Touch a pebble; it shines with dim silver light and briefly brightens near an open grave.
0|Borrowed Knock|Illusion|60|Instantaneous|Bard,Sorcerer,Warlock,Veilwalker|Make one clearly audible knock arise from a door you can see, without opening it.
0|Frostprint|Divination|Touch|Instantaneous|Druid,Ranger,Wizard,Ashbinder|Reveal fresh footprints on a ten-foot patch of ground for a breath, without showing who made them.
1|A Door Remembers|Divination|Touch|Instantaneous|Bard,Cleric,Wizard,Ashbinder|Touch a door to hear one sound it made when last opened. A sealed door reveals nothing beyond its own noise.
1|Hearthward|Abjuration|Touch|1 hour|Cleric,Druid,Paladin,Lantern Marshal|Mark one willing creature with soot. Once during the duration it gains advantage on a save against being frightened; spell then ends.
1|Mudglass|Transmutation|30|10 minutes|Druid,Ranger,Sorcerer,Thornbound|Turn a five-foot puddle into clear, walkable glasslike mud; it breaks harmlessly after the spell.
1|Crows Warning|Divination|Self|1 hour|Bard,Druid,Ranger,Warlock|You hear a distant raven whenever an unseen Large creature moves within thirty feet; total cover blocks the warning.
1|Wick of Mercy|Abjuration|Touch|Instantaneous|Cleric,Paladin,Ashbinder,Lantern Marshal|A living creature at zero HP becomes stable and wakes after one minute with one HP; it cannot benefit again until a long rest.
1|False Window|Illusion|60|10 minutes|Bard,Sorcerer,Warlock,Wizard|Create a false glowing window on a solid wall; physical inspection reveals stone or wood beneath.
2|Brine Circle|Abjuration|Touch|1 hour|Cleric,Druid,Paladin,Ashbinder|Place a ring of salt up to ten feet across. Its outline flashes when an undead creature crosses, but it does not block passage.
2|Wolfglass|Divination|Self|10 minutes|Druid,Ranger,Warlock,Veilwalker|For ten minutes your vision reveals fresh animal tracks as faint blue lines within thirty feet.
2|Tarn Mirror|Illusion|60|1 minute|Bard,Sorcerer,Warlock,Wizard|A still pool reflects an empty landscape instead of nearby creatures; contact dispels the image.
2|Bitter Reed|Transmutation|30|1 minute|Druid,Ranger,Thornbound|Reeds in a ten-foot-square patch rise to waist height, giving half cover without trapping creatures.
2|Bell of Names|Divination|Self|Instantaneous|Bard,Cleric,Paladin,Wizard|Speak a name while ringing a bell. Learn whether the named creature has been within sixty feet in the last day; a ward prevents this.
2|Chimney Flight|Transmutation|Touch|1 minute|Druid,Sorcerer,Wizard,Ashbinder|One willing creature becomes a harmless spiral of warm ash to pass through a nonmagical opening at least one inch wide, ending in a safe empty space.
3|The Empty Procession|Illusion|90|10 minutes|Bard,Sorcerer,Warlock,Wizard|Create distant footsteps and lantern lights moving along one hundred feet of road; figures cannot interact physically.
3|Cinder Guard|Abjuration|Touch|Concentration, up to 1 minute|Cleric,Druid,Paladin,Ashbinder|One willing creature gains resistance to cold damage; its shadow smells faintly of ash.
3|Gravewater Witness|Divination|Touch|Instantaneous|Cleric,Druid,Wizard,Thornbound|Touch naturally collected gravewater to glimpse the most recent living creature reflected in it.
3|Black Orchard|Transmutation|60|Concentration, up to 1 minute|Druid,Ranger,Warlock,Thornbound|A fifteen-foot-radius stand of illusory black trees provides visual obscurity but no physical cover.
3|Lanterngate|Abjuration|30|1 minute|Cleric,Paladin,Wizard,Lantern Marshal|Ward a visible doorway for one minute; allies crossing it gain two temporary HP, once per casting.
3|Salt the Echo|Abjuration|Touch|1 hour|Cleric,Paladin,Warlock,Ashbinder|Suppress magical whispering that originates in one unattended object; a creature holding it can resist with a Wisdom save.
4|When the Road Forks|Divination|Self|Instantaneous|Bard,Cleric,Druid,Wizard|Learn which of two visible roads leads closer to one place you have personally visited; magical redirection may distort the answer.
4|The Quiet House|Abjuration|Touch|Concentration, up to 10 minutes|Bard,Cleric,Paladin,Wizard|Sound cannot pass through the walls of one small room for ten minutes; it does not prevent entry.
4|Drowned Footfall|Transmutation|Touch|Concentration, up to 1 hour|Druid,Ranger,Sorcerer,Thornbound|Up to four willing creatures make no sound while moving across water or wet ground; they still leave tracks.
4|Borrow the Bell|Illusion|90|1 minute|Bard,Sorcerer,Warlock,Ashbinder|Project a realistic tolling bell from a point you see, with the call of one creature you have heard.
4|Hollow Moonfire|Evocation|90|Instantaneous|Cleric,Sorcerer,Warlock,Wizard|A pale ring ignites at a point, revealing invisible creatures in a ten-foot radius until the end of your next turn; it deals no damage.
4|Ashen Ferry|Conjuration|30|10 minutes|Druid,Sorcerer,Wizard,Veilwalker|Summon a stationary raft of cold ash that supports up to four Medium creatures on still water for ten minutes.
5|The Door That Stayed|Abjuration|Touch|1 hour|Cleric,Paladin,Warlock,Wizard|A mundane doorway cannot close or latch for one hour, though it can be blocked physically.
5|Remember the Drowned|Divination|Touch|Instantaneous|Cleric,Druid,Wizard,Ashbinder|Touch an object recovered from a river to see a silent five-second image of the moment it fell in, if any.
5|Unmourned Army|Illusion|120|Concentration, up to 1 minute|Bard,Sorcerer,Warlock,Wizard|Phantasmal silhouettes march across a sixty-foot roadway, blocking sight beyond them but never preventing movement.
5|Mercy Against Roots|Abjuration|60|Instantaneous|Cleric,Druid,Paladin,Thornbound|End one magical plant-grapple on a creature within range; does not end other conditions.
5|Seal the Choir|Abjuration|60|Concentration, up to 1 minute|Cleric,Warlock,Wizard,Ashbinder|For one minute creatures inside a fifteen-foot sphere cannot send telepathic messages outside it; ordinary speech still works.
5|Night Orchard Bloom|Transmutation|90|Concentration, up to 1 minute|Druid,Ranger,Sorcerer,Thornbound|Cause a sixty-foot patch of existing natural growth to erupt with black blossoms, lightly obscuring it for enemies and allies alike.
6|Carry Home the Flame|Conjuration|Touch|Instantaneous|Cleric,Druid,Paladin,Lantern Marshal|Teleport up to three willing creatures touching you to a sanctuary you have rested in today, within five miles; wards may prevent arrival.
6|Buried Map|Divination|Self|Instantaneous|Bard,Druid,Wizard,Ashbinder|Know the shape of natural caves beneath you for five hundred feet in a horizontal radius, but not their occupants or doors.
6|Silence in the Root|Abjuration|120|Concentration, up to 1 minute|Druid,Warlock,Wizard,Thornbound|Suppress communication between magically linked plant creatures within a twenty-foot-radius sphere, without harming them.
6|The Mourning Wind|Illusion|120|10 minutes|Bard,Sorcerer,Warlock,Wizard|A wind carries familiar voices through a town; listeners can identify it as an illusion with an Investigation check against your spell DC.
6|Lantern of the Third Watch|Divination|Self|1 hour|Cleric,Paladin,Wizard,Lantern Marshal|A hovering light marks all visible exits within sixty feet in distinct colors; secret doors remain concealed.
6|Salt Upon the Sea|Abjuration|120|1 minute|Cleric,Druid,Sorcerer,Ashbinder|Conjure a line of suspended salt over water, preventing magical fog from crossing that line for one minute.
7|Names Under Stone|Divination|Touch|Instantaneous|Cleric,Warlock,Wizard,Ashbinder|Read the names last spoken near a standing stone in the previous century; ancient magic can silence some names.
7|Ashes of Yesterday|Transmutation|Touch|Instantaneous|Druid,Sorcerer,Wizard,Ashbinder|Restore one nonmagical object destroyed by ordinary fire in the previous day, no larger than a five-foot cube.
7|The Wolf Who Wasn't|Illusion|120|Concentration, up to 10 minutes|Bard,Druid,Warlock,Veilwalker|Create a convincing phantom pack of wolves that patrol a line you designate, but cannot attack or physically block passage.
7|Road of Mourning|Conjuration|Self|1 minute|Bard,Cleric,Wizard,Lantern Marshal|Create a temporary one-hundred-foot straight path of pale cobbles over stable ground; it cannot bridge open chasms or water.
7|Gallows Rest|Abjuration|60|Concentration, up to 1 minute|Cleric,Paladin,Warlock,Ashbinder|Prevent an area of magical necromantic animation within a twenty-foot radius; affected undead are not destroyed and may leave.
7|Orchard of the Unlost|Transmutation|90|1 hour|Druid,Sorcerer,Wizard,Thornbound|Rejuvenate one acre of mundane diseased orchard for an hour; the land returns to its previous state afterward.
8|The Ninth Toll|Divination|Self|Instantaneous|Bard,Cleric,Warlock,Wizard|Learn one imminent event that threatens a named ally within the next hour, expressed as a brief bell-vision, never a guaranteed future.
8|Lantern Between Worlds|Abjuration|Touch|Concentration, up to 1 minute|Cleric,Paladin,Wizard,Lantern Marshal|Protect one willing creature against being moved unwillingly between planes for one minute.
8|Hollow Sky|Illusion|120|Concentration, up to 10 minutes|Bard,Sorcerer,Warlock,Wizard|Turn a two-hundred-foot patch of visible sky into the illusion of an impossible eclipse, with no actual dimming of sunlight.
8|Restore the Road|Transmutation|Touch|1 hour|Druid,Wizard,Ashbinder,Thornbound|Rebuild up to three hundred feet of collapsed mundane roadway over stable ground; this cannot create material over an unsupported span.
8|Blackwater Covenant|Abjuration|90|Concentration, up to 1 minute|Cleric,Druid,Warlock,Thornbound|Creatures you designate within a thirty-foot pool cannot be unwillingly dragged beneath the surface for the duration.
8|Borrow a Name From Stone|Divination|Touch|Instantaneous|Cleric,Warlock,Wizard,Ashbinder|Touch a grave and learn the deceased's full name and one willingly spoken regret, if their spirit remains accessible.
9|The Valley Remembers|Divination|Self|Instantaneous|Bard,Cleric,Druid,Wizard|Witness a sweeping illusory history of one mile of countryside over the last day, without identifying obscured creatures.
9|The Dawn We Were Denied|Abjuration|120|1 hour|Cleric,Druid,Paladin,Lantern Marshal|Create true sunlight in a thirty-foot radius for one hour, but the effect cannot move with you or override another deity's domain without consent.
9|One More Village|Transmutation|Touch|24 hours|Druid,Wizard,Thornbound|Restore nonmagical structures and crops in a ruined hamlet to the condition they had one year ago for one day. No creatures return.
9|The Final Door|Abjuration|Touch|10 minutes|Cleric,Paladin,Warlock,Ashbinder|Seal one ordinary door against any magical opening below ninth-level magic for ten minutes; mundane destruction still works.
9|A Hundred Unheard Bells|Illusion|120|Concentration, up to 1 minute|Bard,Sorcerer,Warlock,Wizard|Fill a battlefield with illusory bells and the silhouettes of those who mourn it; creatures can resist the distraction with a Wisdom saving throw.
9|Green Without the Hunger|Transmutation|120|Instantaneous|Druid,Cleric,Wizard,Thornbound|Turn one hundred feet of magically infested plants into dormant harmless foliage for one hour; intelligent infection beyond the plants remains.
'''
spells=[]
for line in spell_lines.splitlines():
 if not line.strip():continue
 parts=line.strip().split('|');assert len(parts)==7,(line,len(parts)); level,n,school,rng,duration,caster,text=parts
 spells.append({'name':n,'level':int(level),'school':school,'range':rng,'castingTime':'Action' if int(level)<5 else '1 minute', 'components':'V, S', 'duration':duration,'classes':caster.split(','),'text':text,'mode':'manual','src':SRC})
assert len(spells)==60

starters=[
('The Candle Captain','Lantern Marshal','Order of the Golden Wick','Ashkin','Gate Watcher','Defend a doorway that nobody else can hold.'),
('The Svalich Ghost','Veilwalker','The Ravensworn','Crowblood','Road Cartographer','Find the path that vanished last winter.'),
('The Ash Archivist','Ashbinder','The White Ash','Ashkin','Plague Bellringer','Read the names scraped off a shrine.'),
('The Briar Witness','Thornbound','The Hollow Orchard','Thornmarked','Ash Harvester','Save the last good fruit tree in Barovia.'),
('The Bellless Courier','Veilwalker','The Keyless','Duskling','Relic Smuggler','Deliver a message to a dead recipient.'),
('The Black Warden','Lantern Marshal','Order of the Black Lantern','Gravekin','Grave Tender','Keep a hunted family unseen until sunrise.'),
('The Furnace Scholar','Ashbinder','The Furnace Choir','Bellforged','Weather Scribe','Discover why the forge burns with no fuel.'),
('The Reed Knight','Thornbound','The Briar Covenant','Mireborn','Lake Diver','Reclaim a causeway from the marsh.'),
('The Pale Trailblazer','Veilwalker','The Ravensworn','Palecrest','Wolf Tracker','Bring the missing hunters home.'),
('The Unburnt Scribe','Ashbinder','The White Ash','Duskling','Candle Keeper','Find the one page that fire refused to eat.'),
('The Silent Ferryman','Lantern Marshal','Order of the Golden Wick','Mireborn','Night Ferryman','Carry a stranger over black water without asking their name.'),
('The Last Parishioner','Thornbound','The Hollow Orchard','Gravekin','Abandoned Heir','Replant the churchyard after the dead rise.')]
starters=[{'name':name,'className':cl,'subclass':subc,'species':spec,'background':bg,'hook':hook} for name,cl,subc,spec,bg,hook in starters]

pack={'version':7,'name':'Barovia: The Character Codex','license':'Original table homebrew; no third-party source material reproduced','classes':classes,'subclasses':subs,'species':species,'backgrounds':origins,'feats':feats,'spells':spells,'starters':starters}
assert len(classes)==4 and len(subs)==20 and len(feats)==48 and len(species)==8 and len(origins)==12 and len(spells)==60 and len(starters)==12
code='''/* Barovia Character Codex VII. Wholly original homebrew; not core 5e rules.
   Manual rules unless explicitly automated by the VTT. Do not treat as balance-certified.
   No content from the private .prism file is copied into this public repository. */
export const BAROVIA_CODEX = '''+json.dumps(pack,ensure_ascii=False,indent=2)+';\n'
out.write_text(code,encoding='utf-8')
print('WROTE',out,'size',out.stat().st_size)
print({k:len(v) for k,v in pack.items() if isinstance(v,(dict,list))})
