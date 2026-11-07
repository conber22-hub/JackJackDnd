"""Generate original Barovian village building variants. All geometry is invented here.
    No downloaded textures, no proprietary assets, no dependencies beyond numpy+trimesh.
    Stage changes are visual-only. Same XZ footprint, ground anchor and door location.
"""
import json, math, random, sys
from pathlib import Path
from mesh_helpers import Model, PAL
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'public/assets/dead-villages';OUT.mkdir(parents=True,exist_ok=True)
MANIFEST=ROOT/'docs/barovia/dead-villages-vi-manifest.json'
PAL.update({
 'wattle':'#887b67','wattle_dark':'#554c45','timber':'#594537','timber_light':'#8b6b50',
 'slate_dark':'#31383e','slate_blue':'#4c5961','thatched':'#9e8d63','thatched2':'#6e6548',
 'mortar_white':'#aaa18e','glass_dark':'#101c23','glass_warm':'#b97c37','glass_dusk':'#433738',
 'fungal':'#8ab06f','fungal_core':'#b2d77a','fungal_vein':'#485c39',
 'lumber':'#745740','rubble':'#5b5951','brick_red':'#65463d','rust':'#77503a',
 'roof_lichen':'#667267','roof_moss':'#3a4b3c','sick':'#808467',
 'metal_dull':'#363a3b','light_cream':'#e6c78b','linen':'#b0a595','char':'#1b2022',
})

# PBR GLB models for actual village building skins. Front (door) is +Z in local space.
ARCHETYPES={
 'svalich_cottage':('Svalich Cottage',[4,4],2.1,'gable','A line of lit candles in the windows.','There is no chimney smoke.','The moss reaches for a knock at the door.'),
 'peat_hut':('Peat-Cutter Hut',[3,3],1.7,'thatch','A family has left muddy boots by the door.','A bundle hangs where a child once slept.','Soft lights pulse beneath the roof straw.'),
 'timber_longhouse':('Timber Longhouse',[6,4],2.35,'gable','A pot simmers for the missing woodcutters.','Knives are driven into the threshold.','Ribs of wood push through the shingles.'),
 'gallows_watch':('Palisade Watch House',[3,3],3.1,'tower','A watcher signals from the platform.','The watch bell has a rope but no clapper.','Something watches from inside the empty bell.'),
 'morning_chapel':('Morning Chapel',[5,4],3.05,'chapel','Warm candles cling to the altar glass.','A bell lies in pieces beneath the belfry.','Roots wind through the windows like fingers.'),
 'last_candle_inn':('Last Candle Inn',[6,5],2.75,'inn','A soft song drifts through the shutters.','Chairs stand stacked against the doors.','The windows glow a sickly green after dusk.'),
 'mourners_ossuary':('Mourner’s Ossuary',[4,4],2.15,'crypt','Fresh flowers lie at the stone threshold.','Every painted name is scraped away.','Bone-colored blooms climb the lintel.'),
 'river_granary':('River Granary',[4,4],2.55,'granary','Fresh flour dust coats the landing.','Grain leaks through split boards.','Each sack has sprouted pale tendrils.'),
 'market_stallhouse':('Covered Market Hall',[5,4],1.95,'market','Stalls offer bread and a brass scale.','A sale notice flaps where no merchant stands.','Spore sacs sway beneath the canvas awning.'),
 'bell_schoolhouse':('Bell Schoolhouse',[5,4],2.35,'school','A slate marks today’s lessons.','The students’ desks face the wall.','Writing appears across the shuttered windows.'),
 'charcoal_workshop':('Charcoal Workshop',[5,4],2.25,'workshop','A forge burns in spite of the rain.','The bellows twitch when the room is empty.','An iron-black growth blooms out of the forge.'),
 'burgomaster_manor':('Burgomaster’s Manor',[7,5],3.25,'manor','Every downstairs window is lit.','All the portraits face their own walls.','The roofline has grown crooked horns.'),
}

# Two-tone materials inspired by faded paints, old copper and fungal green.
def prism(m,points,c):
    # pts in xyz, convex faces triangulated as external shell
    verts=np.array(points,float)
    if len(verts)!=6:raise ValueError('roof prism needs 6 vertices')
    faces=[[0,2,1],[3,4,5],[0,1,4],[0,4,3],[1,2,5],[1,5,4],[2,0,3],[2,3,5]]
    mesh=trimesh.Trimesh(vertices=verts,faces=faces,process=False);m.add(mesh,c)

def roof(m,w,d,y,style,stage):
    rr=.58 if style in ('gable','thatch','school','granary','inn') else .72
    h=.64 if style not in ('chapel','manor') else .83
    if style=='market':h=.30
    if style=='tower':h=.43
    roof_c='thatched' if style in ('thatch','market') else 'slate_dark' if style in ('chapel','crypt','manor') else 'slate_blue'
    if stage==1:roof_c='thatched2' if style in ('thatch','market') else 'stone3'
    if stage==2:roof_c='roof_moss'
    # roof is a triangular prism; exaggerated upper silhouette, within horizontal model bounds
    W=w-.10;D=d-.10
    prism(m,[(-W/2,y,-D/2),(W/2,y,-D/2),(0,y+h,-D/2),(-W/2,y,D/2),(W/2,y,D/2),(0,y+h,D/2)],roof_c)
    # roof ridge beam
    m.box(0,y+h+.012,0,.085,.055,D-.08,'timber' if stage<2 else 'fungal_vein')
    for j in range(3):
        z=-d*.34+j*d*.34
        if stage<1:
            m.box(-w*.25,y+h*.48+.035,z,.085,.025,.28,'roof_lichen' if j==2 else 'slate_dark',ry=0)
        elif stage==1:
            m.ell(-w*.30,y+h*.35,z,.22,.055,.16,'stone3',sub=0)
        else:
            # glow patches stay adhered to roof, do not protrude outside building plot
            m.ell((-w*.28),(y+h*.42),z,.15,.05,.18,'fungal_core',sub=0)

def build(key,stage):
    title,fp,y,style,*notes=ARCHETYPES[key]
    w,d=fp;m=Model('dead_village_'+key,seed=2026)
    r=m.r
    # Vertical floor posts, identical anchors and front door geometry for all states.
    floor=0;halfW=w/2;halfD=d/2
    # Foundation sill: no extra terrain or collision footprint.
    m.box(0,.08,0,w-.10,.15,d-.10,'stone3' if style in ('crypt','chapel') else 'stone')
    stone = style in ('crypt','chapel','manor')
    wall = 'mortar_white' if stone else ('wattle' if style not in ('workshop','granary') else 'wattle_dark')
    if stage==1:wall='stone2' if stone else 'wattle_dark'
    if stage==2:wall='roof_moss' if stone else 'wattle_dark'
    # walls, back, and side panels
    th=.11;Y=y*.5
    m.box(0,Y,-halfD+.07,w-.16,y,th,wall)
    for sx in (-1,1):m.box(sx*(halfW-.07),Y,0,th,y,d-.14,wall)
    # Front doorway always south (+z), exactly centered; wall is split around aperture.
    doorWidth=.74;doorHeight=1.25;sideW=(w-doorWidth)/2-.08
    for sx in (-1,1):m.box(sx*(doorWidth/2+sideW/2),Y,halfD-.07,sideW,y,th,wall)
    m.box(0,doorHeight+(y-doorHeight)/2,halfD-.07,doorWidth,y-doorHeight,th,wall)
    # exposed wood frame
    for sx in (-1,1):
        m.box(sx*(halfW-.13),Y,0,.12,y-.12,.12,'timber')
        m.box(sx*(halfW-.13),Y,-halfD+.13,.12,y-.10,.12,'timber')
    for xx in (-doorWidth/2-.05,doorWidth/2+.05):m.box(xx,.69,halfD+.004,.09,1.40,.11,'timber')
    m.box(0,1.35,halfD+.005,doorWidth+.2,.09,.11,'timber_light')
    # door leaf is visual only (real game collisions stay controlled by VTT)
    if stage==0:
        m.box(0,.62,halfD+.012,.65,1.17,.055,'lumber')
        m.ell(.22,.61,halfD+.05,.03,.045,.02,'copper',sub=0)
    elif stage==1:
        m.box(-.25,.62,halfD+.01,.12,1.16,.05,'timber')
        m.box(.29,.36,halfD+.01,.11,.63,.06,'timber')
        # a dark threshold, door opening stays at exact same visual center
        m.box(0,.03,halfD+.02,.64,.06,.10,'ash')
    else:
        m.box(0,.64,halfD+.012,.64,1.17,.055,'char')
        m.ell(0,.68,halfD+.049,.16,.23,.025,'fungal_core',sub=0)
        for sx in (-1,1):m.tube((sx*.35,.14,halfD-.09),(sx*.38,1.17,halfD-.09),.10,.012,'fungal_vein',6)
    # windows on facade: two per long building, one at small huts.
    positions=[-.34*w,.34*w] if w>=4 else [-.89,.89]
    for i,xx in enumerate(positions):
        ww=.47;wy=1.35 if y<3 else 1.55
        m.box(xx,wy,halfD+.004,ww+.13,.67,.065,'timber')
        m.box(xx,wy,halfD+.047,ww,.50,.020,'glass_warm' if stage==0 else 'glass_dark' if stage==1 else 'fungal_vein')
        m.box(xx,wy,halfD+.064,.035,.53,.03,'lumber')
        if stage==1:
            m.box(xx,wy+.20,halfD+.080,.61,.075,.06,'lumber',ry=(-.15 if i else .2))
        elif stage==2:
            for p in (-.16,.12):m.tube((xx+p,wy-.22,halfD-.01),(xx+p*.65,wy+.27,halfD-.01),.05,.012,'fungal',5)
            m.ell(xx,wy,halfD+.075,.09,.09,.018,'fungal_core',sub=0)
    # rear slits and timber trusses
    for xx in (-.28*w,.28*w):
        m.box(xx,y*.65,-halfD-.01,.37,.48,.06,'glass_dusk' if stage else 'glass_warm')
    # beam line under roof edge
    for sz in (-1,1):m.box(0,y-.035,sz*(halfD-.07),w-.18,.115,.16,'timber')
    roof(m,w,d,y,style,stage)
    # silhouette-special architecture (without changing ground footprint)
    if style=='chapel':
        m.box(0,y+1.04,-d*.06,.70,1.2,.70,'stone2')
        m.cone(0,y+1.65,-d*.06,.51,.86,'slate_dark' if stage!=2 else 'roof_moss',8)
        m.tube((0,y+2.4,-d*.06),(0,y+2.70,-d*.06),.05,.025,'metal_dull',6)
        m.box(0,y+2.43,-d*.06,.32,.08,.08,'metal_dull')
    elif style=='tower':
        for sx in (-1,1):m.box(sx*.75,y+.23,0,.30,.46,d-.28,'timber')
        m.box(0,y+.23,0,w-.25,.17,d-.25,'lumber')
        m.cyl(0,y+.18,0,.22,.22,.44,'metal_dull' if stage!=2 else 'fungal_vein',10)
    elif style=='manor':
        for xx in (-w*.30,w*.30):
            m.box(xx,y*.65,halfD+.01,.10,.60,.14,'timber_light')
            m.cone(xx,y+.14,-d*.12,.33,.8,'slate_dark' if stage!=2 else 'roof_moss',7)
        m.box(0,.2,halfD+.01,1.22,.30,.18,'stone2')
    elif style=='inn':
        m.box(0,y*.64,halfD+.10,w*.66,.08,.18,'timber_light')
        for xx in (-w*.33,0,w*.33):m.box(xx,y*.78,halfD+.12,.11,.44,.10,'lumber')
        m.box(-w*.36,1.54,halfD+.025,.40,.38,.05,'red')
    elif style=='market':
        for xx in (-w*.33,w*.33):m.box(xx,.31,halfD+.06,.72,.50,.16,'lumber')
        m.box(0,1.20,halfD+.05,w*.74,.07,.10,'timber')
    elif style=='granary':
        for xx in (-w*.34,w*.34):m.box(xx,.4,-halfD+.11,.15,.62,.15,'lumber')
        m.box(0,.20,-halfD+.10,w*.63,.16,.35,'wood')
    elif style=='school':
        m.box(.06,.9,halfD+.01,.4,.43,.07,'stone3')
        m.box(.05,.9,halfD+.067,.30,.27,.015,'chalk')
    elif style=='workshop':
        m.box(-w*.33,.73,halfD+.045,.6,.65,.06,'ash')
        m.cyl(-w*.30,y+.60,-d*.25,.15,.16,.95,'brick_red',8)
    elif style=='crypt':
        m.cone(0,y+.24,0,.28,.64,'stone3',6)
        for xx in (-w*.30,w*.30):m.box(xx,.35,halfD+.02,.20,.58,.16,'stone2')
    elif style=='thatch':
        m.box(0,y+.54,-d*.20,.22,.97,.22,'timber_light')
    # exterior state details, never outside bounding XZ or door approach
    if stage==0:
        # inhabited: hanging pennant and lamps within building shell
        m.ell(-w*.42,1.12,halfD-.09,.065,.14,.08,'lantern',sub=0)
        m.box(w*.39,1.10,halfD-.12,.15,.38,.06,'linen')
        if style=='inn':m.ell(.72,1.30,halfD-.06,.09,.11,.06,'light_cream',sub=0)
    if stage==1:
        # decay: slanting nailed boards and slashed roof; house stays within original footprint
        for xx in (-w*.22,w*.20):
            m.box(xx,1.01,halfD+.02,.15,1.10,.085,'timber_light',ry=.34 if xx<0 else -.27)
        for k in range(4):
            xx=-w*.32+k*w*.21;zz=-d*.20+(k%2)*d*.30
            yy=y+.56*(1-abs(xx)/(w*.5))
            m.ell(xx,yy,zz,.22,.035,.16,'char',sub=0)
        for j in range(3):
            zz=-d*.38+j*d*.38
            m.box(-w*.47,.42+j*.27,zz,.06,.39,.32,'lumber',ry=.09*(-1)**j)
        m.ell(w*.34,.075,-d*.36,.24,.09,.19,'ash',sub=0)
        m.ell(w*.22,.07,d*.33,.16,.08,.11,'rubble',sub=0)
    if stage==2:
        # Growth clings to walls, sheds light; growth NEVER extends into public street.
        # A hooked crown and knots of luminous tendrils break the otherwise identical silhouette.
        for k in range(5):
            xx=(-.35+k*.175)*w
            if abs(xx)>w*.41:continue
            zz=(-.25+(k%3)*.21)*d
            base_y=y+.55*(1-abs(xx)/(w*.5))
            top_y=base_y+(.35+.26*(k%2))
            m.tube((xx,base_y,zz),(xx+.08*(1 if k%2 else -1),top_y,zz-.14),.105,.018,'fungal_vein',7)
            m.ell(xx,base_y+.13,zz,.22,.13,.20,'fungal',sub=0)
            if k%2==0:m.ell(xx,top_y-.025,zz-.14,.11,.10,.08,'fungal_core',sub=0)
        # The infected threshold is the focal point from the street.
        for xx in (-.30,.30):
            m.tube((xx,0.16,halfD-.035),(xx*.5,1.08,halfD-.043),.12,.035,'fungal_vein',7)
            m.ell(xx*.65,.89,halfD+.015,.18,.19,.07,'fungal_core',sub=0)
        m.ell(0,y*.75,halfD+.025,.23,.27,.045,'fungal',sub=0)
        for j in range(11):
            xx=r.uniform(-w*.42,w*.42);zz=r.choice([-d*.45,d*.42]);yy=r.uniform(.37,y+.28)
            m.ell(xx,yy,zz,.10,.15,.05,'fungal' if j%3 else 'fungal_core',sub=0)
        for j in range(9):
            xx=r.choice([-w*.45,w*.45]);zz=r.uniform(-d*.42,d*.40)
            a=(xx,.11,zz);b=(xx*.98,r.uniform(y*.58,y+.26),zz*.88)
            m.tube(a,b,.065,.01,'fungal_vein',5)
        for x in (-w*.33,w*.33):m.ell(x,y+.21,d*.18,.16,.12,.18,'fungal_core',sub=0)
    return m

def export_model(key,stage):
    model=build(key,stage)
    groups={}
    w,d=ARCHETYPES[key][1]
    for mesh in model.scene.dump():
        # Clothing/boards/moss remain strictly within the established solid-building
        # XZ footprint. This prevents visuals overhanging the adjacent walkable street.
        verts=mesh.vertices.copy()
        verts[:,0]=np.clip(verts[:,0],-w/2+.012,w/2-.012)
        verts[:,2]=np.clip(verts[:,2],-d/2+.012,d/2-.012)
        mesh.vertices=verts
        c=tuple(int(round(n)) for n in mesh.visual.material.baseColorFactor[:3]);groups.setdefault(c,[]).append(mesh)
    scene=trimesh.Scene()
    for i,(col,parts) in enumerate(groups.items()):
        geom=trimesh.util.concatenate(parts)
        geom.visual=TextureVisuals(material=PBRMaterial(baseColorFactor=list(col)+[255],roughnessFactor=.9,metallicFactor=.0,doubleSided=True,name=f'{key}_mat_{i:02d}'))
        scene.add_geometry(geom,node_name=f'{key}_mat_{i:02d}')
    id=f'{key}_{("inhabited","abandoned","infested")[stage]}'
    bs=scene.export(file_type='glb');(OUT/f'{id}.glb').write_bytes(bs)
    bb=scene.bounds
    return {'id':id,'kind':key,'stage':('inhabited','abandoned','infested')[stage], 'file':f'{id}.glb',
            'footprint':ARCHETYPES[key][1],'bounds':[[round(float(n),4) for n in row] for row in bb],
            'drawCalls':len(groups),'parts':model.count,'bytes':len(bs),'visualOnly':True}

if __name__=='__main__':
    models=[export_model(key,stage) for key in ARCHETYPES for stage in range(3)]
    data={'pack':'Barovia VI: The Dead Villages','version':6,'scale':'1 square = 1 world unit = 5 feet, +Y up, north -Z',
          'visualOnly':True,'modelCount':len(models),'archetypeCount':len(ARCHETYPES),'stages':['inhabited','abandoned','infested'],
          'archetypes':[{'id':key,'title':val[0],'footprint':val[1],'notes':val[4:]} for key,val in ARCHETYPES.items()], 'models':models}
    MANIFEST.write_text(json.dumps(data,ensure_ascii=False,indent=2))
    print('Built',len(models),'GLBs',sum(m['bytes'] for m in models),'bytes; max drawcalls',max(m['drawCalls'] for m in models))
