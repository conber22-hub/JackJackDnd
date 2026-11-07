"""After verify-road-watches.mjs, compose its real loader captures (Pillow)."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root = Path(__file__).resolve().parent.parent
assets = json.loads((root/'public/assets/road-watches/manifest.json').read_text())['assets']
font_path = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
font = ImageFont.truetype(font_path, 15)
small = ImageFont.truetype(font_path, 12)
out = Image.new('RGB', (1920, 2040), '#182227')
draw = ImageDraw.Draw(out)
for i, a in enumerate(assets):
    x, y = i%6*320, i//6*340
    im = Image.open('/tmp/road-watches-'+a['id']+'.jpg').convert('RGB')
    out.paste(im, (x, y))
    draw.text((x+10,y+282), a['id'], font=font, fill='#f2dfb6')
    draw.text((x+10,y+305), f"{a['family']} | {a['triangles']} tris | {a['footprint']['w']}x{a['footprint']['h']} cells", font=small, fill='#a6b9b5')
out.save(root/'docs/road-watches/evidence/contact-sheet.jpg', quality=91)
