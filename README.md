# AWS Explained Simply

Every AWS service in plain English, plus a playground where you drag services onto a board,
connect them, change the sizes and see a rough monthly cost.

Free. Educational. No ads, no tracking, no signup.
Intended home: **aws.4bittechnology.com**

---

## What is here

| Page | What it does |
|---|---|
| `index.html` | Browse and search all 303 AWS services. Filter by category. Click one for the full explanation. |
| `playground.html` | Drag services onto a canvas, connect them, change sizes, see a rough cost and a review of what is missing. |
| `learn.html` | A ten minute start page for someone who has never used AWS. |

## Status, honestly

- **303 services** listed, all with their real official AWS icon and category.
- **62 services fully written** in plain English. These show a coloured tag on the card.
- **241 services are listed but not yet written up.** They open to a note saying so. Nothing is faked.
- **19 services have a cost model** in the playground. The rest can be placed on the diagram but add zero to the cost.

Fully written services were chosen as the ones a learner actually meets first: compute, storage,
databases, networking, security, the common AI services and the main integration services.

## Structure

```
index.html            browse and search
playground.html       the architecture sandbox
learn.html            beginner start page
assets/css/style.css        shared styles, light and dark
assets/css/playground.css   playground only
assets/js/app.js            browse and search logic
assets/js/playground.js     the sandbox engine and cost models
assets/icons/services/      303 official AWS service icons, SVG, unmodified
assets/icons/category/      category icons
data/services.json          the content. Edit this to add a service write up.
data/categories.json        category list
```

No build step. No framework. No dependencies. Plain HTML, CSS and JavaScript.

## Running it locally

The pages load `data/services.json` with `fetch`, so opening the file directly with `file://`
will not work. Serve it:

```
python3 -m http.server 8777
```

Then open `http://localhost:8777`.

## Deploying

It is only static files, so any web host works. No build step, no Node, no backend.

**Where this actually runs:** `aws.4bittechnology.com`, served from the project's own cPanel
hosting. GitHub holds the source code only. GitHub Pages is deliberately not used for this
domain.

To deploy, copy the folder to the web root:

```
rsync -az --delete \
  --exclude '.git' --exclude '_work' --exclude 'GITHUB-SETUP.txt' \
  ./ user@host:~/aws-guide/
```

Nothing here talks to AWS. There is no API key, no AWS account, no backend and no database.
The playground cannot create, change or delete anything in any AWS account.

## Adding a service write up

Edit `data/services.json` and fill these fields on the service you want:

```json
{
  "written": true,
  "tier": 1,
  "one":  "One sentence. The simplest possible.",
  "like": "An everyday comparison.",
  "what": "Two or three short sentences on what it really does.",
  "when": ["Use it when...", "Use it when..."],
  "nope": ["Do not use it when..."],
  "eg":   "One tiny concrete example.",
  "pay":  "How you are charged.",
  "rel":  ["slug-of-related-service"]
}
```

`tier` is 1 for core, 2 for common, 3 for advanced, 4 for not yet written.

## Adding a cost model to the playground

Add an entry to the `KINDS` object in `assets/js/playground.js`. Each entry needs `label`,
a `fields` list describing the settings, a `sub` function for the line under the name, and a
`cost` function returning US dollars per month.

## The notice acknowledgement

A small panel asks the reader to acknowledge three things on their first visit: the project is
not affiliated with AWS, prices are teaching estimates, and explanations are simplified.

It is versioned. `NOTICE_VERSION` lives at the top of `assets/js/notice.js` and is currently
`2026-09-30`. **If you change `legal.html` in a way a reader should see again, bump that constant
and the version line at the top of `legal.html`.** Everyone then gets the panel once more, headed
"The notice has changed".

The acknowledgement is stored in the reader's own browser under `aws-notice-ack`. It is never
transmitted. If storage is blocked, the panel simply shows again next visit, which is the safe
failure.

## Licence and trademarks

**This project is not affiliated with, endorsed by, or sponsored by Amazon Web Services.**

The full notice lives at `legal.html` and is linked from every page footer. Key points:

The service icons are the **official AWS Architecture Icons**, downloaded from
https://aws.amazon.com/architecture/icons/ (package dated 31 July 2026) and used **unmodified**.
AWS permits customers and partners to use these assets in architecture diagrams and technical
material. They are not recoloured, redrawn or altered here. Amazon Web Services, AWS and all
service names are trademarks of Amazon.com, Inc. or its affiliates.

The **AWS corporate logo and wordmark are deliberately not used** as branding for this site. The
header mark is the plain "AWS Cloud" architecture icon from the same permitted package, which
carries no wordmark, so there is no implication of endorsement.

If AWS ever objects to their use here, the icons come out and the site still works.

The written explanations are original, written for this project.

## The warning that matters

Every cost figure on this site is a **rough teaching estimate**. It assumes roughly US East on
demand pricing and ignores the free tier, data transfer, taxes, reserved pricing, savings plans
and every discount. Real bills differ, sometimes a lot.

Never use a number from this site for a quote, a budget, or a decision.
Use the [AWS Pricing Calculator](https://calculator.aws/) for that.

Explanations are simplified on purpose and may fall behind AWS changes. The
[official documentation](https://docs.aws.amazon.com/) is always the real answer.

---

Built by **[Mihir Joshi](https://github.com/imihirjoshi/AWS-Guide)**. Distributed by **4Bit Technology**.

Source: https://github.com/imihirjoshi/AWS-Guide

See `legal.html` for the full trademark, icon licensing, accuracy and privacy notice.
