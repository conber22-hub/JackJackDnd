"""Regenerate the plain-ESM site catalogue from the model manifest."""
from pathlib import Path
import json
here=Path(__file__).resolve(); staged=here.parent.name=='hidden-v' and here.parent.parent.name=='barovia'; root=here.parents[3] if staged else here.parents[1]; source=root/'public/assets/hidden-sites' if staged else root; dest=root/'src/render' if staged else root/'js'
m=json.loads((source/'manifest.json').read_text())
items=[]
for item in m['pairs']:
 items.append({k:item[k] for k in ('id','title','kind','biomes','roads','footprint','approach','reveal','return','sealed','revealed')})
(dest/'barovia-hidden-data.js').write_text('/* Barovia V: original scene text and model-state pairs. No copyrighted module passages. */\nexport const HIDDEN_SITES = Object.freeze('+json.dumps(items,indent=2,ensure_ascii=False)+');\nexport const HIDDEN_SITE_BY_ID = Object.freeze(Object.fromEntries(HIDDEN_SITES.map(s=>[s.id,s])));\n',encoding='utf8')
print('Wrote',len(items),'scene definitions')
