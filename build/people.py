import sys, os
from PIL import Image
D = '/tmp/claude-tool-results/b08a314f-6a04-518d-a3bf-bad07f95a169/'
OUT = '/home/claude/site/dist/assets/img/people/'
pairs = [
 ('rodney',  '1794405577059'),
 ('samuel',  '1794405732573'),
 ('maya',    '1794405757401'),
 ('ducasson','1794405778384'),
 ('olivia',  '1794405816843'),
 ('marcus',  '1794405843297'),
 ('sofia',   '1794405863640'),
 ('daniel',  '1794405884772'),
 ('anthony', '1794405906504'),
 ('ethan',   '1794405928460'),
]
files = os.listdir(D)
for name, stamp in pairs:
    match = [f for f in files if stamp in f and f.endswith('.png')]
    if not match:
        print('MISSING', name); continue
    im = Image.open(D + match[0]).convert('RGB')
    im = im.resize((320, 320), Image.LANCZOS)
    im.save(OUT + name + '.jpg', 'JPEG', quality=86, optimize=True, progressive=True)
    print(name, im.size, os.path.getsize(OUT + name + '.jpg'), 'bytes')
