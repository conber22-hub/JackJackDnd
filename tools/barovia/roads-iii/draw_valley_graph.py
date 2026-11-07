"""Schematic based on stylized coordinates and route edges in src/data/barovia-map.js."""
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
COORD={
'mists':(95,22),'gates':(89,30),'village':(80,37),'crossroads':(68,32),
'castle':(71,46),'coffin':(62,17),'tser':(57,30),'bonegrinder':(47,25),
'vallaki':(36,31),'lake':(30,21),'argyn':(42,12),'berez':(37,47),
'winery':(21,38),'krezk':(12,28),'yester':(6,16),'tower':(27,55),
}
LINKS=[('mists','gates','road'),('gates','village','road'),('village','crossroads','road'),('crossroads','castle','road'),('crossroads','coffin','trail'),('crossroads','tser','path'),('tser','bonegrinder','road'),('bonegrinder','vallaki','road'),('vallaki','lake','path'),('vallaki','argyn','trail'),('vallaki','berez','path'),('vallaki','winery','road'),('winery','krezk','road'),('krezk','yester','trail'),('berez','tower','trail')]
LABEL={
'mists':'THE MISTS','gates':'GATES OF BAROVIA','village':'VILLAGE OF BAROVIA','crossroads':'GALLOWS CROSSROADS',
'castle':'CASTLE RAVENLOFT','coffin':'THE IRON COFFIN','tser':'TSER POOL','bonegrinder':'OLD BONEGRINDER',
'vallaki':'VALLAKI','lake':'LAKE ZAROVICH','argyn':'ARGYNVOSTHOLT','berez':'BEREZ',
'winery':'WIZARD OF WINES','krezk':'KREZK','yester':'YESTER HILL','tower':'THE LONELY TOWER',
}
OFF={'mists':(-160,-26),'gates':(-42,-54),'village':(28,18),'crossroads':(28,-65),
'castle':(28,24),'coffin':(-76,-52),'tser':(-54,22),'bonegrinder':(-15,-52),
'vallaki':(-16,22),'lake':(-172,-42),'argyn':(-70,-52),'berez':(28,7),
'winery':(-12,26),'krezk':(-72,-56),'yester':(-20,-54),'tower':(-25,28)}
S=2;W=1600*S;H=980*S
im=Image.new('RGB',(W,H),'#10191c');d=ImageDraw.Draw(im)
f='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
title=ImageFont.truetype(bold,36*S);font=ImageFont.truetype(bold,11*S);mini=ImageFont.truetype(f,15*S)
d.text((54*S,34*S),'THE ROADS OF BAROVIA',font=title,fill='#ede8da')
d.text((56*S,91*S),'16 destinations    /    15 connected road links    /    valley coordinates from JackJackDnd',font=mini,fill='#a6bdb3')
for x in range(60*S,W,70*S):d.line([(x,135*S),(x,915*S)],fill='#192528',width=S)
for y in range(135*S,915*S,70*S):d.line([(55*S,y),(1535*S,y)],fill='#192528',width=S)
def pt(k):
 x,y=COORD[k];return ((80+x*14)*S,(100+y*12)*S)
cols={'road':'#bba77c','path':'#77a8b0','trail':'#879982'}
for a,b,style in LINKS:
 x0,y0=pt(a);x1,y1=pt(b)
 d.line([(x0,y0),(x1,y1)],fill='#101719',width=13*S)
 d.line([(x0,y0),(x1,y1)],fill=cols[style],width=5*S if style=='road' else 4*S)
for a in COORD:
 x,y=pt(a);d.ellipse((x-8*S,y-8*S,x+8*S,y+8*S),fill='#0d1718',outline='#dfd6bf',width=3*S)
 ox,oy=OFF[a];label=LABEL[a];px=x+ox*S;py=y+oy*S
 bb=d.textbbox((px,py),label,font=font);d.rounded_rectangle([bb[0]-6*S,bb[1]-5*S,bb[2]+6*S,bb[3]+5*S],radius=3*S,fill='#10191c',outline='#3e5550',width=S)
 d.text((px,py),label,font=font,fill='#e8eadc')
d.line((65*S,888*S,1535*S,888*S),fill='#4b5a58',width=S)
x=79
for style,tx in [('road','Main road'),('path','Footpath / river'),('trail','Cliff / hidden trail')]:
 d.line((x*S,922*S,(x+80)*S,922*S),fill=cols[style],width=5*S);d.text(((x+94)*S,912*S),tx,font=mini,fill='#c5d1c4');x+=325
im.resize((W//S,H//S),Image.Resampling.LANCZOS).save(ROOT/'previews/Barovia_Valley_Route_Network.png')
print('saved valley schematic')
