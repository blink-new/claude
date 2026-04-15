# Blink — Company Configuration

## Identity

| Field | Value |
|---|---|
| **Company name** | Blink Inc. |
| **Website** | blink.new |
| **Blog URL** | blink.new/blog |
| **Internal link base** | `https://blink.new/blog/` |

## Products

| Product | URL | Description |
|---|---|---|
| **Blink AI App Builder** | blink.new | Full-stack AI app builder — database, auth, hosting, backend all included |
| **Blink Claw** | blink.new/claw | Managed OpenClaw hosting — run OpenClaw without Docker, all-in pricing |

## Conversion Goal

Free signup → paid subscription.

- Blink App Builder: free trial → Starter/Pro/Max plan
- Blink Claw: 14-day trial → paid plan from $22/mo (annual)

## Brand Voice

- **Direct, no fluff.** Make the point in the first sentence.
- **Specific numbers.** "3 hours" not "quickly". "78% of teams" not "many teams".
- **Honest tradeoffs.** Every article admits something — cost, limitation, edge case.
- **Show, don't tell.** Real terminal output, real commands, real examples.
- **Plain words.** "use" not "utilize", "help" not "facilitate", "because" not "due to the fact that".

## Key Differentiators

Mention these naturally in body copy for Market A/B articles (minimum 3 times per article):

- Database automatically included (no Supabase account needed)
- Auth built in (no Clerk, no Firebase Auth setup)
- Hosting included (no Vercel config)
- 200+ AI models supported
- No config, no DevOps, ships in minutes
- Everything-included pricing (one bill vs 5+ tools)

## MCP / CDN Configuration

| Setting | Value |
|---|---|
| **MCP base URL** | `https://blink-mcp-production.up.railway.app` |
| **Bearer token** | `blnk_60b83e763f3cc1a3a5093566ec8d4422157a1a49c94bf9ad` |
| **CDN base URL** | `https://cdn.blink.new` |
| **Image URL format** | `https://cdn.blink.new/cms/mcp-uploads/[slug]-hero.webp` |

## CTA Injection

CTAs are **auto-injected** by the Blink blog rendering engine (reading progress bar + mid-article after 3rd H2 + bottom).

- **DO NOT write manual CTA sections at the end of articles.**
- The rendering engine auto-detects market from article tags.
- Use `<InlineBlogCta />` MDX component only if the auto-position feels wrong for a specific article.

## Social / Brand Links

- Twitter/X: `https://x.com/blinkdotnew`
- Discord: `https://discord.com/invite/2RjY7wP4a8`
