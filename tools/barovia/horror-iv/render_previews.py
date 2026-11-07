"""Real z-tested geometry renders of this horror pack and mixed roadside dioramas."""
import sys,math
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageFilter,ImageEnhance
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'source'))
from render_zbuffer import picture,ITEMS,regular,small,bold
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
fontB='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
fontIt='/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf'
# The renderer expects the manifest catalog; here it already loaded the Horror IV file.
ids=list(ITEMS)
print('Rendering',len(ids),'GLBs')
cols=5;cw=300;ch=226;rows=math.ceil(len(ids)/cols)
sheet=Image.new('RGB',(cols*cw,rows*ch+114),'#0b1315');draw=ImageDraw.Draw(sheet)
draw.text((27,19),'BAROVIA IV  /  THE ROAD WATCHES',font=bold,fill='#e7e5da')
draw.text((28,65),'43 original gothic 3D GLBs · real mesh renders · side discoveries · Hunger Moss horror',font=regular,fill='#aab8b0')
for i,k in enumerate(ids):
 x=i%cols*cw;y=114+i//cols*ch
 im=picture([(k,0,0)],278,173)
 sheet.paste(im,(x+10,y+4))
 draw.text((x+13,y+179),k.replace('_',' ')[:32],font=regular,fill='#e4e9e0')
 draw.text((x+13,y+204),ITEMS[k]['category'].replace('_',' ').upper(),font=small,fill='#90a79c')
 sheet.save(ROOT/'previews'/'Horror_IV_43_Asset_Catalog.png') if i==0 else None
sheet.save(ROOT/'previews'/'Horror_IV_43_Asset_Catalog.png')
print('Catalog',sheet.size)
# Small curated contact sheet
selected=['last_light_inn','plague_tollhouse','drowned_waychapel','wolves_watchtower','root_swallowed_cottage','gallows_three_nooses',
 'noose_oak','blood_well','bone_chime_tree','rusted_prison_cage','false_scarecrow','abandoned_funeral_cart',
 'hunger_root_arch','hunger_heart_tree','bog_sunken_hands','dripping_cave_door']
cols=4;cw=340;ch=255;rows=4
out=Image.new('RGB',(cols*cw,rows*ch+120),'#0a1215');d=ImageDraw.Draw(out)
d.text((36,18),'THE ROAD WATCHES',font=ImageFont.truetype(fontB,40),fill='#f0e8d8')
d.text((38,72),'A collection of places that should not exist in Barovia',font=ImageFont.truetype(font,17),fill='#a9b5aa')
for i,k in enumerate(selected):
 x=i%cols*cw;y=120+i//cols*ch
 im=picture([(k,0,0)],312,190,zoom=.97)
 out.paste(im,(x+14,y+5));d.text((x+16,y+203),k.replace('_',' ').upper()[:30],font=ImageFont.truetype(fontB,14),fill='#ece7da')
 d.text((x+16,y+224),ITEMS[k]['biome'].upper(),font=ImageFont.truetype(font,12),fill='#b1bbb3')
out.save(ROOT/'previews'/'Horror_IV_Shortlist.png')
print('Shortlist',out.size)
# Add in a couple of physical road tiles from Pack III and original fir from Pack I.
road_root=ROOT.parent/'Barovia_Roads_Connections_III'/'assets'
live_root=ROOT.parent/'barovia_living_terrain_v2'/'assets'
for id in ['road_straight_ew','road_tee_new','road_bend_ne','road_straight_ns','path_straight_ns','road_cap_n']:
 ITEMS[id]={'file':str(road_root/(id+'.glb'))}
for id in ['svalich_black_fir','windworn_fir','hunger_taken_fir','forgotten_graves','hollow_fallen_log','tser_cattail_reeds']:
 ITEMS[id]={'file':str(live_root/(id+'.glb'))}
scenes={
 'The Last Light Inn':[
  ('road_straight_ew',-9,0),('road_straight_ew',-1,0),('road_straight_ew',7,0),
  ('last_light_inn',0,-6.4),('abandoned_funeral_cart',-4.0,-5.2),('last_lantern_sign',4.2,-4.1),
  ('noose_oak',9.6,-6.7),('svalich_black_fir',-11,-6),('windworn_fir',12.2,4.8),
  ('hollow_fallen_log',-11,4.5),('forgotten_graves',-7,-7.5),('eyeless_stump',5.6,4.3),
 ],
 'The Root Has a Heart':[
  ('road_straight_ew',-9,0),('road_straight_ew',-1,0),('road_straight_ew',7,0),
  ('root_swallowed_cottage',-.8,-6.2),('hunger_heart_tree',4.8,-6.4),('hunger_taken_wagon',-5.8,-5.6),
  ('hunger_root_arch',9.8,-5.9),('hunger_spore_vent',-4.3,3.9),('hunger_stalking_stalks',3.8,3.6),
  ('hunger_taken_fir',-11,-5.8),('hunger_taken_fir',11.5,5.7),('svalich_black_fir',-11.5,5.7),
 ],
 'The Drowned Vespers':[
  ('road_straight_ew',-9,0),('road_straight_ew',-1,0),('road_straight_ew',7,0),
  ('drowned_waychapel',-.4,-6.6),('blackwater_sinkhole',-5.5,-5.5),('bog_sunken_hands',6.7,4.0),
  ('blood_well',4.5,-5.7),('candled_memorial',-3,4.4),('tser_cattail_reeds',-11,-5),
  ('tser_cattail_reeds',11,5),('noose_oak',10.2,-6.7),
 ]}
fontTitle=ImageFont.truetype(fontB,33);fontSub=ImageFont.truetype(font,15)
for title,items in scenes.items():
 img=picture(items,width=1660,height=620,zoom=.93)
 canvas=Image.new('RGB',(1660,726),'#0b1417');canvas.paste(img,(0,96));dr=ImageDraw.Draw(canvas)
 dr.text((40,17),title.upper(),font=fontTitle,fill='#eee7da')
 dr.text((42,62),'Assembled from original Pack IV horror GLBs + Packs I/III terrain · software z-buffer render of actual meshes',font=fontSub,fill='#b9c3b7')
 fname=title.lower().replace(' ','_').replace('’','').replace('the_','')+'.png';canvas.save(ROOT/'previews'/fname)
 print('Scene',fname)
