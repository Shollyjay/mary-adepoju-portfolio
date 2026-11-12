import sys
from PIL import Image
out = sys.argv[1]
tiles = sys.argv[2:]
coords = [(0,0),(440,0),(0,378),(440,378)]
canvas = Image.new('RGB', (880, 756))
for path,(x,y) in zip(tiles, coords):
    canvas.paste(Image.open(path).convert('RGB'), (x,y))
canvas.save(out, 'JPEG', quality=88, optimize=True, progressive=True)
print('wrote', out, canvas.size)
