"""Composite uses *real mesh files* from Packs I and III, not imaginary concept art."""
from pathlib import Path
import random
from PIL import Image,ImageDraw,ImageFont
from render_zbuffer import ROOT,ITEMS,picture
OLD=ROOT.parent/'barovia_living_terrain_v2'/'assets'
for old in OLD.glob('*.glb'):ITEMS[old.stem]={'file':str(old)}
# First row of the Gallows Crossroads approach, with a road spur, ancient bridge and Svalich trees.
placements=[
 ('road_straight_ew',-16,0),('road_tee_new',-8,0),('bridge_stone_ew',0,0),
 ('road_straight_ew',8,0),('road_straight_ew',16,0),('road_cap_s',-8,-8),
]
r=random.Random(23)
for x,z in [(-18,-3.4),(-15.4,3.15),(-11.9,-3.0),(-4.5,3.15),(3.2,3.0),(5.9,-3.05),(11,-3.05),(16,3.1),(18,-3.4)]:
 placements.append((r.choice(['svalich_black_fir','windworn_fir','crooked_oak'] if abs(x)>14 else ['svalich_black_fir','windworn_fir']),x,z))
placements.extend([
 ('lost_svalich_milestone',12,2.85),('forgotten_graves',-12,-5.8),
 ('svalich_black_fir',-8,-11.2),('mushroom_stump',-8.6,-6.6),
 ('tser_cattail_reeds',-1.8,-3.0),('tser_cattail_reeds',2.0,2.9),
])
img=picture(placements,width=1600,height=540,zoom=.98)
final=Image.new('RGB',(1600,640),'#0c1518');final.paste(img,(0,90))
d=ImageDraw.Draw(final)
b=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',26)
f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15)
d.text((34,21),'THE SVALICH ROAD',font=b,fill='#ebece2')
d.text((35,62),'Assembled 3D road modules + existing Pack I trees, milestone and marsh vegetation · software rendered from GLB geometry',font=f,fill='#9fb3a7')
final.save(ROOT/'previews/Barovia_Road_Connection_In_Scene.png')
print('saved assembled route preview')
