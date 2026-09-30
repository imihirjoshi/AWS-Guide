# The host blocks AI crawlers

Tested 30 September 2026 against `https://aws.4bittechnology.com/robots.txt`.

| User agent | Result |
|---|---|
| Ordinary browser | **200** |
| Googlebot | **200** |
| Googlebot Smartphone | **200** |
| Bingbot | **200** |
| Applebot | **200** |
| A made up bot, `somebot` | **200** |
| **GPTBot** | **403** |
| **OAI-SearchBot** | **403** |
| **ChatGPT-User** | **403** |
| **ClaudeBot** | **403** |
| **PerplexityBot** | **403** |
| **Amazonbot** | **403** |
| **CCBot** | **403** |

The 403 body is the LiteSpeed default error page, and the response still carries
this site's own security headers, so the block happens after `.htaccess` is read
but the request is refused before the file is served.

A made up agent called `somebot` gets 200, and the bare word `Claude` gets 200,
so this is not a general "block anything with bot in the name" rule. It is a
specific blocklist of the known AI crawler names.

## What does not fix it

Adding an explicit allow in `.htaccess` was tried and has no effect:

```
SetEnvIfNoCase User-Agent "(GPTBot|ClaudeBot|PerplexityBot|...)" ai_crawler=1
<RequireAny>
  Require all granted
  Require env ai_crawler
</RequireAny>
```

GPTBot and ClaudeBot still returned 403. The rule lives above user configuration,
in the LiteSpeed server config or a WHM level setting, which a cPanel user cannot
override.

## Why it matters here

This site exists to be quoted. `llms.txt` and `llms-full.txt` were written for
exactly these crawlers, `robots.txt` welcomes twenty of them by name, and 303
static pages were generated so answer engines can read the content without
running JavaScript. None of that reaches them while the server returns 403.

Google and Bing are unaffected, so ordinary search indexing is fine today.

## The two ways out

**1. Ask the host to lift it.** One support ticket. Draft is in
`SUPPORT-TICKET.txt`. This is the smallest change and keeps everything else as is.

**2. Put Cloudflare in front.** Free plan. Cloudflare then answers the request
and decides the policy, not the origin. Two things to check after switching:
turn OFF `Security` then `Bots` then `AI Scrapers and Crawlers`, because
Cloudflare now blocks AI crawlers by default, and keep the origin pull working.
This also gives real CDN caching, which the site would benefit from anyway.

Option 1 first. If the host refuses or cannot do it per domain, option 2 works
regardless of what the origin thinks.
