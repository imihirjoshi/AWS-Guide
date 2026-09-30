#!/usr/bin/env python3
"""Find classes used in markup that have no CSS rule anywhere.
Ignores fragments produced by JavaScript string concatenation."""
import re, glob, pathlib, sys
css = ''.join(open(f).read() for f in glob.glob('assets/css/*.css'))
for p in glob.glob('*.html'):
    s = open(p).read()
    for m in re.findall(r'<style>(.*?)</style>', s, re.S): css += m
defined = set(re.findall(r'\.([A-Za-z][\w-]*)', css))
NOISE = re.compile(r"^[^A-Za-z]|['\"()+?:=]|^(esc|isRead|lvlClass|stateClass|x\.k|w\.length|o\[)")
used = {}
SKIP = {'export.js'}  # builds a standalone print document with its own inline styles
for f in glob.glob('*.html') + glob.glob('assets/js/*.js'):
    if pathlib.Path(f).name in SKIP: continue
    s = open(f).read()
    for attr in re.findall(r'class="([^"{}<>]+)"', s):
        if '+' in attr or "'" in attr: continue
        for c in attr.split():
            if not NOISE.search(c): used.setdefault(c, set()).add(pathlib.Path(f).name)
orphans = {c: v for c, v in used.items() if c not in defined}
if orphans:
    print("UNSTYLED CLASSES FOUND:")
    for c, v in sorted(orphans.items()):
        print(f"  .{c:20} used in {', '.join(sorted(v))}")
    sys.exit(1)
print(f"clean. {len(used)} classes used, all have rules.")
