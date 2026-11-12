"""Remove the placeholder bullet from page 2 of the resume — its text and its bullet glyph —
leaving every other mark on the page exactly as designed."""
import sys
from pikepdf import Pdf, parse_content_stream, unparse_content_stream

SRC, DST = sys.argv[1], sys.argv[2]
PAGE_INDEX = 1
Y_LOW, Y_HIGH = 58.0, 102.0

IDENT = (1, 0, 0, 1, 0, 0)
PATH_BUILD = {'m', 'l', 'c', 'v', 'y', 're', 'h'}
PATH_PAINT = {'S', 's', 'f', 'F', 'f*', 'B', 'B*', 'b', 'b*', 'n'}

def mul(a, b):
    a0, a1, a2, a3, a4, a5 = a
    b0, b1, b2, b3, b4, b5 = b
    return (a0*b0 + a1*b2, a0*b1 + a1*b3,
            a2*b0 + a3*b2, a2*b1 + a3*b3,
            a4*b0 + a5*b2 + b4, a4*b1 + a5*b3 + b5)

def apply_y(m, x, y):
    return m[1]*x + m[3]*y + m[5]

pdf = Pdf.open(SRC)
page = pdf.pages[PAGE_INDEX]

ctm, gstack = IDENT, []
tm = tlm = IDENT
leading = 0.0
kept = []
path_buf, path_ys = [], []
dropped_text = dropped_paths = 0

for ins in parse_content_stream(page):
    ops, op = ins.operands, str(ins.operator)

    # --- graphics state ---
    if op == 'q':
        gstack.append(ctm)
    elif op == 'Q':
        ctm = gstack.pop() if gstack else IDENT
    elif op == 'cm':
        ctm = mul(tuple(float(x) for x in ops), ctm)
    elif op == 'BT':
        tm = tlm = IDENT
    elif op == 'Tm':
        tlm = tm = tuple(float(x) for x in ops)
    elif op in ('Td', 'TD'):
        tx, ty = float(ops[0]), float(ops[1])
        if op == 'TD':
            leading = -ty
        tlm = mul((1, 0, 0, 1, tx, ty), tlm)
        tm = tlm
    elif op == 'TL':
        leading = float(ops[0])
    elif op == 'T*':
        tlm = mul((1, 0, 0, 1, 0, -leading), tlm)
        tm = tlm

    # --- path construction: buffer until it is painted ---
    if op in PATH_BUILD:
        nums = [float(x) for x in ops]
        if op == 're' and len(nums) == 4:
            pts = [(nums[0], nums[1]), (nums[0], nums[1] + nums[3])]
        else:
            pts = [(nums[i], nums[i + 1]) for i in range(0, len(nums) - 1, 2)]
        path_ys += [apply_y(ctm, x, y) for x, y in pts]
        path_buf.append(ins)
        continue

    if op in PATH_PAINT:
        path_buf.append(ins)
        inside = path_ys and all(Y_LOW <= y <= Y_HIGH for y in path_ys)
        if inside:
            dropped_paths += 1
        else:
            kept.extend(path_buf)
        path_buf, path_ys = [], []
        continue

    # --- text showing ---
    if op in ('Tj', 'TJ', "'", '"'):
        if op in ("'", '"'):
            tlm = mul((1, 0, 0, 1, 0, -leading), tlm)
            tm = tlm
        if Y_LOW <= mul(tm, ctm)[5] <= Y_HIGH:
            dropped_text += 1
            continue

    kept.append(ins)

kept.extend(path_buf)
page.Contents = pdf.make_stream(unparse_content_stream(kept))
pdf.save(DST)
print('removed %d glyph operations and %d path(s)' % (dropped_text, dropped_paths))
