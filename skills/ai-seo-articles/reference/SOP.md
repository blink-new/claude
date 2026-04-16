---
name: sop
description: Standard Operating Procedure for producing and publishing SEO articles using the CMS MCP. Covers keyword research, AI-generated hero image system, inline image workflow, article structure, writing standards, and publishing. Use when asked to write a blog post, create SEO content, or publish an article for the active project.
---

# SEO Article Writing — SOP (Standard Operating Procedure)

End-to-end workflow for publishing SEO articles using the `user-blink-mcp` server. No local files — everything goes through MCP tools.

## Scripts in this skill

| Script | Usage |
|--------|-------|
| [`scripts/process-inline-images.mjs`](.cursor/skills/ai-seo-articles/scripts/process-inline-images.mjs) | Processes INLINE_IMAGE_* comments in drafts → generates/searches images → uploads to CDN. Run after writing. |


> **Images:** Generated via `generate_image` → uploaded via `cms_upload_asset` → URL stored as `image_url`. No local files, no compositor script.

---

## Workflow (run in order)

```
1. RESEARCH  → web_search + google_serp + fetch_url
2. IMAGE     → generate_image(scene_prompt, centered full-frame, no dark gradient) → cms_upload_asset → image_url
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

Follow the project's image system defined in the loaded config:
→ Read: `config/blink/IMAGES.md` for CHARACTER ANCHOR, scene types, scene table, prompt templates, and CDN upload command.

Generate the hero image using the project's visual identity:

```javascript
generate_image(
  prompt: "[CHARACTER ANCHOR from IMAGES.md] NEW SCENE: [scene from scene table]. Expression: [expression]. Background: [background]. Centered composition, full frame. No dark gradients. No text. 16:9 wide blog header composition.",
  aspect_ratio: "16:9",
  output_format: "webp"
)
```

**Hard rules:**
- Always `aspect_ratio: "16:9"`, always `output_format: "webp"`
- NEVER add "left side darker" or "left third darker" — looks broken in card thumbnails
- Never include text in the image — the blog page shows the title separately
- CHARACTER ANCHOR must be copied verbatim from IMAGES.md — never paraphrase it
- Replace every `[bracketed]` placeholder with article-specific content before calling

Then upload to CDN:
```javascript
cms_upload_asset(url: "[URL returned by generate_image]", filename: "[slug]-hero.webp", alt_text: "[Article Title]")
// Returns: { "public_url": "https://cdn.blink.new/cms/mcp-uploads/[slug]-hero.webp" }
// ⚠️ generate_image returns cdn.blink.new/ai-generated/... — EPHEMERAL, expires in days.
//    You MUST call cms_upload_asset even though URL looks like cdn.blink.new.
//    Only cms/mcp-uploads/ URLs are permanent. Never embed ai-generated/ in articles.
// If shows [REDACTED]/..., reconstruct: https://cdn.blink.new + path-after-[REDACTED]
```

Use the returned `public_url` as `image_url` in frontmatter.

> ⚠️ **Image URL Masking:** MCP outputs may show `[REDACTED]` for the domain. This is a display mask only.
> Real domain is always `https://cdn.blink.new`. NEVER store `[REDACTED]` literally.

---

### Step 2c — In-article Inline Images (2–3 per article, aim for 3)

See `config/blink/IMAGES.md` for the complete inline image system, including:
- Which type to use (`INLINE_IMAGE_REAL` vs `INLINE_IMAGE_CLAY`)
- Comment formats (exact syntax required by the script parser)
- Clay scene selector table
- Alt text / caption rules

**Inline image count guidance (SEO-driven):**
- **3 images** → recommended for articles 1000+ words (full 10/10 Images score)
- **2 images** → acceptable for shorter, focused articles 600–999 words (7/10 score)
- **0–1 images** → not acceptable — scores 0/10 and blocks publication at the 90-point gate

**Placement rules (same for both types):**

⚠️ **Image 1 must NEVER be the same scene as the hero image.** The hero sets the article scope.
Image 1 zooms into the specific problem or claim. Using the same image twice looks broken.

- **Image 1** — after the intro paragraph, before the 1st H2: illustrates the specific **problem, pain point, or key claim** from the intro (NOT another scope-setter — the hero already does that)
- **Image 2** — after the most data-heavy section: makes abstract numbers visual
- **Image 3** — after the comparison table or final tool section, before the FAQ

⚠️ **`<!-- INLINE_IMAGE_* -->` slots are temporary draft placeholders — the publish pipeline converts them to CDN images before the article reaches the CMS.**

They are NOT HTML comments in the "avoid at all costs" sense — they are required image slots with a specific lifecycle:
1. Writer places them in the draft (STEP 2c)
2. Publisher runs `process-inline-images.mjs` → every slot becomes a `![alt](cdn-url)` image
3. Only then is the draft published to CMS — zero HTML comments in the final content

If a slot somehow reaches the CMS unprocessed, MDX v2 will crash the page. The publish pipeline prevents this: the script always runs before `cms_write_file`, and the post-publish audit (`audit-fix-blog.mjs`) catches anything that slips through.

**Writing INLINE_IMAGE slots is REQUIRED — not writing them is the error, not writing them.**

**Run the script after writing (do not manually process comments):**
```bash
node .cursor/skills/ai-seo-articles/scripts/process-inline-images.mjs .todo/seo/drafts/DRAFT_[slug].mdx
```

**If you wrote directly to CMS without processing, run the bulk fixer:**
```bash
node .cursor/skills/ai-seo-articles/scripts/audit-fix-blog.mjs --fix-strip
```

Exit codes:

| Code | Meaning | Action |
|---|---|---|
| `0` | Images processed — draft is clean | Proceed to publish |
| `2` | No INLINE_IMAGE slots found — writer skipped STEP 2c | Publisher logs IMAGES_MISSING; article publishes without inline images |
| `1` | Fatal file I/O error | Fix path and retry |

Note: there is no exit 3. The script always exits 0 (processed) or 2 (no slots found). Partial failures (individual image fails) still exit 0 — the failed slot is silently removed and the draft remains publishable.


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

> ⚠️ **READ BEFORE WRITING** — The `VOICE.md` file governs voice, paragraph length, openings,
> headers, and endings. You should have read it before this file. If not, read it now.
> The templates below are structural scaffolds; VOICE.md rules determine how to write within them.
>
> **GEO + editorial voice**: The GEO requirement for a "bold direct answer in the first 80 words"
> and the "open cold" rule are the same instruction — your cold opening IS the bold answer.
> Open with the substance. Never add a warmup paragraph before the main point.

### Frontmatter (exact Blink CMS schema)

> **`title` rule**: Write the real article title — the same text as the H1 heading.
> NEVER use the slug. `"how-to-build-a-booking-website"` ❌ → `"How to Build a Booking Website"` ✅

```yaml
---
title: "How to Build a Booking Website"
description: "Meta description 150–160 chars. Lead with keyword, add compelling hook."
category: "Tutorial"
tags: ["AI", "App Builder", "No-Code"]
image_url: "/images/blog/[slug].png"    # ← use image_url: (NOT image: or cover_image:)
sort_order: 0                           # ← always 0 for new articles
status: "published"
---
```

**Slug rules (CRITICAL — violations break URLs permanently):**
- Slug = filename without `.mdx`: `blog/how-to-build-booking-website.mdx` → slug `how-to-build-booking-website`
- **NEVER include a year in the slug** (`-2026`, `-2025`, etc.). Years make slugs obsolete and break links when updated in future years.
  - ❌ Bad: `how-to-build-booking-website-ai-2026`
  - ✅ Good: `how-to-build-booking-website`
- **Exception**: release notes/changelogs only may include dates: `openclaw-march-2026-changelog`
- Keep slugs short, descriptive, timeless: 3-6 hyphenated words max
- Target keyword first: `how-to-build-booking-website` not `ai-powered-booking-website-guide`

**Critical frontmatter rules:**
- Use `image_url:` (the DB column name). `image:` also works as alias, but `cover_image:` is silently ignored
- `cms_search_replace` CAN now edit frontmatter fields directly (requires blink-mcp fix deployed): `old_string='image_url: "/old.png"' new_string='image_url: "/new.png"'`
- **NEVER pass frontmatter inside `content` when calling `cms_write_file`.** The `content` parameter must contain ONLY the article body (starting with `# H1 Title`). The MCP extracts frontmatter fields from the top-level `path`, `content` parameters — if you include a `---frontmatter---` block inside `content`, it will be stored literally and rendered as raw text on the page. The MCP's `parseMdx` strips frontmatter from the full MDX string passed as `content`, so it IS safe to pass the full `---frontmatter---\nbody` string — but **never write the content field of the body as `---fm---\n---fm---\nbody`** (double block). If drafting to a local file first, always strip the score/approval comments before publishing.

**Category** (pick EXACTLY one — use these canonical values only, never variants):

| Value | Use for |
|---|---|
| `Tutorial` | Step-by-step how-to guides, setup walkthroughs, configuration tutorials |
| `Guide` | Comprehensive reference guides, in-depth explanations, long-form how-tos |
| `Comparison` | vs articles, tool comparisons, alternatives, head-to-head analysis |
| `Security` | CVEs, vulnerability fixes, hardening guides, security best practices |
| `Use Cases` | Role/industry-specific use case articles (sales, marketing, finance, etc.) |
| `Product` | Release notes, feature announcements, what's-new articles, product news |
| `Engineering` | Technical deep-dives, architecture, Blink engineering best practices |

⚠️ **Never** use: tutorial (lowercase), Tutorials, Guide (singular is OK), Guides, comparison (lowercase),
Comparisons, comparisons, use-cases, Use Case, Updates, updates, news, Hosting, Developer, Vibe Coding,
or any other variant. These cause duplicate category pages on the site and hurt SEO. Always use
the exact canonical value from the table above.

### Article Structure

**You design the structure. The research determines what to build.**

Before writing a single word, study the competitive landscape:
- What sections do the top 3 ranking results cover? How deep per section?
- What reader questions do they answer (PAA, Reddit)? What do they leave unanswered?
- What angle do ALL top results miss? That gap is your competitive core section.

Then plan your article based on that evidence:
1. **Cold open**: what specific moment, data point, contrast, or direct answer drops the reader in immediately?
2. **Section flow**: what does the reader need to know, in what order? Follow the reader's natural journey — problem → understanding → solution → confidence. 4-9 sections; let the topic determine the count.
3. **Competitive depth**: which section do you make significantly better than competitors? Lead with your strength.
4. **Close**: a specific next action, command, or concrete step. Never a `## Conclusion` section.

**FAQ — use your judgment:**
- Include when: PAA results were rich, reader questions plentiful, article type is informational/comparison
- Skip when: narrative voice would be broken, or questions would feel mechanical for the content type
- When included: `### Question?` headers, 2-3 sentence direct answers, questions target real search queries

**Depth — match the competitive bar, not a word count:**
Your research shows what the top-ranking result covers and how deep it goes. Match or exceed that depth. A focused 1,000-word article that fully answers a precise question beats a padded 2,500-word article. A shallow 600-word article that leaves key questions unanswered loses to a thorough competitor.

**Blueprint library — structural patterns from real articles (inspiration, not templates):**

Blueprints A-E are in `VOICE.md` (Blueprint Cheat Sheet section). Study them for structural techniques that work:
- Blueprint A (Tutorial/Narrative Arc): gap-bridge momentum — each section ends naming the next problem
- Blueprint B (Personal Narrative + Tutorial): when there's genuine personal stake or irony in the topic
- Blueprint C (Comparison/Tool Roundup): multiple subjects with consistent structure per entry
- Blueprint D (Comprehensive Educational): definition-first → why it matters → how to do it → how NOT to
- Blueprint E (Curated List): explicit selection criteria + consistent entry format

Use whichever patterns serve your structure. Mix them. Ignore them if the SERP evidence points to something better.

---

## CTA Reference

**CTAs are auto-injected by the rendering engine.** Do NOT write a manual CTA section at the end of the article.

See `markets/[market]/COPY.md` for exact CTA strings per market (openclaw, vibe-coding, or cursor-claude).

**Exception — Market C "Build This With Your AI Agent" section (REQUIRED, NOT a manual CTA):**
This section (described in `markets/cursor-claude/COPY.md`) is NOT a CTA section — it is a required workflow tutorial section that teaches the reader how to use the Blink plugin. It is the last substantive section before the FAQ. If no FAQ, it is the final section before the closing action. It must always be present in Market C articles. The auto-injected CTA fires separately.

The blog rendering engine automatically injects:
1. **Reading progress bar** — fixed 2px top bar, automatic
2. **Mid-article inline CTA** — injected after the 3rd H2 heading, automatic
3. **Bottom CTA section** — shown after article content, automatic

Market is auto-detected from article tags at render time (see `markets/[market]/COPY.md` for detection tags per market).

**What this means for writers:**
- Do NOT write a manual CTA section at the end of articles
- The CTA is handled by the system — your article ends with the FAQ section
- If you want the inline CTA at a different position, use: `<InlineBlogCta />` — it auto-detects the market

### Manual `<InlineBlogCta />` usage (optional override)

Place this MDX component in the content where you want the inline CTA:

```mdx
<InlineBlogCta />
```

No props needed — it auto-detects the market. Only use if the auto-injection position feels wrong.

---

## Article Type Reference Examples

These are structural reference examples — not templates to fill in. Study them for what makes each article type effective, then design your own structure based on your SERP research. The specific section names shown here emerged from editorial judgment on those particular topics; yours should emerge from your competitive analysis.

Your structure should answer: "What do I need to cover, in what order, to answer this reader's question better than anyone currently ranking?"

### Template 1: "How to Build [Specific App]"

**Blueprint A** (Tutorial/Narrative Arc). Reference example — adapt based on SERP findings.

```markdown
# How to Build a [App Type]

[Cold open — drop into the specific problem or moment: 1-2 sentences.
No "In today's world...", no "Have you ever wondered...".
Example: "The spreadsheet broke at 11pm. Three thousand rows, one corrupt formula, 
no backup." OR "Auth took three weeks. The actual product took two days."]

[What this article gives you: 1 sentence, direct.]

## Why Building [App Type] Is Harder Than It Sounds
[List 4-6 specific pain points — not generic, not abstract. Name the actual tools and costs.]

## What a [App Type] Actually Needs (Infrastructure Breakdown)
[Enumerate 5-7 concrete requirements: auth, database, file storage, etc.
Then the honest comparison table:]

| | Manual Stack | Blink |
|---|---|---|
| Database | Supabase ($25/mo) | Included |
| Auth | Clerk ($25/mo) | Included |
| Hosting | Vercel ($20/mo) | Included |
| Setup time | 4-8 hours | Under 1 hour |
| Total/mo | $70-120 | $0 (free tier) |

## Step 1: [First Concrete Step]
[2-3 sentences. Specific. What to type, what to click. No hedging.]

## Step 2: [Next Step]
[Same format × however many steps needed]

## Step N: [Ship It]
[What "done" looks like — specific.]

## What to Build Next
[3-5 natural extensions. Each with a link.]

## [Optional] Frequently Asked Questions
### How long does it take to build a [app type]?
### Do I need to know how to code?
### What happens when I need to scale?
```

---

### Template 2: Team/Role Use Cases

**Blueprint D** (Comprehensive Guide) or **Blueprint E** (Curated List). Reference example.

```markdown
# What [Sales/Marketing/Product/Operations] Teams Are Building

[Cold open — name the specific frustration or moment that makes this relevant.
Example: "The marketing team had seven SaaS tools open in seven tabs.
Nobody was sure which one was source of truth." OR a crisp observation:
"[Role] teams are the least likely to have a developer. They are also the most 
likely to have a spreadsheet that has gotten completely out of control."]

[1-sentence bridge: here's what they're doing about it.]

## The [SaaS] Treadmill (Why This Keeps Happening)
[2-3 paragraphs: specific friction — pricing tiers, missing features, 
tools that don't talk to each other. Name actual tools.]

## [Use Case 1: e.g., ROI Calculator]

**The problem:** [1 sentence — specific, not vague]

**What teams build:** [2-3 sentences — concrete features, not buzzwords]

**What it replaces:** [Name the tool — Salesforce, Notion, Airtable, etc.]

## [Use Case 2 through 5-6]
[Same format]

## Starting Your First Tool (30-Minute Version)
[5 concrete steps: pick a use case, describe it to Blink, ship to the team, iterate]

## [Optional] Frequently Asked Questions
### Do I need a developer?
### Can multiple people use the same app?
### What's the cost?
```

---

### Template 3: Replace SaaS / Build vs Buy

**Blueprint D** (Comprehensive Guide). High-intent "alternative to" content — FAQ often appropriate.

```markdown
# [SaaS Name] Is $[Price]/mo. Here's What Teams Build Instead.

[Cold open — the specific moment when the bill lands or the limit hits.
Example: "[SaaS name] sent the renewal notice. $[X] for 12 months, up from $[Y]."
OR: "The [feature] you need is in the Enterprise tier. Which starts at $[X]/seat."
One sentence. Then the bridge: here's what teams are doing instead.]

## What You Actually Use [SaaS Name] For
[Honest: list the 3-4 features teams actually use vs. the 15 features they pay for.
No strawmanning — give [SaaS name] credit where it's due.]

## The Cost Breakdown
[Mandatory comparison table:]

| | [SaaS Name] | Custom Blink Build |
|---|---|---|
| Monthly (10 users) | $[X]/mo | $0–[X]/mo |
| Customization | Limited | Complete |
| Data ownership | Vendor | You |
| Setup time | Days | Hours |
| Features you don't use | ~60% | 0% |

## What a Custom [Tool Type] Actually Looks Like
[Feature-by-feature: specific, honest. "You can replicate X but not Y."]

## How to Build It Today
[Step-by-step. Specific. "Type: 'Build me a [tool] that does [X]...'"]

## What You Give Up
[Honest tradeoffs — integrations, mobile apps, compliance certs, support SLAs.
This paragraph is why readers trust the article and the recommendation.]

## Frequently Asked Questions
### Is a custom tool as reliable as [SaaS name]?
### How do I migrate my data?
### What can I replicate vs. what requires the original?
### What am I giving up?
### What does maintenance cost?
```

---

### Template 4: AI Model Comparison

**Blueprint C** (Comparison). High-intent comparison — FAQ often appropriate.

```markdown
# [Model A] vs [Model B]: The Honest Comparison

[Bold GEO anchor = cold open: "[Model A] is better for [X]; [Model B] is better for [Y]."
Then the specific decision frame — 1 sentence. Then "Here's why."]

**[Model A] is better for [X]; [Model B] is better for [Y].** If you [specific use case], 
use [Model A]. If you [other use case], use [Model B]. Here's why.

## Quick Comparison Table
[Mandatory table with: pricing, context window, coding ability, speed, strengths, weaknesses]

| | [Model A] | [Model B] |
|---|---|---|
| Price | $[X]/M tokens | $[X]/M tokens |
| Context window | [X]K | [X]K |
| Coding strength | [score/note] | [score/note] |
| Best for | [use case] | [use case] |

## What Is [Model A]?
[200 words: who made it, what it's optimized for, what's distinctive]

## What Is [Model B]?
[200 words: same]

## Head-to-Head: [Key Dimension 1]
[Objective test/comparison with real examples]

## Head-to-Head: [Key Dimension 2]

## Head-to-Head: Coding and Building Apps
[This is where builders care most — be precise]

## When Should You Use [Model A]?
[Specific use cases with concrete examples]

## When Should You Use [Model B]?
[Same]

## For Builders: Which Model Should Power Your App?
[2-3 sentences: what matters for production LLM apps — latency, cost, reliability.
Mention Blink's model router naturally, not as a hard sell.]

## Frequently Asked Questions
### Which is cheaper for high-volume use?
### Which handles [specific task] better?
### Can I switch models without rewriting my app?
### Which is faster at inference?
### [2-3 more based on keyword research]

[No ## Conclusion section — end on the FAQ or add a 1-sentence action: "Start with [model]
for [use case] — you can add [other model] as a fallback later."]
```

---

### Template 5: Customer Success Story

**Blueprint B** (Personal Narrative). Narrative voice — end with a specific action, not FAQ.

> ⚠️ **NO FABRICATION RULE (hard stop)**: Every specific claim in this template (name,
> company, metric, quote) MUST come from real data in PG2 or a real conversation.
> If real data is not available, skip this article type entirely. Writing a "hypothetical"
> success story violates our editorial standards and will be caught in review.
> Approved source: PG2 workspace + project data, inbound customer emails, support threads.

```markdown
# How [Real Name / Company] [Achieved Specific Outcome] with Blink

[Cold open: drop into the specific moment — the problem, the blocker, the decision.
Not "Company X was founded in..." — start in the middle.
Example: "The invoice template stopped working the week before the client presentation."
OR: "[Company] had three engineers and a Jira board. They did not have a product."]

## The Problem
[Specific. Who, what, when, the actual cost of the problem. Quote the person if possible.]

> "[Real quote about the frustration — from actual conversation or support thread]"

## What They Built
[Feature walkthrough — what Blink handled, what the person actually typed, how long it took.
Specific over vague. "It took 45 minutes" beats "it was fast."]

> "[Real quote about the build]"

## The Outcome
[Real numbers only. Revenue, time, cost, users — whatever is measurable.]

| Metric | Before | After |
|--------|--------|-------|
| [Metric 1] | [Real number] | [Real number] |
| [Metric 2] | [Real number] | [Real number] |

## What They're Building Next
[Shows staying power. Forward-looking. 1-2 sentences.]

> "[Real closing quote]"

[End: 1-sentence action. "If you're in the same situation, [specific thing to do right now]."
No FAQ. No Conclusion.]
```


### SEO rules

| Element | Rule |
|---|---|
| Title | Primary keyword, ≤60 chars |
| Meta description | 150–160 chars, keyword + hook |
| H2 headers | Include secondary keywords naturally |
| Keyword density | ~1–2% for primary keyword |
| Internal links | 2–4 links to existing blog articles — use judgment: more in longer articles, 2 in short focused pieces (see COMPANY.md for blog URL) |
| External links | 2–4 per article — cite sources for statistics; link to official primary sources only |

---

### External link standards (E-E-A-T citations)

External links signal to Google that your content is grounded in real, verifiable information — not thin AI text. Every statistic you cite should have a link to its primary source. These links are precious: keep them few and make every one credible.

**The rule:** Every specific data point (GitHub stars, npm downloads, pricing, benchmark scores, CVE numbers) should link to its primary source. Treat external links as citations, not decoration.

**Approved source tiers (link ONLY to these):**

| Tier | Examples | Why |
|---|---|---|
| Official repos / docs | github.com, npmjs.com, docs.anthropic.com, openai.com/api, developer.mozilla.org | Primary source of truth |
| Major tech publications | techcrunch.com, wired.com, arstechnica.com, theverge.com, hbr.org, wsj.com | High DA, editorial standards |
| Official benchmarks / research | lmsys.org (Chatbot Arena), swebench.com, arxiv.org, nist.gov | Original data sources |
| Official product pricing pages | calendly.com/pricing, salesforce.com/pricing, notion.so/pricing | Specific, verifiable facts |
| Standards bodies | w3.org, ietf.org, owasp.org, cve.mitre.org | Authority on their subject |
| Named news sources for specific events | Reuters, AP, Bloomberg (when citing a specific news event) | Credible for factual claims |

**Never link to:**
- Competitor blog posts or SEO content (you'd be endorsing pages that compete with you)
- Medium, dev.to, Substack posts (low DR, content changes)
- Any page that ranks for the same keywords you're targeting
- Generic "learn more" links with no specific fact being cited
- Sites with DR below ~70 unless they are the literal primary source (e.g., a company's own pricing page)

**Format — plain markdown links only:**
```mdx
[250,000+ GitHub stars](https://github.com/openclaw/openclaw)
```

⚠️ **NEVER append `{target="_blank" rel="noopener noreferrer"}` after markdown links.**
That syntax is invalid in MDX — acorn (the JS parser) crashes trying to parse it,
breaking the entire article for every visitor with "Could not parse expression" error.
Use plain `[text](url)` — links work fine without the attribute.

Or in standard markdown (Next.js MDX handles target via the link renderer):
```mdx
[OpenClaw's npm package](https://www.npmjs.com/package/openclaw) — 1.27M weekly downloads
```

**Cap:** 2–4 unique external links per article (same URL used twice still counts as 1). If you have more statistics than that, pick the most specific and verifiable ones to cite. The rest can be stated without a link if the statistic is common knowledge in the field. Never cite the same external URL more than once — use the first mention only.

**Integration with statistics requirement:** When you include the required 3-5 data points, pick the 2-4 most critical ones and link their sources. The others can be stated as facts. Example:
- ✅ "OpenClaw crossed [250,000 GitHub stars](https://github.com/openclaw/openclaw) in March 2026"
- ✅ "Calendly's [Professional plan costs $20/month](https://calendly.com/pricing)"
- ✅ "Claude 3.5 Sonnet scores [49% on SWE-bench](https://www.swebench.com/)" 
- ❌ "Many AI tools are growing quickly" ← no stat, no link needed

### MDX Components — STRICT ALLOWLIST

> **CRITICAL: Using ANY component not in this list crashes the entire article page.**
> The blog renderer (`src/app/blog/[slug]/page.tsx`) only registers the components below.
> Unregistered components (e.g. `<FAQ>`, `<FAQItem>`, `<Tabs>`, `<Tab>`) cause a fatal
> MDX parse error — the page shows "Oops — Something went wrong" for every visitor.
> **NEVER invent component names. ONLY use what is listed here.**

**Registered blog MDX components (complete list):**

| Component | Usage |
|-----------|-------|
| `<Tip>` | Helpful tips (green) |
| `<Note>` | Informational notes (blue) |
| `<Warning>` | Caution/danger alerts (yellow/red) |
| `<Info>` | General info callout |
| `<Callout>` | Generic callout |
| `<Steps>` + `<Step title="...">` | Numbered step-by-step instructions |
| `<AccordionGroup>` + `<Accordion title="...">` | Collapsible sections — **USE FOR FAQs** |
| `<CardGroup cols={N}>` + `<Card title="..." href="..." icon="...">` | Feature/link cards |
| `<FeatureCardGroup>` + `<FeatureCard>` | Feature highlight cards |
| `<CodeGroup>` + `<CodeTab>` | Tabbed code blocks |
| `<Frame>` | Image frame wrapper |
| `<InlineBlogCta />` | Manual CTA placement override |

> Icon names in `<Card icon="...">` must be **PascalCase** Lucide names (`Database`, `Lock`, `Rocket`, `Globe`). Never use `Sparkles` — use `Bot`, `Cpu`, or `Wand2`. Lowercase icons silently fail.

**FAQ sections MUST use `<AccordionGroup>` + `<Accordion>`:**
```mdx
<AccordionGroup>
  <Accordion title="Should I use WSL2 or Docker Desktop?">
    WSL2 is better for developers who want a full Linux environment...
  </Accordion>
  <Accordion title="Why can't I access localhost:18789?">
    Either the gateway didn't start or Windows Firewall is blocking...
  </Accordion>
</AccordionGroup>
```

**NOT** `<FAQ>`, `<FAQItem>`, `<FAQGroup>`, or any other invented component — those crash the page.

The blog's `extractFAQs()` function auto-generates FAQPage JSON-LD schema from two patterns:
1. `### Question?` H3 headings (plain markdown)
2. `<Accordion title="Question?">` components

Both produce identical FAQ schema. Use `<Accordion>` for collapsible UI, or `### Question?` for simplicity.

**Example usage of other components:**
```mdx
<Tip>Helpful tip.</Tip>
<Note>Note text.</Note>
<Warning>Caution.</Warning>

<Steps>
  <Step title="First Step">Instructions.</Step>
</Steps>

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

**Slug format:** `kebab-case`, keyword-rich, timeless (no year suffix — see Slug Rules in frontmatter section above).
Good: `openclaw-managed-hosting-comparison` | Bad: `the-best-way` | Bad: `openclaw-managed-hosting-2026`

---

## Step 6 — Verify

```
cms_read_file(path: "blog/your-slug.mdx")
```
Live URL: `https://[company-website]/blog/[slug]` (see COMPANY.md for blog URL)

---

## Publishing Checklist

- [ ] **ZERO unregistered MDX components** — search for `<FAQ`, `<FAQItem`, `<Tabs`, `<Tab` or any component not in the STRICT ALLOWLIST above. Unregistered components crash the page. FAQs must use `<AccordionGroup>` + `<Accordion title="...">` or plain `### Question?` headings.
- [ ] **ZERO HTML COMMENTS** — search for `<!--` in your content. If ANY `<!-- ... -->` exists, the article will crash for every visitor. MDX v2 does not support HTML comments. `INLINE_IMAGE_*` comments must be processed by `process-inline-images.mjs` before publish. If you wrote directly to CMS, run `audit-fix-blog.mjs --fix-strip`.
- [ ] `image_url:` in frontmatter — NOT `image:` or `cover_image:` (wrong fields silently ignored)
- [ ] `image_url` value starts with `https://cdn.blink.new/` — if it starts with `[REDACTED]`, reconstruct the URL by replacing `[REDACTED]` with `https://cdn.blink.new`; NEVER publish with `[REDACTED]` in the URL
- [ ] `scene_prompt` written in brief (centered, full-frame — NO dark left gradient), `generate_image()` called, uploaded via `cms_upload_asset`, `image_url:` is `https://cdn.blink.new/...`
- [ ] Title ≤60 chars with primary keyword
- [ ] Meta description 150–160 chars
- [ ] `status: "published"` in frontmatter
- [ ] Category is exactly one of the canonical values: Tutorial / Guide / Comparison / Security / Use Cases / Product / Engineering — never a variant or alternate spelling
- [ ] Comparison table included (for comparison articles)
- [ ] FAQ section present if search intent is question-heavy (or article closes with specific next action if narrative content)
- [ ] 2–3 internal links to blink.new or existing blog posts
- [ ] 2–4 external links — each tied to a specific cited statistic; only approved-tier sources; plain `[text](url)` format only — NO `{target="_blank"}` suffix (crashes MDX)
- [ ] Article depth matches or exceeds the top-ranking competitor for this keyword (not a word count target — a depth target)
