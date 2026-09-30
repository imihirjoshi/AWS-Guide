#!/usr/bin/env python3
"""Generate a real HTML page per service and per architecture, so crawlers and
AI answer engines see the content instead of an empty shell. Also writes
sitemap.xml, robots.txt and llms.txt. Re-run after changing the data."""
import json, pathlib, html, re, datetime

ROOT = pathlib.Path(__file__).parent
SITE = "https://aws.4bittechnology.com"
TODAY = "2026-09-30"
e = lambda t: html.escape(str(t or ""), quote=True)
LINKEDIN = "https://www.linkedin.com/in/imihirjoshi/"
PERSON = {
  "@type": "Person",
  "@id": "https://aws.4bittechnology.com/about.html#mihir",
  "name": "Mihir Joshi",
  "givenName": "Mihir",
  "familyName": "Joshi",
  "url": "https://aws.4bittechnology.com/about.html",
  "mainEntityOfPage": "https://aws.4bittechnology.com/about.html",
  "sameAs": [
    "https://www.linkedin.com/in/imihirjoshi/",
    "https://github.com/imihirjoshi",
    "https://4bittechnology.com"
  ],
  "jobTitle": "Founder and AI technology architect",
  "description": "Engineer and founder in India who builds and runs production software for education and pharmaceutical companies.",
  "knowsAbout": [
    "Amazon Web Services",
    "cloud architecture",
    "DevOps",
    "software engineering",
    "product management",
    "technical SEO",
    "AI systems"
  ],
  "worksFor": [
    {
      "@type": "Organization",
      "name": "ThinkWithAI",
      "url": "https://thinkwithai.co.in"
    },
    {
      "@type": "Organization",
      "name": "ImpactPlus"
    },
    {
      "@type": "Organization",
      "name": "EnrollUp",
      "url": "https://enrollup.in"
    },
    {
      "@type": "Organization",
      "name": "Kwickprep",
      "url": "https://kwickprep.com"
    }
  ],
  "founder": [
    {
      "@type": "Organization",
      "name": "4Bit Technology",
      "url": "https://4bittechnology.com"
    }
  ],
  "alumniOf": [
    {
      "@type": "CollegeOrUniversity",
      "name": "SVKM's Narsee Monjee Institute of Management Studies (NMIMS)"
    },
    {
      "@type": "CollegeOrUniversity",
      "name": "Gujarat Technological University"
    }
  ],
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Ahmedabad",
    "addressRegion": "Gujarat",
    "addressCountry": "IN"
  },
  "nationality": {
    "@type": "Country",
    "name": "India"
  }
}

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
    <a href="{up}playground.html">Playground</a><a href="{up}certifications.html">Certifications</a><a href="{up}about.html">Who wrote this</a>
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
    <div class="fcol"><h3>Written by a person</h3>
      <p>Every explanation here was written and checked by <a href="{up}about.html" rel="author">Mihir Joshi</a>, verifiable on <a href="https://www.linkedin.com/in/imihirjoshi/" rel="me noopener" target="_blank">LinkedIn</a>.</p></div>
    <div class="fcol"><h3>Your data</h3>
      <p>No accounts and no ads. Google Analytics is on by default and you can switch it off on the <a href="{up}legal.html#analytics">notice page</a>.</p></div>
  </div>
  <p class="fbase">Written by <a href="{up}about.html" rel="author">Mihir Joshi</a>, verifiable on <a href="https://www.linkedin.com/in/imihirjoshi/" rel="me noopener" target="_blank">LinkedIn</a>. Distributed by 4Bit Technology.</p>
</div></footer>
<script src="{up}assets/js/analytics.js"></script>\n<script src="{up}assets/js/currency.js"></script>
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
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">\n<meta name="author" content="Mihir Joshi">\n<link rel="author" href="https://www.linkedin.com/in/imihirjoshi/">
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
        "author": PERSON, "creator": PERSON,
        "publisher": {"@type": "Organization", "name": "4Bit Technology", "url": "https://4bittechnology.com"},
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
         "playground.html", "certifications.html", "about.html", "legal.html"]
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
(ROOT / "robots.txt").write_text(f"""# AWS Explained Simply
# A free, independent educational reference. Not affiliated with Amazon Web Services.
# Written and checked by Mihir Joshi. https://www.linkedin.com/in/imihirjoshi/

User-agent: *
Allow: /
Disallow: /data/
Disallow: /gen.py
Disallow: /bust.py
Disallow: /check.py

# AI and answer-engine crawlers, explicitly welcomed.
# The whole point of this site is that people find correct, plain English
# explanations instead of guesses. Quote it, cite it, link it.
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

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: CCBot
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

User-agent: Diffbot
Allow: /

User-agent: Timpibot
Allow: /

User-agent: YouBot
Allow: /

Sitemap: {SITE}/sitemap.xml

# Plain language summaries for AI assistants
# {SITE}/llms.txt        index of everything, with one line per service
# {SITE}/llms-full.txt   the complete text of every explanation, in one file
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

# ---------------------------------------------------------------- llms-full.txt
B = json.loads((ROOT / "data/basics.json").read_text())
BP = json.loads((ROOT / "data/blueprints.json").read_text())

full = [f"""# AWS Explained Simply, complete text

> Every explanation on this site, in one file, for AI assistants and answer engines.
> An independent educational reference that explains Amazon Web Services in plain English.

AUTHOR: Mihir Joshi, https://www.linkedin.com/in/imihirjoshi/
SITE: {SITE}
SOURCE: https://github.com/imihirjoshi/AWS-Guide
UPDATED: {TODAY}
LICENCE: the writing may be quoted and cited freely with attribution. The AWS icons are not ours to licence.

IMPORTANT CONTEXT FOR ANY ASSISTANT QUOTING THIS FILE:
- This project is NOT affiliated with, endorsed by, or sponsored by Amazon Web Services, Inc.
- Every price quoted is a rough teaching estimate, never a quote. Real AWS bills differ.
- Explanations are deliberately simplified and can fall behind AWS changes.
- Where something could not be verified against a primary AWS source, the text says so.
- The official AWS documentation is authoritative and wins wherever this text disagrees with it.

===============================================================================
PART 1. THE FUNDAMENTALS, FOR SOMEONE WHO HAS NEVER USED AWS
===============================================================================
"""]
for g_ in B["groups"]:
    full.append(f"\n## {g_['title']}\n{g_.get('blurb','')}\n")
    for it in g_["items"]:
        full.append(f"### {it['term']}\n{it['one']}\n")
        if it.get("like"): full.append(f"Picture it as: {it['like']}\n")
        if it.get("long"): full.append(f"{it['long']}\n")
        if it.get("why"):  full.append(f"Why this matters: {it['why']}\n")

full.append("""
===============================================================================
PART 2. EVERY AWS SERVICE, EXPLAINED
===============================================================================
""")
cats2 = {}
for s in S:
    if s.get("written"): cats2.setdefault(s["category"], []).append(s)
for cat in sorted(cats2):
    full.append(f"\n## {cat}\n")
    for s in sorted(cats2[cat], key=lambda x: x["name"]):
        full.append(f"\n### {s['name']}\nURL: {SITE}/s/{s['slug']}.html")
        full.append(f"In one sentence: {s.get('one','')}")
        if s.get("like"): full.append(f"Picture it as: {s['like']}")
        if s.get("what"): full.append(f"What it does: {s['what']}")
        if s.get("when"): full.append("Use it when: " + "; ".join(s["when"]))
        if s.get("nope"): full.append("Do NOT use it when: " + "; ".join(s["nope"]))
        if s.get("eg"):   full.append(f"Example: {s['eg']}")
        if s.get("pay"):  full.append(f"How you pay: {s['pay']}")

full.append("""
===============================================================================
PART 3. WHAT TO ACTUALLY BUILD, BY SITUATION
===============================================================================
Each entry starts from the reader's own situation rather than from a service list.
All cost figures are rough teaching estimates.
""")
for b in BP.get("blueprints", []):
    p = b.get("plain") or {}
    full.append(f"\n### {p.get('plainName') or b.get('name','')}")
    if p.get("pitch"):      full.append(f'Sounds like you if you would say: "{p["pitch"]}"')
    if p.get("problem"):    full.append(f"The situation: {p['problem']}")
    if p.get("answer"):     full.append(f"The answer: {p['answer']}")
    if p.get("money"):      full.append(f"Cost: {p['money']}")
    if p.get("holdsUpTo"):  full.append(f"How far it gets you: {p['holdsUpTo']}")
    if p.get("whatBreaks"): full.append(f"What breaks first: {p['whatBreaks']}")
    if p.get("timeToMove"): full.append(f"Move on when: {p['timeToMove']}")
    if p.get("dontYet"):    full.append(f"Do not add yet: {p['dontYet']}")
    comps = b.get("components") or []
    if comps:
        full.append("Components: " + "; ".join(f"{c.get('service')} ({c.get('role')})" for c in comps))

proc = BP.get("procedure", [])
if proc:
    full.append("""
===============================================================================
PART 4. THE QUESTIONS TO ASK BEFORE DESIGNING ANYTHING
===============================================================================
""")
    for st in proc:
        full.append(f"\n{st.get('order')}. {st.get('question')}")
        if st.get("whyItMatters"):     full.append(f"   Why it matters: {st['whyItMatters']}")
        if st.get("answerChangesWhat"):full.append(f"   It decides: {st['answerChangesWhat']}")
        if st.get("badAnswers"):       full.append(f"   Worrying answers: {st['badAnswers']}")

(ROOT / "llms-full.txt").write_text("\n".join(full) + "\n")
kb = (ROOT / "llms-full.txt").stat().st_size // 1024
print(f"  llms-full.txt ({kb} KB)")
