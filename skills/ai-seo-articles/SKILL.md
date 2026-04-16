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
1. Create `config/[project-name]/` with subdirectories:
   - `markets/market-a/COPY.md` + `CLUSTERS.md`
   - `markets/market-b/COPY.md` + `CLUSTERS.md`
   - `markets/market-c/COPY.md` + `CLUSTERS.md` (add more markets as needed)
   - `COMPANY.md` (identity, CDN, brand voice, global rules)
   - `IMAGES.md` (character system + scene table)
2. Update the "Active Project" table above to point to `config/[project-name]/`
3. Create `.todo/seo-[project-name]/` with SEO_PROFILE.md, MANIFEST.md, briefs/, drafts/
4. Update ORCHESTRATOR.md Phase 0 config file paths to reference the new config and runtime paths

---

## How to Invoke

| Command | What runs |
|---|---|
| `run seo` | Standard run — 5 articles across top 5 priority clusters |
| `run seo 8 articles` | Extended run — 8 articles |
| `run seo b7 sprint` | 5-6 "How to Build X" articles + 2-3 other priorities |
| `run seo claude code focus` | Prioritise Market C clusters (C1-C8) |
| `run seo openclaw focus` | Prioritise Market A clusters (A7, A9, A1) |
| `run seo vibe coding focus` | Prioritise Market B clusters (B2, B4, B7, B8, B9) |
| `audit blog` | Scan all published articles for MDX-breaking issues (~30s) |
| `fix blog` | Auto-fix all broken articles (strip HTML comments, fix images) |

---

## Execution

### For `run seo` commands:
1. Read `.cursor/skills/ai-seo-articles/prompts/ORCHESTRATOR.md` — the full 6-phase pipeline
2. The orchestrator reads config files (Phase 0) before any other action
3. Execute the orchestrator phases 0-6 exactly as written

### For `audit blog`:
```bash
node .cursor/skills/ai-seo-articles/scripts/audit-fix-blog.mjs
```
Lists all broken articles. Exit 0 = all clean, exit 2 = issues found.

### For `fix blog`:
```bash
# Fast — strip HTML comments (recommended default):
node .cursor/skills/ai-seo-articles/scripts/audit-fix-blog.mjs --fix-strip

# Full — generate replacement images + strip comments:
node .cursor/skills/ai-seo-articles/scripts/audit-fix-blog.mjs --fix
```
Scans all 200+ articles, auto-fixes broken ones, publishes the fixes.
Re-run audit afterwards to confirm `Broken: 0`.

---

## Config Files (what each contains)

| File | Contains |
|---|---|
| `config/blink/COMPANY.md` | Company identity, CDN config, global CTA rules, brand language dos/don'ts |
| `config/blink/IMAGES.md` | CHARACTER ANCHOR, scene table by article type, 6 validated prompts, inline image system |
| `config/blink/markets/openclaw/COPY.md` | Market A: CTAs, talking points, pricing anchors, competitor positioning |
| `config/blink/markets/openclaw/CLUSTERS.md` | Market A: A1-A10 cluster definitions and keywords |
| `config/blink/markets/vibe-coding/COPY.md` | Market B: CTAs, talking points, pricing anchors, competitor positioning |
| `config/blink/markets/vibe-coding/CLUSTERS.md` | Market B: B1-B11 cluster definitions and keywords |
| `config/blink/markets/cursor-claude/COPY.md` | Market C: CTAs, happy path, builder section template, style rules |
| `config/blink/markets/cursor-claude/CLUSTERS.md` | Market C: C1-C8 cluster definitions and keywords |

---

## Directory Index

| Path | What it contains |
|---|---|
| `SKILL.md` | **This file.** Entry point with Active Project config section. |
| `config/blink/COMPANY.md` | Company identity, CDN, global brand + CTA rules |
| `config/blink/IMAGES.md` | Clay character system, scene table, 6 example prompts |
| `config/blink/markets/openclaw/COPY.md` | Market A copy: CTAs, talking points, pricing, competitors |
| `config/blink/markets/openclaw/CLUSTERS.md` | Market A clusters: A1-A10 keywords and strategy |
| `config/blink/markets/vibe-coding/COPY.md` | Market B copy: CTAs, talking points, pricing, competitors |
| `config/blink/markets/vibe-coding/CLUSTERS.md` | Market B clusters: B1-B11 keywords and strategy |
| `config/blink/markets/cursor-claude/COPY.md` | Market C copy: CTAs, happy path, builder template, style rules |
| `config/blink/markets/cursor-claude/CLUSTERS.md` | Market C clusters: C1-C8 keywords and strategy |
| `prompts/ORCHESTRATOR.md` | **The brain.** Generic 6-phase pipeline — loads config at Phase 0 |
| `reference/VOICE.md` | **Writing voice.** 10 writing rules with real examples + blueprint cheat sheet. Read second (after brief, before SOP.md). |
| `reference/SOP.md` | **SOP.** Production workflow, article type templates, frontmatter schema, MDX component allowlist, SEO/external-link rules, publishing checklist |
| `reference/GEO.md` | **GEO + technical SEO.** AI citation optimization, schema markup, robots.txt, sitemap, llms.txt, verification commands |
| `scripts/validate-draft.mjs` | **Run before publishing.** Validates a draft: frontmatter, images, MDX safety, word count, stats, links. Exit 0=pass, 2=warnings, 1=fail |
| `scripts/process-inline-images.mjs` | **Run after writing.** Replaces INLINE_IMAGE comments with CDN-hosted images. Exit 0=processed, 2=no slots found, 1=fatal |
| `scripts/audit-fix-blog.mjs` | **Blog health guard.** Scans all CMS articles for MDX-breaking patterns, bulk auto-fixes. Run after every SEO run. |
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
# Validate a draft before publishing (checks frontmatter, images, MDX safety, links):
node .cursor/skills/ai-seo-articles/scripts/validate-draft.mjs .todo/seo/drafts/DRAFT_[slug].mdx

# Process inline images (run after writing, before publishing):
node .cursor/skills/ai-seo-articles/scripts/process-inline-images.mjs .todo/seo/drafts/DRAFT_[slug].mdx

# Technical SEO audit:
bash .cursor/skills/ai-seo-articles/scripts/audit-seo-health.sh
bash .cursor/skills/ai-seo-articles/scripts/audit-seo-health.sh http://localhost:3000  # against localhost

# SERP presence check:
bash .cursor/skills/ai-seo-articles/scripts/check-competitor-serps.sh

# Blog health audit (run after EVERY publish — mandatory Phase 5b gate):
node .cursor/skills/ai-seo-articles/scripts/audit-fix-blog.mjs              # audit: list broken articles
node .cursor/skills/ai-seo-articles/scripts/audit-fix-blog.mjs --fix-strip  # fast fix: strip HTML comments
node .cursor/skills/ai-seo-articles/scripts/audit-fix-blog.mjs --fix        # full fix: generate images + strip
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
- **Zero HTML comments in published MDX**: `audit-fix-blog.mjs` must exit 0 (Broken: 0) before any run closes. HTML comments crash every page visitor. Note: `<!-- INLINE_IMAGE_* -->` slots are draft-only placeholders — the publish pipeline converts them to images before CMS. They must never appear in published content.

---

## End-of-Run Report Format

1. Articles published (count + full production URLs, e.g. https://blink.new/blog/[slug])
2. Clusters worked + new coverage scores
3. One M2 backlink opportunity flagged for human action
4. What to prioritise next run
5. Articles held (with reason and score)
