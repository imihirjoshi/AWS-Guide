#!/usr/bin/env python3
"""Stamp every local css and js link with a hash of the file, so a deploy can
never be defeated by a stale browser cache. Re-run after changing assets."""
import re, hashlib, pathlib, sys
root = pathlib.Path(__file__).parent
def h(p):
    f = root / p
    return hashlib.sha1(f.read_bytes()).hexdigest()[:8] if f.exists() else None
pat = re.compile(r'(href|src)="(assets/(?:css|js)/[^"?]+)(?:\?v=[0-9a-f]+)?"')
changed = 0
for page in root.glob('*.html'):
    s = page.read_text()
    def sub(m):
        v = h(m.group(2))
        return f'{m.group(1)}="{m.group(2)}?v={v}"' if v else m.group(0)
    new = pat.sub(sub, s)
    if new != s:
        page.write_text(new); changed += 1
        print(f"  stamped {page.name}")
print(f"{changed} pages stamped")
