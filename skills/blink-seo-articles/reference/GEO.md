---
name: ai-seo-articles
description: Full SEO and GEO (Generative Engine Optimization) playbook. Covers technical SEO infrastructure, AI engine citation optimization, schema markup, robots/sitemap/llms.txt, competitive strategy, and content quality standards. Use when auditing SEO health, fixing indexing issues, improving AI citation visibility, or dominating a new keyword space.
---

# SEO / GEO Playbook

This reference captures SEO and GEO (Generative Engine Optimization) strategies. It is the authoritative reference for technical SEO and Generative Engine Optimization.

## Scripts in this skill

| Script | Usage |
|--------|-------|
| [`scripts/audit-seo-health.sh`](.cursor/skills/ai-seo-articles/scripts/audit-seo-health.sh) | Full health check: noindex, robots.txt, sitemap, FAQPage schema, llms.txt, OG images. Run against live site or localhost. |
| [`scripts/check-competitor-serps.sh`](.cursor/skills/ai-seo-articles/scripts/check-competitor-serps.sh) | Check if blink.new appears in SERPs for 15 key OpenClaw keywords. Requires `blink` CLI. |

```bash
# Run the health audit (live site)
bash .cursor/skills/ai-seo-articles/scripts/audit-seo-health.sh

# Run against localhost
bash .cursor/skills/ai-seo-articles/scripts/audit-seo-health.sh http://localhost:3000

# Check SERP presence
bash .cursor/skills/ai-seo-articles/scripts/check-competitor-serps.sh
```

---

## The #1 Mistake We Made (and How to Catch It)

**The blog was 100% noindexed for months.** Three layers simultaneously:
1. `src/app/blog/layout.tsx` — `robots: { index: false, follow: false }` (layout-level, blocks ALL child routes)
2. `src/app/blog/page.tsx` — same metadata
3. `src/app/blog/[slug]/page.tsx` — same metadata
4. `src/app/robots.ts` — `Disallow: /blog/`

**Always check first:**
```bash
# Check live noindex status
curl -s https://blink.new/blog/some-post | grep -i "noindex\|robots"

# Check robots.txt
curl -s https://blink.new/robots.txt | grep -i "blog"

# Check if blog appears in sitemap
curl -s https://blink.new/sitemap.xml | grep "blog" | head -5
```

If ANY blog route has `robots: { index: false }` in metadata or is in `Disallow:` — it **cannot rank or be cited by any AI engine**.

---

## Technical SEO Checklist

### robots.ts (`src/app/robots.ts`)

Must allow `/blog/` for all crawlers and explicitly list all AI bots:

```typescript
{
  userAgent: '*',
  allow: ['/', '/docs/', '/blog/', '/claw', '/pricing', '/faq', ...],
  disallow: ['/api/', '/project/', '/admin/', '/settings/', '/account/', ...],
},
// AI Search bots — allows ChatGPT, Claude, Perplexity to cite content
{ userAgent: 'OAI-SearchBot', allow: ['/'], disallow: ['/api/', '/admin/'] },
{ userAgent: 'GPTBot',        allow: ['/'], disallow: ['/api/', '/admin/'] },
{ userAgent: 'ClaudeBot',     allow: ['/'], disallow: ['/api/', '/admin/'] },
{ userAgent: 'Claude-Web',    allow: ['/'], disallow: ['/api/', '/admin/'] },
{ userAgent: 'Anthropic-AI',  allow: ['/'], disallow: ['/api/', '/admin/'] },
{ userAgent: 'PerplexityBot', allow: ['/'], disallow: ['/api/', '/admin/'] },
{ userAgent: 'Google-Extended', allow: ['/'], disallow: ['/api/', '/admin/'] },
{ userAgent: 'Bingbot',       allow: ['/'], disallow: ['/api/', '/admin/'] },
```

**Critical distinction:**
- `OAI-SearchBot` = ChatGPT real-time search citations (drives traffic)
- `GPTBot` = OpenAI model training only (no direct citation traffic)
- Both should be allowed for maximum coverage

### sitemap.ts (`src/app/sitemap.ts`)

Blog posts must be included with **real `lastmod` from post dates** (not `new Date()`):

```typescript
import { getAllPosts } from '@/lib/blog/utils'

// In getStaticEntries():
const posts = await getAllPosts({ includeDrafts: false })
for (const post of posts) {
  const lastMod = post.updated ? new Date(post.updated)
    : post.date ? new Date(post.date) : now
  entries.push({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: lastMod,
    changeFrequency: 'weekly',
    priority: 0.8,
  })
}
```

**Remove auth pages** (`/sign-up`, `/sign-in`) from sitemap — wastes crawl budget, Google ignores them.

**Include in sitemap:**
- All blog posts
- All docs pages
- `/claw` landing page
- `/blog` index
- `/llms.txt`, `/docs/llms.txt`, `/blog/llms.txt`

### Blog layout metadata (`src/app/blog/layout.tsx`)

```typescript
export const metadata: Metadata = {
  // No robots block — let it index!
  alternates: {
    types: { 'application/rss+xml': 'https://blink.new/blog/feed.xml' },
  },
}
```

### Blog slug page (`src/app/blog/[slug]/page.tsx`)

No `robots: { index: false }` anywhere. Schema should include 3 types:

```typescript
// 1. BlogPosting — article metadata
const articleSchema = {
  '@context': 'https://schema.org', '@type': 'BlogPosting',
  headline: post.title, datePublished: post.date, dateModified: post.updated || post.date,
  author: { '@type': 'Person', name: author.name },
  publisher: { '@type': 'Organization', name: 'Blink', url: 'https://blink.new' },
  image: { '@type': 'ImageObject', url: imageUrl, width: 1200, height: 630 },
}

// 2. BreadcrumbList — navigation rich results
const breadcrumbSchema = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://blink.new' },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://blink.new/blog' },
    { '@type': 'ListItem', position: 4, name: post.title, item: url },
  ],
}

// 3. FAQPage — 3.2× more likely in Google AI Overviews
// Auto-extract from ### question headings in post content
function extractFAQs(content: string) {
  const faqs = []
  const pattern = /^### (.+\?)\s*\n+([\s\S]+?)(?=\n###|\n##|\n---|\z)/gm
  let match
  while ((match = pattern.exec(content)) !== null) {
    faqs.push({ question: match[1].trim(), answer: match[2].split('\n')[0].trim().slice(0, 500) })
  }
  return faqs.slice(0, 10)
}
```

### Root layout.tsx (`src/app/layout.tsx`)

Must include `WebSite` + `Organization` schema in `<head>`:

```typescript
// WebSite = enables SiteLinksSearchBox in Google Knowledge Panel
// Organization = confirms brand identity, sameAs social profiles
const schemas = [
  {
    '@type': 'Organization', '@id': 'https://blink.new/#organization',
    name: '[Company Name from COMPANY.md]', url: '[Website from COMPANY.md]',
    sameAs: ['[Twitter/X from COMPANY.md]', '[Discord from COMPANY.md]'],
    description: '...',
  },
  {
    '@type': 'WebSite', '@id': 'https://blink.new/#website',
    url: '[Website from COMPANY.md]', name: '[Company Name from COMPANY.md]',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: '[Search URL from your site]' },
      'query-input': 'required name=search_term_string',
    },
  },
]
```

---

## llms.txt Maintenance (`src/app/llms.txt/route.ts`)

The root `llms.txt` is how ChatGPT, Perplexity, and Claude discover what to cite. **Keep it updated.**

Must include:
- Product section (description, pricing, key facts — see COMPANY.md and COPY.md)
- Links to the 10 most important blog posts
- Links to docs sub-indexes (`/docs/llms.txt`, `/blog/llms.txt`)
- Contact and social links (see COMPANY.md)

Key structure:
```
# Blink
> [1-3 sentence description]

## [Product Name — from COMPANY.md]
[Key facts paragraph — pricing, key features]
- [Key blog post links]

## Documentation Index
- [Documentation](https://blink.new/docs/llms.txt)
- [Blog](https://blink.new/blog/llms.txt)

## Key Blog Posts — OpenClaw / AI Agents
- [Post title](url): description
...
```

`blog/llms.txt` is dynamic — auto-generated from all published posts. Don't edit it manually.

---

## GEO Content Standards (Google AI Overviews + Perplexity + ChatGPT)

### Impact numbers (from Princeton GEO paper + platform studies)

| Signal | Impact |
|--------|--------|
| Direct answer in first 80 words | **+41% citation visibility** |
| Statistics/specific numbers | **+33% citation visibility** |
| FAQPage schema | **3.2× more likely in AI Overviews** |
| 15+ named entities per page | **4.8× higher AI selection probability** |
| SSR (content in initial HTML) | **3× more AI citations vs CSR** |
| Tables vs equivalent prose | **317% higher citation rate** |
| Freshness (Perplexity) | **38% more citations for recent content** |
| Readable prose (Grade 7–9) | **Lower bounce rate → higher ranking signal** |
| Short paragraphs (≤3 sentences) | **Better scroll depth → stronger engagement signal** |

### Every blog post must have:

1. **Bold direct answer in first 80 words** — machine-extractable, GEO-ready
   ```
   **OpenClaw is not inherently unsafe — but self-hosting it incorrectly is.**
   In 2026, Snyk found 1,467 malicious skills...
   ```

2. **H2/H3 headings phrased as questions** — AI Overview eligibility
   - ✅ `## What Is the ClawHub Supply Chain Attack?`
   - ❌ `## The ClawHub Supply Chain Attack`

3. **FAQ section at end with ### question headings** — triggers FAQPage schema extraction
   ```markdown
   ## Frequently Asked Questions
   
   ### Is OpenClaw safe to use?
   OpenClaw is safe when properly configured...
   
   ### How much does managed OpenClaw cost?
   Blink Claw starts at $22/mo (annual) all-in...
   ```

4. **Specific statistics with numbers** in every section
   - ✅ "63% of 42,000+ self-hosted instances run with insecure default configs"
   - ❌ "many instances are insecure"

5. **Comparison tables** for any data comparison (317% more citable than prose)

6. **CTA with price anchor** at the end
   ```
   [Use exact CTA from COPY.md for Market A]
   ```

7. **Meta description ≤160 chars** — non-negotiable

8. **Readable prose** — GEO engines cite content that humans can parse quickly
   - Sentences: maximum 25 words. Split at conjunctions when over.
   - Paragraphs: maximum 3 sentences. One idea per paragraph.
   - Grade level: Flesch-Kincaid 7–9. Write for a smart colleague, not an academic journal.
   - ✅ "Blink Claw runs your agent 24/7. No Docker needed. No VPS. From $22/month."
   - ❌ "Blink Claw is a managed hosting solution that eliminates the need for Docker configuration or virtual private server provisioning by providing a fully managed environment that runs your OpenClaw agent continuously for a monthly fee starting at twenty-two dollars."


---

## Competitive Landscape by Market (2026)

blink.new has estimated **DA 80+**. All three markets have competitors at DA 5-60. We dominate on authority — the only requirement is publishing the right content.

---

### Market A — OpenClaw / Blink Claw Competitors

| Domain | DA | What they own | Our advantage |
|--------|-----|--------------|--------------|
| `clawctl.com` | 15-25 | `managed openclaw hosting`, `openclaw setup guide` | Better depth, lower price ($22 all-in vs $49+ with LLM costs) |
| `clawhosters.com` | 10-18 | `openclaw without docker`, EU audience | US pricing, broader content |
| `clawhub.biz` | 12-20 | `clawhub skills`, `openclaw skills directory` | Technical depth |
| `clarilo-ai.com` | 20-30 | `openclaw alternatives` | We ARE managed OpenClaw, not an alternative |
| `openclawaws.com` | 5-10 | `openclaw pricing` | Better all-in pricing |

**Market A target keywords:**
- Tier 1 (direct conversion): `openclaw managed hosting`, `blink claw vs clawctl`, `openclaw without docker`, `openclaw morning briefing`, `openclaw personal assistant`
- Tier 2 (high intent): `openclaw getting started`, `openclaw skills`, `openclaw for sales`, `openclaw inbox zero`
- Tier 3 (definitional): `what is an AI employee`, `AI agents vs chatbots`

---

### Market B — AI App Builder / Vibe Coding Competitors

| Domain | DA | What they own | Their weakness | Our counter |
|--------|-----|--------------|---------------|-------------|
| `emergent.sh` | 35-50 | "how to build X" tutorials (40+), tool comparisons (30+), vibe coding guides | Generic, no product authority | We write with E-E-A-T as the product we're describing |
| `lovable.dev` | 40-60 | Team/role content, customer stories, security | Requires Supabase (extra setup) | Everything included in Blink |
| `replit.com` | 60-75 | PM-focused vibe coding, enterprise | Playground feel, not production | Production-grade from day one |
| `bolt.new` | 25-40 | Fast prototyping tutorials | No persistent backend | Full stack |
| `v0.dev` | 45-65 | UI component generation | Components only, no full app | Complete app, not components |

**Market B target keywords:**
- Tier 1 (direct conversion): `blink vs lovable`, `how to build a CRM without code`, `vibe coding for non-technical founders`, `replace Salesforce with custom tool`
- Tier 2 (high intent): `how to build a [specific app type]`, `what sales teams build with AI`, `best vibe coding platform 2026`, `AI app builder with database`
- Tier 3 (broad traffic): `what is vibe coding`, `vibe coding tools`, `AI app builder comparison`, `ChatGPT vs Claude for coding`

**Emergent's content gaps to exploit (checked April 2026):**
- No "build vs buy" / "replace SaaS" content at all
- No customer success stories
- Team/role content absent (they have solutions pages but no blog content for teams)
- No "how to build a CRM / booking app / marketplace" — just generic app tutorials
- No "vibe coding for non-technical founders" angle — their tutorials assume technical users

**Lovable's content gaps to exploit:**
- No Claude Code / agentic coding content
- No "how to build [specific app type]" long-tail tutorials
- Security content is enterprise-focused, not founder-friendly
- No "replace SaaS" ROI framing beyond their one Salesforce story

---

### Market C — Claude Code / Agentic Coding Competitors

| Source | DA | What they own | Their weakness | Our counter |
|--------|-----|--------------|---------------|-------------|
| Medium articles | 95+ | Claude Code tutorials | No product, no E-E-A-T, low depth | We actually built our product with Claude Code |
| dev.to | 70+ | Community tutorials | Thin, inconsistent, no product authority | Consistent depth + actual product proof |
| code.claude.com/docs | — | Official docs | Clinical, not beginner-friendly | Human-readable guides with real workflow context |
| YouTube tutorials | — | Video walkthroughs | Not text-indexable | Text + searchable format |
| Reddit r/ClaudeAI | 97+ | Tips and tricks | Not a blog, no SEO structure | We capture the long-tail in structured articles |

**Market C target keywords:**
- Tier 1 (direct conversion): `Claude Code tutorial`, `CLAUDE.md best practices`, `how to use Claude Code`, `Claude Code vs Cursor`
- Tier 2 (high intent): `what is agentic coding`, `agentic coding best practices`, `best AI coding tools 2026`, `context engineering AI`
- Tier 3 (broad traffic): `what is MCP`, `AI coding workflow`, `spec-driven development AI`

**Competitor gaps to exploit:**
- Nobody at DA 80+ has published "Claude Code tutorial for beginners" — we rank #1 the moment we publish
- "CLAUDE.md best practices" exists only on UX Planet (DA 40) — we beat it easily
- "Agentic coding best practices" is owned by Google Cloud (definitional) and Medium posts — neither has product authority
- "Claude Code vs Cursor" — all existing articles are on DA 20-40 sites

---

### Keywords by Priority Across All Markets

**Highest ROI (publish these first — low competition, high intent, direct product fit):**
1. `openclaw morning briefing` (A7) — 0 competitors, very specific, high desire
2. `Claude Code tutorial for beginners` (C1) — DA 80+ vs DA 20-40 competitors
3. `how to build a CRM without code` (B7) — high volume, Emergent doesn't have it
4. `vibe coding for non-technical founders` (B4) — Forbes wrote about it, nobody owns the SEO
5. `CLAUDE.md best practices` (C2) — only UX Planet article exists
6. `blink vs lovable` (B3) — we're one of the two products being compared
7. `replace Salesforce custom tool` (B9) — high commercial intent, Lovable has ONE article
8. `what sales teams build with AI` (B8) — Lovable has it, we don't — copy the pattern

---

## Schema Markup Reference

### For blog posts — use all three:

```typescript
// In blog/[slug]/page.tsx
<Script id="blog-article-jsonld"  type="application/ld+json" ... /> // BlogPosting
<Script id="blog-breadcrumb-jsonld" type="application/ld+json" ... /> // BreadcrumbList
{faqSchema && <Script id="blog-faq-jsonld" type="application/ld+json" ... />} // FAQPage
```

### For docs pages:
- `TechArticle` (already implemented)
- `BreadcrumbList` (add)

### For root layout:
- `Organization` + `WebSite` (already implemented)

### For `/claw` landing page (add):
```json
{
  "@type": "SoftwareApplication",
  "name": "Blink Claw",
  "applicationCategory": "WebApplication",
  "offers": { "@type": "Offer", "price": "45", "priceCurrency": "USD" }
}
```

---

## Verification Commands

```bash
# 1. Is the blog indexed? (check live page)
curl -s https://blink.new/blog/some-slug | grep -c "noindex"
# Expected: 0

# 2. Does robots.txt allow blog + AI bots?
curl -s https://blink.new/robots.txt | grep -E "OAI-SearchBot|PerplexityBot|ClaudeBot|blog"

# 3. Are blog posts in sitemap?
curl -s https://blink.new/sitemap.xml | python3 -c "
import sys, urllib.request
data = open('/dev/stdin').read()
print('Blog entries:', data.count('/blog/'))
"

# 4. Does FAQPage schema exist on a blog post?
curl -s https://blink.new/blog/openclaw-getting-started-complete-guide-2026 | python3 -c "
import sys, json, re
html = sys.stdin.read()
scripts = re.findall(r'application/ld\+json[^>]*>(.*?)</script>', html, re.S)
for s in scripts:
  try:
    d = json.loads(s)
    if isinstance(d, list):
      for item in d: print(item.get('@type'))
    else: print(d.get('@type'))
  except: pass
"

# 5. Does llms.txt mention Blink Claw?
curl -s https://blink.new/llms.txt | grep -c "Blink Claw"
# Expected: > 0

# 6. Does blog/llms.txt include blog posts?
curl -s https://blink.new/blog/llms.txt | grep -c "blink.new/blog/"
# Expected: > 20
```

---

## Content Audit Checklist (before publishing any blog post)

**Structure & GEO:**
- [ ] Bold direct answer in first 80 words
- [ ] H2/H3 headings phrased as questions (`What is X?`, `How does Y work?`)
- [ ] FAQ section at end with `### Question?` format (triggers FAQPage schema)
- [ ] At least 5 statistics with specific numbers
- [ ] Comparison table (for comparison/alternative articles)
- [ ] `image_url:` in frontmatter uses a Blink CDN URL (`https://cdn.blink.new/...`) — NOT a local `/images/blog/` path
- [ ] `image_url` does NOT contain `[REDACTED]` — if it does, replace `[REDACTED]` with `https://cdn.blink.new` before publishing
- [ ] Meta description ≤160 chars
- [ ] Internal links to 3+ related blog posts
- [ ] CTA auto-injected (do NOT write a manual CTA section)
- [ ] `status: "published"` in frontmatter
- [ ] No `robots: { index: false }` anywhere in the route hierarchy

**Readability (Grade Level 7–9 target):**
- [ ] No sentence exceeds 25 words
- [ ] No paragraph exceeds 3 sentences
- [ ] Active voice throughout (no "is built by", "was done by")
- [ ] No meaningless adverbs (very, quite, simply, basically, essentially)
- [ ] Every paragraph opens with its main point
- [ ] 3+ items = bullet list, not a run-on sentence
- [ ] Steps = numbered list, not prose paragraphs
- [ ] Plain words used (use/help/because — not utilize/facilitate/due to the fact that)

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `src/app/robots.ts` | Controls crawler access — `/blog/` must be allowed, all AI bots listed |
| `src/app/sitemap.ts` | Blog posts must be here with real `lastmod` |
| `src/app/llms.txt/route.ts` | Root AI index — keep Blink Claw section updated |
| `src/app/blog/layout.tsx` | Must NOT have `robots: { index: false }` |
| `src/app/blog/page.tsx` | Must NOT have `robots: { index: false }` |
| `src/app/blog/[slug]/page.tsx` | BlogPosting + BreadcrumbList + FAQPage schema |
| `src/app/layout.tsx` | Organization + WebSite schema in `<head>` |
| `.cursor/skills/ai-seo-articles/reference/ARTICLES.md` | Clay character image system, hero image generation, inline images |

---

## OG Image Generation

All blog posts need a 1200×630px branded OG image. The generator is at
`scripts/generate-blog-og-images.mjs`.

**Scene prompts → `.cursor/skills/ai-seo-articles/reference/ARTICLES.md` (Step 2a) is the source of truth.**
That file contains the full character system, the scene-by-article-type table, and six
proven example prompts. Do not write scene prompts from scratch — use those templates.

**Quick summary of the image system:**
- Character: clay 3D builder hero, blue lightning hoodie, same face in every image
- Costume changes per article type (detective coat, space suit, blazer, hood-up, etc.)
- Left side of every image is kept darker/clear for the text compositor overlay
- See `.cursor/skills/ai-seo-articles/reference/ARTICLES.md → Step 2a` for the complete scene table and examples

**Never commit image files to the repo. Always upload to Blink CDN and use the CDN URL.**

> ⚠️ **CRITICAL — Image URL Masking Rule**
>
> MCP tool outputs may display URLs with `[REDACTED]` substituted for the domain as a security mask.
> This is a display-only substitution — the real domain is always `https://cdn.blink.new`.
>
> **RULE: The `image_url` field must ALWAYS start with `https://cdn.blink.new/`.**
>
> If any tool output, upload response, or variable shows `[REDACTED]/...`:
> - DO NOT store that value in `image_url`
> - Extract the path after `[REDACTED]` (e.g., `/cms/mcp-uploads/slug-id.png`)
> - Prepend `https://cdn.blink.new` to get the real URL
> - Store that reconstructed URL: `https://cdn.blink.new/cms/mcp-uploads/slug-id.png`
>
> **Validation check (run before every publish):**
> `echo "$CDN_URL" | grep "^https://cdn.blink.new"` — must match.

```bash
# 1. Generate scene image (see .cursor/skills/ai-seo-articles/reference/ARTICLES.md Step 2a for prompts):
generate_image(prompt: "[CHARACTER ANCHOR] NEW SCENE: ...", aspect_ratio: "16:9", output_format: "webp")

# 2. Re-host on Blink CDN:
cms_upload_asset(url: "[fal.media URL from generate_image]", filename: "[slug]-hero.webp", alt_text: "...")
# Returns: { "public_url": "https://cdn.blink.new/cms/mcp-uploads/[slug]-hero.webp" }
# If shows [REDACTED]/...: reconstruct as https://cdn.blink.new + path-after-[REDACTED]

# 3. Run compositor (Sharp composites text overlay onto scene):
node /Users/kaifeng/Developer/auto-engineer/scripts/generate-blog-og-images.mjs
# Output: public/images/blog/[slug].png

# 4. Upload composited PNG:
CDN_URL=$(curl -s -X POST \
  "https://blink-mcp-production.up.railway.app/upload?filename=[slug].png&alt_text=[title]" \
  -H "Authorization: Bearer blnk_68f3c7384ce7f296ff1f3c4d88fcfbf4" \
  --data-binary @"public/images/blog/[slug].png" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['public_url'])")
rm public/images/blog/[slug].png

# VALIDATE:
echo "$CDN_URL" | grep "^https://cdn.blink.new" || echo "ERROR: reconstruct URL before using"
# If shows [REDACTED]/...: CDN_URL="https://cdn.blink.new" + path-after-[REDACTED]
```

Compositor theme → accent color (matches the character scene mood):

| Theme | Accent | Use for |
|-------|--------|---------|
| `agent` | Purple | AI agent, agentic coding, MCP, Claude Code |
| `security` | Red | CVEs, vulnerabilities, security hardening |
| `comparison` | Cyan | vs articles, tool comparisons, rankings |
| `developer` | Cyan | Code, GitHub, APIs, developer tooling |
| `hosting` | Blue | Deployment, VPS, cloud, server setup |
| `sales` | Green | CRM, lead gen, revenue, business automation |
| `morning` | Orange | Routines, scheduling, daily workflows |
| `pricing` | Teal | Cost breakdowns, pricing guides |
| `email` | Indigo | Email, Slack, Discord, messaging |
| `default` | Blue | Anything else |

Image frontmatter field: `image_url:` (NOT `image:` or `cover_image:`).

