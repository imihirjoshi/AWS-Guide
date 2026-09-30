# AI crawler access: blocked, then fixed

## What was wrong

Tested 30 September 2026. The host returned **403 Forbidden** to every AI crawler
while letting browsers, Googlebot, Bingbot and Applebot through.

Blocked: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot,
Amazonbot, CCBot.

It was not a general "block anything called a bot" rule. A made up agent called
`somebot` got 200, and the bare word `Claude` got 200. It was a specific
blocklist of the real AI crawler names.

An explicit allow in `.htaccess` had no effect at that point, so the rule sat
above user configuration.

## The fix

hostns.io support updated the server rules so that a `bad_bot` flag decides the
block, and a site can clear that flag per user agent from its own `.htaccess`.
The allow list now sits at the top of this site's `.htaccess`.

**One line from their template was deliberately left out:**

```
SetEnvIfNoCase User-Agent .*.* !bad_bot
```

`.*.*` matches every user agent, so that line would switch the protection off
completely and make the other rules pointless. Only named agents are allowed.

## Verified after the fix

Run from the server itself, because testing repeatedly from one home IP with bot
user agents gets that IP firewalled.

| Agent | Result |
|---|---|
| GPTBot, OAI-SearchBot, ChatGPT-User | **200**, real content |
| ClaudeBot, Claude-User | **200**, real content |
| PerplexityBot | **200**, real content |
| Amazonbot, CCBot, Google-Extended, GrokBot | **200**, real content |
| Googlebot, Bingbot, Applebot, browser | **200**, real content |
| AhrefsBot, SemrushBot, Screaming Frog | **200**, real content |
| MJ12bot, PetalBot (not on the list) | **403**, still blocked |

The AI files are reachable too: `robots.txt`, `llms.txt` (49 KB),
`llms-full.txt` (542 KB) and `sitemap.xml` all return 200 to GPTBot.

So the crawlers we want are in, and the protection still holds against the ones
we did not name.

## A note for anyone testing this later

The server firewalls your IP if it sees several blocked bot user agents from you
in quick succession. Connections then fail at TLS with no HTTP status at all,
which looks like the site being down. It is not. Test from a different host, or
leave several seconds between requests.

Also worth knowing: support described the change as an Apache rule, but the
server reports itself as LiteSpeed. The fix works regardless.
