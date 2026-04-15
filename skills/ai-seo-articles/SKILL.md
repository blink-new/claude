---
name: ai-seo-articles
description: >
  AI-powered SEO article production pipeline. Researches keywords, writes high-quality
  articles with branded hero images and inline visuals, scores quality at 110 pts,
  processes images via script, and publishes at scale. Configurable for any company
  via config/ subfolder. Currently configured for: Blink (blink.new).
  Commands: "run seo", "write seo articles", "seo run", "run seo 8 articles",
  "run seo b7 sprint", "run seo [market] focus".
---

# ai-seo-articles — Master Skill

One skill, one source of truth for AI-powered SEO article production. Configurable for any project.

---

## Active Project

> **Change this section to switch projects.** Everything else reads from these paths automatically.

| Setting | Value |
|---|---|
| **Project** | Blink (blink.new) |
| **Config path** | `.cursor/skills/ai-seo-articles/config/blink/` |
| **Runtime data** | `.todo/seo/` (SEO_PROFILE.md, MANIFEST.md, briefs/, drafts/) |

**To use this skill for a different project:**
1. Create `.cursor/skills/ai-seo-articles/config/[project-name]/`
2. Copy `config/blink/` as a template, update all 5 files (COMPANY, MARKETS, CLUSTERS, COPY, IMAGES)
3. Update the "Active Project" table above to point to `config/[project-name]/`
4. Create `.todo/seo-[project-name]/` with SEO_PROFILE.md, MANIFEST.md, briefs/, drafts/
5. Update ORCHESTRATOR.md Phase 0 config file paths to reference the new config and runtime paths

---

## How to Invoke

| Command | What runs |
|---|---|
| `run seo` | Standard run — 5 articles across top 5 priority clusters |
| `run seo 8 articles` | Extended run — 8 articles |
| `run seo b7 sprint` | 5-6 "How to Build X" articles + 2-3 other priorities |
| `run seo claude code focus` | Prioritise Market C clusters (C1-C6) |
| `run seo openclaw focus` | Prioritise Market A clusters (A7, A9, A1) |
| `run seo vibe coding focus` | Prioritise Market B clusters (B2, B4, B7, B8, B9) |

---

## Execution: read and run the orchestrator

When invoked, immediately:

1. Read `.cursor/skills/ai-seo-articles/prompts/ORCHESTRATOR.md` — the full 6-phase pipeline
2. The orchestrator reads config files (Phase 0) before any other action
3. Execute the orchestrator phases 0-6 exactly as written

---

## Config Files (what each contains)

| File | Contains |
|---|---|
| `config/blink/COMPANY.md` | Company name, website, blog URL, products, brand voice, key differentiators, CDN token |
| `config/blink/MARKETS.md` | Three content markets (A/B/C), products per market, exact CTA strings, detection signals |
| `config/blink/CLUSTERS.md` | All keyword clusters, Global Priority Stack, competitor intelligence per market, strategic rules |
| `config/blink/COPY.md` | Exact CTA strings verbatim, pricing anchors, product advantage phrases, brand language dos/don'ts |
| `config/blink/IMAGES.md` | CHARACTER ANCHOR, scene table by article type, 6 validated prompts, inline image system, CDN upload |

---

## Directory Index

| Path | What it contains |
|---|---|
| `SKILL.md` | **This file.** Entry point with Active Project config section. |
| `config/blink/COMPANY.md` | Company identity — name, URLs, products, brand voice, CDN config |
| `config/blink/MARKETS.md` | Content markets A/B/C — products, CTAs, detection signals |
| `config/blink/CLUSTERS.md` | Keyword clusters, Global Priority Stack, competitor intel |
| `config/blink/COPY.md` | Exact CTA copy, pricing anchors, brand language rules |
| `config/blink/IMAGES.md` | Clay character system, scene table, 6 example prompts, inline image system |
| `prompts/ORCHESTRATOR.md` | **The brain.** Generic 6-phase pipeline — loads config at Phase 0 |
| `reference/ARTICLES.md` | **Writing standards.** Step 2 generic image section, article templates, blueprints A-E, style rules 1-10, SEO rules, frontmatter schema, publishing checklist |
| `reference/GEO.md` | **GEO + technical SEO.** AI citation optimization, schema markup, robots.txt, sitemap, llms.txt, verification commands |
| `scripts/process-inline-images.mjs` | **Run after writing.** Replaces INLINE_IMAGE comments with CDN-hosted images. Exit 0=ok, 2=no comments, 3=partial, 1=fatal |
| `scripts/audit-seo-health.sh` | **Technical audit.** Checks noindex, robots.txt, sitemap, schema, llms.txt, OG images |
| `scripts/check-competitor-serps.sh` | **SERP monitoring.** Checks SERP position for key keywords |

---

## Runtime Data (in .todo/seo/ — not in this skill)

| Path | Purpose | Who writes it |
|---|---|---|
| `.todo/seo/SEO_PROFILE.md` | Markets, clusters, Global Priority Stack, live scores | Human + orchestrator |
| `.todo/seo/MANIFEST.md` | Run history — append after every run | Orchestrator |
| `.todo/seo/briefs/BRIEF_[slug].md` | Per-article research briefs | Research worker |
| `.todo/seo/drafts/DRAFT_[slug].mdx` | Article drafts in-flight | Writer worker |

---

## Quick Scripts

```bash
# Process inline images (run after writing, before publishing):
node .cursor/skills/ai-seo-articles/scripts/process-inline-images.mjs .todo/seo/drafts/DRAFT_[slug].mdx

# Technical SEO audit:
bash .cursor/skills/ai-seo-articles/scripts/audit-seo-health.sh
bash .cursor/skills/ai-seo-articles/scripts/audit-seo-health.sh http://localhost:3000  # against localhost

# SERP presence check:
bash .cursor/skills/ai-seo-articles/scripts/check-competitor-serps.sh
```

---

## Hard Stops (always enforced)

- **B11 Customer Stories**: never write without real customer data provided by a human
- **B10 AI Comparisons**: cap at 5 total; never prioritise over P1-P14
- **Score gate**: nothing publishes below 90/110; three revision passes max, then hold
- **No duplicate keywords**: check MANIFEST.md before any brief
- **No fabricated data**: invented stats or quotes → editor rejects, writer rewrites with sources
- **Slug rules**: no year suffix (`-2026`). Timeless slugs. Exception: changelogs only
- **No manual CTAs**: auto-injected by rendering engine. DO NOT write CTA sections.

---

## End-of-Run Report Format

1. Articles published (count + full production URLs, e.g. https://blink.new/blog/[slug])
2. Clusters worked + new coverage scores
3. One M2 backlink opportunity flagged for human action
4. What to prioritise next run
5. Articles held (with reason and score)
