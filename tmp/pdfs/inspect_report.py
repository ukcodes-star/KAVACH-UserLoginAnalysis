from pathlib import Path
import json
import pypdfium2 as pdfium
from pypdf import PdfReader
from PIL import Image, ImageOps, ImageDraw

root = Path(__file__).resolve().parents[2]
report = root / 'output/pdf/KAVACH_Report/Final_Thesis.pdf'
out = root / 'tmp/pdfs'
reader = PdfReader(report)
doc = pdfium.PdfDocument(str(report))
summary = []
tiles = []
for idx, page in enumerate(doc):
    text = reader.pages[idx].extract_text() or ''
    summary.append({'page': idx + 1, 'chars': len(text), 'start': text[:110],
                    'width': float(reader.pages[idx].mediabox.width),
                    'height': float(reader.pages[idx].mediabox.height)})
    img = page.render(scale=1.05).to_pil().convert('RGB')
    img.save(out / f'page-{idx + 1:02d}.png')
    img.thumbnail((380, 540))
    tile = Image.new('RGB', (400, 575), '#dddddd')
    tile.paste(img, ((400 - img.width)//2, 25))
    ImageDraw.Draw(tile).text((12, 7), f'Page {idx+1}', fill='black')
    tiles.append(tile)
for group in range(0, len(tiles), 9):
    sheet = Image.new('RGB', (1200, 1725), 'white')
    for offset, tile in enumerate(tiles[group:group+9]):
        sheet.paste(tile, ((offset % 3)*400, (offset//3)*575))
    sheet.save(out / f'contact-{group//9+1}.png')
(out / 'page-summary.json').write_text(json.dumps(summary, indent=2), encoding='utf-8')
(out / 'report-text.txt').write_text('\n\n'.join(p.extract_text() or '' for p in reader.pages), encoding='utf-8')
print(json.dumps({'pages': len(reader.pages), 'short_pages': [p for p in summary if p['chars'] < 130],
                  'contacts': [str(p) for p in sorted(out.glob('contact-*.png'))]}, indent=2))
