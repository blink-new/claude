# SEO Article Writing Skill

A comprehensive workflow for creating high-ranking SEO blog articles with keyword research, competitive analysis, dynamic image generation, and optimized content structure.

## When to Use

- Setting up a blog section for SEO
- Writing blog articles for organic traffic
- Creating comparison/review content
- Building content marketing assets
- Any project needing a file-based blog CMS

## Prerequisites

Before writing articles, ensure:
1. Blog infrastructure is set up (see [Blog Setup](#blog-infrastructure-setup))
2. Pattern images exist in `/public/` (see [Image Generation](#image-generation))
3. MDX support is configured in your bundler

---

## Quick Start

```bash
# 1. Set up blog infrastructure (first time only)
# Copy assets from this skill to your project

# 2. Generate pattern images
# Use AI image generation tool with prompts below

# 3. Create article folder
mkdir -p src/content/blog/{slug}

# 4. Write article using template
# Use assets/templates/article.mdx as base
```

---

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  1. SETUP (One-time)                                            │
│     └─> Blog infrastructure + Pattern images                    │
├─────────────────────────────────────────────────────────────────┤
│  2. RESEARCH                                                    │
│     └─> Keywords → Competitors → Content gaps                   │
├─────────────────────────────────────────────────────────────────┤
│  3. OUTLINE                                                     │
│     └─> Structure → Tables → FAQs                               │
├─────────────────────────────────────────────────────────────────┤
│  4. WRITE                                                       │
│     └─> Draft → Optimize → Review                               │
├─────────────────────────────────────────────────────────────────┤
│  5. PUBLISH                                                     │
│     └─> MDX file → Sitemap → Verify                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Blog Infrastructure Setup

### Required Files

Copy these from `assets/` to your project:

```
your-project/
├── src/
│   ├── content/
│   │   └── blog/           # MDX articles go here
│   │       └── {slug}/
│   │           └── index.mdx
│   ├── types/
│   │   └── blog.ts         # Copy from assets/templates/
│   ├── lib/
│   │   └── blog.ts         # Copy from assets/templates/
│   ├── components/
│   │   └── blog/
│   │       ├── blog-card.tsx
│   │       └── blog-layout.tsx
│   └── routes/
│       ├── blog.tsx        # Blog listing
│       └── blog.$slug.tsx  # Individual post
└── public/
    ├── blog-pattern-1.png  # Generate these
    ├── blog-pattern-2.png
    └── blog-pattern-3.png
```

### Vite/React Setup

For Vite projects, use `import.meta.glob` to load MDX files:

```typescript
// src/lib/blog.ts
const modules = import.meta.glob('../content/blog/*/index.mdx', { eager: true });
```

### Next.js Setup

For Next.js projects, use `@next/mdx` or `contentlayer`:

```typescript
// next.config.js
import mdx from '@next/mdx';
const withMDX = mdx({ extension: /\.mdx?$/ });
export default withMDX({ pageExtensions: ['ts', 'tsx', 'mdx'] });
```

---

## Image Generation

### Pattern Backgrounds (Required First!)

Generate 3 pattern images using AI image generation before writing any articles:

#### Pattern 1: Grid Network
```
Prompt for AI Image Generation:

A minimalist abstract geometric pattern background in the style of Linear, 
Vercel, and Resend. Features subtle gradients from deep navy blue (#0f172a) 
to warm orange (#f97316). Clean intersecting lines forming a grid pattern 
with soft glowing nodes at intersections. Very subtle noise texture overlay. 
Modern tech aesthetic, perfect for a blog header. No text, pure abstract 
pattern. High contrast, dark theme. 1200x630 pixels.
```

Save as: `public/blog-pattern-1.png`

#### Pattern 2: Wave Lines
```
Prompt for AI Image Generation:

A sophisticated abstract wave pattern background inspired by Linear and 
Stripe design. Flowing curved lines in gradients of orange (#f97316) and 
amber on a dark slate background (#1e293b). Subtle mesh gradient effect 
with soft glow. Minimalist, modern, tech-forward aesthetic. Clean and 
professional, suitable for SaaS blog headers. No text, pure abstract 
pattern. 1200x630 pixels.
```

Save as: `public/blog-pattern-2.png`

#### Pattern 3: Radial Gradient
```
Prompt for AI Image Generation:

A modern abstract radial gradient pattern in the style of Linear and Vercel. 
Concentric circles emanating from the bottom center, transitioning from 
deep charcoal (#1a1a2e) to warm orange (#f97316) with soft blur effects. 
Subtle dot grid overlay. Clean, minimal, professional SaaS aesthetic for 
blog headers. No text, pure abstract pattern. Dark theme with orange accent. 
1200x630 pixels.
```

Save as: `public/blog-pattern-3.png`

### Dynamic OG Images (Optional)

For programmatic OG image generation, see `assets/scripts/generate-og-image.ts`.

This script:
1. Loads a pattern background
2. Overlays article title and metadata
3. Exports as PNG for social sharing

---

## Keyword Research

### Step 1: Primary Keyword Selection

Use web search to research your topic:

```
Search queries to run:
- "[topic] 2026"
- "best [topic]"
- "[topic] alternative"
- "[topic] vs [competitor]"
```

### Step 2: Classify Search Intent

| Intent | Indicators | Content Type | Priority |
|--------|-----------|--------------|----------|
| Transactional | "best", "alternative", "buy" | Comparison, review | HIGH |
| Informational | "how to", "what is", "guide" | Tutorial, explainer | MEDIUM |
| Navigational | Brand names, specific tools | Feature page | LOW |

### Step 3: Competitor Analysis

For each target keyword:
1. Web search the primary keyword
2. Fetch top 5 results
3. Analyze for:
   - Word count (aim for 120% of average)
   - Heading structure
   - Tables and visuals
   - FAQ sections
   - Content gaps (what's missing?)

### Subagent Prompt: Keyword Research

```
You are an SEO expert. Research keywords for [TOPIC].

Use web search to find:
1. Primary keyword with highest search intent
2. 5 secondary keywords (long-tail variations)
3. Top 5 competitor URLs for analysis
4. Content gaps competitors are missing

Return:
- Prioritized keyword list with intent classification
- Recommended content angle
- Estimated search volume (HIGH/MEDIUM/LOW)
```

---

## Article Structure

### Frontmatter Template

```javascript
export const frontmatter = {
  title: "SEO Title Under 60 Characters with Primary Keyword",
  description: "Meta description 150-160 chars with keyword and compelling hook.",
  date: "2026-01-30",
  author: "Team Name",
  tags: ["primary-tag", "secondary-tag", "category"],
  readingTime: 10,
  image: "/blog-pattern-1.png"
};
```

### Article Outline Template

```markdown
# [Primary Keyword in H1 Title]

## Introduction
- Hook with statistic or pain point
- What reader will learn
- Establish credibility (1-2 paragraphs)

## [Section 2: Definition/Background]
- What is [topic]?
- Why it matters (2-3 paragraphs)

## [Section 3: Core Content / How-To]
- Main value proposition
- Step-by-step if tutorial
- Numbered list for scanability

## [Section 4: Comparison Table]

| Feature | Option A | Option B | Option C |
|---------|----------|----------|----------|
| Price   | Free     | $10/mo   | $25/mo   |
| Feature | ✅       | ✅       | ❌       |

## [Section 5: Detailed Analysis]
- 3-4 paragraphs per option
- Pros and cons
- Best use cases

## [Section 6: Implementation Guide]
- Practical steps
- Code snippets if technical

## Frequently Asked Questions

### What is [primary keyword]?
[2-3 sentence answer targeting featured snippet]

### Is [option A] better than [option B]?
[Honest comparison with recommendation]

### How much does [topic] cost?
[Price breakdown, mention free alternatives]

### Can I [common action]?
[Yes/no with brief explanation]

### What are the best [alternatives]?
[List 3-5 options briefly]

## Conclusion
- Summary of key points
- Clear CTA with link to action
- Final recommendation
```

---

## Writing Guidelines

### SEO Best Practices

| Element | Guideline |
|---------|-----------|
| Title | Primary keyword, under 60 characters |
| Meta description | 150-160 chars, keyword, compelling hook |
| H2 headers | Include secondary keywords naturally |
| Keyword density | 1-2% for primary keyword |
| Internal links | 2-3 links to relevant pages |
| External links | 1-2 authoritative sources |

### Word Count Targets

| Content Type | Minimum Words | Optimal |
|--------------|---------------|---------|
| Comparison/Review | 2,000 | 2,500 |
| Complete Guide | 2,500 | 3,500 |
| How-To Tutorial | 1,500 | 2,000 |
| Thought Leadership | 1,800 | 2,200 |

### Content Quality Checklist

- [ ] Write for humans first, search engines second
- [ ] Short paragraphs (3-4 sentences max)
- [ ] Include numbered lists and bullet points
- [ ] Add comparison table(s)
- [ ] Write 5+ FAQ questions
- [ ] Include internal links to product/features
- [ ] Add CTA in conclusion

---

## Subagent Prompts

### Article Writer Agent

```
Write a [WORD_COUNT]+ word SEO article on [TOPIC].

Primary keyword: [KEYWORD]
Secondary keywords: [KEYWORD_LIST]

Include:
1. Frontmatter with all required fields
2. Introduction with hook/statistic
3. Comparison table with 4+ options
4. Detailed breakdown (3-4 paragraphs per option)
5. FAQ section with 5+ questions using h3 headers
6. Conclusion with CTA linking to [PAGE]

Use proper markdown with h2/h3 headers.
Professional, helpful tone.
```

### FAQ Writer Agent

```
Write 7 FAQ questions for article about [TOPIC].

Target keywords:
- [keyword 1]
- [keyword 2]
- [keyword 3]

Use h3 headers (###) for each question.
Each answer should be 2-3 sentences.
Target featured snippet format (direct, concise).
Include keywords naturally.
```

### Competitor Analysis Agent

```
Fetch and analyze [URL] for SEO insights.

Extract:
1. Word count
2. Heading structure (list all H2s)
3. Tables present (describe content)
4. FAQ count
5. Unique angles/content
6. Missing content (gaps)

Return actionable insights for outranking this content.
```

---

## Publishing Checklist

Before publishing, verify:

- [ ] Primary keyword in title
- [ ] Meta description optimized (150-160 chars)
- [ ] At least 1 comparison table
- [ ] At least 5 FAQ questions
- [ ] Internal links added (2-3)
- [ ] Pattern image assigned in frontmatter
- [ ] Reading time calculated
- [ ] Tags assigned (2-4)
- [ ] Date set correctly
- [ ] Article added to sitemap.xml

### Sitemap Entry Template

```xml
<url>
  <loc>https://yoursite.com/blog/{slug}</loc>
  <lastmod>{date}</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>
```

---

## File References

See `assets/` folder for:

| File | Purpose |
|------|---------|
| `templates/blog-types.ts` | TypeScript interfaces |
| `templates/blog-utils.ts` | Utility functions for loading MDX |
| `templates/article.mdx` | Article template |
| `components/blog-card.tsx` | Card component for listing |
| `components/blog-layout.tsx` | Layout for individual posts |
| `scripts/generate-og-image.ts` | Dynamic OG image generation |
| `patterns/prompts.md` | All image generation prompts |

---

## Example Workflow

### Creating a New Article

```bash
# 1. Research
# Use keyword research agent prompt above

# 2. Create folder
mkdir -p src/content/blog/my-article-slug

# 3. Create MDX file
touch src/content/blog/my-article-slug/index.mdx

# 4. Copy template and customize
# Use templates/article.mdx as starting point

# 5. Write content
# Use article writer agent prompt

# 6. Add to sitemap
# Edit public/sitemap.xml

# 7. Test locally
bun dev
# Navigate to /blog/my-article-slug
```

---

## Metrics to Track

After publishing, monitor:

- **Google Search Console**: Impressions, clicks, CTR, position
- **Analytics**: Page views, time on page, bounce rate
- **Conversions**: CTA clicks, signups from blog

### 30-Day Check

| Metric | Target |
|--------|--------|
| Indexed | Yes |
| Impressions | 100+ |
| Average Position | Top 50 |
| Referring pages | 1+ |

---

## Updates

- **v1.0** (2026-01-30): Initial skill with complete workflow, image generation, templates
