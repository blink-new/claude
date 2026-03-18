---
name: blink-seo-articles
description: Write and publish SEO-optimized blog articles on blink.new using the Blink CMS MCP. Covers keyword research with web_search/google_serp, programmatic OG image generation, MDX authoring with Blink frontmatter schema, and publishing via cms_write_file + cms_publish. Use when asked to write a blog post, create SEO content, publish an article on blink.new, or grow organic traffic for Blink.
---

# Blink SEO Article Writing

End-to-end workflow for publishing SEO articles on blink.new using the `user-blink-mcp` server. No local files — everything goes through MCP tools.

## Scripts in this skill

| Script | Purpose |
|--------|---------|
| [`scripts/generate-og-images.mjs`](scripts/generate-og-images.mjs) | Generates branded 1200×630 PNG hero images for blog posts using `sharp` + SVG. No browser, no external services. ~1500ms for 20 images. |

---

## Workflow (run in order)

```
1. RESEARCH  → web_search + google_serp + fetch_url
2. IMAGE     → run scripts/generate-og-images.mjs (or generate_image as fallback)
3. WRITE     → compose MDX with Blink frontmatter
4. PUBLISH   → cms_write_file(publish: true) for new articles
5. VERIFY    → cms_read_file to confirm it's live
```

---

## Step 1 — Keyword Research

Run all three tools. Do not skip any.

**A. Broad search for volume signals:**
```
web_search(query: "best no-code app builder 2026")
web_search(query: "[topic] alternative site:reddit.com")
```

**B. SERP ranking + People Also Ask (PAA):**
```
google_serp(q: "[primary keyword]", num: 10)
google_serp(q: "[topic] vs [competitor]", num: 10)
```
Note: `google_serp` uses `q:` (not `query:`).

**C. Competitor content analysis:**
```
# Take the top 2–3 organic URLs from google_serp results, then:
fetch_url(url: "https://competitor.com/their-article")
```
Scan the fetched content for: headings structure, topics they cover, topics they miss. Write to fill those gaps.

**Classify intent before writing:**

| Intent | Signals | Content type | Priority |
|---|---|---|---|
| Transactional | "best", "alternative", "vs" | Comparison, review | HIGH |
| Informational | "how to", "what is", "guide" | Tutorial, explainer | MEDIUM |
| Navigational | Brand names | Feature page | LOW |

Pick **one primary keyword** + 3–5 secondary long-tail variations from PAA results.

---

## Step 2 — Hero Image

### Option A: Programmatic OG image (preferred — consistent brand)

Uses [`scripts/generate-og-images.mjs`](scripts/generate-og-images.mjs) which generates branded 1200×630 PNG images using `sharp` + SVG. Each image has a dark themed background (color-coded by article type), bold title text, BLINK.NEW footer branding, category pill, and decorative elements — all consistent and always ~100–130KB.

**One-time setup:**
```bash
# Install sharp (once per machine)
mkdir -p /tmp/og-gen && cd /tmp/og-gen && npm init -y && npm install sharp
```

**To generate images for new posts:**
1. Open `scripts/generate-og-images.mjs`
2. Add an entry to the `POSTS` array:
```javascript
{ slug: 'my-new-post-slug', title: 'Short Title', subtitle: 'Supporting subtitle', tag: 'Guide', theme: 'agent' },
```
3. Run (copy script to /tmp/og-gen first or adjust OUT_DIR):
```bash
OUT_DIR=/path/to/repo/public/images/blog node /path/to/skills/blink-seo-articles/scripts/generate-og-images.mjs
```
4. Image output: `public/images/blog/[slug].png`
5. In frontmatter: `image_url: "/images/blog/[slug].png"`
6. Commit the image file locally (push to prod whenever ready)

**Image color themes** (choose by article type):

| Theme key | Accent color | Use for |
|-----------|-------------|---------|
| `hosting` | Blue `#3b82f6` | Deployment/hosting guides |
| `agent` | Purple `#8b5cf6` | AI agent articles |
| `security` | Red `#ef4444` | Security/risk guides |
| `sales` | Green `#10b981` | Sales & business automation |
| `developer` | Cyan `#06b6d4` | Developer-focused content |
| `comparison` | Amber `#f59e0b` | Comparison/ranked articles |
| `email` | Indigo `#6366f1` | Email/Slack integrations |
| `morning` | Orange `#f97316` | Routine/schedule articles |
| `pricing` | Teal `#14b8a6` | Pricing/cost guides |
| `default` | Blue `#3b82f6` | Anything else |

**Tag values** (`tag:` field in POSTS array): `Guide`, `Tutorial`, `Comparison`, `Security`

**Visual anatomy of each image:**
```
┌────────────────────────────────────────────────────┐
│▌  [dot grid top-right]                  [•][•][•]  │  ← accent bar + dots
│▌                                                   │
│▌  TUTORIAL           ← category pill (fixed y=152) │
│▌  Bold Title Here    ← title 70px/800 (fixed y=248)│
│▌  Subtitle line      ← subtitle 22px/muted         │
│▌                            [decorative circles]   │
│████████████████████████████████████████████████████│  ← footer bar
│  BLINK.NEW                        blink.new/claw   │
└────────────────────────────────────────────────────┘
Size: 1200×630px PNG  |  Weight: ~100–130KB
```

### Option B: AI-generated image (fallback — unique visuals)

Use `generate_image` on `user-blink-mcp` when you want a custom AI illustration rather than the branded template.

```
generate_image(
  prompt: "A sophisticated hero image for '[ARTICLE TITLE]'. [VISUAL CONCEPT].
           Dark background (#0f172a) with electric blue and orange accents.
           Modern SaaS aesthetic like Vercel or Linear. Clean, minimal, professional.",
  aspect_ratio: "16:9",
  output_format: "webp"
)
```
Returns `{ images: [{ url: "https://cdn.blink.new/ai-generated/..." }] }`. Use `images[0].url` as the `image_url:` frontmatter value.

> ⚠️ AI text rendering in images is unreliable. Use the programmatic script for title/text overlays; AI image for abstract background visuals only.

---

## Step 3 — Check Existing Content

Before writing, always run:
```
cms_list_dir(path: "blog")
cms_search(query: "[topic]")       # semantic search
cms_grep(query: "[topic keyword]")  # exact phrase match
```
This avoids duplication and finds existing articles to link to internally.

---

## Step 4 — Write the Article (MDX)

### Frontmatter (exact Blink CMS schema)

```yaml
---
title: "Primary Keyword in Title — Under 60 Characters"
description: "Meta description 150–160 chars. Lead with keyword, add compelling hook."
category: "Tutorial"
tags: ["AI", "App Builder", "No-Code"]
image_url: "/images/blog/[slug].png"    # ← use image_url: (NOT image: or cover_image:)
status: "published"
---
```

**Critical frontmatter rules:**
- Use `image_url:` (the DB column name). `image:` also works as alias, but `cover_image:` is silently ignored
- `cms_search_replace` CAN now edit frontmatter fields directly (requires blink-mcp fix deployed): `old_string='image_url: "/old.png"' new_string='image_url: "/new.png"'`

**Category** (pick exactly one):
- `Product` — Announcements, launches, feature updates
- `Engineering` — Technical deep-dives, best practices
- `Tutorial` — Step-by-step guides
- `Case Study` — Customer success stories

### Article Structure

```markdown
# [H1: Primary Keyword — exact or close variant]

[Hook: stat, pain point, or bold claim — 2 sentences max]
[Promise: what the reader will learn — 1 sentence]

## What is [Topic]?
[2–3 direct sentences. Write for featured snippet: define clearly.]

## [Core Section: How-To or Why It Matters]
[Numbered steps or prose. Use <Steps> component for tutorials.]

## [Comparison Table]  ← required for comparison/alternatives articles

| Feature | Tool A | Tool B | Blink |
|---|---|---|---|
| Pricing | Free | $X/mo | Free–$200/mo |
| AI-native | ❌ | ❌ | ✅ |

## [Deep-Dive Sections — one per tool/option]
[3–4 paragraphs per option: overview, pros, cons, best for]

## Frequently Asked Questions

### [Question using primary or secondary keyword]?
[2–3 sentence direct answer. Targets featured snippets.]

[Repeat for 5–7 questions, using ### headers]

## Conclusion
[3–4 sentences: recap key insight, CTA linking to blink.new or a doc.]
```

### Word count targets

| Type | Minimum | Optimal |
|---|---|---|
| Comparison / Alternatives | 2,000 | 2,500 |
| Complete Guide | 2,500 | 3,500 |
| How-To Tutorial | 1,500 | 2,000 |
| Thought Leadership | 1,800 | 2,200 |

### SEO rules

| Element | Rule |
|---|---|
| Title | Primary keyword, ≤60 chars |
| Meta description | 150–160 chars, keyword + hook |
| H2 headers | Include secondary keywords naturally |
| Keyword density | ~1–2% for primary keyword |
| Internal links | 2–3 links to blink.new pages or existing blog articles |
| External links | 1–2 authoritative sources |

### MDX Components (use these, not raw HTML)

> Icon names in `<Card icon="...">` must be **PascalCase** Lucide names (`Database`, `Lock`, `Rocket`, `Globe`). Never use `Sparkles` — use `Bot`, `Cpu`, or `Wand2`. Lowercase icons silently fail.

```mdx
<Tip>Helpful tip.</Tip>
<Note>Note text.</Note>
<Warning>Caution.</Warning>

<Steps>
  <Step title="First Step">Instructions.</Step>
</Steps>

<AccordionGroup>
  <Accordion title="FAQ?">Answer.</Accordion>
</AccordionGroup>

<CardGroup cols={2}>
  <Card title="Feature" href="/docs/path" icon="Rocket">Description.</Card>
</CardGroup>
```

---

## Step 5 — Publish

### New articles:
```
cms_write_file(
  path: "blog/your-slug.mdx",
  content: "...full MDX...",
  publish: true      ← directly publishes new files, avoids version conflict
)
```

### Editing existing articles:
```
# 1. Save as draft
cms_write_file(path: "blog/slug.mdx", content: "...", publish: false)
# 2. Verify
cms_read_file(path: "blog/slug.mdx")
# 3. Publish
cms_publish(paths: ["blog/slug.mdx"])
```

**Slug format:** `kebab-case`, keyword-rich, include year.
Good: `openclaw-managed-hosting-comparison-2026` | Bad: `the-best-way`

---

## Step 6 — Verify

```
cms_read_file(path: "blog/your-slug.mdx")
```
Live URL: `https://blink.new/blog/[slug]`

---

## Publishing Checklist

- [ ] `image_url:` in frontmatter — NOT `image:` or `cover_image:` (wrong fields silently ignored)
- [ ] Image file committed to `public/images/blog/[slug].png` (push to prod when ready)
- [ ] Title ≤60 chars with primary keyword
- [ ] Meta description 150–160 chars
- [ ] `status: "published"` in frontmatter
- [ ] Category is exactly one of: Product / Engineering / Tutorial / Case Study
- [ ] Comparison table included (for comparison articles)
- [ ] 5–7 FAQ questions using `###` headers
- [ ] 2–3 internal links to blink.new or existing blog posts
- [ ] Article meets minimum word count for its type
