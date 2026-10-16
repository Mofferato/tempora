# usage: python3 tools/patch-atlas.py   (applies the field replacements below to src/data-atlas-*.js)
import re, glob, sys
def patch(rid, key, value, newkey=None):
    for f in glob.glob('src/data-atlas-*.js'):
        s = open(f, encoding='utf8').read()
        m = re.search(r'Land\(`' + re.escape(rid) + r'\|.*?`\);', s, re.S)
        if not m: continue
        blk = m.group(0)
        fm = re.search(r'(?<![A-Za-z])' + re.escape(key) + r'=[^;]*;', blk)
        nk = newkey or key
        rep = f'{nk}={value};'
        if fm: nb = blk.replace(fm.group(0), rep, 1)
        else: nb = blk.replace('`);', ';\n' + rep + '`);', 1) if not blk.rstrip().endswith(';`);') else blk.replace(';`);', ';\n' + rep + '`);', 1)
        open(f, 'w', encoding='utf8').write(s.replace(blk, nb, 1)); return True
    print('NOT FOUND', rid, key); return False
