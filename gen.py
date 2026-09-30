#!/usr/bin/env python3
"""Generate a real HTML page per service and per architecture, so crawlers and
AI answer engines see the content instead of an empty shell. Also writes
sitemap.xml, robots.txt and llms.txt. Re-run after changing the data."""
import json, pathlib, html, re, datetime

ROOT = pathlib.Path(__file__).parent
SITE = "https://aws.4bittechnology.com"
TODAY = "2026-09-30"
e = lambda t: html.escape(str(t or ""), quote=True)

CHROME_CSS = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100,400;100,500;100,600;112,600;125,600&family=JetBrains+Mono:wght@400;500&display=swap">')

def nav(depth=1):
    up = "../" * depth
    return f'''<header class="top"><div class="wrap">
  <a class="logo" href="{up}index.html"><span class="awsmark"><img src="{up}assets/icons/brand/aws-logo.svg" alt="AWS" width="40" height="24"></span><b>Explained Simply</b></a>
  <nav class="nav">
    <a href="{up}index.html">Basics</a><a href="{up}learn.html">Start here</a>
    <a href="{up}services.html">Services</a><a href="{up}architecture.html">What to build</a>
    <a href="{up}playground.html">Playground</a><a href="{up}certifications.html">Certifications</a>
  </nav>
  <div class="ctl"><span id="curbox"></span><button id="theme" title="Switch light and dark" aria-label="Switch light and dark">&#9681;</button></div>
</div></header>'''

def foot(depth=1):
    up = "../" * depth
    return f'''<footer class="foot"><div class="wrap">
  <div class="fgrid">
    <div class="fcol"><h3>Independent project</h3>
      <p><strong>Not affiliated with Amazon Web Services.</strong> Not endorsed by, sponsored by, or connected to Amazon Web Services, Inc. or Amazon.com, Inc.</p></div>
    <div class="fcol"><h3>Trademarks and icons</h3>
      <p>AWS and all service names and icons are trademarks of Amazon.com, Inc. or its affiliates. Icons are the official AWS Architecture Icons, used unmodified. All writing here is original.</p></div>
    <div class="fcol"><h3>Prices are estimates</h3>
      <p>Every figure is a rough teaching estimate, never a quote. Use the <a href="https://calculator.aws/" rel="nofollow noopener" target="_blank">AWS Pricing Calculator</a> for real numbers.</p></div>
    <div class="fcol"><h3>Your data</h3>
      <p>No accounts, no ads, no tracking, no cookies. <a href="{up}legal.html">Full notice</a>.</p></div>
  </div>
  <p class="fbase">Built by <a href="https://github.com/imihirjoshi/AWS-Guide" rel="noopener" target="_blank">Mihir Joshi</a>. Distributed by 4Bit Technology.</p>
</div></footer>
<script src="{up}assets/js/currency.js"></script>
<script src="{up}assets/js/ui.js"></script>
<script src="{up}assets/js/notice.js"></script>'''

def head(title, desc, canon, og_img, extra_css="", jsonld=None, depth=1):
    up = "../" * depth
    ld = f'<script type="application/ld+json">{json.dumps(jsonld, ensure_ascii=False)}</script>' if jsonld else ""
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{canon}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta property="og:type" content="article">
<meta property="og:site_name" content="AWS Explained Simply">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{canon}">
<meta property="og:image" content="{SITE}/{og_img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(title)}">
<meta name="twitter:description" content="{e(desc)}">
<meta name="twitter:image" content="{SITE}/{og_img}">
<link rel="icon" href="{up}assets/icons/brand/aws-cloud.svg">
{CHROME_CSS}
<link rel="stylesheet" href="{up}assets/css/style.css">{extra_css}
{ld}
</head>
<body>'''

# ---------------------------------------------------------------- services
S = json.loads((ROOT / "data/services.json").read_text())
by = {x["slug"]: x for x in S}
(ROOT / "s").mkdir(exist_ok=True)
made = []
for s in S:
    if not s.get("written"):
        continue
    slug = s["slug"]
    canon = f"{SITE}/s/{slug}.html"
    desc = (s.get("one") or "")[:155]
    title = f"{s['name']}: {s.get('one','')}"[:70]
    ld = {
        "@context": "https://schema.org", "@type": "TechArticle",
        "headline": f"{s['name']} explained in plain English",
        "description": desc, "url": canon, "inLanguage": "en",
        "datePublished": TODAY, "dateModified": TODAY,
        "author": {"@type": "Person", "name": "Mihir Joshi"},
        "publisher": {"@type": "Organization", "name": "4Bit Technology"},
        "about": {"@type": "SoftwareApplication", "name": s["name"],
                  "applicationCategory": s["category"]},
        "isPartOf": {"@type": "WebSite", "name": "AWS Explained Simply", "url": SITE},
    }
    when = "".join(f"<li>{e(x)}</li>" for x in (s.get("when") or []))
    nope = "".join(f"<li>{e(x)}</li>" for x in (s.get("nope") or []))
    rel = [by[r] for r in (s.get("rel") or []) if r in by and by[r].get("written")]
    relhtml = "".join(
        f'<a class="relcard" href="{r["slug"]}.html"><img src="../{e(r["icon"])}" alt="" width="24" height="24">'
        f'<span><b>{e(r["name"])}</b><span>{e(r.get("one",""))}</span></span></a>' for r in rel)
    tier = {1: "Learn this early", 2: "Common, learn when you need it",
            3: "Advanced, most people never need it"}.get(s.get("tier"), "")
    body = f'''{nav()}
<main class="wrap sdoc">
  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="../index.html">Basics</a> <span>/</span>
    <a href="../services.html">Services</a> <span>/</span>
    <a href="../services.html#{e(slug)}">{e(s["category"])}</a>
  </nav>
  <header class="shead">
    <img src="../{e(s["icon"])}" alt="{e(s["name"])} icon" width="56" height="56">
    <div><h1>{e(s["name"])}</h1><p class="scat">{e(s["category"])} &nbsp;&middot;&nbsp; {e(tier)}</p></div>
  </header>
  <p class="sone">{e(s.get("one",""))}</p>
  <div class="slike"><b>Picture it as</b><p>{e(s.get("like",""))}</p></div>
  <section class="sblk"><h2>What it actually does</h2><p>{e(s.get("what",""))}</p></section>
  {f'<section class="sblk"><h2>Reach for it when</h2><ul class="syes">{when}</ul></section>' if when else ''}
  {f'<section class="sblk"><h2>Do not reach for it when</h2><ul class="sno">{nope}</ul></section>' if nope else ''}
  {f'<section class="sblk"><h2>One small example</h2><p>{e(s.get("eg"))}</p></section>' if s.get("eg") else ''}
  {f'<section class="sblk"><h2>How you pay</h2><p>{e(s.get("pay"))}</p></section>' if s.get("pay") else ''}
  {f'<section class="sblk"><h2>Usually sits next to</h2><div class="relwrap">{relhtml}</div></section>' if relhtml else ''}
  <section class="sblk"><h2>The real source</h2><p>This is a simplified summary written for people learning AWS.
    The <a href="https://docs.aws.amazon.com/" rel="nofollow noopener" target="_blank">official AWS documentation</a>
    is the authoritative word and it wins wherever this page disagrees with it.</p></section>
  <p class="sback"><a href="../services.html">All 303 AWS services, explained</a></p>
</main>
{foot()}
</body></html>'''
    (ROOT / f"s/{slug}.html").write_text(head(title, desc, canon, "assets/og/service.png",
        extra_css='\n<link rel="stylesheet" href="../assets/css/sdoc.css">', jsonld=ld) + body)
    made.append(slug)
print(f"  {len(made)} service pages")

# ---------------------------------------------------------------- sitemap
PAGES = ["index.html", "learn.html", "services.html", "architecture.html",
         "playground.html", "certifications.html", "legal.html"]
urls = [(f"{SITE}/", "1.0", "weekly")]
urls += [(f"{SITE}/{p}", "0.9" if p in ("services.html", "architecture.html") else "0.7", "monthly")
         for p in PAGES if p != "index.html"]
urls += [(f"{SITE}/s/{m}.html", "0.6", "monthly") for m in made]
sm = ['<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for u, pr, cf in urls:
    sm.append(f"<url><loc>{u}</loc><lastmod>{TODAY}</lastmod><changefreq>{cf}</changefreq><priority>{pr}</priority></url>")
sm.append("</urlset>")
(ROOT / "sitemap.xml").write_text("\n".join(sm))
print(f"  sitemap.xml with {len(urls)} urls")

# ---------------------------------------------------------------- robots
(ROOT / "robots.txt").write_text(f"""# AWS Explained Simply. Free educational reference.
# AI answer engines are welcome. The whole point is that people find correct,
# plain English explanations instead of guesses.

User-agent: *
Allow: /

User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Claude-User
Allow: /
User-agent: Claude-SearchBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Perplexity-User
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Applebot-Extended
Allow: /
User-agent: CCBot
Allow: /
User-agent: Bytespider
Allow: /
User-agent: Amazonbot
Allow: /

Sitemap: {SITE}/sitemap.xml
""")
print("  robots.txt")

# ---------------------------------------------------------------- llms.txt
cats = {}
for s in S:
    if s.get("written"):
        cats.setdefault(s["category"], []).append(s)
lines = [f"""# AWS Explained Simply

> A free, independent educational reference that explains every Amazon Web Services
> product in plain English, with an honest note on when NOT to use each one. It also
> holds 51 reference architectures from a one page site up to global scale, a sandbox
> for sketching a setup and seeing a rough cost, and a catalogue of AWS certifications.

Not affiliated with, endorsed by, or sponsored by Amazon Web Services.
All prices quoted are rough teaching estimates, never quotes.
Written by Mihir Joshi. Distributed by 4Bit Technology.
Last updated {TODAY}.

## Start here

- [Before AWS: the words nobody explained]({SITE}/): 31 fundamentals, from what a server is to what DNS does, explained with nothing assumed.
- [How AWS itself works]({SITE}/learn.html): why there are 300 services, the eight to learn first, and how the billing actually works.
- [What should I actually build]({SITE}/architecture.html): 51 architectures keyed to the reader's own situation, with cost, capacity ceiling, what breaks first and what not to build yet.
- [All services]({SITE}/services.html): the full index.
- [Playground]({SITE}/playground.html): sketch an architecture and see a rough monthly cost.
- [AWS certifications]({SITE}/certifications.html): every current exam with code, price, domains and status.

## Every service, explained
"""]
for cat in sorted(cats):
    lines.append(f"\n### {cat}\n")
    for s in sorted(cats[cat], key=lambda x: x["name"]):
        lines.append(f'- [{s["name"]}]({SITE}/s/{s["slug"]}.html): {s.get("one","")}')
(ROOT / "llms.txt").write_text("\n".join(lines) + "\n")
print(f"  llms.txt with {len(made)} services")
