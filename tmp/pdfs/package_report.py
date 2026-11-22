from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import shutil

root = Path(__file__).resolve().parents[2]
source = root / 'output/pdf/KAVACH_Report'
out = root / 'output/pdf'
pdf = source / 'Final_Thesis.pdf'
assert pdf.is_file() and pdf.stat().st_size > 20000
shutil.copy2(pdf, out / 'KAVACH_MCA_Report.pdf')
names = ['Final_Thesis.tex', 'metadata.tex', 'appendix.tex', 'nitathesis.cls',
         'README.md', 'README_NITA_THESIS_LATEX', 'build.ps1', 'screenshots.tex']
names += [f'chapter{i}.tex' for i in range(1, 7)]
files = [source / n for n in names]
files += sorted(source.glob('*.sty'))
files += sorted((source / 'images').glob('*'))
files += sorted((source / 'diagrams').glob('*.tex'))
files += sorted((source / 'appendices').glob('*.tex'))
files += [pdf]
with ZipFile(out / 'KAVACH_MCA_LaTeX_Source.zip', 'w', ZIP_DEFLATED) as archive:
    for item in files:
        assert item.is_file(), item
        archive.write(item, 'KAVACH_Report/' + item.relative_to(source).as_posix())
print('Packaged', len(files), 'files')
for name in ['KAVACH_MCA_Report.pdf', 'KAVACH_MCA_LaTeX_Source.zip']:
    p = out / name
    print(p, p.stat().st_size)
